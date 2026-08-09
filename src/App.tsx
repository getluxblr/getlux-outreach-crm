import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ComplianceModal from './components/ComplianceModal';
import { useUiStore } from './state/store';

import Dashboard from './pages/Dashboard';
import LinkedInData from './pages/LinkedInData';
import ImportCsv from './pages/ImportCsv';
import Contacts from './pages/Contacts';
import Companies from './pages/Companies';
import QualifiedQueue from './pages/QualifiedQueue';
import VerificationQueue from './pages/VerificationQueue';
import BatchSend from './pages/BatchSend';
import Campaigns from './pages/Campaigns';
import Messages from './pages/Messages';
import Replies from './pages/Replies';
import Pipeline from './pages/Pipeline';
import Proposals from './pages/Proposals';
import Tasks from './pages/Tasks';
import Templates from './pages/Templates';
import Reports from './pages/Reports';
import Scheduler from './pages/Scheduler';
import AuditLog from './pages/AuditLog';
import ExportBackup from './pages/ExportBackup';
import Settings from './pages/Settings';

export default function App(): JSX.Element {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">
        <ComplianceModal />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/linkedin-data" element={<LinkedInData />} />
          <Route path="/import" element={<ImportCsv />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/qualified-queue" element={<QualifiedQueue />} />
          <Route path="/verification-queue" element={<VerificationQueue />} />
          <Route path="/batch-send" element={<BatchSend />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/replies" element={<Replies />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/scheduler" element={<Scheduler />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/export" element={<ExportBackup />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
