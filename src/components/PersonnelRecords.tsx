import React, { useState } from 'react';
import { Pencil, X, Check, Plus, Building2, Search } from 'lucide-react';
import { API_URL } from '../types';
import type { EmployeeRecord, Employee } from '../types';
import { resolveImg, uploadImage } from '../utils';

function ImgCell({ src, height, fit }: { src: string | null; height: number; fit: 'contain' | 'cover' }) {
  if (!src) return <span style={{ color: '#7d8590', fontSize: '11px', display: 'block', textAlign: 'center' }}>—</span>;
  return <img src={src} style={{ width: '100%', height: `${height}px`, objectFit: fit, display: 'block' }} />;
}

function EditImgCell({ file, existingSrc, onFile, fit }: { file: File | null; existingSrc: string | null; onFile: (f: File) => void; fit: 'contain' | 'cover' }) {
  const preview = file ? URL.createObjectURL(file) : existingSrc;
  return (
    <div style={{ position: 'relative', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1', borderRadius: '4px', cursor: 'pointer', background: '#f8fafc', overflow: 'hidden' }}>
      {preview ? <img src={preview} style={{ width: '100%', height: '86px', objectFit: fit }} /> : <span style={{ fontSize: '10px', color: '#94a3b8' }}>Upload</span>}
      <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
    </div>
  );
}

interface Props {
  records: EmployeeRecord[];
  setRecords: React.Dispatch<React.SetStateAction<EmployeeRecord[]>>;
  employeeDatabase: Employee[];
  onAddPersonnel: () => void;
}

export default function PersonnelRecords({ records, setRecords, employeeDatabase, onAddPersonnel }: Props) {
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterIndication, setFilterIndication] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<EmployeeRecord>>({});
  const [editSignatureFile, setEditSignatureFile] = useState<File | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editShowDropdown, setEditShowDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const saveRecords = async (data: EmployeeRecord[]) => {
    try { await fetch(`${API_URL}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch {}
  };

  const handleEdit = (record: EmployeeRecord) => { setEditingId(record.id); setEditData({ ...record }); setEditSignatureFile(null); setEditPhotoFile(null); };
  const handleCancelEdit = () => { setEditingId(null); setEditData({}); };
  const handleDelete = async (id: number) => {
    await fetch(`${API_URL}/records/${id}`, { method: 'DELETE' });
    setRecords(prev => prev.filter(r => r.id !== id));
  };
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

  // Unique companies and departments from records
  const companies = [...new Set(records.map(r => r.company).filter(Boolean))] as string[];
  const departments = [...new Set(records.map(r => r.position).filter(Boolean))] as string[];

  const filtered = records.filter(r => {
    const matchSearch = search === '' ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.position?.toLowerCase().includes(search.toLowerCase()) ||
      r.empCode?.toLowerCase().includes(search.toLowerCase());
    const matchCompany = filterCompany === '' || r.company === filterCompany;
    const matchDept = filterDept === '' || r.position === filterDept;
    const matchIndication = filterIndication === '' || r.indication === filterIndication;
    return matchSearch && matchCompany && matchDept && matchIndication;
  });

  if (records.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
      <Building2 size={48} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
      <p style={{ color: '#64748b', fontSize: '16px', margin: '0 0 6px', fontWeight: 600 }}>No personnel records yet</p>
      <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>Add your first employee to get started</p>
      <button onClick={onAddPersonnel} style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(102,126,234,0.4)' }}>
        <Plus size={14} /> Add Personnel
      </button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Personnel Records</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>{filtered.length} of {records.length} employees</p>
        </div>
        <button onClick={onAddPersonnel} style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '12px', padding: '9px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(102,126,234,0.35)' }}>
          <Plus size={14} /> Add Personnel
        </button>
      </div>

      <div id="print-area" style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>

        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: '#fafafa' }} className="print:hidden">
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search name, position, ID..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px 6px 28px', fontSize: '12px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#667eea'}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'} />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}><X size={12} /></button>}
          </div>
          {/* Company filter */}
          {companies.length > 0 && (
            <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
              style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: '#374151', outline: 'none', cursor: 'pointer' }}>
              <option value="">All Companies</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {/* Department filter */}
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: '#374151', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Departments</option>
            {departments.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {/* Status filter */}
          <select value={filterIndication} onChange={e => setFilterIndication(e.target.value)}
            style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: '#374151', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Status</option>
            <option value="Stay-In">Stay-In</option>
            <option value="Stay-Out">Stay-Out</option>
          </select>
          {/* Active filters count */}
          <span style={{ background: '#667eea15', color: '#667eea', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{filtered.length} records</span>
          {/* Clear filters */}
          {(search || filterCompany || filterDept || filterIndication) && (
            <button onClick={() => { setSearch(''); setFilterCompany(''); setFilterDept(''); setFilterIndication(''); }}
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Clear filters
            </button>
          )}
        </div>

        {/* Empty filtered state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Search size={32} color="#e2e8f0" style={{ margin: '0 auto 8px' }} />
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No results found</p>
          </div>
        )}

        {/* Table */}
        {filtered.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'NAME', 'DESIGNATION', 'ID CODE', 'SIGNATURE', 'STATUS', 'PHOTO', ''].map((h, i) => (
                    <th key={i} className={h === '' ? 'print:hidden' : ''}
                      style={{ padding: '11px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '10px', letterSpacing: '1px', textAlign: i === 0 || (i >= 4 && i <= 6) ? 'center' : 'left', borderBottom: '2px solid #f1f5f9', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, index) => {
                  const isEditing = editingId === record.id;
                  return (
                    <tr key={record.id} style={{ borderBottom: '1px solid #f8fafc', background: isEditing ? '#667eea08' : '#fff', transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = '#fff'; }}>

                      {/* # */}
                      <td style={{ padding: '10px 16px', textAlign: 'center', color: '#cbd5e1', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 }}>{String(index + 1).padStart(2, '0')}</td>

                      {/* Name */}
                      <td style={{ padding: '10px 16px' }}>
                        {isEditing ? (
                          <div style={{ position: 'relative' }}>
                            <input type="text" value={editData.name || ''} onChange={e => { setEditData(p => ({ ...p, name: e.target.value })); setEditShowDropdown(true); }}
                              onFocus={() => setEditShowDropdown(true)} onBlur={() => setTimeout(() => setEditShowDropdown(false), 200)}
                              style={{ width: '100%', background: '#fff', border: '1.5px solid #667eea', borderRadius: '8px', padding: '7px 10px', color: '#0f172a', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }} />
                            {editShowDropdown && editData.name && (
                              <ul style={{ position: 'absolute', zIndex: 50, width: '100%', marginTop: '4px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxHeight: '180px', overflowY: 'auto', padding: 0, listStyle: 'none' }}>
                                {employeeDatabase.filter(e => e.fullname.toLowerCase().includes((editData.name || '').toLowerCase())).map((emp, i) => (
                                  <li key={i} onMouseDown={() => { setEditData(p => ({ ...p, name: emp.fullname, position: emp.position, ...(emp.empCode ? { empCode: emp.empCode } : {}) })); setEditShowDropdown(false); }}
                                    style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontSize: '13px', color: '#0f172a' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#667eea10'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}>
                                    {emp.fullname} {emp.position && <span style={{ color: '#94a3b8', fontSize: '11px' }}>— {emp.position}</span>}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{record.name}</p>
                            {record.company && <p style={{ margin: '1px 0 0', fontSize: '10px', color: '#94a3b8' }}>{record.company}</p>}
                            {record.empCode && <span style={{ background: '#667eea15', color: '#667eea', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>{record.empCode}</span>}
                          </div>
                        )}
                      </td>

                      {/* Position */}
                      <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '12px' }}>
                        {isEditing
                          ? <input type="text" value={editData.position || ''} onChange={e => setEditData(p => ({ ...p, position: e.target.value }))} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', color: '#0f172a', fontSize: '12px', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                          : record.position}
                      </td>

                      {/* Emp Code */}
                      <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
                        {isEditing
                          ? <input type="text" value={editData.empCode || ''} onChange={e => setEditData(p => ({ ...p, empCode: e.target.value }))} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', color: '#667eea', fontSize: '12px', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                          : record.empCode}
                      </td>

                      {/* Signature */}
                      <td style={{ padding: '6px 16px', textAlign: 'center', width: '120px' }}>
                        {isEditing
                          ? <EditImgCell file={editSignatureFile} existingSrc={resolveImg(record.signature)} onFile={f => setEditSignatureFile(f)} fit="contain" />
                          : <ImgCell src={resolveImg(record.signature)} height={48} fit="contain" />}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        {isEditing ? (
                          <select value={editData.indication || ''} onChange={e => setEditData(p => ({ ...p, indication: e.target.value }))}
                            style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '5px 8px', color: '#0f172a', fontSize: '12px', outline: 'none' }}>
                            <option value="Stay-In">Stay-In</option>
                            <option value="Stay-Out">Stay-Out</option>
                          </select>
                        ) : (
                          <span style={{ background: record.indication === 'Stay-In' ? '#ecfdf5' : '#fef2f2', color: record.indication === 'Stay-In' ? '#059669' : '#dc2626', border: `1px solid ${record.indication === 'Stay-In' ? '#a7f3d0' : '#fecaca'}`, borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {record.indication}
                          </span>
                        )}
                      </td>

                      {/* Photo — contain so face isn't cropped */}
                      <td style={{ padding: '6px 16px', textAlign: 'center', width: '90px' }}>
                        {isEditing
                          ? <EditImgCell file={editPhotoFile} existingSrc={resolveImg(record.photo)} onFile={f => setEditPhotoFile(f)} fit="contain" />
                          : <ImgCell src={resolveImg(record.photo)} height={56} fit="contain" />}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '8px 16px', textAlign: 'center' }} className="print:hidden">
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button onClick={handleSaveEdit} disabled={isSaving}
                              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Check size={11} />{isSaving ? '...' : 'Save'}
                            </button>
                            <button onClick={handleCancelEdit}
                              style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
                          </div>
                        ) : (
                          <div className="row-actions" style={{ display: 'flex', gap: '4px', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}>
                            <button onClick={() => handleEdit(record)}
                              style={{ background: '#667eea15', color: '#667eea', border: '1px solid #667eea30', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Pencil size={10} />Edit
                            </button>
                            <button onClick={() => handleDelete(record.id)}
                              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', fontSize: '11px' }}>
                              <X size={10} />
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
        )}
      </div>
    </div>
  );
}