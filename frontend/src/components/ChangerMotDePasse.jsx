import React, { useState } from 'react';

export default function ChangerMotDePasse({ onClose }) {
  const [ancienMdp, setAncienMdp] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmerMdp, setConfirmerMdp] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErreur('');

    if (nouveauMdp !== confirmerMdp) {
      setErreur('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (nouveauMdp.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('hod_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/changer-mdp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ancienMdp, nouveauMdp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setMessage('Mot de passe modifié avec succès !');
      setAncienMdp('');
      setNouveauMdp('');
      setConfirmerMdp('');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#162032', padding: '2rem', borderRadius: '16px',
        width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.07)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#2ecc71', margin: 0, fontSize: '1.2rem' }}>🔐 Changer le mot de passe</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#8899aa',
            fontSize: '1.5rem', cursor: 'pointer'
          }}>×</button>
        </div>

        {message && (
          <div style={{
            background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)',
            color: '#2ecc71', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem',
            textAlign: 'center'
          }}>{message}</div>
        )}

        {erreur && (
          <div style={{
            background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)',
            color: '#e74c3c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem',
            textAlign: 'center'
          }}>{erreur}</div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Ancien mot de passe', value: ancienMdp, setter: setAncienMdp },
            { label: 'Nouveau mot de passe', value: nouveauMdp, setter: setNouveauMdp },
            { label: 'Confirmer le nouveau mot de passe', value: confirmerMdp, setter: setConfirmerMdp }
          ].map(({ label, value, setter }) => (
            <div key={label} style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#8899aa', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>
                {label}
              </label>
              <input
                type="password"
                value={value}
                onChange={e => setter(e.target.value)}
                required
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
                  background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e8f0fe', fontSize: '1rem', boxSizing: 'border-box'
                }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.85rem', borderRadius: '8px',
              background: loading ? '#1a5c3a' : '#2ecc71', color: '#0d1b2a',
              fontWeight: 700, fontSize: '1rem', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem'
            }}
          >
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}