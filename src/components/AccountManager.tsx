import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Shield, User, Check, X, Pencil } from 'lucide-react';
import { API_URL } from '../types';

interface UserAccount {
  id: number;
  username: string;
  role: 'admin' | 'user';
  createdAt?: string;
}

interface Props {
  currentUser: { username: string; role: string };
}

function DeleteDialog({ username, onConfirm, onCancel }: { username: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 32px', maxWidth: '380px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ background: '#fef2f2', borderRadius: '50%', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Trash2 size={24} color="#dc2626" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Delete Account?</h3>
        <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#64748b' }}>This will permanently delete:</p>
        <p style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 700, color: '#0f172a', background: '#f8fafc', borderRadius: '8px', padding: '8px 16px' }}>{username}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ flex: 1, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function AccountManager({ currentUser }: Props) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change password form
  const [changingPasswordFor, setChangingPasswordFor] = useState<UserAccount | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/users`);
      if (res.ok) setUsers(await res.json());
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg('success', `User "${data.username}" created successfully`);
        setNewUsername(''); setNewPassword(''); setNewRole('user');
        setShowAddForm(false);
        fetchUsers();
      } else {
        showMsg('error', data.message || 'Failed to create user');
      }
    } catch { showMsg('error', 'Cannot connect to server'); }
    setIsSaving(false);
  };

  const handleDelete = async (user: UserAccount) => {
    try {
      await fetch(`${API_URL}/auth/users/${user.id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setDeleteTarget(null);
      showMsg('success', `User "${user.username}" deleted`);
    } catch { showMsg('error', 'Failed to delete user'); }
  };

  const handleChangePassword = async () => {
    if (!changingPasswordFor || !newPwd.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/users/${changingPasswordFor.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPwd }),
      });
      if (res.ok) {
        showMsg('success', `Password updated for "${changingPasswordFor.username}"`);
        setChangingPasswordFor(null);
        setNewPwd('');
      } else {
        showMsg('error', 'Failed to update password');
      }
    } catch { showMsg('error', 'Cannot connect to server'); }
    setIsSaving(false);
  };

  const inp: React.CSSProperties = {
    width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    padding: '10px 14px', fontSize: '13px', color: '#0f172a', outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: 'inherit', transition: 'border-color 0.15s',
  };

  return (
    <div>
      {deleteTarget && <DeleteDialog username={deleteTarget.username} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}

      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Account Manager</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>{users.length} user account{users.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowAddForm(true); setChangingPasswordFor(null); }}
            style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '12px', padding: '9px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(102,126,234,0.35)' }}>
            <Plus size={15} /> Add User
          </button>
        )}
      </div>

      {/* Success/Error message */}
      {msg && (
        <div style={{ background: msg.type === 'success' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#a7f3d0' : '#fecaca'}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: msg.type === 'success' ? '#059669' : '#dc2626' }}>
          {msg.type === 'success' ? <Check size={14} /> : <X size={14} />} {msg.text}
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: '10px', padding: '7px', display: 'flex' }}><Plus size={15} color="white" /></div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>New User Account</h3>
            </div>
            <button onClick={() => setShowAddForm(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', color: '#64748b' }}><X size={15} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Username <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inp} type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g. jsmith"
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#667eea'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Password <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inp, paddingRight: '40px' }} type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters"
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#667eea'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: '2px' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Role</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['user', 'admin'] as const).map(r => (
                  <button key={r} type="button" onClick={() => setNewRole(r)}
                    style={{ flex: 1, padding: '9px', borderRadius: '10px', border: newRole === r ? '2px solid #667eea' : '2px solid #e2e8f0', background: newRole === r ? '#667eea15' : '#f8fafc', color: newRole === r ? '#667eea' : '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {r === 'admin' ? <Shield size={13} /> : <User size={13} />}
                    {r === 'admin' ? 'Admin' : 'User'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button onClick={() => setShowAddForm(false)} style={{ flex: 1, background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
            <button onClick={handleAddUser} disabled={isSaving || !newUsername.trim() || !newPassword.trim()}
              style={{ flex: 2, background: newUsername && newPassword ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f1f5f9', color: newUsername && newPassword ? '#fff' : '#94a3b8', border: 'none', borderRadius: '10px', padding: '10px', cursor: newUsername && newPassword ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {isSaving ? 'Creating...' : <><Plus size={14} /> Create Account</>}
            </button>
          </div>
        </div>
      )}

      {/* Change Password Form */}
      {changingPasswordFor && (
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '10px', padding: '7px', display: 'flex' }}><Pencil size={15} color="white" /></div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Change Password — <span style={{ color: '#667eea' }}>{changingPasswordFor.username}</span></h3>
            </div>
            <button onClick={() => { setChangingPasswordFor(null); setNewPwd(''); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', color: '#64748b' }}><X size={15} /></button>
          </div>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <input style={{ ...inp, paddingRight: '40px' }} type={showNewPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="New password (min. 6 characters)" autoFocus
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#667eea'}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'} />
            <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: '2px' }}>
              {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setChangingPasswordFor(null); setNewPwd(''); }} style={{ flex: 1, background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
            <button onClick={handleChangePassword} disabled={isSaving || newPwd.length < 6}
              style={{ flex: 2, background: newPwd.length >= 6 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#f1f5f9', color: newPwd.length >= 6 ? '#fff' : '#94a3b8', border: 'none', borderRadius: '10px', padding: '10px', cursor: newPwd.length >= 6 ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 700 }}>
              {isSaving ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '13px' }}>Loading accounts...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>All Accounts</span>
          </div>
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
              <User size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '13px' }}>No users found</p>
            </div>
          ) : (
            <div>
              {users.map((user, i) => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: i < users.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}>
                  {/* Avatar */}
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: user.role === 'admin' ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <span style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>{user.username.charAt(0).toUpperCase()}</span>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{user.username}</p>
                      {user.username === currentUser.username && (
                        <span style={{ background: '#667eea15', color: '#667eea', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px' }}>You</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: user.role === 'admin' ? '#667eea15' : '#10b98115', color: user.role === 'admin' ? '#667eea' : '#059669', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                        {user.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                      {user.createdAt && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Created {new Date(user.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  {/* Actions */}
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => { setChangingPasswordFor(user); setShowAddForm(false); setNewPwd(''); }}
                        style={{ background: '#f59e0b15', color: '#d97706', border: '1px solid #f59e0b30', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Pencil size={11} /> Password
                      </button>
                      {user.username !== currentUser.username && (
                        <button onClick={() => setDeleteTarget(user)}
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}