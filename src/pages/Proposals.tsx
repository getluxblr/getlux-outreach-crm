import React, { useEffect, useState } from 'react';
import { api } from '../api';

const STAGES = ['Proposal Requested', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

export default function Proposals(): JSX.Element {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [contactId, setContactId] = useState('');
  const [dealValue, setDealValue] = useState('');

  const load = () => api.opportunities.list().then(setOpportunities);

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!contactId) return;
    await api.opportunities.create({ contact_id: contactId, stage: 'Proposal Requested', deal_value_estimate: dealValue ? Number(dealValue) : null });
    setContactId('');
    setDealValue('');
    load();
  };

  const updateStage = async (id: string, stage: string) => {
    const outcome = stage === 'Won' ? 'Won' : stage === 'Lost' ? 'Lost' : null;
    await api.opportunities.update(id, { stage, outcome });
    load();
  };

  return (
    <div>
      <h1>Proposals Tracker</h1>
      <p className="page-subtitle">Opportunities from Proposal Requested through Won/Lost.</p>

      <div className="panel">
        <div className="toolbar">
          <input type="text" placeholder="Contact ID" value={contactId} onChange={(e) => setContactId(e.target.value)} />
          <input type="number" placeholder="Deal value estimate" value={dealValue} onChange={(e) => setDealValue(e.target.value)} />
          <button className="btn btn-primary" onClick={create}>Add opportunity</button>
        </div>
      </div>

      <div className="panel">
        {opportunities.length === 0 && <div className="empty-state">No opportunities yet.</div>}
        {opportunities.length > 0 && (
          <table>
            <thead><tr><th>Contact</th><th>Stage</th><th>Deal value</th><th>Outcome</th><th></th></tr></thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o.id}>
                  <td>{o.contact_id}</td>
                  <td>{o.stage}</td>
                  <td>{o.deal_value_estimate ?? '-'}</td>
                  <td>{o.outcome ?? '-'}</td>
                  <td>
                    <select value={o.stage} onChange={(e) => updateStage(o.id, e.target.value)}>
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
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
