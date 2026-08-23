"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setToken } from '../../utils/api';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const router = useRouter();
  const [tab, setTab] = useState<'key' | 'admin'>('key');
  
  const [keyCode, setKeyCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyCode) return;
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/key-login', {
        method: 'POST',
        body: JSON.stringify({ key_code: keyCode.trim() }),
      });
      setToken(data.access_token);
      router.push('/chat');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid or expired Access Key.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.access_token);
      router.push('/chat');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', fontWeight: '700' }}>SAM AI</h1>
          <p style={{ color: 'var(--text-muted)' }}>Enter your access key to continue</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '12px' }}>
          <button 
            onClick={() => setTab('key')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === 'key' ? 'var(--primary)' : 'transparent', color: tab === 'key' ? '#fff' : 'var(--text-muted)', fontWeight: '600', transition: 'all 0.2s' }}
          >
            <KeyRound size={16} /> Access Key
          </button>
          <button 
            onClick={() => setTab('admin')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === 'admin' ? 'rgba(255,255,255,0.1)' : 'transparent', color: tab === 'admin' ? '#fff' : 'var(--text-muted)', fontWeight: '600', transition: 'all 0.2s' }}
          >
            <ShieldAlert size={16} /> Admin
          </button>
        </div>

        {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {tab === 'key' ? (
          <form onSubmit={handleKeyLogin}>
            <div className="input-group">
              <label>System Access Key</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. SAM-A1B2-C3D4"
                value={keyCode}
                onChange={(e) => setKeyCode(e.target.value.toUpperCase())}
                style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '1.1rem', fontWeight: '600' }}
                required 
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Unlock System'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin}>
            <div className="input-group">
              <label>Admin Email</label>
              <input 
                type="email" 
                className="input-field" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                className="input-field" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn-secondary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Admin Login'}
            </button>
          </form>
        )}
      </motion.div>
    </main>
  );
}
