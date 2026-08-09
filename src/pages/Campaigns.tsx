import React, { useEffect, useState } from 'react';
import { api } from '../api';

const EMPTY = { name: '', description: '', target_criteria: '', start_date: '', end_date: '' };

export default function Campaigns(): JSX.Element {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [form, setForm] = useState<any>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [performance, setPerformance] = useState<Record<string, any>>({});

  const load = async () => {
    const list = await api.campaigns.list();
    setCampaigns(list);
    const perf: Record<string, any> = {};
    for (const c of list) {
      perf[c.id] = await api.campaigns.performance(c.id);
    }
    setPerformance(perf);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) return;
    await api.campaigns.create(form);
    setForm(EMPTY);
    setShowForm(false);
    load();
  };

  return (
    <div>
      <h1>Campaigns</h1>
      <p className="page-subtitle">Group outreach by target segment (e.g. "NBFC Decision Makers", "Kerala Field Collections Leads").</p>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>New campaign</button>
      </div>

      {showForm && (
        <div className="panel">
          <div className="card-grid">
            <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input type="text" placeholder="Target criteria" value={form.target_criteria} onChange={(e) => setForm({ ...form, target_criteria: e.target.value })} />
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <textarea placeholder="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-primary" onClick={save}>Save campaign</button>
          </div>
        </div>
      )}

      <div className="panel">
        {campaigns.length === 0 && <div className="empty-state">No campaigns yet.</div>}
        {campaigns.length > 0 && (
          <table>
            <thead><tr><th>Name</th><th>Status</th><th>Sent</th><th>Replies</th><th>Reply rate</th><th>Positive rate</th></tr></thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.status}</td>
                  <td>{performance[c.id]?.sent ?? '-'}</td>
                  <td>{performance[c.id]?.replies ?? '-'}</td>
                  <td>{performance[c.id]?.replyRate?.toFixed(1) ?? '-'}%</td>
                  <td>{performance[c.id]?.positiveReplyRate?.toFixed(1) ?? '-'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
