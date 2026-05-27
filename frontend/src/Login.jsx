import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion');
      localStorage.setItem('hod_token', data.token);
      localStorage.setItem('hod_role', data.role);
      localStorage.setItem('hod_username', data.username);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0d1b2a'
    }}>
      <div style={{
        background: '#162032', padding: '2.5rem', borderRadius: '16px',
        width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.07)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌐</div>
          <h1 style={{ color: '#2ecc71', fontSize: '1.8rem', margin: 0 }}>HOD GROUPE</h1>
          <p style={{ color: '#8899aa', margin: '0.5rem 0 0' }}>Gestion unifiée</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)',
            color: '#e74c3c', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#8899aa', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin ou employe"
              required
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
                background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)',
                color: '#e8f0fe', fontSize: '1rem', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: '#8899aa', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
                background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)',
                color: '#e8f0fe', fontSize: '1rem', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.85rem', borderRadius: '8px',
              background: loading ? '#1a5c3a' : '#2ecc71', color: '#0d1b2a',
              fontWeight: 700, fontSize: '1rem', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
