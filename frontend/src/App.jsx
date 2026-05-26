import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';

import Dashboard from './pages/hodmarket/Dashboard';
import Clients from './pages/hodmarket/Clients';
import Facturation from './pages/hodmarket/Facturation';
import Balance from './pages/hodmarket/Balance';
import Caisse from './pages/hodmarket/Caisse';
import Parametres from './pages/hodmarket/Parametres';

import DashboardGlobal from './pages/DashboardGlobal';

import LogisticDashboard from './pages/hodlogistic/LogisticDashboard';
import LogisticRecettes from './pages/hodlogistic/LogisticRecettes';
import LogisticCharges from './pages/hodlogistic/LogisticCharges';
import LogisticCaisse from './pages/hodlogistic/LogisticCaisse';

import ConstructionDashboard from './pages/hodconstruction/ConstructionDashboard';
import ConstructionRecettes from './pages/hodconstruction/ConstructionRecettes';
import ConstructionCharges from './pages/hodconstruction/ConstructionCharges';
import ConstructionProduction from './pages/hodconstruction/ConstructionProduction';
import ConstructionStock from './pages/hodconstruction/ConstructionStock';
import ConstructionCaisse from './pages/hodconstruction/ConstructionCaisse';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1b2a' }}>
        <NavBar />
        <main style={{ marginLeft: 260, flex: 1, padding: '2rem', color: '#e8f0fe', fontFamily: "'Inter', sans-serif" }}>
          <Routes>
            <Route path="/" element={<DashboardGlobal />} />

            <Route path="/hodmarket" element={<Dashboard />} />
            <Route path="/hodmarket/clients" element={<Clients />} />
            <Route path="/hodmarket/facturation" element={<Facturation />} />
            <Route path="/hodmarket/balance" element={<Balance />} />
            <Route path="/hodmarket/caisse" element={<Caisse />} />
            <Route path="/hodmarket/parametres" element={<Parametres />} />

            <Route path="/hodlogistic" element={<LogisticDashboard />} />
            <Route path="/hodlogistic/recettes" element={<LogisticRecettes />} />
            <Route path="/hodlogistic/charges" element={<LogisticCharges />} />
            <Route path="/hodlogistic/caisse" element={<LogisticCaisse />} />

            <Route path="/hodconstruction" element={<ConstructionDashboard />} />
            <Route path="/hodconstruction/recettes" element={<ConstructionRecettes />} />
            <Route path="/hodconstruction/charges" element={<ConstructionCharges />} />
            <Route path="/hodconstruction/production" element={<ConstructionProduction />} />
            <Route path="/hodconstruction/stock" element={<ConstructionStock />} />
            <Route path="/hodconstruction/caisse" element={<ConstructionCaisse />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}