import React, { useState, useEffect } from 'react';
import { Users, Plus, FileSpreadsheet, CreditCard, Download, Menu, Shield, Printer } from 'lucide-react';
import { API_URL } from './types';
import type { EmployeeRecord, Employee, ActiveSection } from './types';
import HomePage from './components/HomePage';
import PersonnelRecords from './components/PersonnelRecords';
import AddPersonnel from './components/AddPersonnel';
import LoadDatabase from './components/LoadDatabase';
import SavedIDs from './components/SavedIDs';
import IDBuilder from './components/IDBuilder';

export default function App() {
  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [employeeDatabase, setEmployeeDatabase] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [savedIDs, setSavedIDs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/saved-ids`).then(r => r.ok ? r.json() : []).then(setSavedIDs).catch(() => {});
  }, [activeSection]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dbRes, recRes] = await Promise.all([fetch(`${API_URL}/database`), fetch(`${API_URL}/records`)]);
        if (dbRes.ok) setEmployeeDatabase(await dbRes.json());
        if (recRes.ok) setRecords(await recRes.json());
      } catch { console.error('Connection failed.'); }
      finally { setIsLoading(false); }
    };
    if (!(window as any).XLSX) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.async = true;
      document.body.appendChild(s);
    }
    loadData();
  }, []);

  const stayIn = records.filter(r => r.indication === 'Stay-In').length;
  const stayOut = records.filter(r => r.indication === 'Stay-Out').length;

  const navItems: { id: ActiveSection; label: string; icon: React.ReactNode; color: string; badge?: number | null }[] = [
    { id: 'home',       label: 'Home',              icon: <Shield size={16}/>,          color: '#667eea' },
    { id: 'dashboard',  label: 'Personnel Records', icon: <Users size={16}/>,           color: '#667eea', badge: records.length },
    { id: 'add',        label: 'Add Personnel',     icon: <Plus size={16}/>,            color: '#10b981' },
    { id: 'database',   label: 'Load Database',     icon: <FileSpreadsheet size={16}/>, color: '#f59e0b', badge: employeeDatabase.length || null },
    { id: 'idbuilder',  label: 'ID Builder',        icon: <CreditCard size={16}/>,      color: '#ec4899' },
    { id: 'idrecords',  label: 'Saved IDs',         icon: <Download size={16}/>,        color: '#8b5cf6', badge: savedIDs.length || null },
  ];

  const sectionTitle: Record<ActiveSection, string> = {
    home: 'Home',
    dashboard: 'Personnel Records',
    add: 'Add Personnel',
    database: 'Load Database',
    idbuilder: 'ID Builder',
    idrecords: 'Saved IDs',
  };

  if (isLoading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#667eea 0%,#764ba2 50%,#ec4899 100%)', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '32px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', border: '1px solid rgba(255,255,255,0.2)' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '12px', display: 'flex', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <Shield size={28} color="#667eea" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 800, letterSpacing: '3px' }}>PORTER ACCESS</p>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '12px', letterSpacing: '1px' }}>Control System</p>
        </div>
        <div style={{ width: '180px', height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'white', animation: 'loading 1.4s ease-in-out infinite', borderRadius: '2px' }}></div>
        </div>
      </div>
      <style>{`@keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', height: '100vh', background: '#f8fafc', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: '#0f172a', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: sidebarOpen ? '240px' : '64px', background: '#fff', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', borderRight: '1px solid #e2e8f0', boxShadow: '4px 0 24px rgba(0,0,0,0.04)' }} className="print:hidden">

        {/* Logo */}
        <div style={{ padding: sidebarOpen ? '20px 18px' : '20px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px', minHeight: '64px' }}>
          <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: '12px', padding: '8px', display: 'flex', flexShrink: 0, boxShadow: '0 4px 12px rgba(102,126,234,0.4)' }}>
            <Shield size={16} color="white" />
          </div>
          {sidebarOpen && (
            <div>
              <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 800, letterSpacing: '0.5px' }}>Porter Access</p>
              <p style={{ margin: '1px 0 0', color: '#94a3b8', fontSize: '10px', letterSpacing: '1px' }}>Control System</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
          {sidebarOpen && <p style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0 10px', margin: '0 0 8px' }}>Navigation</p>}
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 10px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: activeSection === item.id ? `${item.color}15` : 'transparent', color: activeSection === item.id ? item.color : '#64748b', marginBottom: '2px', transition: 'all 0.15s', textAlign: 'left', justifyContent: sidebarOpen ? 'flex-start' : 'center', boxShadow: activeSection === item.id ? `0 2px 8px ${item.color}20` : 'none' }}
              onMouseEnter={e => { if (activeSection !== item.id) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
              onMouseLeave={e => { if (activeSection !== item.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <span style={{ flexShrink: 0, color: activeSection === item.id ? item.color : '#94a3b8' }}>{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: activeSection === item.id ? 600 : 400, flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                    <span style={{ background: activeSection === item.id ? item.color : '#e2e8f0', color: activeSection === item.id ? '#fff' : '#64748b', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', minWidth: '20px', textAlign: 'center' }}>{item.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Stats */}
        {sidebarOpen && (
          <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ margin: '0 0 8px', color: '#94a3b8', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Quick Stats</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[{ label: 'Stay-In', value: stayIn, color: '#10b981', bg: '#ecfdf5' }, { label: 'Stay-Out', value: stayOut, color: '#ef4444', bg: '#fef2f2' }].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '10px 12px', border: `1px solid ${s.color}20` }}>
                  <p style={{ margin: 0, color: s.color, fontSize: '20px', fontWeight: 800 }}>{s.value}</p>
                  <p style={{ margin: '2px 0 0', color: s.color, fontSize: '10px', opacity: 0.7 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapse */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ margin: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f1f5f9'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}>
          <Menu size={15} />
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Header */}
        <header style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }} className="print:hidden">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Porter Access</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: 600 }}>{sectionTitle[activeSection]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ color: '#64748b', fontSize: '11px' }}>Server Online</span>
            </div>
            <span style={{ color: '#e2e8f0' }}>|</span>
            {activeSection === 'dashboard' && records.length > 0 && (
              <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '10px', padding: '7px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(102,126,234,0.4)' }}>
                <Printer size={13} /> Print
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: activeSection === 'idbuilder' ? '0' : '24px' }}>
          {activeSection === 'home' && (
            <HomePage records={records} savedIDs={savedIDs} employeeDatabase={employeeDatabase} onNavigate={setActiveSection} />
          )}
          {activeSection === 'dashboard' && (
            <PersonnelRecords records={records} setRecords={setRecords} employeeDatabase={employeeDatabase} onNavigate={setActiveSection} />
          )}
          {activeSection === 'add' && (
            <AddPersonnel records={records} setRecords={setRecords} employeeDatabase={employeeDatabase} onSuccess={() => setActiveSection('dashboard')} />
          )}
          {activeSection === 'database' && (
            <LoadDatabase employeeDatabase={employeeDatabase} setEmployeeDatabase={setEmployeeDatabase} />
          )}
          {activeSection === 'idbuilder' && (
            <IDBuilder records={records} />
          )}
          {activeSection === 'idrecords' && (
            <SavedIDs savedIDs={savedIDs} setSavedIDs={setSavedIDs} />
          )}
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        tr:hover .row-actions { opacity: 1 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          thead { display: table-header-group !important; }
          th, td { border: 1px solid #000 !important; color: #000 !important; background: #fff !important; padding: 8px !important; }
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          img { display: block !important; max-width: 100% !important; }
          .print\\:hidden { display: none !important; }
          span[style*="border-radius"] { border: 1px solid #000 !important; color: #000 !important; background: #fff !important; padding: 2px 6px !important; }
        }
      `}</style>
    </div>
  );
}