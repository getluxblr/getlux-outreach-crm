import React, { useEffect, useState } from 'react';
import { api } from '../api';

const EMPTY = { name: '', industry: '', company_type: 'NBFC', location: '', website: '', notes: '' };

export default function Companies(): JSX.Element {
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<any>(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const load = () => api.companies.list(search || undefined).then(setCompanies);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!form.name) return;
    await api.companies.create(form);
    setForm(EMPTY);
    setShowForm(false);
    load();
  };

  return (
    <div>
      <h1>Companies / Accounts</h1>
      <p className="page-subtitle">Company-level records aggregated across contacts and opportunities.</p>

      <div className="toolbar">
        <input type="search" placeholder="Search companies…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button className="btn" onClick={load}>Search</button>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>New company</button>
      </div>

      {showForm && (
        <div className="panel">
          <div className="card-grid">
            <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select value={form.company_type} onChange={(e) => setForm({ ...form, company_type: e.target.value })}>
              {['NBFC', 'Bank', 'Fintech', 'Lender', 'Collection Agency', 'Financial Services', 'Other'].map((t) => <option key={t}>{t}</option>)}
            </select>
            <input type="text" placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            <input type="text" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <input type="text" placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>
          <textarea placeholder="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-primary" onClick={save}>Save company</button>
          </div>
        </div>
      )}

      <div className="panel">
        {companies.length === 0 && <div className="empty-state">No companies yet.</div>}
        {companies.length > 0 && (
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>Location</th><th>Pipeline stage</th><th>Related contacts</th></tr></thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.company_type}</td>
                  <td>{c.location}</td>
                  <td>{c.pipeline_stage}</td>
                  <td>{c.related_contacts_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
