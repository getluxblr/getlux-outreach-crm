import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PIPELINE_STAGES } from '../../shared/types';
import StageBadge from '../components/StageBadge';

export default function Contacts(): JSX.Element {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.contacts
      .list({ search: search || undefined, pipelineStage: stage || undefined })
      .then(setContacts)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDoNotContact = async (id: string, value: boolean) => {
    await api.contacts.update(id, { do_not_contact_flag: value ? 1 : 0, crm_pipeline_stage: value ? 'Do Not Contact' : 'Imported' });
    load();
  };

  return (
    <div>
      <h1>Contacts</h1>
      <p className="page-subtitle">All imported contacts, searchable and filterable by pipeline stage.</p>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search name, company, LinkedIn URL…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">All stages</option>
          {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-primary" onClick={load}>Apply filters</button>
      </div>

      <div className="panel">
        {loading && <div className="empty-state">Loading…</div>}
        {!loading && contacts.length === 0 && <div className="empty-state">No contacts found. Try Import CSV first.</div>}
        {!loading && contacts.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>LinkedIn</th>
                <th>Company (CSV)</th>
                <th>Verified Company</th>
                <th>Stage</th>
                <th>Qualification</th>
                <th>DNC</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>{c.full_name}</td>
                  <td><a href={c.linkedin_url} target="_blank" rel="noreferrer">profile</a></td>
                  <td>{c.csv_company}</td>
                  <td>{c.verified_current_company}</td>
                  <td><StageBadge stage={c.crm_pipeline_stage} /></td>
                  <td style={{ maxWidth: 220 }}>{c.qualification_reason}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!c.do_not_contact_flag}
                      onChange={(e) => setDoNotContact(c.id, e.target.checked)}
                    />
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
