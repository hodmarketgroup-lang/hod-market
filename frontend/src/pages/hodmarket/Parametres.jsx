import React, { useEffect, useState } from 'react';
import { getParams, saveParams } from '../../services/api';

export default function Parametres() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getParams().then(r => setForm(r.data)); }, []);

  const handleSave = () => {
    saveParams(form).then(() => { setSaved(true); setTimeout(() => setSaved(false), 2000); });
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (!form) return <p style={{ color: '#8ba3c1' }}>Chargement...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: '1.5rem', color: '#1a2332' }}>⚙️ Parametres</h1>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1.2rem', color: '#e8f0fe' }}>Valeurs par defaut</h3>

          <label style={lbl}>Devise</label>
          <select value={form.devise} onChange={e => set('devise', e.target.value)} style={inp}>
            <option value="XAF">XAF (FCFA)</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>

          <label style={lbl}>Frais de dossier (%)</label>
          <input type="number" value={form.frais_dossier_pct} onChange={e => set('frais_dossier_pct', e.target.value)} style={inp} />

          <label style={lbl}>Solde caisse initial</label>
          <input type="number" value={form.solde_initial} onChange={e => set('solde_initial', e.target.value)} style={inp} />

          <label style={lbl}>Date solde initial</label>
          <input type="date" value={form.date_solde_initial} onChange={e => set('date_solde_initial', e.target.value)} style={inp} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <input type="checkbox" id="deduire" checked={!!form.deduire_commande} onChange={e => set('deduire_commande', e.target.checked ? 1 : 0)} />
            <label htmlFor="deduire" style={{ color: '#8ba3c1', fontSize: 13, cursor: 'pointer' }}>Deduire la commande de la caisse</label>
          </div>

          <h3 style={{ margin: '1.5rem 0 1rem', color: '#e8f0fe' }}>Penalites de retard</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Penalite (%)</label>
              <input type="number" value={form.penalite_pct} onChange={e => set('penalite_pct', e.target.value)} style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Decalage (mois)</label>
              <input type="number" value={form.decalage_mois} onChange={e => set('decalage_mois', e.target.value)} style={inp} />
            </div>
          </div>

          <h3 style={{ margin: '1.5rem 0 1rem', color: '#e8f0fe' }}>Taux par duree</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[1,2,3,4,5,6].map(n => (
              <div key={n}>
                <label style={lbl}>{n} mois (%)</label>
                <input type="number" value={form['taux_' + n + 'm']} onChange={e => set('taux_' + n + 'm', e.target.value)} style={inp} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
            <button onClick={handleSave} style={btn('#2979ff')}>{saved ? 'Enregistre !' : 'Enregistrer'}</button>
            <button onClick={() => getParams().then(r => setForm(r.data))} style={btn('#333')}>Restaurer</button>
          </div>
        </div>

        <div style={{ minWidth: 260, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Notes</h3>
          <ul style={{ color: '#8ba3c1', fontSize: 13, lineHeight: 2, paddingLeft: 16 }}>
            <li>Alertes : J-5 + echeances depassees</li>
            <li>Penalite : re-etale les echeances restantes</li>
            <li>La caisse est mise a jour automatiquement</li>
            <li>Le taux est selectionne selon la duree</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', color: '#8ba3c1', fontSize: 12, marginTop: 10, marginBottom: 4 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#0d1b2a', color: '#e8f0fe', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const btn = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 });