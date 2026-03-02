const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 5000;

const DATA_PATH = path.join(__dirname, 'data');
const IMAGES_PATH = path.join(__dirname, 'data', 'images');
const DB_FILE = path.join(DATA_PATH, 'database.json');
const RECORDS_FILE = path.join(DATA_PATH, 'records.json');
const TEMPLATES_FILE = path.join(DATA_PATH, 'templates.json');

[DATA_PATH, IMAGES_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json({ limit: '50mb' })); // increased for base64 backgrounds stored in templates

app.use('/images', express.static(IMAGES_PATH));

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`-----------------------------------------`);
  console.log(`Server is LIVE on port ${PORT}`);
  console.log(`Images saved to: ${IMAGES_PATH}`);
  console.log(`-----------------------------------------`);
});
