import React, { useEffect, useState } from 'react';
import { api } from '../api';
import StageBadge from '../components/StageBadge';

export default function QualifiedQueue(): JSX.Element {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.contacts.list({ pipelineStage: 'Qualified' }).then(setContacts).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const sendToVerification = async (id: string) => {
    await api.contacts.update(id, { crm_pipeline_stage: 'Verification Pending' });
    load();
  };

  return (
    <div>
      <h1>Qualified Contacts Queue</h1>
      <p className="page-subtitle">Contacts that matched the qualification keyword engine, ready for LinkedIn (mock) verification.</p>
      <div className="panel">
        {loading && <div className="empty-state">Loading…</div>}
        {!loading && contacts.length === 0 && <div className="empty-state">No qualified contacts waiting. Import a CSV to populate this queue.</div>}
        {!loading && contacts.length > 0 && (
          <table>
            <thead><tr><th>Name</th><th>Company (CSV)</th><th>Position</th><th>Qualification reason</th><th>Stage</th><th></th></tr></thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>{c.full_name}</td>
                  <td>{c.csv_company}</td>
                  <td>{c.csv_position}</td>
                  <td>{c.qualification_reason}</td>
                  <td><StageBadge stage={c.crm_pipeline_stage} /></td>
                  <td><button className="btn btn-primary" onClick={() => sendToVerification(c.id)}>Send to verification</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
