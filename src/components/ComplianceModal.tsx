import React, { useEffect, useState } from 'react';
import { api } from '../api';

const COMPLIANCE_TEXT =
  'Use this tool only for relevant, legitimate, and policy-compliant business outreach. You are responsible for message content, consent, and compliance with LinkedIn policies and applicable laws.';

const SETTING_KEY = 'compliance_acknowledged';

export default function ComplianceModal(): JSX.Element | null {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.settings
      .get(SETTING_KEY)
      .then((value) => setVisible(value !== 'true'))
      .catch(() => setVisible(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !visible) return null;

  const acknowledge = async () => {
    await api.settings.set(SETTING_KEY, 'true');
    setVisible(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" role="dialog" aria-modal="true">
        <h2>Before you begin</h2>
        <p className="compliance-text">{COMPLIANCE_TEXT}</p>
        <p className="compliance-note">
          This application never automates LinkedIn sending, scraping, or bypasses LinkedIn protections. All
          "sending" happens in Mock Mode and is recorded only in your local database.
        </p>
        <label className="checkbox-row">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          I have read and understood this
        </label>
        <button className="btn btn-primary" disabled={!checked} onClick={acknowledge}>
          Continue
        </button>
      </div>
    </div>
  );
}
