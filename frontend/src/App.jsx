import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Login from './Login';

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
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('hod_token');
    const role = localStorage.getItem('hod_role');
    const username = localStorage.getItem('hod_username');
    if (token) setUser({ token, role, username });
  }, []);

  const handleLogin = (data) => setUser(data);

  const handleLogout = () => {
    localStorage.removeItem('hod_token');
    localStorage.removeItem('hod_role');
    localStorage.removeItem('hod_username');
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const isAdmin = user.role === 'admin';

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1b2a' }}>
        <NavBar role={user.role} username={user.username} onLogout={handleLogout} />
        <main style={{ marginLeft: 260, flex: 1, padding: '2rem', color: '#e8f0fe', fontFamily: "'Inter', sans-serif" }}>
          <Routes>
            {/* Dashboard global - admin seulement */}
            <Route path="/" element={isAdmin ? <DashboardGlobal /> : <Navigate to="/hodmarket/clients" />} />

            {/* HOD MARKET */}
            <Route path="/hodmarket" element={isAdmin ? <Dashboard /> : <Navigate to="/hodmarket/clients" />} />
            <Route path="/hodmarket/clients" element={<Clients />} />
            <Route path="/hodmarket/facturation" element={<Facturation />} />
            <Route path="/hodmarket/balance" element={<Balance />} />
            <Route path="/hodmarket/caisse" element={isAdmin ? <Caisse /> : <Navigate to="/hodmarket/clients" />} />
            <Route path="/hodmarket/parametres" element={isAdmin ? <Parametres /> : <Navigate to="/hodmarket/clients" />} />

            {/* HOD LOGISTIC */}
            <Route path="/hodlogistic" element={isAdmin ? <LogisticDashboard /> : <Navigate to="/hodmarket/clients" />} />
            <Route path="/hodlogistic/recettes" element={<LogisticRecettes />} />
            <Route path="/hodlogistic/charges" element={<LogisticCharges />} />
            <Route path="/hodlogistic/caisse" element={isAdmin ? <LogisticCaisse /> : <Navigate to="/hodmarket/clients" />} />

            {/* HOD CONSTRUCTION */}
            <Route path="/hodconstruction" element={isAdmin ? <ConstructionDashboard /> : <Navigate to="/hodmarket/clients" />} />
            <Route path="/hodconstruction/recettes" element={<ConstructionRecettes />} />
            <Route path="/hodconstruction/charges" element={<ConstructionCharges />} />
            <Route path="/hodconstruction/production" element={<ConstructionProduction />} />
            <Route path="/hodconstruction/stock" element={<ConstructionStock />} />
            <Route path="/hodconstruction/caisse" element={isAdmin ? <ConstructionCaisse /> : <Navigate to="/hodmarket/clients" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}