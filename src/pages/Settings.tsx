import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useUiStore } from '../state/store';

export default function Settings(): JSX.Element {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  useEffect(() => { api.settings.getAll().then(setSettings); }, []);

  const resetCompliance = async () => {
    await api.settings.set('compliance_acknowledged', 'false');
    window.location.reload();
  };

  return (
    <div>
      <h1>Settings</h1>
      <p className="page-subtitle">Application preferences and compliance controls.</p>

      <div className="panel">
        <h2>Appearance</h2>
        <button className="btn" onClick={toggleTheme}>
          Switch to {theme === 'light' ? 'dark' : 'light'} mode
        </button>
      </div>

      <div className="panel">
        <h2>Compliance</h2>
        <p className="compliance-text">
          "Use this tool only for relevant, legitimate, and policy-compliant business outreach. You are responsible
          for message content, consent, and compliance with LinkedIn policies and applicable laws."
        </p>
        <p>Acknowledged: {settings.compliance_acknowledged === 'true' ? 'Yes' : 'No'}</p>
        <button className="btn" onClick={resetCompliance}>Reset acknowledgement (show modal again)</button>
      </div>

      <div className="panel">
        <h2>Mock mode</h2>
        <p>
          This application only ever operates in Mock Mode. All LinkedIn verification and sending is simulated with
          randomized in-memory results — no network request is ever made to linkedin.com. See
          <code> electron/services/linkedin/adapter.ts</code> for the interface a real, policy-compliant adapter
          would implement later.
        </p>
      </div>
    </div>
  );
}
