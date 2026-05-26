import React from 'react';

const colors = {
  'En attente': { bg: '#e65100', text: '#fff' },
  'Soldée':     { bg: '#2e7d32', text: '#fff' },
  'Payé':       { bg: '#2e7d32', text: '#fff' },
  'Annulé':     { bg: '#555',    text: '#fff' },
};

export default function BadgeStatut({ statut }) {
  const s = statut || '';
  const isPartiel = s.startsWith('Partiel');
  const style = isPartiel
    ? { bg: '#1565c0', text: '#fff' }
    : (colors[s] || { bg: '#888', text: '#fff' });

  return (
    <span style={{
      background: style.bg,
      color: style.text,
      borderRadius: 20,
      padding: '3px 12px',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap'
    }}>
      {statut}
    </span>
  );
}
