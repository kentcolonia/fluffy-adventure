import React, { useState } from 'react';
import { Download, Printer, CreditCard } from 'lucide-react';
import { API_URL } from '../types';

interface Props {
  savedIDs: any[];
  setSavedIDs: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function SavedIDs({ savedIDs, setSavedIDs }: Props) {
  const [viewingID, setViewingID] = useState<any | null>(null);

  if (viewingID) return (
    <div>
      <button onClick={() => setViewingID(null)} style={{ marginBottom: '20px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        ← Back to Saved IDs
      </button>
      <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{viewingID.employeeName}</h2>
        <p style={{ margin: '0 0 2px', fontSize: '13px', color: '#64748b' }}>{viewingID.position}</p>
        <p style={{ margin: '0 0 20px', fontSize: '11px', color: '#94a3b8' }}>Saved: {viewingID.savedAt}</p>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Front</p>
            <img src={viewingID.frontImg} style={{ width: '220px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Back</p>
            <img src={viewingID.backImg} style={{ width: '220px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { const a = document.createElement('a'); a.download = `${viewingID.employeeName}-front.jpg`; a.href = viewingID.frontImg; a.click(); }}
            style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(102,126,234,0.4)' }}>
            <Download size={13} /> Download Front
          </button>
          <button onClick={() => { const a = document.createElement('a'); a.download = `${viewingID.employeeName}-back.jpg`; a.href = viewingID.backImg; a.click(); }}
            style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={13} /> Download Back
          </button>
          <button onClick={() => { const w = window.open('', '_blank')!; w.document.write(`<html><body style="margin:0;display:flex;gap:16px;padding:16px;background:#f8fafc"><img src="${viewingID.frontImg}" style="height:90vh"><img src="${viewingID.backImg}" style="height:90vh"></body></html>`); w.document.close(); setTimeout(() => w.print(), 500); }}
            style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={13} /> Print Both
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Saved ID Cards</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>{savedIDs.length} cards saved</p>
      </div>

      {savedIDs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
          <CreditCard size={48} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 600, margin: '0 0 6px' }}>No saved IDs yet</p>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Use the ID Builder to design and save employee IDs</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
          {savedIDs.map(entry => (
            <div key={entry.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
              <div style={{ display: 'flex', gap: '8px', padding: '12px', background: '#f8fafc', cursor: 'pointer' }} onClick={() => setViewingID(entry)}>
                <img src={entry.frontImg} style={{ width: '72px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0 }} />
                <img src={entry.backImg} style={{ width: '72px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, paddingLeft: '4px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.employeeName}</p>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.position}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>{entry.savedAt}</p>
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '6px' }}>
                <button onClick={() => setViewingID(entry)} style={{ flex: 1, background: '#667eea15', color: '#667eea', border: '1px solid #667eea30', borderRadius: '8px', padding: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>View & Print</button>
                <button onClick={async () => { await fetch(`${API_URL}/saved-ids/${entry.id}`, { method: 'DELETE' }); setSavedIDs(prev => prev.filter(e => e.id !== entry.id)); }}
                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}