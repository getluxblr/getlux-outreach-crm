import React, { useEffect, useState } from 'react';
import { api } from '../api';

const STALE_DAYS = 7;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export default function LinkedInData(): JSX.Element {
  const [totalConnections, setTotalConnections] = useState(0);
  const [pendingSent, setPendingSent] = useState(0);
  const [pendingReceived, setPendingReceived] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => {
    api.linkedinData.get().then((data: any) => {
      setTotalConnections(data.totalConnections);
      setPendingSent(data.pendingSent);
      setPendingReceived(data.pendingReceived);
      setLastUpdated(data.lastUpdated);
    });
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const result = await api.linkedinData.update({ totalConnections, pendingSent, pendingReceived });
      setLastUpdated(result.lastUpdated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const staleDays = daysSince(lastUpdated);
  const isStale = staleDays === null || staleDays > STALE_DAYS;

  return (
    <div>
      <h1>LinkedIn Data</h1>
      <p className="page-subtitle">
        Manually enter what you see in your own LinkedIn account (My Network → Connections, and the "Sent"/"Received"
        invitation tabs). This app never logs into LinkedIn or pulls these numbers automatically — you type them in,
        and "Last updated" is set automatically when you save.
      </p>

      <div className="panel">
        <div className="card-grid">
          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Total Connections</label>
            <input
              type="number"
              min={0}
              value={totalConnections}
              onChange={(e) => setTotalConnections(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Pending Sent Requests</label>
            <input
              type="number"
              min={0}
              value={pendingSent}
              onChange={(e) => setPendingSent(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Pending Received Requests</label>
            <input
              type="number"
              min={0}
              value={pendingReceived}
              onChange={(e) => setPendingReceived(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save LinkedIn Data'}
          </button>
          {saved && <span className="badge badge-success" style={{ marginLeft: 10 }}>Saved</span>}
        </div>

        <p style={{ marginTop: 14 }}>
          <strong>Last updated: </strong>
          {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
          {isStale && (
            <span className="badge badge-warning" style={{ marginLeft: 10 }}>
              Update your LinkedIn numbers
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
