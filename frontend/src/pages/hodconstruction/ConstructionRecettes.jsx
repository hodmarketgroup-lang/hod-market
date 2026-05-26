import React, { useEffect, useState } from 'react';
import { getConstructionRecettes, addConstructionRecette, deleteConstructionRecette, getConstructionParams } from '../../services/api';

function fmt(m) { return Math.round(m || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

export default function ConstructionRecettes() {
  const [recettes, setRecettes] = useState([]);
  const [params, setParams] = useState({ prix_parping: 0, prix_ciment: 0, types_produits: 'Parping,Ciment Depot' });
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], type_vente: '', quantite: '', prix_unitaire: '', remise: '0', montant: '', description: '' });

  const load = () => {
    getConstructionRecettes().then(r => setRecettes(r.data));
    getConstructionParams().then(r => setParams(r.data));
  };
  useEffect(() => { load(); }, []);

  const typesProduits = params.types_produits ? params.types_produits.split(',') : ['Parping', 'Ciment Depot'];

  const getPrix = (type) => {
    if (type === 'Parping') return params.prix_parping || 0;
    if (type === 'Ciment Depot') return params.prix_ciment || 0;
    return 0;
  };

  const handleTypeChange = (type) => {
    const prix = getPrix(type);
    const montant = calcMontant(form.quantite, prix, form.remise);
    setForm(f => ({ ...f, type_vente: type, prix_unitaire: prix, montant }));
  };

  const calcMontant = (qte, prix, remise) => {
    const m = Number(qte || 0) * Number(prix || 0);
    return Math.round(m - Number(remise || 0));
  };

  const handleQteChange = (qte) => {
    const montant = calcMontant(qte, form.prix_unitaire, form.remise);
    setForm(f => ({ ...f, quantite: qte, montant }));
  };

  const handleRemiseChange = (remise) => {
    const montant = calcMontant(form.quantite, form.prix_unitaire, remise);
    setForm(f => ({ ...f, remise, montant }));
  };

  const handleAdd = () => {
    if (!form.type_vente || !form.quantite || !form.montant) return alert('Type, quantite et montant requis');
    if (!window.confirm('Confirmer cette vente ?\n\nProduit : ' + form.type_vente + '\nQuantite : ' + form.quantite + '\nMontant : ' + fmt(form.montant) + ' FCFA')) return;
    addConstructionRecette(form).then(() => {
      setForm(f => ({ ...f, quantite: '', remise: '0', montant: '', description: '' }));
      load();
    });
  };

  const total = recettes.reduce((s, r) => s + (r.montant || 0), 0);

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: '1.5rem', color: '#00e676' }}>💵 HOD CONSTRUCTION - Recettes</h1>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Ajouter une vente</h3>

          <label style={lbl}>Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />

          <label style={lbl}>Type de vente</label>
          <select value={form.type_vente} onChange={e => handleTypeChange(e.target.value)} style={inp}>
            <option value="">Selectionner</option>
            {typesProduits.map(t => <option key={t}>{t.trim()}</option>)}
          </select>

          <label style={lbl}>Prix unitaire (auto)</label>
          <input readOnly value={fmt(form.prix_unitaire) + ' FCFA'} style={{ ...inp, background: '#0a1628', color: '#8ba3c1' }} />

          <label style={lbl}>Quantite</label>
          <input type="number" placeholder="Ex: 100" value={form.quantite} onChange={e => handleQteChange(e.target.value)} style={inp} />

          <label style={lbl}>Remise (FCFA)</label>
          <input type="number" value={form.remise} onChange={e => handleRemiseChange(e.target.value)} style={inp} />

          <label style={lbl}>Montant (auto)</label>
          <input readOnly value={fmt(form.montant) + ' FCFA'} style={{ ...inp, background: '#0a1628', color: '#00e676', fontWeight: 700 }} />

          <label style={lbl}>Description (optionnel)</label>
          <input placeholder="Details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} />

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={handleAdd} style={btn('#2979ff')}>Ajouter</button>
            <button onClick={() => setForm(f => ({ ...f, type_vente: '', quantite: '', remise: '0', montant: '', description: '' }))} style={btn('#333')}>Vider</button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#e8f0fe' }}>Liste des ventes</h3>
            <div style={{ color: '#00e676', fontWeight: 700 }}>Total : {fmt(total)} FCFA</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#8ba3c1' }}>
                <th style={th}>Date</th>
                <th style={th}>Produit</th>
                <th style={th}>Qte</th>
                <th style={th}>Prix unit.</th>
                <th style={th}>Remise</th>
                <th style={th}>Montant</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recettes.map(r => (
                <tr key={r.id}>
                  <td style={td}>{r.date}</td>
                  <td style={td}>{r.type_vente}</td>
                  <td style={td}>{r.quantite}</td>
                  <td style={td}>{fmt(r.prix_unitaire)} FCFA</td>
                  <td style={{ ...td, color: '#ff5252' }}>{r.remise > 0 ? fmt(r.remise) + ' FCFA' : '-'}</td>
                  <td style={{ ...td, color: '#00e676' }}>{fmt(r.montant)} FCFA</td>
                  <td style={td}><button onClick={() => { if(window.confirm('Supprimer ?')) deleteConstructionRecette(r.id).then(load); }} style={btn('#c62828', true)}>Supprimer</button></td>
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