import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { selectGreeting } from '../../shared/greeting';
import { renderTemplate } from '../../shared/templates';

const BATCH_SIZES = [1, 5, 10, 25, 50, 75, 100, 125, 150];

interface Draft {
  contactId: string;
  name: string;
  company: string;
  role: string;
  pronouns: string | null;
  qualificationReason: string | null;
  templateId: string;
  message: string;
  skip: boolean;
}

export default function BatchSend(): JSX.Element {
  const [templates, setTemplates] = useState<any[]>([]);
  const [batchSize, setBatchSize] = useState(10);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progress, setProgress] = useState<any | null>(null);
  const [batchRunId, setBatchRunId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    api.templates.list().then(setTemplates);
    const off = api.batch.onProgress((payload) => {
      setProgress(payload);
      if (payload.done) setRunning(false);
    });
    return off;
  }, []);

  const buildDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const verified = await api.contacts.list({ pipelineStage: 'Verified' });
      const selected = verified.slice(0, batchSize);
      const defaultTemplate = templates[0];
      const built: Draft[] = selected.map((c: any) => {
        const greeting = selectGreeting(c.pronouns_found);
        const company = c.verified_current_company || c.csv_company || 'your organization';
        const message = defaultTemplate ? renderTemplate(defaultTemplate, { greeting, company }) : '';
        return {
          contactId: c.id,
          name: c.full_name,
          company,
          role: c.verified_current_title || c.csv_position || '',
          pronouns: c.pronouns_found,
          qualificationReason: c.qualification_reason,
          templateId: defaultTemplate?.id || '',
          message,
          skip: false,
        };
      });
      setDrafts(built);
    } finally {
      setLoadingDrafts(false);
    }
  };

  const updateDraft = (contactId: string, fields: Partial<Draft>) => {
    setDrafts((prev) => prev.map((d) => (d.contactId === contactId ? { ...d, ...fields } : d)));
  };

  const changeTemplate = (contactId: string, templateId: string) => {
    const draft = drafts.find((d) => d.contactId === contactId);
    const template = templates.find((t) => t.id === templateId);
    if (!draft || !template) return;
    const greeting = selectGreeting(draft.pronouns as any);
    const message = renderTemplate(template, { greeting, company: draft.company });
    updateDraft(contactId, { templateId, message });
  };

  const confirmAndSend = async () => {
    setConfirmOpen(false);
    setRunning(true);
    setProgress(null);
    const items = drafts
      .filter((d) => !d.skip)
      .map((d) => ({
        contactId: d.contactId,
        message: d.message,
        templateId: d.templateId,
        greeting: selectGreeting(d.pronouns as any),
        company: d.company,
      }));
    const id = await api.batch.run(null, items);
    setBatchRunId(id);
  };

  const stopBatch = async () => {
    if (batchRunId) await api.batch.stop(batchRunId);
  };

  const activeCount = useMemo(() => drafts.filter((d) => !d.skip).length, [drafts]);

  return (
    <div>
      <h1>Batch Review &amp; Send</h1>
      <p className="page-subtitle">
        Every message below requires your review before it is recorded. "Sending" here is fully simulated (mock
        mode) and only writes to your local database — nothing is sent to LinkedIn.
      </p>

      <div className="panel">
        <div className="toolbar">
          <label>Batch size</label>
          <select value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))}>
            {BATCH_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={buildDrafts} disabled={loadingDrafts}>
            {loadingDrafts ? 'Loading…' : 'Load next batch from Verified contacts'}
          </button>
        </div>
      </div>

      {drafts.length > 0 && (
        <div className="panel">
          <h2>Drafts ({activeCount} will be sent)</h2>
          {drafts.map((d) => (
            <div key={d.contactId} className="panel" style={{ marginBottom: 10 }}>
              <div className="toolbar">
                <strong>{d.name}</strong>
                <span className="badge badge-info">{d.company}</span>
                <span>{d.role}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.qualificationReason}</span>
                <select value={d.templateId} onChange={(e) => changeTemplate(d.contactId, e.target.value)}>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <label>
                  <input type="checkbox" checked={d.skip} onChange={(e) => updateDraft(d.contactId, { skip: e.target.checked })} /> Skip
                </label>
              </div>
              <textarea
                rows={8}
                value={d.message}
                onChange={(e) => updateDraft(d.contactId, { message: e.target.value })}
                disabled={d.skip}
              />
            </div>
          ))}
          <button className="btn btn-primary" onClick={() => setConfirmOpen(true)} disabled={running || activeCount === 0}>
            Confirm and Send ({activeCount})
          </button>
        </div>
      )}

      {confirmOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>Confirm batch send</h2>
            <p>
              You are about to (mock) send {activeCount} message(s). This simulates the send and writes results to
              your local database only. No message is transmitted to LinkedIn.
            </p>
            <button className="btn" onClick={() => setConfirmOpen(false)}>Cancel</button>{' '}
            <button className="btn btn-primary" onClick={confirmAndSend}>Confirm and Send</button>
          </div>
        </div>
      )}

      {(running || progress) && (
        <div className="panel">
          <h2>Batch progress</h2>
          {progress?.current && <p>Current: {progress.current.name} — {progress.current.company} ({progress.current.status})</p>}
          <div className="card-grid">
            <div className="metric-card"><div className="metric-value">{progress?.sent ?? 0}</div><div className="metric-label">Sent</div></div>
            <div className="metric-card"><div className="metric-value">{progress?.skipped ?? 0}</div><div className="metric-label">Skipped</div></div>
            <div className="metric-card"><div className="metric-value">{progress?.failed ?? 0}</div><div className="metric-label">Failed</div></div>
            <div className="metric-card"><div className="metric-value">{progress?.remaining ?? activeCount}</div><div className="metric-label">Remaining</div></div>
          </div>
          {progress?.detail && <p className="badge badge-warning">{progress.detail}</p>}
          {running && <button className="btn btn-danger" onClick={stopBatch}>Stop batch</button>}
          {progress?.done && <p>Batch finished{progress.stopped ? ' (stopped early)' : ''}.</p>}
        </div>
      )}
    </div>
  );
}
