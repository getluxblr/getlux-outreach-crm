import React, { useEffect, useState } from 'react';
import { api } from '../api';
import StageBadge from '../components/StageBadge';

export default function VerificationQueue(): JSX.Element {
  const [contacts, setContacts] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => api.contacts.list({ pipelineStage: 'Verification Pending' }).then(setContacts);

  useEffect(() => { load(); }, []);

  const verify = async (id: string) => {
    setBusyId(id);
    try {
      await api.verification.verifyContact(id);
    } finally {
      setBusyId(null);
      load();
    }
  };

  return (
    <div>
      <h1>LinkedIn Verification Queue</h1>
      <p className="page-subtitle">
        Mock-mode profile verification only — this simulates checking current company/title, message availability,
        and existing conversations. No request is ever made to linkedin.com.
      </p>
      <div className="panel">
        {contacts.length === 0 && <div className="empty-state">Nothing waiting for verification.</div>}
        {contacts.length > 0 && (
          <table>
            <thead><tr><th>Name</th><th>LinkedIn</th><th>Stage</th><th></th></tr></thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>{c.full_name}</td>
                  <td><a href={c.linkedin_url} target="_blank" rel="noreferrer">profile</a></td>
                  <td><StageBadge stage={c.crm_pipeline_stage} /></td>
                  <td>
                    <button className="btn btn-primary" disabled={busyId === c.id} onClick={() => verify(c.id)}>
                      {busyId === c.id ? 'Verifying…' : 'Run mock verification'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
