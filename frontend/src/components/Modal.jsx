import React from 'react';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.65)',
      zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#162436',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '2rem',
        minWidth: 340,
        maxWidth: 600,
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: 0, color: '#e8f0fe', fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: '#8ba3c1', fontSize: 22,
            cursor: 'pointer', lineHeight: 1
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}