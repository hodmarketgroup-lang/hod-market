import React, { useEffect, useState } from 'react';
import { getConstructionCaisse } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/StatCard';

function fmt(m) { return Math.round(m || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

export default function ConstructionCaisse() {
  const [data, setData] = useState({ journal: [], solde: 0 });

  useEffect(() => { getConstructionCaisse().then(r => setData(r.data)); }, []);

  const totalEntrees = data.journal.reduce((s, j) => s + (j.entree || 0), 0);
  const totalSorties = data.journal.reduce((s, j) => s + (j.sortie || 0), 0);
  const graphData = data.journal.map((j, i) => ({ index: i + 1, solde: j.solde, date: j.date }));

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: '1.5rem', color: '#00e676' }}>💰 HOD CONSTRUCTION - Caisse</h1>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '2rem' }}>
        <StatCard label="Solde actuel" value={fmt(data.solde) + ' FCFA'} color="#00e676" />
        <StatCard label="Total entrees" value={fmt(totalEntrees) + ' FCFA'} color="#2979ff" />
        <StatCard label="Total sorties" value={fmt(totalSorties) + ' FCFA'} color="#ff5252" />
      </div>

      <div style={{ background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Evolution de la caisse</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={graphData}>
            <XAxis dataKey="date" tick={{ fill: '#8ba3c1', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8ba3c1', fontSize: 10 }} />
            <Tooltip formatter={v => fmt(v) + ' FCFA'} contentStyle={{ background: '#0d1b2a', border: 'none' }} />
            <Line type="monotone" dataKey="solde" stroke="#00e676" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)' };
const td = { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e8f0fe' };