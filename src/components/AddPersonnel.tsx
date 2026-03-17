import React, { useState } from 'react';
import { Plus, Upload, Loader2 } from 'lucide-react';
import { API_URL } from '../types';
import type { EmployeeRecord, Employee } from '../types';
import { uploadImage } from '../utils';

interface Props {
  records: EmployeeRecord[];
  setRecords: React.Dispatch<React.SetStateAction<EmployeeRecord[]>>;
  employeeDatabase: Employee[];
  onSuccess: () => void;
}

export default function AddPersonnel({ records, setRecords, employeeDatabase, onSuccess }: Props) {
  const [selectedName, setSelectedName] = useState('');
  const [position, setPosition] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [indication, setIndication] = useState('');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImagePick = (file: File, setFile: (f: File) => void, setPreview: (s: string) => void) => {
    setFile(file);
    const r = new FileReader();
    r.onload = () => setPreview(r.result as string);
    r.readAsDataURL(file);
  };

  const saveRecords = async (data: EmployeeRecord[]) => {
    try { await fetch(`${API_URL}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch {}
  };

  const handleSubmit = async () => {
    if (!selectedName || !indication) return;
    setIsSaving(true);
    const [sigUrl, photoUrl] = await Promise.all([
      signatureFile ? uploadImage(signatureFile, selectedName, 'signature') : Promise.resolve(null),
      photoFile ? uploadImage(photoFile, selectedName, 'photo') : Promise.resolve(null),
    ]);
    const updated = [...records, { id: Date.now(), name: selectedName, position, empCode, indication, signature: sigUrl, photo: photoUrl }];
    setRecords(updated);
    await saveRecords(updated);
    setSelectedName(''); setPosition(''); setEmpCode(''); setIndication('');
    setSignatureFile(null); setSignaturePreview(null); setPhotoFile(null); setPhotoPreview(null);
    setIsSaving(false);
    onSuccess();
  };

  const canSubmit = selectedName && indication;

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Add Personnel</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>Register a new employee record</p>
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg,#667eea15,#764ba215)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: '8px', padding: '6px', display: 'flex' }}><Plus size={14} color="white" /></div>
          <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>New Personnel Entry</span>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Name search */}
            <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Employee Name</label>
              <input type="text" value={selectedName}
                onChange={e => { setSelectedName(e.target.value); setShowDropdown(true); }}
                onFocus={e => { setShowDropdown(true); (e.target as HTMLInputElement).style.borderColor = '#667eea'; }}
                onBlur={e => { setTimeout(() => setShowDropdown(false), 200); (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'; }}
                placeholder="Search or type name..."
                style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', color: '#0f172a', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s' }} />
              {showDropdown && selectedName && (
                <ul style={{ position: 'absolute', zIndex: 50, width: '100%', marginTop: '4px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxHeight: '200px', overflowY: 'auto', padding: 0, listStyle: 'none' }}>
                  {employeeDatabase.filter(e => e.fullname.toLowerCase().includes(selectedName.toLowerCase())).map((emp, i) => (
                    <li key={i} onMouseDown={() => { setSelectedName(emp.fullname); setPosition(emp.position); if (emp.empCode) setEmpCode(emp.empCode); setShowDropdown(false); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#667eea10'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}>
                      <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 600 }}>{emp.fullname}</div>
                      <div style={{ color: '#94a3b8', fontSize: '11px' }}>{emp.position}
                        {emp.empCode && <span style={{ marginLeft: '8px', background: '#667eea15', color: '#667eea', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700 }}>{emp.empCode}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label style={{ display: 'block', color: '#374151', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Designation</label>
              <input type="text" value={position} readOnly style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', color: '#94a3b8', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <div>
              <label style={{ display: 'block', color: '#374151', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Employee ID <span style={{ color: '#94a3b8', fontWeight: 400 }}>— auto-fills</span></label>
              <input type="text" value={empCode} onChange={e => setEmpCode(e.target.value)} placeholder="e.g. ABISC-231003"
                style={{ width: '100%', background: empCode ? '#667eea08' : '#f8fafc', border: empCode ? '1.5px solid #667eea' : '1.5px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', color: '#667eea', fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <div>
              <label style={{ display: 'block', color: '#374151', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Status</label>
              <select value={indication} onChange={e => setIndication(e.target.value)}
                style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', color: indication ? '#0f172a' : '#94a3b8', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }}>
                <option value="">— Select Status —</option>
                <option value="Stay-In">Stay-In</option>
                <option value="Stay-Out">Stay-Out</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Signature', preview: signaturePreview, setFile: setSignatureFile, setPreview: setSignaturePreview, fit: 'contain' as const },
              { label: 'Photo', preview: photoPreview, setFile: setPhotoFile, setPreview: setPhotoPreview, fit: 'cover' as const },
            ].map(({ label, preview, setFile, setPreview, fit }) => (
              <div key={label}>
                <label style={{ display: 'block', color: '#374151', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>{label}</label>
                <div style={{ position: 'relative', height: '120px', border: '1.5px dashed #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc', overflow: 'hidden', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#667eea'; (e.currentTarget as HTMLElement).style.background = '#667eea05'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}>
                  {preview ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: fit }} /> : <><Upload size={20} color="#cbd5e1" /><span style={{ color: '#94a3b8', fontSize: '11px', marginTop: '6px' }}>Upload {label}</span></>}
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleImagePick(f, setFile, setPreview); }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={isSaving || !canSubmit}
            style={{ width: '100%', padding: '12px', background: canSubmit ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f1f5f9', color: canSubmit ? '#fff' : '#94a3b8', border: 'none', borderRadius: '12px', cursor: canSubmit ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: canSubmit ? '0 4px 14px rgba(102,126,234,0.4)' : 'none', transition: 'all 0.2s' }}>
            {isSaving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : <><Plus size={15} /> Submit Record</>}
          </button>
        </div>
      </div>
    </div>
  );
}