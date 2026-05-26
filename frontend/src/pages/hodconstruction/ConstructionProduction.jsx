import React, { useEffect, useState } from 'react';
import { getConstructionProduction, addConstructionProduction, deleteConstructionProduction, getConstructionParams } from '../../services/api';

function fmt(m) { return Math.round(m || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

export default function ConstructionProduction() {
  const [productions, setProductions] = useState([]);
  const [params, setParams] = useState({ types_produits: 'Parping,Ciment Depot' });
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], type_produit: '', quantite: '', description: '' });

  const load = () => {
    getConstructionProduction().then(r => setProductions(r.data));
    getConstructionParams().then(r => setParams(r.data));
  };
  useEffect(() => { load(); }, []);

  const typesProduits = params.types_produits ? params.types_produits.split(',') : ['Parping'];

  const handleAdd = () => {
    if (!form.type_produit || !form.quantite) return alert('Type et quantite requis');
    if (!window.confirm('Confirmer cette production ?\n\nProduit : ' + form.type_produit + '\nQuantite : ' + form.quantite + ' unites')) return;
    addConstructionProduction(form).then(() => { setForm(f => ({ ...f, quantite: '', description: '' })); load(); });
  };

  const totalParType = typesProduits.reduce((acc, t) => {
    acc[t.trim()] = productions.filter(p => p.type_produit === t.trim()).reduce((s, p) => s + (p.quantite || 0), 0);
    return acc;
  }, {});

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: '1.5rem', color: '#00e676' }}>🏭 HOD CONSTRUCTION - Production</h1>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '2rem' }}>
        {typesProduits.map(t => (
          <div key={t} style={{ background: '#162436', borderRadius: 14, padding: '1rem 1.5rem', border: '1px solid rgba(255,255,255,0.07)', minWidth: 150 }}>
            <div style={{ color: '#8ba3c1', fontSize: 13 }}>Total {t.trim()}</div>
            <div style={{ color: '#00e676', fontWeight: 700, fontSize: 22 }}>{fmt(totalParType[t.trim()])} <span style={{ fontSize: 13 }}>unites</span></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Ajouter une production</h3>

          <label style={lbl}>Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />

          <label style={lbl}>Type de produit</label>
          <select value={form.type_produit} onChange={e => setForm(f => ({ ...f, type_produit: e.target.value }))} style={inp}>
            <option value="">Selectionner</option>
            {typesProduits.map(t => <option key={t}>{t.trim()}</option>)}
          </select>

          <label style={lbl}>Quantite produite</label>
          <input type="number" placeholder="Ex: 500" value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))} style={inp} />

          <label style={lbl}>Description (optionnel)</label>
          <input placeholder="Details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} />

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={handleAdd} style={btn('#2979ff')}>Ajouter</button>
            <button onClick={() => setForm(f => ({ ...f, type_produit: '', quantite: '', description: '' }))} style={btn('#333')}>Vider</button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Historique de production</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#8ba3c1' }}>
                <th style={th}>Date</th>
                <th style={th}>Produit</th>
                <th style={th}>Quantite</th>
                <th style={th}>Description</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {productions.map(p => (
                <tr key={p.id}>
                  <td style={td}>{p.date}</td>
                  <td style={td}>{p.type_produit}</td>
                  <td style={{ ...td, color: '#00e676', fontWeight: 600 }}>{fmt(p.quantite)} unites</td>
                  <td style={td}>{p.description || '-'}</td>
                  <td style={td}><button onClick={() => { if(window.confirm('Supprimer ?')) deleteConstructionProduction(p.id).then(load); }} style={btn('#c62828', true)}>Supprimer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', color: '#8ba3c1', fontSize: 12, marginTop: 10, marginBottom: 4 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#0d1b2a', color: '#e8f0fe', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const th = { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)' };
const td = { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e8f0fe' };
const btn = (bg, small) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: small ? '5px 12px' : '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: small ? 12 : 14 });