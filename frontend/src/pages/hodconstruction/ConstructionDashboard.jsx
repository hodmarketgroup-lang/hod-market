import React, { useEffect, useState } from 'react';
import { getConstructionDashboard } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/StatCard';

function fmt(m) { return Math.round(m || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

export default function ConstructionDashboard() {
  const [data, setData] = useState({ totalRecettes: 0, totalCharges: 0, marge: 0, solde: 0, stock: [], recettes: [], charges: [] });

  useEffect(() => { getConstructionDashboard().then(r => setData(r.data)); }, []);

  const moisData = () => {
    const mois = {};
    (data.recettes || []).forEach(r => {
      const m = r.date ? r.date.substring(0, 7) : '';
      if (!mois[m]) mois[m] = { mois: m, recettes: 0, charges: 0 };
      mois[m].recettes += r.montant || 0;
    });
    (data.charges || []).forEach(c => {
      const m = c.date ? c.date.substring(0, 7) : '';
      if (!mois[m]) mois[m] = { mois: m, recettes: 0, charges: 0 };
      mois[m].charges += c.montant || 0;
    });
    return Object.values(mois).sort((a, b) => a.mois.localeCompare(b.mois));
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: '1.5rem', color: '#00e676' }}>🏗️ HOD CONSTRUCTION - Dashboard</h1>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '2rem' }}>
        <StatCard label="Total recettes" value={fmt(data.totalRecettes) + ' FCFA'} color="#00e676" />
        <StatCard label="Total charges" value={fmt(data.totalCharges) + ' FCFA'} color="#ff5252" />
        <StatCard label="Marge commerciale" value={fmt(data.marge) + ' FCFA'} color={data.marge >= 0 ? '#2979ff' : '#ff5252'} />
        <StatCard label="Solde caisse" value={fmt(data.solde) + ' FCFA'} color="#00e676" />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div style={{ flex: 1, minWidth: 300, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Recettes vs Charges par mois</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={moisData()}>
              <XAxis dataKey="mois" tick={{ fill: '#8ba3c1', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8ba3c1', fontSize: 11 }} />
              <Tooltip formatter={v => fmt(v) + ' FCFA'} contentStyle={{ background: '#0d1b2a', border: 'none' }} />
              <Bar dataKey="recettes" fill="#00e676" radius={[4,4,0,0]} name="Recettes" />
              <Bar dataKey="charges" fill="#ff5252" radius={[4,4,0,0]} name="Charges" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ minWidth: 250, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Stock actuel</h3>
          {(data.stock || []).length === 0 ? (
            <p style={{ color: '#8ba3c1' }}>Aucun stock</p>
          ) : (
            data.stock.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#8ba3c1' }}>{s.type_produit}</span>
                <span style={{ color: s.quantite > 0 ? '#00e676' : '#ff5252', fontWeight: 700 }}>{s.quantite} unites</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}