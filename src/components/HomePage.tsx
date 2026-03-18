import React from 'react';
import { Users, CreditCard, Download, FileSpreadsheet, Plus, TrendingUp, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { EmployeeRecord, ActiveSection } from '../types';

interface Props {
  records: EmployeeRecord[];
  savedIDs: any[];
  employeeDatabase: any[];
  onNavigate: (section: ActiveSection) => void;
  onAddPersonnel: () => void;
}

export default function HomePage({ records, savedIDs, employeeDatabase, onNavigate, onAddPersonnel }: Props) {
  const stayIn = records.filter(r => r.indication === 'Stay-In').length;
  const stayOut = records.filter(r => r.indication === 'Stay-Out').length;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const stats = [
    { label: 'Total Personnel', value: records.length, icon: <Users size={20}/>, color: '#667eea', bg: '#667eea15', section: 'dashboard' as ActiveSection, trend: '+' + records.length },
    { label: 'Stay-In', value: stayIn, icon: <CheckCircle size={20}/>, color: '#10b981', bg: '#10b98115', section: 'dashboard' as ActiveSection, trend: `${records.length ? Math.round(stayIn/records.length*100) : 0}%` },
    { label: 'Stay-Out', value: stayOut, icon: <AlertCircle size={20}/>, color: '#f59e0b', bg: '#f59e0b15', section: 'dashboard' as ActiveSection, trend: `${records.length ? Math.round(stayOut/records.length*100) : 0}%` },
    { label: 'Saved ID Cards', value: savedIDs.length, icon: <CreditCard size={20}/>, color: '#8b5cf6', bg: '#8b5cf615', section: 'idrecords' as ActiveSection, trend: savedIDs.length + ' total' },
  ];

  const quickActions = [
    { label: 'Add Personnel', desc: 'Register a new employee', icon: <Plus size={22}/>, color: '#667eea', gradient: 'linear-gradient(135deg,#667eea,#764ba2)', section: 'add' as ActiveSection, isModal: true },
    { label: 'ID Builder', desc: 'Design employee ID cards', icon: <CreditCard size={22}/>, color: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#be185d)', section: 'idbuilder' as ActiveSection },
    { label: 'Load Database', desc: 'Import from Excel', icon: <FileSpreadsheet size={22}/>, color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#059669)', section: 'database' as ActiveSection },
    { label: 'View Records', desc: 'Browse all personnel', icon: <Users size={22}/>, color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', section: 'dashboard' as ActiveSection },
    { label: 'Saved IDs', desc: 'View & print saved cards', icon: <Download size={22}/>, color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', section: 'idrecords' as ActiveSection },
  ];

  const recentRecords = records.slice(-5).reverse();

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#667eea 0%,#764ba2 50%,#ec4899 100%)', borderRadius: '20px', padding: '24px 20px', marginBottom: '20px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}/>
        <div style={{ position: 'absolute', bottom: '-60px', right: '80px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>
        <div style={{ position: 'absolute', top: '20px', right: '180px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px', display: 'flex', backdropFilter: 'blur(10px)' }}>
              <Shield size={20} color="white"/>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '2px', opacity: 0.8, textTransform: 'uppercase' }}>AVPass Control</span>
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 900, lineHeight: 1.1 }}>Welcome back! 👋</h1>
          <p style={{ margin: '0 0 6px', opacity: 0.85, fontSize: '14px' }}>{dateStr}</p>
          <p style={{ margin: '0 0 28px', opacity: 0.6, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13}/> {timeStr} — System Online
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={onAddPersonnel}
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', padding: '10px 22px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)'}>
              <Plus size={15}/> Add Personnel
            </button>
            <button onClick={() => onNavigate('idbuilder')}
              style={{ background: '#fff', color: '#667eea', border: 'none', borderRadius: '12px', padding: '10px 22px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}>
              <CreditCard size={15}/> ID Builder
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '20px' }}>
        {stats.map((s, i) => (
          <div key={i} onClick={() => onNavigate(s.section)} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ background: s.bg, borderRadius: '10px', padding: '8px', color: s.color, display: 'flex' }}>{s.icon}</div>
              <span style={{ background: s.bg, color: s.color, fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px' }}>{s.trend}</span>
            </div>
            <p style={{ margin: '0 0 2px', fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>

        {/* Quick Actions */}
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Quick Actions</h3>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>Jump to any section</p>
          </div>
          <div style={{ padding: '12px' }}>
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => (a as any).isModal ? onAddPersonnel() : onNavigate(a.section)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '11px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left', transition: 'all 0.15s', marginBottom: '4px' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <div style={{ background: a.gradient, borderRadius: '10px', padding: '8px', display: 'flex', flexShrink: 0, boxShadow: `0 4px 10px ${a.color}40` }}>
                  {React.cloneElement(a.icon, { color: 'white' })}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{a.label}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Personnel */}
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Recent Personnel</h3>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>Latest added records</p>
            </div>
            <button onClick={() => onNavigate('dashboard')}
              style={{ background: '#667eea15', color: '#667eea', border: 'none', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
              View All
            </button>
          </div>
          <div>
            {recentRecords.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Users size={32} color="#e2e8f0" style={{ margin: '0 auto 8px' }}/>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No records yet</p>
              </div>
            ) : recentRecords.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: i < recentRecords.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{r.name.charAt(0)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.position}</p>
                </div>
                <span style={{ background: r.indication === 'Stay-In' ? '#ecfdf5' : '#fef2f2', color: r.indication === 'Stay-In' ? '#059669' : '#dc2626', border: `1px solid ${r.indication === 'Stay-In' ? '#a7f3d0' : '#fecaca'}`, borderRadius: '20px', padding: '3px 10px', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{r.indication}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* System Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginTop: '16px' }}>
        {[
          { label: 'Database Records', value: employeeDatabase.length, icon: <FileSpreadsheet size={16}/>, color: '#10b981', desc: 'Employee data loaded' },
          { label: 'ID Cards Saved', value: savedIDs.length, icon: <CreditCard size={16}/>, color: '#8b5cf6', desc: 'Ready to print' },
          { label: 'Completion Rate', value: `${records.length ? Math.round((records.filter(r => r.photo && r.signature).length / records.length) * 100) : 0}%`, icon: <TrendingUp size={16}/>, color: '#f59e0b', desc: 'Photo & signature' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #f1f5f9', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ background: s.color + '15', borderRadius: '10px', padding: '8px', color: s.color, display: 'flex', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ margin: '0 0 1px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#0f172a', fontWeight: 600 }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}