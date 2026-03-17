import React from 'react';
import { FileSpreadsheet, Check } from 'lucide-react';
import { API_URL } from '../types';
import type { Employee } from '../types';

interface Props {
  employeeDatabase: Employee[];
  setEmployeeDatabase: React.Dispatch<React.SetStateAction<Employee[]>>;
}

export default function LoadDatabase({ employeeDatabase, setEmployeeDatabase }: Props) {
  const saveDatabase = async (data: Employee[]) => {
    try { await fetch(`${API_URL}/database`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch {}
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const XLSX = (window as any).XLSX;
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];
        const formatted = jsonData.map((row: any) => {
          const ck = Object.keys(row).reduce((acc: any, k: string) => { acc[k.toLowerCase().replace(/\s+/g, '')] = row[k]; return acc; }, {});
          return {
            fullname: String(ck['fullname'] || '').trim(),
            position: String(ck['position'] || '').trim(),
            empCode: String(ck['employeeid'] || ck['employee_id'] || ck['empcode'] || ck['id_code'] || '').trim(),
            company: String(ck['company'] || '').trim(),
            department: String(ck['department'] || '').trim(),
          };
        }).filter(e => e.fullname);
        setEmployeeDatabase(formatted);
        saveDatabase(formatted);
        e.target.value = '';
      } catch { alert('Error reading Excel file'); }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Load Database</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>Import employee data from Excel spreadsheet</p>
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg,#10b98115,#05996915)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '8px', padding: '6px', display: 'flex' }}><FileSpreadsheet size={14} color="white" /></div>
          <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>Import Excel Database</span>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.6 }}>
            Upload an Excel file with columns:
            <code style={{ color: '#667eea', background: '#667eea10', padding: '2px 7px', borderRadius: '5px', margin: '0 4px', fontSize: '12px', fontFamily: 'monospace' }}>fullname</code>
            and
            <code style={{ color: '#667eea', background: '#667eea10', padding: '2px 7px', borderRadius: '5px', margin: '0 4px', fontSize: '12px', fontFamily: 'monospace' }}>position</code>
          </p>

          <label style={{ display: 'block', border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#10b981'; (e.currentTarget as HTMLElement).style.background = '#10b98105'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}>
            <FileSpreadsheet size={40} color="#10b981" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
            <p style={{ color: '#0f172a', fontWeight: 600, margin: '0 0 4px', fontSize: '15px' }}>Click to Upload Excel File</p>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>.xlsx or .xls format</p>
            <input type="file" accept=".xlsx, .xls" onChange={handleUpload} style={{ display: 'none' }} />
          </label>

          {employeeDatabase.length > 0 && (
            <div style={{ marginTop: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#10b981', borderRadius: '50%', padding: '5px', display: 'flex' }}><Check size={14} color="white" /></div>
              <div>
                <p style={{ color: '#059669', fontWeight: 700, margin: 0, fontSize: '13px' }}>{employeeDatabase.length} employees loaded successfully</p>
                <p style={{ color: '#10b981', fontSize: '11px', margin: '2px 0 0' }}>Synced to server storage</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}