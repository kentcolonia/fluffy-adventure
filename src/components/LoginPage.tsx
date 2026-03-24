import React, { useState } from 'react';
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { API_URL } from '../types';

interface Props {
  onLogin: (user: { username: string; role: string; token: string }) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('avpass_token', data.token);
        localStorage.setItem('avpass_user', JSON.stringify({ username: data.username, role: data.role }));
        onLogin({ username: data.username, role: data.role, token: data.token });
      } else {
        setError(data.message || 'Invalid username or password');
      }
    } catch {
      // ── LOCAL DEV FALLBACK ──
      // When server is unreachable, allow test login with: admin / admin123
      if (username === 'admin' && password === 'admin123') {
        const mockUser = { username: 'admin', role: 'admin', token: 'local-dev-token' };
        localStorage.setItem('avpass_token', mockUser.token);
        localStorage.setItem('avpass_user', JSON.stringify({ username: mockUser.username, role: mockUser.role }));
        onLogin(mockUser);
      } else {
        setError('Cannot connect to server. Local test: use admin / admin123');
      }
    }
    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', position: 'relative', overflow: 'hidden',
      backgroundImage: "url('/gradient-background.jpg')",
      backgroundSize: 'cover', backgroundPosition: 'center',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    }}>
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />

      {/* Floating glass orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[
          { top: '20%', left: '20%', w: 140, delay: '0s' },
          { top: '70%', right: '20%', w: 100, delay: '1s' },
          { top: '45%', right: '30%', w: 72, delay: '0.5s' },
          { top: '10%', right: '10%', w: 56, delay: '1.5s' },
          { bottom: '15%', left: '10%', w: 84, delay: '0.8s' },
        ].map((orb, i) => (
          <div key={i} style={{
            position: 'absolute', ...orb, width: `${orb.w}px`, height: `${orb.w}px`,
            borderRadius: '50%', opacity: 0.45,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '2px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
            animation: `pulse 3s ease-in-out ${orb.delay} infinite`,
          }} />
        ))}
      </div>

      {/* Login Card */}
      <div style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px',
        background: 'rgba(255,255,255,0.25)',
        backdropFilter: 'blur(40px) saturate(250%)',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: '24px', padding: '40px 36px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 16px 64px rgba(255,255,255,0.2), inset 0 3px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.3)',
        animation: 'cardIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg,#667eea,#764ba2)',
            borderRadius: '16px', padding: '14px', display: 'inline-flex',
            boxShadow: '0 8px 24px rgba(102,126,234,0.45)', marginBottom: '16px',
          }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
            Welcome Back
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(30,41,59,0.65)', fontWeight: 500 }}>
            Sign in to AVPass ID Management
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
            fontSize: '13px', color: '#dc2626', fontWeight: 500,
            backdropFilter: 'blur(10px)',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          {/* Username */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
              Username
            </label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username" required autoFocus
              style={{
                width: '100%', padding: '12px 14px', fontSize: '14px', color: '#1e293b',
                background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255,255,255,0.6)', borderRadius: '12px',
                outline: 'none', boxSizing: 'border-box' as const, transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(102,126,234,0.7)'; (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.7)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(102,126,234,0.15)'; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.6)'; (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.5)'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" required
                style={{
                  width: '100%', padding: '12px 44px 12px 14px', fontSize: '14px', color: '#1e293b',
                  background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)',
                  border: '1.5px solid rgba(255,255,255,0.6)', borderRadius: '12px',
                  outline: 'none', boxSizing: 'border-box' as const, transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(102,126,234,0.7)'; (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.7)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(102,126,234,0.15)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.6)'; (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.5)'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(30,41,59,0.5)', padding: '4px', display: 'flex' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isLoading || !username || !password}
            style={{
              width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700,
              color: '#fff', border: 'none', borderRadius: '12px', cursor: isLoading ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              boxShadow: '0 8px 24px rgba(102,126,234,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s', opacity: (!username || !password) ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(102,126,234,0.55)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(102,126,234,0.45)'; }}>
            {isLoading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing In...</> : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <p style={{ margin: '20px 0 0', textAlign: 'center', fontSize: '12px', color: 'rgba(30,41,59,0.5)' }}>
          AVPass · Avega Bros. Integrated Shipping Corp.
        </p>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { transform:scale(1); opacity:0.45; } 50% { transform:scale(1.05); opacity:0.6; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes cardIn { from { opacity:0; transform:scale(0.95) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }
        input::placeholder { color: rgba(30,41,59,0.4); }
      `}</style>
    </div>
  );
}