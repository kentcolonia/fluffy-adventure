const API_URL = "http://10.10.0.3:5000/api";
const BASE_URL = "http://10.10.0.3:5000";

import React, { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Printer, FileSpreadsheet, Loader2, Pencil, Check, X, Users, UserCheck, UserX, Menu, ChevronRight } from 'lucide-react';

interface Employee { fullname: string; position: string; }
interface EmployeeRecord {
  id: number; name: string; position: string;
  indication: string; signature: string | null; photo: string | null;
}

async function uploadImage(file: File, employeeName: string, fileType: 'photo' | 'signature'): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('employeeName', employeeName);
    formData.append('fileType', fileType);
    const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
    if (!res.ok) return null;
    return (await res.json()).url;
  } catch { return null; }
}

function resolveImg(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  return `${BASE_URL}${url}`;
}

function ImgCell({ src, height, fit }: { src: string | null; height: number; fit: 'contain' | 'cover' }) {
  if (!src) return <span style={{ color: '#4a5568', fontSize: '11px', display: 'block', textAlign: 'center' }}>—</span>;
  return <img src={src} style={{ width: '100%', height: `${height}px`, objectFit: fit, display: 'block', borderRadius: fit === 'cover' ? '4px' : '0' }} />;
}

function EditImgCell({ file, existingSrc, onFile, fit }: { file: File | null; existingSrc: string | null; onFile: (f: File) => void; fit: 'contain' | 'cover'; }) {
  const preview = file ? URL.createObjectURL(file) : existingSrc;
  return (
    <div style={{ position: 'relative', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #4a5568', borderRadius: '6px', cursor: 'pointer', background: '#1a202c' }}>
      {preview
        ? <img src={preview} style={{ width: '100%', height: '86px', objectFit: fit, borderRadius: '4px' }} />
        : <span style={{ fontSize: '11px', color: '#718096' }}>Click to upload</span>}
      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
    </div>
  );
}

export default function App() {
  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [employeeDatabase, setEmployeeDatabase] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'add' | 'database'>('dashboard');

  const [selectedName, setSelectedName] = useState('');
  const [position, setPosition] = useState('');
  const [indication, setIndication] = useState('');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<EmployeeRecord>>({});
  const [editSignatureFile, setEditSignatureFile] = useState<File | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editShowDropdown, setEditShowDropdown] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dbRes, recRes] = await Promise.all([fetch(`${API_URL}/database`), fetch(`${API_URL}/records`)]);
        if (dbRes.ok) setEmployeeDatabase(await dbRes.json());
        if (recRes.ok) setRecords(await recRes.json());
      } catch (err) { console.error("Connection failed."); }
      finally { setIsLoading(false); }
    };
    if (!(window as any).XLSX) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.async = true; document.body.appendChild(s);
    }
    loadData();
  }, []);

  const saveDatabase = async (data: Employee[]) => {
    try { await fetch(`${API_URL}/database`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch (e) { }
  };
  const saveRecords = async (data: EmployeeRecord[]) => {
    try { await fetch(`${API_URL}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch (e) { }
  };

  const handleDatabaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const XLSX = (window as any).XLSX;
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];
        const formatted = jsonData.map((row: any) => {
          const cleanKeys = Object.keys(row).reduce((acc: any, key: string) => { acc[key.toLowerCase().replace(/\s+/g, '')] = row[key]; return acc; }, {});
          return { fullname: String(cleanKeys["fullname"] || "").trim(), position: String(cleanKeys["position"] || "").trim() };
        }).filter(emp => emp.fullname);
        setEmployeeDatabase(formatted); saveDatabase(formatted); e.target.value = '';
      } catch { alert("Error reading Excel"); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImagePick = (file: File, setFile: (f: File) => void, setPreview: (s: string) => void) => {
    setFile(file); const r = new FileReader(); r.onload = () => setPreview(r.result as string); r.readAsDataURL(file);
  };

  const handleAddRecord = async () => {
    if (!selectedName || !indication) return;
    setIsSaving(true);
    const [sigUrl, photoUrl] = await Promise.all([
      signatureFile ? uploadImage(signatureFile, selectedName, 'signature') : Promise.resolve(null),
      photoFile ? uploadImage(photoFile, selectedName, 'photo') : Promise.resolve(null),
    ]);
    const newRecord: EmployeeRecord = { id: Date.now(), name: selectedName, position, indication, signature: sigUrl, photo: photoUrl };
    const updated = [...records, newRecord];
    setRecords(updated); await saveRecords(updated);
    setSelectedName(''); setPosition(''); setIndication('');
    setSignatureFile(null); setSignaturePreview(null); setPhotoFile(null); setPhotoPreview(null);
    setIsSaving(false); setActiveSection('dashboard');
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API_URL}/records/${id}`, { method: 'DELETE' });
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleEdit = (record: EmployeeRecord) => { setEditingId(record.id); setEditData({ ...record }); setEditSignatureFile(null); setEditPhotoFile(null); };
  const handleCancelEdit = () => { setEditingId(null); setEditData({}); setEditSignatureFile(null); setEditPhotoFile(null); };
  const handleSaveEdit = async () => {
    setIsSaving(true);
    const [sigUrl, photoUrl] = await Promise.all([
      editSignatureFile ? uploadImage(editSignatureFile, editData.name || '', 'signature') : Promise.resolve(editData.signature ?? null),
      editPhotoFile ? uploadImage(editPhotoFile, editData.name || '', 'photo') : Promise.resolve(editData.photo ?? null),
    ]);
    const updated = records.map(r => r.id === editingId ? { ...r, ...editData, signature: sigUrl, photo: photoUrl } as EmployeeRecord : r);
    setRecords(updated); await saveRecords(updated);
    setEditingId(null); setEditData({}); setEditSignatureFile(null); setEditPhotoFile(null); setIsSaving(false);
  };

  const stayIn = records.filter(r => r.indication === 'Stay-In').length;
  const stayOut = records.filter(r => r.indication === 'Stay-Out').length;

  if (isLoading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid #2d3748', borderTop: '3px solid #63b3ed', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
        <p style={{ color: '#718096', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '12px' }}>CONNECTING TO SERVER...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const navItems = [
    { id: 'dashboard', label: 'Records', icon: '⊞' },
    { id: 'add', label: 'Add Employee', icon: '+' },
    { id: 'database', label: 'Load Database', icon: '⬆' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '220px' : '60px', minHeight: '100vh', background: '#161b27',
        borderRight: '1px solid #1e2533', transition: 'width 0.25s ease', flexShrink: 0,
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh'
      }} className="print:hidden">
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e2533', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#63b3ed', padding: '4px', flexShrink: 0 }}>
            <Menu size={18} />
          </button>
          {sidebarOpen && <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>PORTER ACCESS</span>}
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id as any)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: activeSection === item.id ? 'linear-gradient(135deg, #1e3a5f, #1a2f4a)' : 'transparent',
                color: activeSection === item.id ? '#63b3ed' : '#718096',
                marginBottom: '4px', transition: 'all 0.15s', textAlign: 'left',
                borderLeft: activeSection === item.id ? '2px solid #63b3ed' : '2px solid transparent',
              }}>
              <span style={{ fontSize: '16px', flexShrink: 0, width: '20px', textAlign: 'center' }}>{item.icon}</span>
              {sidebarOpen && <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div style={{ padding: '16px', borderTop: '1px solid #1e2533' }}>
            <p style={{ color: '#4a5568', fontSize: '11px', margin: 0 }}>v2.0 · Linux Server</p>
            <p style={{ color: '#2d6a4f', fontSize: '11px', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#48bb78', display: 'inline-block' }}></span>
              Connected
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top Bar */}
        <div style={{ background: '#161b27', borderBottom: '1px solid #1e2533', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="print:hidden">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#4a5568', fontSize: '13px' }}>
              {activeSection === 'dashboard' && 'Employee Records'}
              {activeSection === 'add' && 'Add Employee'}
              {activeSection === 'database' && 'Load Database'}
            </span>
            <ChevronRight size={14} color="#4a5568" />
            <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600 }}>
              {activeSection === 'dashboard' ? `${records.length} entries` : activeSection === 'add' ? 'New Entry' : 'Excel Upload'}
            </span>
          </div>
          {activeSection === 'dashboard' && records.length > 0 && (
            <button onClick={() => window.print()}
              style={{ background: 'linear-gradient(135deg, #2b6cb0, #1e4e8c)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={14} /> Print
            </button>
          )}
        </div>

        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

          {/* DASHBOARD VIEW */}
          {activeSection === 'dashboard' && (
            <div>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }} className="print:hidden">
                {[
                  { label: 'Total Employees', value: records.length, icon: <Users size={20} />, color: '#63b3ed', bg: '#1e3a5f' },
                  { label: 'Stay-In', value: stayIn, icon: <UserCheck size={20} />, color: '#68d391', bg: '#1c3a2a' },
                  { label: 'Stay-Out', value: stayOut, icon: <UserX size={20} />, color: '#fc8181', bg: '#3a1c1c' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: '#161b27', border: '1px solid #1e2533', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: stat.bg, color: stat.color, borderRadius: '10px', padding: '10px', display: 'flex' }}>{stat.icon}</div>
                    <div>
                      <p style={{ color: '#718096', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
                      <p style={{ color: stat.color, fontSize: '28px', fontWeight: 700, margin: 0, lineHeight: 1 }}>{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table */}
              {records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#4a5568' }}>
                  <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '16px', margin: '0 0 8px' }}>No records yet</p>
                  <p style={{ fontSize: '13px', margin: 0 }}>Go to Add Employee to get started</p>
                </div>
              ) : (
                <div id="print-area" style={{ background: '#161b27', borderRadius: '12px', border: '1px solid #1e2533', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#0f1117' }}>
                          {['No.', 'Name', 'Designation', 'Signature', 'Indication', 'Photo', ''].map((h, i) => (
                            <th key={i} className={h === '' ? 'print:hidden' : ''} style={{ padding: '12px 16px', color: '#4a5568', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: h === 'No.' ? 'center' : 'left', borderBottom: '1px solid #1e2533', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record, index) => {
                          const isEditing = editingId === record.id;
                          return (
                            <tr key={record.id} style={{ borderBottom: '1px solid #1a2030', background: isEditing ? '#1a2535' : index % 2 === 0 ? '#161b27' : '#13181f' }}
                              onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = '#1a2535'; }}
                              onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = index % 2 === 0 ? '#161b27' : '#13181f'; }}>

                              <td style={{ padding: '12px 16px', textAlign: 'center', color: '#4a5568', fontWeight: 600, fontSize: '12px' }}>{index + 1}</td>

                              <td style={{ padding: '12px 16px', minWidth: '160px' }}>
                                {isEditing ? (
                                  <div style={{ position: 'relative' }}>
                                    <input type="text" value={editData.name || ''}
                                      onChange={(e) => { setEditData(p => ({ ...p, name: e.target.value })); setEditShowDropdown(true); }}
                                      onFocus={() => setEditShowDropdown(true)}
                                      onBlur={() => setTimeout(() => setEditShowDropdown(false), 200)}
                                      style={{ width: '100%', background: '#0f1117', border: '1px solid #2d3748', borderRadius: '6px', padding: '6px 10px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                    {editShowDropdown && (
                                      <ul style={{ position: 'absolute', zIndex: 50, width: '240px', marginTop: '4px', background: '#1a2030', border: '1px solid #2d3748', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: '160px', overflowY: 'auto', padding: 0, listStyle: 'none' }}>
                                        {employeeDatabase.filter(e => e.fullname.toLowerCase().includes((editData.name || '').toLowerCase())).map((emp, i) => (
                                          <li key={i} onMouseDown={() => { setEditData(p => ({ ...p, name: emp.fullname, position: emp.position })); setEditShowDropdown(false); }}
                                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #1e2533' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e2d40'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                            <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>{emp.fullname}</div>
                                            <div style={{ color: '#718096', fontSize: '11px' }}>{emp.position}</div>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ) : <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{record.name}</span>}
                              </td>

                              <td style={{ padding: '12px 16px', minWidth: '130px' }}>
                                {isEditing
                                  ? <input type="text" value={editData.position || ''} onChange={(e) => setEditData(p => ({ ...p, position: e.target.value }))}
                                      style={{ width: '100%', background: '#0f1117', border: '1px solid #2d3748', borderRadius: '6px', padding: '6px 10px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                  : <span style={{ color: '#a0aec0' }}>{record.position}</span>}
                              </td>

                              <td style={{ padding: '8px 12px', width: '140px' }}>
                                {isEditing
                                  ? <EditImgCell file={editSignatureFile} existingSrc={resolveImg(editData.signature)} onFile={setEditSignatureFile} fit="contain" />
                                  : <ImgCell src={resolveImg(record.signature)} height={76} fit="contain" />}
                              </td>

                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                {isEditing
                                  ? <select value={editData.indication || ''} onChange={(e) => setEditData(p => ({ ...p, indication: e.target.value }))}
                                      style={{ background: '#0f1117', border: '1px solid #2d3748', borderRadius: '6px', padding: '6px 10px', color: '#e2e8f0', fontSize: '13px', outline: 'none' }}>
                                      <option value="Stay-In">Stay-In</option>
                                      <option value="Stay-Out">Stay-Out</option>
                                    </select>
                                  : <span style={{
                                      display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                      background: record.indication === 'Stay-In' ? '#1c3a2a' : '#3a1c1c',
                                      color: record.indication === 'Stay-In' ? '#68d391' : '#fc8181',
                                      border: `1px solid ${record.indication === 'Stay-In' ? '#276749' : '#9b2c2c'}`
                                    }}>{record.indication}</span>}
                              </td>

                              <td style={{ padding: '8px 12px', width: '120px' }}>
                                {isEditing
                                  ? <EditImgCell file={editPhotoFile} existingSrc={resolveImg(editData.photo)} onFile={setEditPhotoFile} fit="cover" />
                                  : <ImgCell src={resolveImg(record.photo)} height={118} fit="cover" />}
                              </td>

                              <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }} className="print:hidden">
                                {isEditing ? (
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    <button onClick={handleSaveEdit} disabled={isSaving}
                                      style={{ background: '#276749', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                                      {isSaving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />} Save
                                    </button>
                                    <button onClick={handleCancelEdit}
                                      style={{ background: '#2d3748', color: '#a0aec0', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                                      <X size={12} /> Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', opacity: 0 }} className="action-btns"
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0'}>
                                    <button onClick={() => handleEdit(record)}
                                      style={{ background: '#1e3a5f', color: '#63b3ed', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                                      <Pencil size={12} /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(record.id)}
                                      style={{ background: '#3a1c1c', color: '#fc8181', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                                      <Trash2 size={12} /> Del
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADD EMPLOYEE VIEW */}
          {activeSection === 'add' && (
            <div style={{ maxWidth: '680px' }}>
              <div style={{ background: '#161b27', border: '1px solid #1e2533', borderRadius: '16px', padding: '32px' }}>
                <h2 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 700, margin: '0 0 28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: '#1e3a5f', color: '#63b3ed', borderRadius: '8px', padding: '6px 10px', fontSize: '14px' }}>+</span>
                  New Employee Entry
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
                    <label style={{ display: 'block', color: '#718096', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                      Employee Name
                    </label>
                    <input type="text" value={selectedName}
                      onChange={(e) => { setSelectedName(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      placeholder="Search employee..."
                      style={{ width: '100%', background: '#0f1117', border: '1px solid #2d3748', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                    {showDropdown && selectedName && (
                      <ul style={{ position: 'absolute', zIndex: 50, width: '100%', marginTop: '4px', background: '#1a2030', border: '1px solid #2d3748', borderRadius: '10px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)', maxHeight: '200px', overflowY: 'auto', padding: 0, listStyle: 'none' }}>
                        {employeeDatabase.filter(e => e.fullname.toLowerCase().includes(selectedName.toLowerCase())).map((emp, i) => (
                          <li key={i} onMouseDown={() => { setSelectedName(emp.fullname); setPosition(emp.position); setShowDropdown(false); }}
                            style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #1e2533' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e2d40'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                            <div style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600 }}>{emp.fullname}</div>
                            <div style={{ color: '#718096', fontSize: '12px' }}>{emp.position}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#718096', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Designation</label>
                    <input type="text" value={position} readOnly
                      style={{ width: '100%', background: '#0d1117', border: '1px solid #1e2533', borderRadius: '8px', padding: '10px 14px', color: '#4a5568', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#718096', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Indication</label>
                    <select value={indication} onChange={(e) => setIndication(e.target.value)}
                      style={{ width: '100%', background: '#0f1117', border: '1px solid #2d3748', borderRadius: '8px', padding: '10px 14px', color: indication ? '#e2e8f0' : '#4a5568', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}>
                      <option value="">-- Select --</option>
                      <option value="Stay-In">Stay-In</option>
                      <option value="Stay-Out">Stay-Out</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Signature', file: signatureFile, preview: signaturePreview, setFile: setSignatureFile, setPreview: setSignaturePreview },
                    { label: 'Photo', file: photoFile, preview: photoPreview, setFile: setPhotoFile, setPreview: setPhotoPreview },
                  ].map(({ label, preview, setFile, setPreview }) => (
                    <div key={label}>
                      <label style={{ display: 'block', color: '#718096', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{label}</label>
                      <div style={{ position: 'relative', height: '120px', border: '1px dashed #2d3748', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#0f1117', overflow: 'hidden' }}>
                        {preview
                          ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: label === 'Photo' ? 'cover' : 'contain', padding: label === 'Photo' ? '0' : '8px', boxSizing: 'border-box' }} />
                          : <>
                            <Upload size={20} color="#4a5568" />
                            <span style={{ color: '#4a5568', fontSize: '12px', marginTop: '6px' }}>Click to upload</span>
                          </>}
                        <input type="file" accept="image/*"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImagePick(f, setFile, setPreview); }}
                          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={handleAddRecord} disabled={isSaving || !selectedName || !indication}
                  style={{
                    width: '100%', background: selectedName && indication ? 'linear-gradient(135deg, #2b6cb0, #1e4e8c)' : '#1a2030',
                    color: selectedName && indication ? 'white' : '#4a5568', border: 'none', borderRadius: '10px',
                    padding: '13px', cursor: selectedName && indication ? 'pointer' : 'not-allowed',
                    fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.2s', letterSpacing: '0.5px'
                  }}>
                  {isSaving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Plus size={16} /> Add to Records</>}
                </button>
              </div>
            </div>
          )}

          {/* DATABASE VIEW */}
          {activeSection === 'database' && (
            <div style={{ maxWidth: '520px' }}>
              <div style={{ background: '#161b27', border: '1px solid #1e2533', borderRadius: '16px', padding: '32px' }}>
                <h2 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: '#1c3a2a', color: '#68d391', borderRadius: '8px', padding: '6px 10px', fontSize: '14px' }}>⬆</span>
                  Load Employee Database
                </h2>
                <p style={{ color: '#4a5568', fontSize: '13px', margin: '0 0 24px' }}>Upload an Excel file with columns: <code style={{ color: '#68d391', background: '#0f1117', padding: '2px 6px', borderRadius: '4px' }}>fullname</code> and <code style={{ color: '#68d391', background: '#0f1117', padding: '2px 6px', borderRadius: '4px' }}>position</code></p>

                <label style={{ display: 'block', border: '2px dashed #2d3748', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: '#0f1117' }}>
                  <FileSpreadsheet size={40} color="#2d6a4f" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: '#68d391', fontWeight: 600, margin: '0 0 4px', fontSize: '14px' }}>Click to upload Excel file</p>
                  <p style={{ color: '#4a5568', fontSize: '12px', margin: 0 }}>.xlsx or .xls supported</p>
                  <input type="file" accept=".xlsx, .xls" onChange={handleDatabaseUpload} style={{ display: 'none' }} />
                </label>

                {employeeDatabase.length > 0 && (
                  <div style={{ marginTop: '16px', background: '#1c3a2a', border: '1px solid #276749', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#68d391', fontSize: '20px' }}>✓</span>
                    <div>
                      <p style={{ color: '#68d391', fontWeight: 700, margin: 0, fontSize: '13px' }}>{employeeDatabase.length} employees loaded</p>
                      <p style={{ color: '#2d6a4f', fontSize: '12px', margin: '2px 0 0' }}>Stored permanently on server</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0f1117; }
  ::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 3px; }
  tr:hover .action-btns { opacity: 1 !important; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 640px) {
    nav button span:last-child { display: none; }
  }
  @media print {
    /* Hide everything first */
    body * { visibility: hidden !important; }

    /* Then show only the table */
    #print-area, #print-area * { visibility: visible !important; }
    #print-area {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
    }

    /* Clean table styles */
    table { border-collapse: collapse !important; width: 100% !important; }
    thead { display: table-header-group !important; }
    tbody { display: table-row-group !important; }
    th, td { border: 1px solid black !important; color: black !important; background: white !important; padding: 8px !important; }
    tr { page-break-inside: avoid !important; break-inside: avoid !important; }
    img { display: block !important; max-width: 100% !important; }
    .print\\:hidden { display: none !important; }

    /* Remove badge styling */
    span[style*="border-radius: 20px"] {
      border: 1px solid black !important;
      border-radius: 4px !important;
      padding: 2px 6px !important;
      color: black !important;
      background: white !important;
    }
  }
`}</style>
    </div>
  );
}