import React, { useEffect, useState } from 'react';
import { getCaisse, addOperation } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/StatCard';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

function fmt(m) { return Math.round(m || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

export default function Caisse() {
  const [data, setData] = useState({ journal: [], solde: 0 });
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'Entree', libelle: '', montant: '' });

  const load = () => getCaisse().then(r => setData(r.data));
  useEffect(() => { load(); }, []);

  const handleAdd = () => {
    if (!form.montant) return alert('Montant requis');
    if (!window.confirm('Confirmer cette operation ?\n\nType : ' + form.type + '\nMontant : ' + fmt(form.montant) + ' FCFA')) return;
    addOperation(form).then(() => { setForm(f => ({ ...f, libelle: '', montant: '' })); load(); });
  };

  const handleAnnuler = (id) => {
    if (!window.confirm('Annuler cette operation manuelle ?')) return;
    API.delete('/caisse/' + id).then(() => load()).catch(err => alert('Erreur : ' + err.message));
  };

  const exportExcel = () => {
    const rows = data.journal.map(j => ({ Date: j.date, Type: j.type, Libelle: j.libelle, Entree: j.entree > 0 ? j.entree : '', Sortie: j.sortie > 0 ? j.sortie : '', Solde: j.solde }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Journal de caisse');
    ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Journal_Caisse_HOD_MARKET_' + new Date().toISOString().split('T')[0] + '.xlsx');
  };

  const graphData = data.journal.map((j, i) => ({ index: i + 1, solde: j.solde, date: j.date }));
  const totalEntrees = data.journal.reduce((s, j) => s + (j.entree || 0), 0);
  const totalSorties = data.journal.reduce((s, j) => s + (j.sortie || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: '#1a2332' }}>Gestion de caisse</h1>
        <button onClick={exportExcel} style={{ background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Exporter Excel</button>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '2rem' }}>
        <StatCard label="Solde actuel" value={fmt(data.solde) + ' FCFA'} color="#00e676" />
        <StatCard label="Total entrees" value={fmt(totalEntrees) + ' FCFA'} color="#2979ff" />
        <StatCard label="Total sorties" value={fmt(totalSorties) + ' FCFA'} color="#ff5252" />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div style={{ flex: 1, minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe', fontSize: 15 }}>Evolution de la caisse</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={graphData}>
              <XAxis dataKey="date" tick={{ fill: '#8ba3c1', fontSize: 10 }} />
              <YAxis tick={{ fill: '#8ba3c1', fontSize: 10 }} />
              <Tooltip formatter={v => fmt(v) + ' FCFA'} contentStyle={{ background: '#0d1b2a', border: 'none' }} />
              <Line type="monotone" dataKey="solde" stroke="#00e676" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ minWidth: 280, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe', fontSize: 15 }}>Operation manuelle</h3>
          <label style={lbl}>Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />
          <label style={lbl}>Type</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inp}>
            <option>Entree</option>
            <option>Sortie</option>
          </select>
          <label style={lbl}>Libelle</label>
          <input placeholder="Ex: Approvisionnement" value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} style={inp} />
          <label style={lbl}>Montant</label>
          <input type="number" placeholder="Ex: 50000" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} style={inp} />
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={handleAdd} style={btn('#2979ff')}>Ajouter</button>
            <button onClick={() => setForm(f => ({ ...f, libelle: '', montant: '' }))} style={btn('#333')}>Vider</button>
          </div>
        </div>
      </div>

      <div style={{ background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Journal de caisse</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#8ba3c1' }}>
              <th style={th}>Date</th>
              <th style={th}>Type</th>
              <th style={th}>Libelle</th>
              <th style={th}>Entree</th>
              <th style={th}>Sortie</th>
              <th style={th}>Solde</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {[...data.journal].reverse().map((j, i) => (
              <tr key={i}>
                <td style={td}>{j.date}</td>
                <td style={td}><span style={{ color: j.type === 'Entree' ? '#00e676' : '#ff5252', fontWeight: 600 }}>{j.type}</span></td>
                <td style={td}>{j.libelle}</td>
                <td style={{ ...td, color: '#00e676' }}>{j.entree > 0 ? fmt(j.entree) + ' FCFA' : '-'}</td>
                <td style={{ ...td, color: '#ff5252' }}>{j.sortie > 0 ? fmt(j.sortie) + ' FCFA' : '-'}</td>
                <td style={{ ...td, fontWeight: 600 }}>{fmt(j.solde)} FCFA</td>
                <td style={td}>
                  {!j.facture_id && !j.echeance_id ? (
                    <button onClick={() => handleAnnuler(j.id)} style={btn('#c62828', true)}>Annuler</button>
                  ) : (
                    <span style={{ color: '#8ba3c1', fontSize: 11 }}>Auto</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const lbl = { display: 'block', color: '#8ba3c1', fontSize: 12, marginTop: 10, marginBottom: 4 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#0d1b2a', color: '#e8f0fe', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const th = { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)' };
const td = { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e8f0fe' };
const btn = (bg, small) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: small ? '5px 12px' : '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: small ? 12 : 14 });