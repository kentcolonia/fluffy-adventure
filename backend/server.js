import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_PATH = path.join(__dirname, 'data');
const IMAGES_PATH = path.join(__dirname, 'data', 'images');
const DB_FILE = path.join(DATA_PATH, 'database.json');
const RECORDS_FILE = path.join(DATA_PATH, 'records.json');
const TEMPLATES_FILE = path.join(DATA_PATH, 'templates.json');

[DATA_PATH, IMAGES_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// ── Smart Image Proxy ──
// Serves locally if cached, otherwise fetches from avegabros.net and caches
app.get('/images/:filename', async (req, res) => {
  const filename = req.params.filename;

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!filename || ['null', 'undefined', ''].includes(filename)) {
    return res.status(404).send('No image specified');
  }

  const localPath = path.join(IMAGES_PATH, filename);

  // 1. Serve locally if already cached
  if (fs.existsSync(localPath)) {
    const ext = path.extname(filename).toLowerCase();
    const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif' };
    if (mime[ext]) res.setHeader('Content-Type', mime[ext]);
    return res.sendFile(localPath);
  }

  // 2. Fetch from remote — try signatures folder first, then photos folder
  // We cannot rely on filename pattern to detect type, so we probe both
  const BASE = 'https://abas-staging.avegabros.net/';
  const ext = filename.toLowerCase().split('.').pop();
  const remotePaths = [
    `assets/uploads/users/signatures/${filename}`,
    `assets/uploads/hr/employee_pictures/${filename}`,
    `assets/uploads/users/signatures/${filename}.png`,
    `assets/uploads/hr/employee_pictures/${filename}.png`,
    `assets/uploads/hr/employee_pictures/${filename}.jpg`,
    `assets/uploads/hr/employee_pictures/${filename}.jpeg`,
  ];

  for (const remotePath of remotePaths) {
    const remoteUrl = BASE + remotePath;
    try {
      console.log(`[PROXY] Fetching: ${remoteUrl}`);
      const response = await axios({ url: remoteUrl, method: 'GET', responseType: 'stream', timeout: 8000 });
      if (response.headers['content-type']) res.setHeader('Content-Type', response.headers['content-type']);
      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);
      return new Promise((resolve) => {
        writer.on('finish', () => { console.log(`[PROXY] Cached: ${filename}`); res.sendFile(localPath); resolve(undefined); });
        writer.on('error', (err) => { console.error('[PROXY] Write error:', err); res.status(500).send('Storage error'); resolve(undefined); });
      });
    } catch { continue; }
  }

  console.error(`[PROXY 404] Not found: ${filename}`);
  res.status(404).send('Image not found');
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_PATH),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `temp_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Image Upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  const employeeName = (req.body.employeeName || 'unknown').toLowerCase().replace(/\s+/g, '');
  const fileType = req.body.fileType || 'photo';
  const ext = path.extname(req.file.originalname) || '.png';
  const newFilename = fileType === 'signature' ? `${employeeName}_sig${ext}` : `${employeeName}${ext}`;
  const newPath = path.join(IMAGES_PATH, newFilename);
  fs.renameSync(req.file.path, newPath);
  console.log(`[IMAGE SAVED] ${newFilename}`);
  res.json({ url: `/images/${newFilename}` });
});

function deleteImageFile(url) {
  if (!url || url.startsWith('data:')) return;
  const filePath = path.join(__dirname, url);
  if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); console.log(`[IMAGE DELETED] ${url}`); }
}

// ==========================================
// NEW HRIS API INTEGRATION
// ==========================================
let hrisToken = null;

async function getHrisToken() {
  if (hrisToken) return hrisToken; 
  
  try {
    // We need to attach the API key to the login URL as well
    const loginUrl = new URL(process.env.HRIS_URL);
    loginUrl.searchParams.append('key', process.env.HRIS_API_KEY);

    const response = await axios.post(loginUrl.toString(), {
        username: process.env.HRIS_USERNAME,
        password: process.env.HRIS_PASSWORD
    });
    
    hrisToken = response.data.token;
    return hrisToken;
  } catch (error) {
    console.error("HRIS Login Error:", error.response ? error.response.data : error.message);
    throw error;
  }
}

app.get('/api/employees', async (req, res) => {
  try {
      const token = await getHrisToken();
      const { search, page, limit } = req.query;
      
      const url = new URL('https://api.avegabros.org/website/id-employees'); // Make sure this matches your actual endpoint
      url.searchParams.append('key', process.env.HRIS_API_KEY);
      url.searchParams.append('order', 'asc');
      url.searchParams.append('sort', 'id');
      
      if (search) url.searchParams.append('search', search);
      if (page) url.searchParams.append('page', page);
      if (limit) url.searchParams.append('limit', limit);

      const response = await axios.get(url.toString(), {
          headers: { 'Authorization': `Bearer ${token}` }
      });

      res.json(response.data);
  } catch (error) {
      // If token expired (401), clear it so it fetches a new one next time
      if (error.response && error.response.status === 401) {
          hrisToken = null;
      }
      console.error("Backend Error:", error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Failed to fetch from HRIS' });
  }
});
// ==========================================

// Database
app.get('/api/database', (req, res) => {
  res.json(fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : []);
});
app.post('/api/database', (req, res) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(req.body, null, 2));
  console.log(`[SUCCESS] database.json saved (${req.body.length} items)`);
  res.sendStatus(200);
});

// Records
app.get('/api/records', (req, res) => {
  res.json(fs.existsSync(RECORDS_FILE) ? JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8')) : []);
});
app.post('/api/records', (req, res) => {
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(req.body, null, 2));
  console.log(`[SUCCESS] records.json saved (${req.body.length} items)`);
  res.sendStatus(200);
});
app.delete('/api/records/:id', (req, res) => {
  if (!fs.existsSync(RECORDS_FILE)) return res.sendStatus(404);
  const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
  const target = records.find(r => String(r.id) === req.params.id);
  if (target) { deleteImageFile(target.signature); deleteImageFile(target.photo); }
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(records.filter(r => String(r.id) !== req.params.id), null, 2));
  res.sendStatus(200);
});

// Templates — saves full front/back layout including background images as base64
app.get('/api/templates', (req, res) => {
  res.json(fs.existsSync(TEMPLATES_FILE) ? JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf8')) : []);
});
app.post('/api/templates', (req, res) => {
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(req.body, null, 2));
  console.log(`[SUCCESS] templates.json saved (${req.body.length} templates)`);
  res.sendStatus(200);
});

// Saved IDs — stores rendered front+back PNG as base64 per employee
const IDS_FILE = path.join(DATA_PATH, 'saved_ids.json');

app.get('/api/saved-ids', (req, res) => {
  res.json(fs.existsSync(IDS_FILE) ? JSON.parse(fs.readFileSync(IDS_FILE, 'utf8')) : []);
});
app.post('/api/saved-ids', (req, res) => {
  const existing = fs.existsSync(IDS_FILE) ? JSON.parse(fs.readFileSync(IDS_FILE, 'utf8')) : [];
  const newEntry = req.body; // { id, employeeName, company, frontImg, backImg, savedAt }
  // Replace if same employee+company already exists
  const updated = [...existing.filter(e => !(e.employeeName === newEntry.employeeName && e.company === newEntry.company)), newEntry];
  fs.writeFileSync(IDS_FILE, JSON.stringify(updated, null, 2));
  console.log(`[SUCCESS] ID saved for ${newEntry.employeeName}`);
  res.sendStatus(200);
});
app.delete('/api/saved-ids/:id', (req, res) => {
  if (!fs.existsSync(IDS_FILE)) return res.sendStatus(404);
  const updated = JSON.parse(fs.readFileSync(IDS_FILE, 'utf8')).filter(e => e.id !== req.params.id);
  fs.writeFileSync(IDS_FILE, JSON.stringify(updated, null, 2));
  res.sendStatus(200);
});
app.patch('/api/saved-ids/:id', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(IDS_FILE, 'utf8'));
    const idx = data.findIndex(e => String(e.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    data[idx] = { ...data[idx], ...req.body };
    fs.writeFileSync(IDS_FILE, JSON.stringify(data, null, 2));
    res.json(data[idx]);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ── Serve built frontend from dist/ ──
const DIST_PATH = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  // Catch-all: return index.html for any non-API route (React Router support)
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  });
  console.log(`[STATIC] Serving frontend from: ${DIST_PATH}`);
} else {
  console.warn(`[STATIC] No dist/ folder found. Run 'npm run build' first.`);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`-----------------------------------------`);
  console.log(`Server is LIVE on port ${PORT}`);
  console.log(`Open: http://localhost:${PORT}`);
  console.log(`Images saved to: ${IMAGES_PATH}`);
  console.log(`-----------------------------------------`);
});