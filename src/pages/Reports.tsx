import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Reports(): JSX.Element {
  const [metrics, setMetrics] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [performance, setPerformance] = useState<Record<string, any>>({});

  useEffect(() => {
    api.dashboard.metrics().then(setMetrics);
    api.campaigns.list().then(async (list) => {
      setCampaigns(list);
      const perf: Record<string, any> = {};
      for (const c of list) perf[c.id] = await api.campaigns.performance(c.id);
      setPerformance(perf);
    });
  }, []);

  return (
    <div>
      <h1>Reports &amp; Analytics</h1>
      <p className="page-subtitle">Campaign-wise performance and overall funnel metrics computed from the local database.</p>

      {metrics && (
        <div className="panel">
          <h2>Overall funnel</h2>
          <div className="card-grid">
            <div className="metric-card"><div className="metric-value">{metrics.totalImported}</div><div className="metric-label">Imported</div></div>
            <div className="metric-card"><div className="metric-value">{metrics.qualified}</div><div className="metric-label">Qualified</div></div>
            <div className="metric-card"><div className="metric-value">{metrics.verified}</div><div className="metric-label">Verified</div></div>
            <div className="metric-card"><div className="metric-value">{metrics.sent}</div><div className="metric-label">Sent</div></div>
            <div className="metric-card"><div className="metric-value">{metrics.replies}</div><div className="metric-label">Replies</div></div>
            <div className="metric-card"><div className="metric-value">{metrics.won}</div><div className="metric-label">Won</div></div>
          </div>
        </div>
      )}

      <div className="panel">
        <h2>Campaign-wise performance</h2>
        {campaigns.length === 0 && <div className="empty-state">No campaigns yet.</div>}
        {campaigns.length > 0 && (
          <table>
            <thead><tr><th>Campaign</th><th>Sent</th><th>Replies</th><th>Reply rate</th><th>Positive rate</th><th>Conversion rate</th></tr></thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{performance[c.id]?.sent}</td>
                  <td>{performance[c.id]?.replies}</td>
                  <td>{performance[c.id]?.replyRate?.toFixed(1)}%</td>
                  <td>{performance[c.id]?.positiveReplyRate?.toFixed(1)}%</td>
                  <td>{performance[c.id]?.conversionRate?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
