import React, { useEffect, useState } from 'react';
import { getFactures, getClients } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import BadgeStatut from '../../components/BadgeStatut';
import StatCard from '../../components/StatCard';

const COLORS = ['#ff9800','#2979ff','#00e676'];

export default function Balance() {
  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    getFactures().then(r => setFactures(r.data));
    getClients().then(r => setClients(r.data));
  }, []);

  const fmt = (m) => Math.round(m || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const totalCommandes = factures.reduce((s, f) => s + (f.montant_commande || 0), 0);
  const totalFacture = factures.reduce((s, f) => s + (f.total || 0), 0);
  const totalEncours = clients.reduce((s, c) => s + (c.encours || 0), 0);

  const statuts = [
    { name: 'En attente', value: factures.filter(f => f.statut === 'En attente').length },
    { name: 'Partiel', value: factures.filter(f => f.statut && f.statut.startsWith('Partiel')).length },
    { name: 'Soldee', value: factures.filter(f => f.statut === 'Soldée').length },
  ];

  const encoursByClient = clients.filter(c => c.encours > 0).sort((a, b) => b.encours - a.encours).slice(0, 6).map(c => ({ name: c.nom, encours: Math.round(c.encours) }));

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: '1.5rem', color: '#1a2332' }}>📈 Balance generale</h1>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '2rem' }}>
        <StatCard label="Total commandes" value={fmt(totalCommandes) + ' FCFA'} />
        <StatCard label="Total facture" value={fmt(totalFacture) + ' FCFA'} color="#2979ff" />
        <StatCard label="Encours clients" value={fmt(totalEncours) + ' FCFA'} color="#ff9800" />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div style={{ flex: 1, minWidth: 280, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe', fontSize: 15 }}>Encours par client</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={encoursByClient}>
              <XAxis dataKey="name" tick={{ fill: '#8ba3c1', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8ba3c1', fontSize: 11 }} />
              <Tooltip formatter={v => fmt(v) + ' FCFA'} contentStyle={{ background: '#0d1b2a', border: 'none' }} />
              <Bar dataKey="encours" fill="#2979ff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ minWidth: 220, background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe', fontSize: 15 }}>Statut des factures</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statuts} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={e => e.name}>
                {statuts.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#162436', borderRadius: 14, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ margin: '0 0 1rem', color: '#e8f0fe' }}>Factures en cours</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#8ba3c1' }}>
              <th style={th}>Client</th>
              <th style={th}>Facture</th>
              <th style={th}>Total</th>
              <th style={th}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {factures.filter(f => f.statut !== 'Soldée').map(f => (
              <tr key={f.id}>
                <td style={td}>{f.client_nom}</td>
                <td style={{ ...td, color: '#2979ff' }}>{f.numero}</td>
                <td style={td}>{fmt(f.total)} FCFA</td>
                <td style={td}><BadgeStatut statut={f.statut} /></td>
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