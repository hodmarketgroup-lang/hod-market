import React, { useEffect, useState } from 'react';
import { getFactures, getCaisse, getClients, getFacture, envoyerRelanceAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/StatCard';
import BadgeStatut from '../../components/BadgeStatut';

function fmt(m) { return Math.round(m || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

const MOIS = ['Tout','Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
const MOIS_COURTS = ['Jan','Fev','Mar','Avr','Mai','Jui','Jul','Aou','Sep','Oct','Nov','Dec'];
const ANNEES = ['Tout', ...Array.from({ length: 25 }, (_, i) => String(2026 + i))];

export default function Dashboard() {
  const [stats, setStats] = useState({ factures: [], caisse: {}, clients: [] });
  const [alertes, setAlertes] = useState({ retard: [], bientot: [] });
  const [annee, setAnnee] = useState('Tout');
  const [mois, setMois] = useState('Tout');
  const [synthese, setSynthese] = useState({ margeCommerciale: 0, depensesDirectes: 0, margeNette: 0 });
  const [allFactures, setAllFactures] = useState([]);
  const [allCaisse, setAllCaisse] = useState([]);
  const [previsions, setPrevisions] = useState([]);
  const [relanceEnCours, setRelanceEnCours] = useState({});
  const [relanceOk, setRelanceOk] = useState({});
  const [moisSelectionne, setMoisSelectionne] = useState(null);

  const getKey = (e) => `${e.numero}_${e.numero_ech}`;

  const envoyerRelance = async (e) => {
    const key = getKey(e);
    setRelanceEnCours(prev => ({ ...prev, [key]: true }));
    try {
      await envoyerRelanceAPI({
        client_nom: e.client_nom,
        telephone: e.telephone,
        numero_ech: e.numero_ech,
        montant: e.montant,
        date_echeance: e.date_echeance,
      });
      setRelanceOk(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setRelanceOk(prev => ({ ...prev, [key]: false })), 3000);
    } catch (err) {
      alert('Erreur lors de l\'envoi de la relance');
    } finally {
      setRelanceEnCours(prev => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    Promise.all([getFactures(), getCaisse(), getClients()]).then(([f, c, cl]) => {
      setStats({ factures: f.data, caisse: c.data, clients: cl.data });
      setAllCaisse(c.data.journal || []);

      const today = new Date().toISOString().split('T')[0];
      const j5 = new Date(); j5.setDate(j5.getDate() + 5);
      const j5str = j5.toISOString().split('T')[0];

      Promise.all(f.data.map(fa => getFacture(fa._id || fa.id))).then(details => {
        const facDetail = details.map(d => d.data);
        setAllFactures(facDetail);

        const echeances = facDetail.flatMap(d => (d.echeances || []).map(e => ({
          ...e,
          client_nom: d.client_nom,
          telephone: d.telephone,
          numero: d.numero
        })));

        setAlertes({
          retard: echeances.filter(e => e.statut === 'En attente' && e.date_echeance < today),
          bientot: echeances.filter(e => e.statut === 'En attente' && e.date_echeance >= today && e.date_echeance <= j5str)
        });

        const anneeEnCours = new Date().getFullYear();
        const moisEnCours = new Date().getMonth();
        const previsionsData = [];
        for (let m = moisEnCours; m < 12; m++) {
          const moisStr = String(anneeEnCours) + '-' + String(m + 1).padStart(2, '0');
          const echeancesMois = echeances.filter(e => {
            if (!e.date_echeance) return false;
            const moisEch = e.date_echeance.substring(0, 7);
            return moisEch === moisStr && (e.statut === 'En attente' || e.statut === 'Reste a regler');
          });
          const montantPrev = echeancesMois.reduce((s, e) => s + (e.montant || 0), 0);
          previsionsData.push({ mois: MOIS_COURTS[m], moisNum: m + 1, montant: montantPrev, nb: echeancesMois.length, echeances: echeancesMois });
        }
        setPrevisions(previsionsData);
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
    const margeCommerciale = facFiltrees.reduce((s, f) => s + (f.marge || 0) + (f.frais_dossier || 0) - (f.remise || 0) + (f.penalite_montant || 0), 0);
    const caisseFiltree = allCaisse.filter(j => j.type === 'Sortie' && !j.facture_id && filtrerDate(j.date));
    const depensesDirectes = caisseFiltree.reduce((s, j) => s + (j.sortie || 0), 0);
    setSynthese({ margeCommerciale, depensesDirectes, margeNette: margeCommerciale - depensesDirectes });
  }, [annee, mois, allFactures, allCaisse]);

  const totalEncours = stats.clients.reduce((s, c) => s + (c.encours || 0), 0);
  const totalFacture = stats.factures.reduce((s, f) => s + (f.total || 0), 0);
  const soldees = stats.factures.filter(f => f.statut === 'Soldée').length;
  const totalPrevisions = previsions.reduce((s, p) => s + p.montant, 0);

  const graphMois = () => {
    const data = {};
    allFactures.forEach(f => {
      const m = f.date_facture ? f.date_facture.substring(0, 7) : '';
      if (!data[m]) data[m] = { mois: m, marge: 0, depenses: 0 };
      data[m].marge += (f.marge || 0) + (f.frais_dossier || 0) - (f.remise || 0) + (f.penalite_montant || 0);
    });
    allCaisse.filter(j => j.type === 'Sortie' && !j.facture_id).forEach(j => {
      const m = j.date ? j.date.substring(0, 7) : '';
      if (!data[m]) data[m] = { mois: m, marge: 0, depenses: 0 };
      data[m].depenses += j.sortie || 0;
    });
    return Object.values(data).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-12);
  };

  const CustomTooltipPrev = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = previsions.find(p => p.mois === label);
      return (
        <div style={{ background: '#0d1b2a', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ color: '#2ecc71', fontWeight: 700, marginBottom: 6 }}>{label} {new Date().getFullYear()}</div>
          <div style={{ color: '#e8f0fe', fontSize: 13 }}>{fmt(payload[0]?.value)} FCFA</div>
          <div style={{ color: '#8ba3c1', fontSize: 11 }}>{data?.nb || 0} échéance(s)</div>
        </div>
      );
    }
    return null;
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

      {/* PREVISIONS */}
      <div style={{ background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(46,204,113,0.2)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#2ecc71', fontSize: 16 }}>💰 Prévisions d'encaissement {new Date().getFullYear()}</h3>
            <div style={{ color: '#8ba3c1', fontSize: 12, marginTop: 4 }}>Échéances en attente mois par mois jusqu'en décembre</div>
          </div>
          <div style={{ background: '#0d1b2a', borderRadius: 10, padding: '10px 20px', border: '1px solid rgba(46,204,113,0.3)' }}>
            <div style={{ color: '#8ba3c1', fontSize: 11 }}>Total à encaisser</div>
            <div style={{ color: '#2ecc71', fontWeight: 700, fontSize: 20 }}>{fmt(totalPrevisions)} FCFA</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {previsions.map(p => {
            const estSelectionne = moisSelectionne?.mois === p.mois;
            return (
              <div
                key={p.mois}
                onClick={() => p.montant > 0 && setMoisSelectionne(estSelectionne ? null : p)}
                style={{
                  flex: '1 1 80px', minWidth: 80, borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                  background: estSelectionne ? '#0d2a1a' : p.montant > 0 ? '#0d1b2a' : '#0a1525',
                  border: estSelectionne ? '2px solid #2ecc71' : p.montant > 0 ? '1px solid rgba(46,204,113,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  cursor: p.montant > 0 ? 'pointer' : 'default',
                  transition: 'border 0.15s, background 0.15s'
                }}
              >
                <div style={{ color: estSelectionne ? '#2ecc71' : '#8ba3c1', fontSize: 11, marginBottom: 4 }}>{p.mois}</div>
                <div style={{ color: p.montant > 0 ? '#2ecc71' : '#8ba3c1', fontWeight: 700, fontSize: 14 }}>{p.montant > 0 ? fmt(p.montant) : '—'}</div>
                {p.montant > 0 && <div style={{ color: '#8ba3c1', fontSize: 10, marginTop: 2 }}>{p.nb} éch.</div>}
              </div>
            );
          })}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={previsions} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <XAxis dataKey="mois" tick={{ fill: '#8ba3c1', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8ba3c1', fontSize: 10 }} tickFormatter={v => fmt(v)} />
            <Tooltip content={<CustomTooltipPrev />} />
            <Bar dataKey="montant" fill="#2ecc71" radius={[6,6,0,0]} name="Prévision"
              onClick={(data) => data.montant > 0 && setMoisSelectionne(moisSelectionne?.mois === data.mois ? null : data)}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>

        {/* DETAIL DU MOIS SELECTIONNE */}
        {moisSelectionne && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(46,204,113,0.2)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <span style={{ color: '#2ecc71', fontWeight: 700, fontSize: 15 }}>
                  Détail — {moisSelectionne.mois} {new Date().getFullYear()}
                </span>
                <span style={{ color: '#8ba3c1', fontSize: 12, marginLeft: 12 }}>
                  {moisSelectionne.nb} échéance(s) · Total : {fmt(moisSelectionne.montant)} FCFA
                </span>
              </div>
              <button
                onClick={() => setMoisSelectionne(null)}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#8ba3c1', fontSize: 12, padding: '4px 12px', cursor: 'pointer' }}
              >
                Fermer ✕
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#8ba3c1' }}>
                  <th style={thS}>Client</th>
                  <th style={thS}>Facture</th>
                  <th style={thS}>Échéance</th>
                  <th style={thS}>Date</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {moisSelectionne.echeances
                  .slice()
                  .sort((a, b) => (a.date_echeance || '').localeCompare(b.date_echeance || ''))
                  .map((e, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={tdS}>{e.client_nom}</td>
                      <td style={{ ...tdS, color: '#2979ff' }}>{e.numero}</td>
                      <td style={tdS}><span style={{ color: e.statut === 'Reste a regler' ? '#ff9800' : '#e8f0fe' }}>{e.numero_ech}</span></td>
                      <td style={tdS}>{e.date_echeance}</td>
                      <td style={{ ...tdS, textAlign: 'right', color: '#2ecc71', fontWeight: 600 }}>{fmt(e.montant)} FCFA</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ ...tdS, fontWeight: 700, color: '#e8f0fe', paddingTop: 10 }}>TOTAL</td>
                  <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: '#2ecc71', fontSize: 14, paddingTop: 10 }}>{fmt(moisSelectionne.montant)} FCFA</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* SYNTHESE */}
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
            <div style={{ color: '#8ba3c1', fontSize: 10, marginTop: 4 }}>Marge + Frais - Remise + Penalites</div>
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

        {/* EN RETARD */}
        <div style={{ flex: 1, minWidth: 280, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: '#ff5252', margin: '0 0 1rem' }}>🔴 En retard ({alertes.retard.length})</h3>
          {alertes.retard.length === 0 ? <p style={{ color: '#8ba3c1' }}>Aucun retard</p> : alertes.retard.map((e, i) => {
            const key = getKey(e);
            return (
              <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: '#e8f0fe', fontSize: 13 }}>{e.client_nom} — {e.numero_ech} — {fmt(e.montant)} FCFA</div>
                  <button
                    onClick={() => envoyerRelance(e)}
                    disabled={relanceEnCours[key]}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: 'none',
                      background: relanceOk[key] ? '#00e676' : '#ff5252',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: relanceEnCours[key] ? 'not-allowed' : 'pointer',
                      opacity: relanceEnCours[key] ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                      transition: 'background 0.3s'
                    }}
                  >
                    {relanceOk[key] ? '✓ Envoyé' : relanceEnCours[key] ? '...' : '📲 Relance'}
                  </button>
                </div>
                <div style={{ color: '#ff5252', fontSize: 12 }}>Echeance : {e.date_echeance}</div>
              </div>
            );
          })}
        </div>

        {/* DANS 5 JOURS */}
        <div style={{ flex: 1, minWidth: 280, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: '#ff9800', margin: '0 0 1rem' }}>🟡 Dans 5 jours ({alertes.bientot.length})</h3>
          {alertes.bientot.length === 0 ? <p style={{ color: '#8ba3c1' }}>Aucune echeance proche</p> : alertes.bientot.map((e, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 0' }}>
              <div style={{ color: '#e8f0fe', fontSize: 13 }}>{e.client_nom} — {e.numero_ech} — {fmt(e.montant)} FCFA</div>
              <div style={{ color: '#ff9800', fontSize: 12 }}>Echeance : {e.date_echeance}</div>
            </div>
          ))}
        </div>

        {/* DERNIERES FACTURES */}
        <div style={{ flex: 1, minWidth: 280, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ color: '#e8f0fe', margin: '0 0 1rem' }}>📋 Dernieres factures</h3>
          {stats.factures.slice(0, 5).map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
const thS = { padding: '7px 10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#8ba3c1', fontWeight: 600 };
const tdS = { padding: '9px 10px', color: '#e8f0fe' };