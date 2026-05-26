import React, { useEffect, useState } from 'react';
import { getLogisticRecettes, addLogisticRecette, deleteLogisticRecette } from '../../services/api';

function fmt(m) { return Math.round(m || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

const typesService = ['Location camion', 'Transport marchandise', 'Livraison', 'Autres services'];

export default function LogisticRecettes() {
  const [recettes, setRecettes] = useState([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], id_camion: '', type_service: 'Location camion', montant: '', description: '' });

  const load = () => getLogisticRecettes().then(r => setRecettes(r.data));
  useEffect(() => { load(); }, []);

  const handleAdd = () => {
    if (!form.montant || !form.id_camion) return alert('ID camion et montant requis');
    if (!window.confirm('Confirmer cette recette ?\n\nCamion : ' + form.id_camion + '\nService : ' + form.type_service + '\nMontant : ' + fmt(form.montant) + ' FCFA')) return;
    addLogisticRecette(form).then(() => { setForm(f => ({ ...f, id_camion: '', montant: '', description: '' })); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Supprimer cette recette ?')) return;
    deleteLogisticRecette(id).then(load);
  };

  const total = recettes.reduce((s, r) => s + (r.montant || 0), 0);

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: '1.5rem', color: '#ff9800' }}>💵 HOD LOGISTIC - Recettes</h1>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Ajouter une recette</h3>

          <label style={lbl}>Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />

          <label style={lbl}>ID Camion</label>
          <input placeholder="Ex: CAM-001" value={form.id_camion} onChange={e => setForm(f => ({ ...f, id_camion: e.target.value }))} style={inp} />

          <label style={lbl}>Type de service</label>
          <select value={form.type_service} onChange={e => setForm(f => ({ ...f, type_service: e.target.value }))} style={inp}>
            {typesService.map(t => <option key={t}>{t}</option>)}
          </select>

          <label style={lbl}>Montant (FCFA)</label>
          <input type="number" placeholder="Ex: 50000" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} style={inp} />

          <label style={lbl}>Description (optionnel)</label>
          <input placeholder="Details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} />

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={handleAdd} style={btn('#2979ff')}>Ajouter</button>
            <button onClick={() => setForm(f => ({ ...f, id_camion: '', montant: '', description: '' }))} style={btn('#333')}>Vider</button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#e8f0fe' }}>Liste des recettes</h3>
            <div style={{ color: '#00e676', fontWeight: 700 }}>Total : {fmt(total)} FCFA</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#8ba3c1' }}>
                <th style={th}>Date</th>
                <th style={th}>Camion</th>
                <th style={th}>Service</th>
                <th style={th}>Montant</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recettes.map(r => (
                <tr key={r.id}>
                  <td style={td}>{r.date}</td>
                  <td style={td}>{r.id_camion}</td>
                  <td style={td}>{r.type_service}</td>
                  <td style={{ ...td, color: '#00e676' }}>{fmt(r.montant)} FCFA</td>
                  <td style={td}><button onClick={() => handleDelete(r.id)} style={btn('#c62828', true)}>Supprimer</button></td>
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