import React, { useEffect, useState } from 'react';
import { getFactures, getCaisse, getClients, getFacture } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/StatCard';
import BadgeStatut from '../../components/BadgeStatut';

function fmt(m) { return Math.round(m || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

const MOIS = ['Tout','Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
const ANNEES = ['Tout', ...Array.from({ length: 25 }, (_, i) => String(2026 + i))];

export default function Dashboard() {
  const [stats, setStats] = useState({ factures: [], caisse: {}, clients: [] });
  const [alertes, setAlertes] = useState({ retard: [], bientot: [] });
  const [annee, setAnnee] = useState('Tout');
  const [mois, setMois] = useState('Tout');
  const [synthese, setSynthese] = useState({ margeCommerciale: 0, depensesDirectes: 0, margeNette: 0 });
  const [allFactures, setAllFactures] = useState([]);
  const [allCaisse, setAllCaisse] = useState([]);

  useEffect(() => {
    Promise.all([getFactures(), getCaisse(), getClients()]).then(([f, c, cl]) => {
      setStats({ factures: f.data, caisse: c.data, clients: cl.data });
      setAllCaisse(c.data.journal || []);

      const today = new Date().toISOString().split('T')[0];
      const j5 = new Date(); j5.setDate(j5.getDate() + 5);
      const j5str = j5.toISOString().split('T')[0];

      Promise.all(f.data.map(fa => getFacture(fa.id))).then(details => {
        const facDetail = details.map(d => d.data);
        setAllFactures(facDetail);
        const echeances = facDetail.flatMap(d => d.echeances || []);
        setAlertes({
          retard: echeances.filter(e => e.statut === 'En attente' && e.date_echeance < today),
          bientot: echeances.filter(e => e.statut === 'En attente' && e.date_echeance >= today && e.date_echeance <= j5str)
        });
      });
    });
  }, []);

  useEffect(() => {
    const filtrerDate = (dateStr) => {
      if (!dateStr) return false;
      const [a, m] = dateStr.split('-');
      if (annee !== 'Tout' && a !== annee) return false;
      if (mois !== 'Tout' && Number(m) !== MOIS.indexOf(mois)) return false;
      return true;
    };

    const facFiltrees = allFactures.filter(f => filtrerDate(f.date_facture));
    const margeCommerciale = facFiltrees.reduce((s, f) => s + (f.marge || 0) + (f.frais_dossier || 0) - (f.remise || 0), 0);

    const caisseFiltree = allCaisse.filter(j => j.type === 'Sortie' && !j.facture_id && filtrerDate(j.date));
    const depensesDirectes = caisseFiltree.reduce((s, j) => s + (j.sortie || 0), 0);

    setSynthese({ margeCommerciale, depensesDirectes, margeNette: margeCommerciale - depensesDirectes });
  }, [annee, mois, allFactures, allCaisse]);

  const totalEncours = stats.clients.reduce((s, c) => s + (c.encours || 0), 0);
  const totalFacture = stats.factures.reduce((s, f) => s + (f.total || 0), 0);
  const soldees = stats.factures.filter(f => f.statut === 'Soldée').length;

  const graphMois = () => {
    const data = {};
    allFactures.forEach(f => {
      const m = f.date_facture ? f.date_facture.substring(0, 7) : '';
      if (!data[m]) data[m] = { mois: m, marge: 0, depenses: 0 };
      data[m].marge += (f.marge || 0) + (f.frais_dossier || 0) - (f.remise || 0);
    });
    allCaisse.filter(j => j.type === 'Sortie' && !j.facture_id).forEach(j => {
      const m = j.date ? j.date.substring(0, 7) : '';
      if (!data[m]) data[m] = { mois: m, marge: 0, depenses: 0 };
      data[m].depenses += j.sortie || 0;
    });
    return Object.values(data).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-12);
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: '1.5rem', color: '#1a2332' }}>📊 Dashboard HOD MARKET</h1>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '2rem' }}>
        <StatCard label="Solde caisse" value={fmt(stats.caisse.solde) + ' FCFA'} color="#00e676" />
        <StatCard label="Encours clients" value={fmt(totalEncours) + ' FCFA'} color="#ff9800" />
        <StatCard label="Total facture" value={fmt(totalFacture) + ' FCFA'} />
        <StatCard label="Factures soldees" value={soldees} sub={'sur ' + stats.factures.length} color="#2979ff" />
      </div>

      <div style={{ background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#e8f0fe', fontSize: 16 }}>Synthese de la periode</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={annee} onChange={e => setAnnee(e.target.value)} style={selStyle}>
              {ANNEES.map(a => <option key={a}>{a}</option>)}
            </select>
            <select value={mois} onChange={e => setMois(e.target.value)} style={selStyle}>
              {MOIS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, minWidth: 160, background: '#0d1b2a', borderRadius: 12, padding: '1rem 1.5rem', border: '1px solid rgba(41,121,255,0.3)' }}>
            <div style={{ color: '#8ba3c1', fontSize: 12, marginBottom: 6 }}>Marge commerciale</div>
            <div style={{ color: '#2979ff', fontWeight: 700, fontSize: 22 }}>{fmt(synthese.margeCommerciale)}</div>
            <div style={{ color: '#8ba3c1', fontSize: 11 }}>FCFA</div>
            <div style={{ color: '#8ba3c1', fontSize: 10, marginTop: 4 }}>Marge + Frais - Remise</div>
          </div>
          <div style={{ flex: 1, minWidth: 160, background: '#0d1b2a', borderRadius: 12, padding: '1rem 1.5rem', border: '1px solid rgba(255,82,82,0.3)' }}>
            <div style={{ color: '#8ba3c1', fontSize: 12, marginBottom: 6 }}>Depenses directes</div>
            <div style={{ color: '#ff5252', fontWeight: 700, fontSize: 22 }}>{fmt(synthese.depensesDirectes)}</div>
            <div style={{ color: '#8ba3c1', fontSize: 11 }}>FCFA</div>
            <div style={{ color: '#8ba3c1', fontSize: 10, marginTop: 4 }}>Operations manuelles caisse</div>
          </div>
          <div style={{ flex: 1, minWidth: 160, background: '#0d1b2a', borderRadius: 12, padding: '1rem 1.5rem', border: synthese.margeNette >= 0 ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,82,82,0.3)' }}>
            <div style={{ color: '#8ba3c1', fontSize: 12, marginBottom: 6 }}>Marge nette</div>
            <div style={{ color: synthese.margeNette >= 0 ? '#00e676' : '#ff5252', fontWeight: 700, fontSize: 22 }}>{fmt(synthese.margeNette)}</div>
            <div style={{ color: '#8ba3c1', fontSize: 11 }}>FCFA</div>
            <div style={{ color: '#8ba3c1', fontSize: 10, marginTop: 4 }}>Marge commerciale - Depenses</div>
          </div>
        </div>

        <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe', fontSize: 14 }}>Evolution mensuelle (12 derniers mois)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={graphMois()}>
            <XAxis dataKey="mois" tick={{ fill: '#8ba3c1', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8ba3c1', fontSize: 10 }} />
            <Tooltip formatter={v => fmt(v) + ' FCFA'} contentStyle={{ background: '#0d1b2a', border: 'none' }} />
            <Bar dataKey="marge" fill="#2979ff" radius={[4,4,0,0]} name="Marge commerciale" />
            <Bar dataKey="depenses" fill="#ff5252" radius={[4,4,0,0]} name="Depenses directes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: '#ff5252', margin: '0 0 1rem' }}>🔴 En retard ({alertes.retard.length})</h3>
          {alertes.retard.length === 0 ? <p style={{ color: '#8ba3c1' }}>Aucun retard</p> : alertes.retard.map(e => (
            <div key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 0' }}>
              <div style={{ color: '#e8f0fe', fontSize: 13 }}>{e.numero_ech} — {fmt(e.montant)} FCFA</div>
              <div style={{ color: '#ff5252', fontSize: 12 }}>Echeance : {e.date_echeance}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 280, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: '#ff9800', margin: '0 0 1rem' }}>🟡 Dans 5 jours ({alertes.bientot.length})</h3>
          {alertes.bientot.length === 0 ? <p style={{ color: '#8ba3c1' }}>Aucune echeance proche</p> : alertes.bientot.map(e => (
            <div key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 0' }}>
              <div style={{ color: '#e8f0fe', fontSize: 13 }}>{e.numero_ech} — {fmt(e.montant)} FCFA</div>
              <div style={{ color: '#ff9800', fontSize: 12 }}>Echeance : {e.date_echeance}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 280, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: '#e8f0fe', margin: '0 0 1rem' }}>📋 Dernieres factures</h3>
          {stats.factures.slice(0, 5).map(f => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ color: '#e8f0fe', fontSize: 13 }}>{f.numero}</div>
                <div style={{ color: '#8ba3c1', fontSize: 12 }}>{f.client_nom}</div>
              </div>
              <BadgeStatut statut={f.statut} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const selStyle = { padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#0d1b2a', color: '#e8f0fe', fontSize: 13, outline: 'none', cursor: 'pointer' };