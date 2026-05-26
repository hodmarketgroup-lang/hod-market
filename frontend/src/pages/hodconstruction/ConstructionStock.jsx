import React, { useEffect, useState } from 'react';
import { getConstructionStock, ajusterConstructionStock } from '../../services/api';

function fmt(m) { return Math.round(m || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

export default function ConstructionStock() {
  const [stock, setStock] = useState([]);
  const [ajust, setAjust] = useState({ type_produit: '', quantite: '' });

  const load = () => getConstructionStock().then(r => setStock(r.data));
  useEffect(() => { load(); }, []);

  const handleAjuster = () => {
    if (!ajust.type_produit || ajust.quantite === '') return alert('Type et quantite requis');
    if (!window.confirm('Ajuster le stock de ' + ajust.type_produit + ' a ' + ajust.quantite + ' unites ?')) return;
    ajusterConstructionStock(ajust).then(() => { setAjust({ type_produit: '', quantite: '' }); load(); });
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: '1.5rem', color: '#00e676' }}>📦 HOD CONSTRUCTION - Stock</h1>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Ajustement manuel du stock</h3>

          <label style={lbl}>Type de produit</label>
          <input placeholder="Ex: Parping" value={ajust.type_produit} onChange={e => setAjust(a => ({ ...a, type_produit: e.target.value }))} style={inp} />

          <label style={lbl}>Nouvelle quantite</label>
          <input type="number" placeholder="Ex: 1000" value={ajust.quantite} onChange={e => setAjust(a => ({ ...a, quantite: e.target.value }))} style={inp} />

          <button onClick={handleAjuster} style={{ ...btn('#2979ff'), marginTop: 14 }}>Ajuster stock</button>
        </div>

        <div style={{ flex: 1, minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Stock actuel</h3>
          {stock.length === 0 ? (
            <p style={{ color: '#8ba3c1' }}>Aucun stock enregistre</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#8ba3c1' }}>
                  <th style={th}>Produit</th>
                  <th style={th}>Quantite</th>
                  <th style={th}>Derniere MAJ</th>
                  <th style={th}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {stock.map(s => (
                  <tr key={s.id}>
                    <td style={td}>{s.type_produit}</td>
                    <td style={{ ...td, color: s.quantite > 0 ? '#00e676' : '#ff5252', fontWeight: 700 }}>{fmt(s.quantite)} unites</td>
                    <td style={td}>{s.updated_at ? s.updated_at.split('T')[0] : '-'}</td>
                    <td style={td}>
                      <span style={{ background: s.quantite > 10 ? '#2e7d32' : s.quantite > 0 ? '#e65100' : '#c62828', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                        {s.quantite > 10 ? 'Normal' : s.quantite > 0 ? 'Bas' : 'Rupture'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', color: '#8ba3c1', fontSize: 12, marginTop: 10, marginBottom: 4 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#0d1b2a', color: '#e8f0fe', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const th = { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)' };
const td = { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e8f0fe' };
const btn = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 });