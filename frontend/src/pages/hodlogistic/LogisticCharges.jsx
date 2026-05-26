import React, { useEffect, useState } from 'react';
import { getLogisticCharges, addLogisticCharge, deleteLogisticCharge } from '../../services/api';

function fmt(m) { return Math.round(m || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

const typesDepense = ['Panne', 'Essence', 'Loyer', 'Publicite', 'Entretien', 'Documents camion', 'Salaire', 'Autres'];

export default function LogisticCharges() {
  const [charges, setCharges] = useState([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], type_depense: 'Essence', montant: '', description: '' });

  const load = () => getLogisticCharges().then(r => setCharges(r.data));
  useEffect(() => { load(); }, []);

  const handleAdd = () => {
    if (!form.montant) return alert('Montant requis');
    if (!window.confirm('Confirmer cette charge ?\n\nType : ' + form.type_depense + '\nMontant : ' + fmt(form.montant) + ' FCFA')) return;
    addLogisticCharge(form).then(() => { setForm(f => ({ ...f, montant: '', description: '' })); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Supprimer cette charge ?')) return;
    deleteLogisticCharge(id).then(load);
  };

  const total = charges.reduce((s, c) => s + (c.montant || 0), 0);

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: '1.5rem', color: '#ff9800' }}>📉 HOD LOGISTIC - Charges</h1>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Ajouter une charge</h3>

          <label style={lbl}>Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />

          <label style={lbl}>Type de depense</label>
          <select value={form.type_depense} onChange={e => setForm(f => ({ ...f, type_depense: e.target.value }))} style={inp}>
            {typesDepense.map(t => <option key={t}>{t}</option>)}
          </select>

          <label style={lbl}>Montant (FCFA)</label>
          <input type="number" placeholder="Ex: 25000" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} style={inp} />

          <label style={lbl}>Description (optionnel)</label>
          <input placeholder="Details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} />

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={handleAdd} style={btn('#e65100')}>Ajouter</button>
            <button onClick={() => setForm(f => ({ ...f, montant: '', description: '' }))} style={btn('#333')}>Vider</button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#e8f0fe' }}>Liste des charges</h3>
            <div style={{ color: '#ff5252', fontWeight: 700 }}>Total : {fmt(total)} FCFA</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#8ba3c1' }}>
                <th style={th}>Date</th>
                <th style={th}>Type</th>
                <th style={th}>Description</th>
                <th style={th}>Montant</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {charges.map(c => (
                <tr key={c.id}>
                  <td style={td}>{c.date}</td>
                  <td style={td}>{c.type_depense}</td>
                  <td style={td}>{c.description || '-'}</td>
                  <td style={{ ...td, color: '#ff5252' }}>{fmt(c.montant)} FCFA</td>
                  <td style={td}><button onClick={() => handleDelete(c.id)} style={btn('#c62828', true)}>Supprimer</button></td>
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