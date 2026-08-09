import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { selectGreeting } from '../../shared/greeting';
import { renderTemplate } from '../../shared/templates';
import type { TemplateType } from '../../shared/types';

const BATCH_SIZES = [1, 5, 10, 25, 50, 75, 100, 125, 150];

interface Draft {
  contactId: string;
  name: string;
  company: string;
  role: string;
  pronouns: string | null;
  connectionStatus: string;
  templateType: TemplateType;
  qualificationReason: string | null;
  templateId: string;
  message: string;
  messageDbId: string | null;
  status: 'pending' | 'copied' | 'sent';
}

function templateTypeFor(contact: any): TemplateType {
  return contact.contact_status === 'Connected' ? 'Connection Message' : 'Invitation Note';
}

export default function BatchSend(): JSX.Element {
  const [templates, setTemplates] = useState<any[]>([]);
  const [batchSize, setBatchSize] = useState(10);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.templates.list().then(setTemplates);
  }, []);

  const templatesOfType = (type: TemplateType) => templates.filter((t) => (t.type || 'Connection Message') === type);

  const buildDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const verified = await api.contacts.list({ pipelineStage: 'Verified' });
      const selected = verified.slice(0, batchSize);
      const built: Draft[] = selected.map((c: any) => {
        const greeting = selectGreeting(c.pronouns_found);
        const company = c.verified_current_company || c.csv_company || 'your organization';
        const templateType = templateTypeFor(c);
        // Auto-select the correct template type for this contact: Invitation
        // Note if not yet connected, Connection Message if already connected.
        const candidates = templatesOfType(templateType);
        const defaultTemplate = candidates[0] || templates[0];
        const message = defaultTemplate ? renderTemplate(defaultTemplate, { greeting, company }) : '';
        return {
          contactId: c.id,
          name: c.full_name,
          company,
          role: c.verified_current_title || c.csv_position || '',
          pronouns: c.pronouns_found,
          connectionStatus: c.contact_status || 'Not Connected',
          templateType,
          qualificationReason: c.qualification_reason,
          templateId: defaultTemplate?.id || '',
          message,
          messageDbId: null,
          status: 'pending',
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

  const editMessage = (contactId: string, message: string) => {
    // Editing the draft after it's been copied/sent starts a fresh draft
    // cycle for that contact — it does not retroactively change what was
    // already sent.
    updateDraft(contactId, { message });
  };

  // Creates the outreach_messages row for this draft if it doesn't exist
  // yet, otherwise returns the existing one. Always returns a real id.
  const ensureMessageId = async (draft: Draft): Promise<string> => {
    if (draft.messageDbId) return draft.messageDbId;
    const id: string = await api.messages.create({
      contact_id: draft.contactId,
      template_id: draft.templateId,
      greeting_used: selectGreeting(draft.pronouns as any),
      company_used: draft.company,
      final_message: draft.message,
      status: 'Draft Copied',
    });
    return id;
  };

  // Copies the drafted message to the clipboard for the user to paste into
  // LinkedIn themselves. This never sends anything — it only writes to the
  // OS clipboard and marks the contact as "awaiting manual send" so it's
  // clear a human still has to go paste and send it.
  const copyToClipboard = async (draft: Draft) => {
    setBusyId(draft.contactId);
    try {
      await navigator.clipboard.writeText(draft.message);

      const alreadyHadId = !!draft.messageDbId;
      const messageDbId = await ensureMessageId(draft);
      if (alreadyHadId) {
        await api.messages.markDraftCopied(messageDbId);
      }

      await api.contacts.update(draft.contactId, { crm_pipeline_stage: 'Draft Copied — Awaiting Manual Send' });
      updateDraft(draft.contactId, { messageDbId, status: 'copied' });
    } finally {
      setBusyId(null);
    }
  };

  // The ONLY way a contact's stage becomes "Outreach Sent" — always a
  // deliberate, explicit click by the human, made only after they've
  // actually pasted and sent the message inside their own LinkedIn tab.
  // Never triggered automatically.
  const markAsSent = async (draft: Draft) => {
    setBusyId(draft.contactId);
    try {
      const messageDbId = await ensureMessageId(draft);
      await api.messages.markManualSent(messageDbId);
      await api.contacts.update(draft.contactId, {
        crm_pipeline_stage: 'Outreach Sent',
        full_sent_message: draft.message,
        sent_at: new Date().toISOString(),
        message_variation_used: draft.templateId,
      });
      updateDraft(draft.contactId, { messageDbId, status: 'sent' });
    } finally {
      setBusyId(null);
    }
  };

  const copiedCount = useMemo(() => drafts.filter((d) => d.status !== 'pending').length, [drafts]);
  const sentCount = useMemo(() => drafts.filter((d) => d.status === 'sent').length, [drafts]);

  return (
    <div>
      <h1>Batch Review &amp; Send</h1>
      <p className="page-subtitle">
        For each contact below, a draft is auto-selected — an <strong>Invitation Note</strong> if they're not yet
        connected on LinkedIn, or a <strong>Connection Message</strong> if they already are. Review or edit the text,
        click <strong>Copy to Clipboard</strong>, then paste and send it yourself inside your own LinkedIn tab.
        Nothing is ever sent from this app automatically — you must click <strong>Mark as Sent</strong> yourself,
        after you've actually sent it, to record it here.
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
          <h2>Drafts ({drafts.length} total — {copiedCount} copied, {sentCount} marked sent)</h2>
          {drafts.map((d) => (
            <div key={d.contactId} className="panel" style={{ marginBottom: 10 }}>
              <div className="toolbar">
                <strong>{d.name}</strong>
                <span className="badge badge-info">{d.company}</span>
                <span>{d.role}</span>
                <span className={`badge ${d.connectionStatus === 'Connected' ? 'badge-success' : 'badge-warning'}`}>
                  {d.connectionStatus}
                </span>
                <span className="badge badge-info">{d.templateType}</span>
                <select value={d.templateId} onChange={(e) => changeTemplate(d.contactId, e.target.value)}>
                  {templatesOfType(d.templateType).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {d.status === 'copied' && <span className="badge badge-warning">Draft Copied — Awaiting Manual Send</span>}
                {d.status === 'sent' && <span className="badge badge-success">Marked as Sent</span>}
              </div>
              <textarea
                rows={8}
                value={d.message}
                onChange={(e) => editMessage(d.contactId, e.target.value)}
              />
              <div style={{ marginTop: 8 }}>
                <button
                  className="btn btn-primary"
                  disabled={busyId === d.contactId}
                  onClick={() => copyToClipboard(d)}
                >
                  Copy to Clipboard
                </button>{' '}
                <button
                  className="btn"
                  disabled={busyId === d.contactId || d.status === 'sent'}
                  onClick={() => markAsSent(d)}
                  title="Click only after you've actually pasted and sent this message on LinkedIn yourself"
                >
                  {d.status === 'sent' ? 'Sent ✓' : 'Mark as Sent'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
