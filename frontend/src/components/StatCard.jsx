import React from 'react';

export default function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#162436',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '1.2rem 1.5rem',
      minWidth: 180,
      flex: 1
    }}>
      <div style={{ color: '#8ba3c1', fontSize: 13, marginBottom: 6 }}>{label}</div>
      <div style={{
        color: color || '#e8f0fe',
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: 0.5
      }}>{value}</div>
      {sub && <div style={{ color: '#8ba3c1', fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}