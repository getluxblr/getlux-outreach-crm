import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function AuditLog(): JSX.Element {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => { api.activity.list(500).then(setEntries); }, []);

  return (
    <div>
      <h1>Audit Log</h1>
      <p className="page-subtitle">Every compliance-relevant event: imports, verifications, sends, failures, and stop reasons.</p>
      <div className="panel">
        {entries.length === 0 && <div className="empty-state">No activity recorded yet.</div>}
        {entries.length > 0 && (
          <table>
            <thead><tr><th>When</th><th>Event</th><th>Description</th></tr></thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.created_at}</td>
                  <td>{e.event_type}</td>
                  <td>{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
