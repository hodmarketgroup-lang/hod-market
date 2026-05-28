import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import ChangerMotDePasse from './ChangerMotDePasse';

export default function NavBar({ role, username, onLogout }) {
  const [openModule, setOpenModule] = useState('');
  const [showChangerMdp, setShowChangerMdp] = useState(false);

  const toggle = (module) => {
    setOpenModule(openModule === module ? '' : module);
  };

  const isAdmin = role === 'admin';

  const navLinkStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 16px',
    borderRadius: 8,
    textDecoration: 'none',
    color: isActive ? '#ffffff' : '#2c3e50',
    background: isActive ? '#2c3e50' : 'transparent',
    border: isActive ? '1px solid #2c3e50' : '1px solid transparent',
    fontWeight: isActive ? 700 : 400,
    fontSize: 13,
    transition: 'all 0.2s'
  });

  const subLinkStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 16px 7px 32px',
    borderRadius: 8,
    textDecoration: 'none',
    color: isActive ? '#ffffff' : '#34495e',
    background: isActive ? '#34495e' : 'transparent',
    fontWeight: isActive ? 600 : 400,
    fontSize: 12,
    transition: 'all 0.2s'
  });

  const moduleHeaderStyle = (color) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    color: color,
    fontSize: 13,
    fontWeight: 700,
    marginTop: 4,
    background: 'rgba(44,62,80,0.08)'
  });

  return (
    <>
      <nav style={{
        width: 260,
        minHeight: '100vh',
        background: '#f0f2f5',
        borderRight: '1px solid #d0d5dd',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '1.5rem', paddingLeft: 12 }}>
          <div style={{ color: '#1a2332', fontWeight: 800, fontSize: 22, letterSpacing: 1 }}>HOD GROUPE</div>
          <div style={{ color: '#7f8c8d', fontSize: 11, marginTop: 2 }}>Gestion unifiee</div>
        </div>

        {/* Infos utilisateur */}
        <div style={{
          background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.2)',
          borderRadius: 8, padding: '8px 12px', marginBottom: 8
        }}>
          <div style={{ color: '#2ecc71', fontSize: 12, fontWeight: 700 }}>
            {isAdmin ? '👑 Admin' : '👤 Employé'} — {username}
          </div>
        </div>

        {isAdmin && (
          <NavLink to="/" end style={({ isActive }) => navLinkStyle(isActive)}>
            <span>🌍</span> Dashboard Global
          </NavLink>
        )}

        {/* HOD MARKET */}
        <div style={{ borderTop: '1px solid #d0d5dd', marginTop: 8, paddingTop: 8 }}>
          <div style={moduleHeaderStyle('#1a2332')} onClick={() => toggle('market')}>
            <span>🏪 HOD MARKET</span>
            <span style={{ fontSize: 10 }}>{openModule === 'market' ? '▲' : '▼'}</span>
          </div>
          {openModule === 'market' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
              {isAdmin && <NavLink to="/hodmarket" end style={({ isActive }) => subLinkStyle(isActive)}>📊 Dashboard</NavLink>}
              <NavLink to="/hodmarket/clients" style={({ isActive }) => subLinkStyle(isActive)}>👥 Clients</NavLink>
              <NavLink to="/hodmarket/facturation" style={({ isActive }) => subLinkStyle(isActive)}>🧾 Facturation</NavLink>
              <NavLink to="/hodmarket/balance" style={({ isActive }) => subLinkStyle(isActive)}>📈 Balance</NavLink>
              {isAdmin && <NavLink to="/hodmarket/caisse" style={({ isActive }) => subLinkStyle(isActive)}>💰 Caisse</NavLink>}
              {isAdmin && <NavLink to="/hodmarket/parametres" style={({ isActive }) => subLinkStyle(isActive)}>⚙️ Parametres</NavLink>}
            </div>
          )}
        </div>

        {/* HOD LOGISTIC */}
        <div style={{ borderTop: '1px solid #d0d5dd', marginTop: 8, paddingTop: 8 }}>
          <div style={moduleHeaderStyle('#c0392b')} onClick={() => toggle('logistic')}>
            <span>🚛 HOD LOGISTIC</span>
            <span style={{ fontSize: 10 }}>{openModule === 'logistic' ? '▲' : '▼'}</span>
          </div>
          {openModule === 'logistic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
              {isAdmin && <NavLink to="/hodlogistic" end style={({ isActive }) => subLinkStyle(isActive)}>📊 Dashboard</NavLink>}
              <NavLink to="/hodlogistic/recettes" style={({ isActive }) => subLinkStyle(isActive)}>💵 Recettes</NavLink>
              <NavLink to="/hodlogistic/charges" style={({ isActive }) => subLinkStyle(isActive)}>📉 Charges</NavLink>
              {isAdmin && <NavLink to="/hodlogistic/caisse" style={({ isActive }) => subLinkStyle(isActive)}>💰 Caisse</NavLink>}
            </div>
          )}
        </div>

        {/* HOD CONSTRUCTION */}
        <div style={{ borderTop: '1px solid #d0d5dd', marginTop: 8, paddingTop: 8 }}>
          <div style={moduleHeaderStyle('#27ae60')} onClick={() => toggle('construction')}>
            <span>🏗️ HOD CONSTRUCTION</span>
            <span style={{ fontSize: 10 }}>{openModule === 'construction' ? '▲' : '▼'}</span>
          </div>
          {openModule === 'construction' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
              {isAdmin && <NavLink to="/hodconstruction" end style={({ isActive }) => subLinkStyle(isActive)}>📊 Dashboard</NavLink>}
              <NavLink to="/hodconstruction/recettes" style={({ isActive }) => subLinkStyle(isActive)}>💵 Recettes</NavLink>
              <NavLink to="/hodconstruction/charges" style={({ isActive }) => subLinkStyle(isActive)}>📉 Charges</NavLink>
              <NavLink to="/hodconstruction/production" style={({ isActive }) => subLinkStyle(isActive)}>🏭 Production</NavLink>
              <NavLink to="/hodconstruction/stock" style={({ isActive }) => subLinkStyle(isActive)}>📦 Stock</NavLink>
              {isAdmin && <NavLink to="/hodconstruction/caisse" style={({ isActive }) => subLinkStyle(isActive)}>💰 Caisse</NavLink>}
            </div>
          )}
        </div>

        {/* Bas de page */}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #d0d5dd' }}>
          <button
            onClick={() => setShowChangerMdp(true)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.2)',
              color: '#2ecc71', fontSize: 12, cursor: 'pointer',
              fontWeight: 600, marginBottom: 8, textAlign: 'left'
            }}
          >
            🔐 Changer mot de passe
          </button>
          <button
            onClick={onLogout}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)',
              color: '#e74c3c', fontSize: 12, cursor: 'pointer',
              fontWeight: 600, textAlign: 'left'
            }}
          >
            🚪 Se déconnecter
          </button>
          <div style={{ color: '#7f8c8d', fontSize: 10, marginTop: 8, paddingLeft: 4 }}>HOD GROUPE v1.0</div>
          <div style={{ color: '#95a5a6', fontSize: 10, paddingLeft: 4 }}>Pointe-Noire, Congo</div>
        </div>
      </nav>

      {showChangerMdp && <ChangerMotDePasse onClose={() => setShowChangerMdp(false)} />}
    </>
  );
}