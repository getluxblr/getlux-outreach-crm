import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../api';

interface Metrics {
  totalImported: number;
  qualified: number;
  verified: number;
  sent: number;
  replies: number;
  replyRate: number;
  positiveReplyRate: number;
  interested: number;
  proposalRequests: number;
  proposalsSent: number;
  proposalConversionRate: number;
  meetingsBooked: number;
  won: number;
  lost: number;
  winRate: number;
  followUpsDueToday: number;
  skipped: number;
  existingConversations: number;
  failedMessages: number;
  sentToday: number;
  repliesToday: number;
}

const CARD_DEFS: { key: keyof Metrics; label: string; suffix?: string }[] = [
  { key: 'totalImported', label: 'Total Imported' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'verified', label: 'Verified' },
  { key: 'sent', label: 'Messages Sent' },
  { key: 'replies', label: 'Replies Received' },
  { key: 'replyRate', label: 'Reply Rate', suffix: '%' },
  { key: 'positiveReplyRate', label: 'Positive Reply Rate', suffix: '%' },
  { key: 'interested', label: 'Interested Leads' },
  { key: 'proposalRequests', label: 'Proposal Requests' },
  { key: 'proposalsSent', label: 'Proposals Sent' },
  { key: 'proposalConversionRate', label: 'Proposal Conversion Rate', suffix: '%' },
  { key: 'meetingsBooked', label: 'Meetings Booked' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
  { key: 'winRate', label: 'Win Rate', suffix: '%' },
  { key: 'followUpsDueToday', label: 'Follow-ups Due Today' },
  { key: 'skipped', label: 'Skipped' },
  { key: 'existingConversations', label: 'Existing Conversations' },
  { key: 'failedMessages', label: 'Failed Messages' },
  { key: 'sentToday', label: 'Sent Today' },
  { key: 'repliesToday', label: 'Replies Today' },
];

export default function Dashboard(): JSX.Element {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [stageCounts, setStageCounts] = useState<{ stage: string; count: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api.dashboard
      .metrics()
      .then(setMetrics)
      .catch((e) => setError(e.message));
    api.contacts
      .countByStage()
      .then((counts: Record<string, number>) =>
        setStageCounts(Object.entries(counts).map(([stage, count]) => ({ stage, count }))),
      )
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="page-subtitle">Live metrics computed from your local Getlux Outreach CRM database.</p>
      {error && <div className="panel">{error}</div>}
      {!metrics && !error && <div className="empty-state">Loading metrics…</div>}
      {metrics && (
        <div className="card-grid">
          {CARD_DEFS.map((c) => (
            <div className="metric-card" key={c.key}>
              <div className="metric-value">
                {typeof metrics[c.key] === 'number'
                  ? (c.suffix === '%' ? Number(metrics[c.key]).toFixed(1) : metrics[c.key])
                  : metrics[c.key]}
                {c.suffix || ''}
              </div>
              <div className="metric-label">{c.label}</div>
            </div>
          ))}
        </div>
      )}
      {stageCounts.length > 0 && (
        <div className="panel">
          <h2>Contacts by pipeline stage</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stageCounts} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="stage" width={160} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1f5c99" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <button className="btn" onClick={load}>Refresh</button>
    </div>
  );
}
