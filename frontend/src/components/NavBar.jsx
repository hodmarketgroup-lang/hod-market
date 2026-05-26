import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function NavBar() {
  const [openModule, setOpenModule] = useState('');

  const toggle = (module) => {
    setOpenModule(openModule === module ? '' : module);
  };

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

      <NavLink to="/" end style={({ isActive }) => navLinkStyle(isActive)}>
        <span>🌍</span> Dashboard Global
      </NavLink>

      <div style={{ borderTop: '1px solid #d0d5dd', marginTop: 8, paddingTop: 8 }}>
        <div style={moduleHeaderStyle('#1a2332')} onClick={() => toggle('market')}>
          <span>🏪 HOD MARKET</span>
          <span style={{ fontSize: 10 }}>{openModule === 'market' ? '▲' : '▼'}</span>
        </div>
        {openModule === 'market' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
            <NavLink to="/hodmarket" end style={({ isActive }) => subLinkStyle(isActive)}>📊 Dashboard</NavLink>
            <NavLink to="/hodmarket/clients" style={({ isActive }) => subLinkStyle(isActive)}>👥 Clients</NavLink>
            <NavLink to="/hodmarket/facturation" style={({ isActive }) => subLinkStyle(isActive)}>🧾 Facturation</NavLink>
            <NavLink to="/hodmarket/balance" style={({ isActive }) => subLinkStyle(isActive)}>📈 Balance</NavLink>
            <NavLink to="/hodmarket/caisse" style={({ isActive }) => subLinkStyle(isActive)}>💰 Caisse</NavLink>
            <NavLink to="/hodmarket/parametres" style={({ isActive }) => subLinkStyle(isActive)}>⚙️ Parametres</NavLink>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #d0d5dd', marginTop: 8, paddingTop: 8 }}>
        <div style={moduleHeaderStyle('#c0392b')} onClick={() => toggle('logistic')}>
          <span>🚛 HOD LOGISTIC</span>
          <span style={{ fontSize: 10 }}>{openModule === 'logistic' ? '▲' : '▼'}</span>
        </div>
        {openModule === 'logistic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
            <NavLink to="/hodlogistic" end style={({ isActive }) => subLinkStyle(isActive)}>📊 Dashboard</NavLink>
            <NavLink to="/hodlogistic/recettes" style={({ isActive }) => subLinkStyle(isActive)}>💵 Recettes</NavLink>
            <NavLink to="/hodlogistic/charges" style={({ isActive }) => subLinkStyle(isActive)}>📉 Charges</NavLink>
            <NavLink to="/hodlogistic/caisse" style={({ isActive }) => subLinkStyle(isActive)}>💰 Caisse</NavLink>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #d0d5dd', marginTop: 8, paddingTop: 8 }}>
        <div style={moduleHeaderStyle('#27ae60')} onClick={() => toggle('construction')}>
          <span>🏗️ HOD CONSTRUCTION</span>
          <span style={{ fontSize: 10 }}>{openModule === 'construction' ? '▲' : '▼'}</span>
        </div>
        {openModule === 'construction' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
            <NavLink to="/hodconstruction" end style={({ isActive }) => subLinkStyle(isActive)}>📊 Dashboard</NavLink>
            <NavLink to="/hodconstruction/recettes" style={({ isActive }) => subLinkStyle(isActive)}>💵 Recettes</NavLink>
            <NavLink to="/hodconstruction/charges" style={({ isActive }) => subLinkStyle(isActive)}>📉 Charges</NavLink>
            <NavLink to="/hodconstruction/production" style={({ isActive }) => subLinkStyle(isActive)}>🏭 Production</NavLink>
            <NavLink to="/hodconstruction/stock" style={({ isActive }) => subLinkStyle(isActive)}>📦 Stock</NavLink>
            <NavLink to="/hodconstruction/caisse" style={({ isActive }) => subLinkStyle(isActive)}>💰 Caisse</NavLink>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #d0d5dd', paddingLeft: 12 }}>
        <div style={{ color: '#7f8c8d', fontSize: 10 }}>HOD GROUPE v1.0</div>
        <div style={{ color: '#95a5a6', fontSize: 10 }}>Pointe-Noire, Congo</div>
      </div>
    </nav>
  );
}