import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { TrialsPage } from './pages/TrialsPage';
import { SitesPage } from './pages/SitesPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { RecruitmentPage } from './pages/RecruitmentPage';
import { ProtocolPage } from './pages/ProtocolPage';
import { ChangesetsPage } from './pages/ChangesetsPage';
import { ImpactPage } from './pages/ImpactPage';
import { SafetyPage } from './pages/SafetyPage';
import { EthicsPage } from './pages/EthicsPage';
import { RegulatoryPage } from './pages/RegulatoryPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { CompilerPage } from './pages/CompilerPage';
import { DemoPage } from './pages/DemoPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="demo" element={<DemoPage />} />
          <Route path="trials" element={<TrialsPage />} />
          <Route path="sites" element={<SitesPage />} />
          <Route path="participants" element={<ParticipantsPage />} />
          <Route path="recruitment" element={<RecruitmentPage />} />
          <Route path="protocol" element={<ProtocolPage />} />
          <Route path="protocols" element={<Navigate to="/protocol" replace />} />
          <Route path="changesets" element={<ChangesetsPage />} />
          <Route path="impact" element={<ImpactPage />} />
          <Route path="safety" element={<SafetyPage />} />
          <Route path="ethics" element={<EthicsPage />} />
          <Route path="regulatory" element={<RegulatoryPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="compiler" element={<CompilerPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
