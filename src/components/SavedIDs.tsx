import React, { useState } from 'react';
import { Download, Printer, CreditCard, Search, Pencil, Trash2, Check, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { API_URL } from '../types';

interface Props {
  savedIDs: any[];
  setSavedIDs: React.Dispatch<React.SetStateAction<any[]>>;
  onEditInBuilder: (entry: any) => void;
}

function DeleteDialog({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 32px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ background: '#fef2f2', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={28} color="#dc2626" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Delete ID Card?</h3>
        <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#64748b' }}>You are about to delete the ID card for:</p>
        <p style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 700, color: '#0f172a', background: '#f8fafc', borderRadius: '8px', padding: '8px 16px' }}>{name}</p>
        <p style={{ margin: '0 0 24px', fontSize: '12px', color: '#94a3b8' }}>This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ flex: 1, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, boxShadow: '0 4px 12px rgba(220,38,38,0.35)' }}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function SavedIDs({ savedIDs, setSavedIDs, onEditInBuilder }: Props) {
  const [viewingID, setViewingID] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = savedIDs.filter(e =>
    e.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
    e.position?.toLowerCase().includes(search.toLowerCase())
  ).slice().reverse();

  const handleDelete = async (entry: any) => {
    await fetch(`${API_URL}/saved-ids/${entry.id}`, { method: 'DELETE' });
    setSavedIDs(prev => prev.filter(e => e.id !== entry.id));
    setDeleteTarget(null);
    if (viewingID?.id === entry.id) setViewingID(null);
  };

  const startEdit = (entry: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(entry.id);
    setEditName(entry.employeeName || '');
    setEditPosition(entry.position || '');
  };

  const saveEdit = async (entry: any) => {
    setIsSaving(true);
    const updated = { ...entry, employeeName: editName, position: editPosition };
    try {
      await fetch(`${API_URL}/saved-ids/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName: editName, position: editPosition }),
      });
    } catch {}
    setSavedIDs(prev => prev.map(e => e.id === entry.id ? updated : e));
    if (viewingID?.id === entry.id) setViewingID(updated);
    setEditingId(null);
    setIsSaving(false);
  };

  if (viewingID) {
    const current = savedIDs.find(e => e.id === viewingID.id) || viewingID;
    return (
      <div>
        {deleteTarget && <DeleteDialog name={deleteTarget.employeeName} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
        <button onClick={() => setViewingID(null)} style={{ marginBottom: '20px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          ← Back to Saved IDs
        </button>
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          {editingId === current.id ? (
            <div style={{ marginBottom: '20px' }}>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Employee Name"
                style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #667eea', borderRadius: '8px', padding: '8px 12px', fontSize: '16px', fontWeight: 700, color: '#0f172a', outline: 'none', marginBottom: '8px', boxSizing: 'border-box' as const }} />
              <input value={editPosition} onChange={e => setEditPosition(e.target.value)} placeholder="Position"
                style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '7px 12px', fontSize: '13px', color: '#64748b', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' as const }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => saveEdit(current)} disabled={isSaving} style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Check size={13} />{isSaving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingId(null)} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{current.employeeName}</h2>
                <p style={{ margin: '0 0 2px', fontSize: '13px', color: '#64748b' }}>{current.position}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Saved: {current.savedAt}</p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={() => onEditInBuilder(current)}
                  style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 8px rgba(102,126,234,0.35)' }}>
                  <ExternalLink size={12} />Edit in Builder
                </button>
                <button onClick={e => startEdit(current, e)} style={{ background: '#667eea15', color: '#667eea', border: '1px solid #667eea30', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Pencil size={12} />Rename
                </button>
                <button onClick={() => setDeleteTarget(current)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Trash2 size={12} />Delete
                </button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
            {[{ label: 'Front', img: current.frontImg }, { label: 'Back', img: current.backImg }].map(side => (
              <div key={side.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>{side.label}</p>
                <img src={side.img} style={{ width: '220px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { const a = document.createElement('a'); a.download = `${current.employeeName}-front.jpg`; a.href = current.frontImg; a.click(); }} style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(102,126,234,0.4)' }}>
              <Download size={13} />Download Front
            </button>
            <button onClick={() => { const a = document.createElement('a'); a.download = `${current.employeeName}-back.jpg`; a.href = current.backImg; a.click(); }} style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={13} />Download Back
            </button>
            <button onClick={() => { const w = window.open('', '_blank')!; w.document.write(`<html><body style="margin:0;display:flex;gap:16px;padding:16px;background:#f8fafc"><img src="${current.frontImg}" style="height:90vh"><img src="${current.backImg}" style="height:90vh"></body></html>`); w.document.close(); setTimeout(() => w.print(), 500); }} style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={13} />Print Both
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {deleteTarget && <DeleteDialog name={deleteTarget.employeeName} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Saved ID Cards</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>{filtered.length} of {savedIDs.length} cards</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input type="text" placeholder="Search by name or position..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '9px 36px 9px 34px', fontSize: '13px', color: '#0f172a', outline: 'none', width: '260px', boxSizing: 'border-box' as const, transition: 'border-color 0.15s' }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#667eea'}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'} />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {savedIDs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
          <CreditCard size={48} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 600, margin: '0 0 6px' }}>No saved IDs yet</p>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Use the ID Builder to design and save employee IDs</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
          <Search size={36} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, margin: '0 0 6px' }}>No results for "{search}"</p>
          <button onClick={() => setSearch('')} style={{ background: '#667eea15', color: '#667eea', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Clear search</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' }}>
          {filtered.map(entry => (
            <div key={entry.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
              <div style={{ display: 'flex', gap: '8px', padding: '12px', background: '#f8fafc', cursor: 'pointer' }} onClick={() => editingId !== entry.id && setViewingID(entry)}>
                <img src={entry.frontImg} style={{ width: '72px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0 }} />
                <img src={entry.backImg} style={{ width: '72px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, paddingLeft: '4px' }}>
                  {editingId === entry.id ? (
                    <div onClick={e => e.stopPropagation()}>
                      <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                        style={{ width: '100%', background: '#fff', border: '1.5px solid #667eea', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: 700, color: '#0f172a', outline: 'none', marginBottom: '4px', boxSizing: 'border-box' as const }} />
                      <input value={editPosition} onChange={e => setEditPosition(e.target.value)}
                        style={{ width: '100%', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', color: '#64748b', outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                  ) : (
                    <>
                      <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.employeeName}</p>
                      <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.position}</p>
                      <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>{entry.savedAt}</p>
                    </>
                  )}
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '6px' }}>
                {editingId === entry.id ? (
                  <>
                    <button onClick={() => saveEdit(entry)} disabled={isSaving} style={{ flex: 1, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Check size={11} />{isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditingId(null)} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center' }}>
                      <X size={11} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setViewingID(entry)} style={{ flex: 1, background: '#667eea15', color: '#667eea', border: '1px solid #667eea30', borderRadius: '8px', padding: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>View</button>
                    <button onClick={() => onEditInBuilder(entry)} style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Edit in ID Builder">
                      <ExternalLink size={11} />
                    </button>
                    <button onClick={e => startEdit(entry, e)} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Rename">
                      <Pencil size={11} />
                    </button>
                    <button onClick={() => setDeleteTarget(entry)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Delete">
                      <Trash2 size={11} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}