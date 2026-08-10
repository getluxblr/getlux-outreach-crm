import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PIPELINE_STAGES } from '../../shared/types';
import { toOpenableLinkedInUrl } from '../../shared/linkedinUrl';
import StageBadge from '../components/StageBadge';

const LINKEDIN_URL_ERROR = 'Enter a valid LinkedIn profile URL, e.g. https://www.linkedin.com/in/your-handle';

const EMPTY_ADD_FORM = {
  fullName: '',
  company: '',
  position: '',
  linkedinUrl: '',
  pronouns: '', // '' (Not specified) | 'He/Him' | 'She/Her' — same options selectGreeting() uses
  connectionStatus: 'Connected' as 'Connected' | 'Not Connected',
};

export default function Contacts(): JSX.Element {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [addBusy, setAddBusy] = useState(false);

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

  const openAddConnection = () => {
    setAddForm(EMPTY_ADD_FORM);
    setAddError(null);
    setShowAddConnection(true);
  };

  const closeAddConnection = () => {
    setShowAddConnection(false);
    setAddError(null);
  };

  // Creates one contact the same way CSV import would — reuses the exact
  // same upsertContactFromImport()/isQualified() logic on the Electron side
  // (see electron/services/csvImport.ts createManualContact), just for a
  // single person typed in by hand instead of a whole file. This never
  // talks to linkedin.com; the LinkedIn URL is only stored for later use by
  // the "Connect on LinkedIn" button on the Batch Review & Send screen.
  const submitAddConnection = async () => {
    setAddError(null);
    if (!addForm.fullName.trim()) {
      setAddError('Name is required.');
      return;
    }
    if (!addForm.linkedinUrl.trim()) {
      setAddError('LinkedIn Profile URL is required.');
      return;
    }
    const normalizedLinkedinUrl = toOpenableLinkedInUrl(addForm.linkedinUrl);
    if (!normalizedLinkedinUrl) {
      setAddError(LINKEDIN_URL_ERROR);
      return;
    }
    setAddBusy(true);
    try {
      await api.contacts.createManual({
        full_name: addForm.fullName.trim(),
        linkedin_url: normalizedLinkedinUrl,
        company: addForm.company.trim() || null,
        position: addForm.position.trim() || null,
        pronouns_found: addForm.pronouns || null,
        connection_status: addForm.connectionStatus,
      });
      setShowAddConnection(false);
      load();
    } catch (e: any) {
      setAddError(e.message || 'Could not add this connection.');
    } finally {
      setAddBusy(false);
    }
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
        <button className="btn" onClick={openAddConnection}>+ Add Connection</button>
      </div>

      {showAddConnection && (
        <div className="panel">
          <h2>Add Connection</h2>
          <p className="page-subtitle">
            Manually log one person you already know — creates a contact the same way importing a CSV row would.
            This is not a bulk import; use Import CSV for a full file.
          </p>
          <div className="card-grid">
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Name</label>
              <input
                type="text"
                value={addForm.fullName}
                onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Company</label>
              <input
                type="text"
                value={addForm.company}
                onChange={(e) => setAddForm((f) => ({ ...f, company: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Position / Title</label>
              <input
                type="text"
                value={addForm.position}
                onChange={(e) => setAddForm((f) => ({ ...f, position: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>LinkedIn Profile URL</label>
              <input
                type="text"
                placeholder="https://www.linkedin.com/in/…"
                value={addForm.linkedinUrl}
                onChange={(e) => setAddForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                Pronoun (used only for the explicit greeting rule — never inferred from name)
              </label>
              <select
                value={addForm.pronouns}
                onChange={(e) => setAddForm((f) => ({ ...f, pronouns: e.target.value }))}
                style={{ width: '100%' }}
              >
                <option value="">Not specified</option>
                <option value="He/Him">He/Him</option>
                <option value="She/Her">She/Her</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Connection status</label>
              <select
                value={addForm.connectionStatus}
                onChange={(e) => setAddForm((f) => ({ ...f, connectionStatus: e.target.value as 'Connected' | 'Not Connected' }))}
                style={{ width: '100%' }}
              >
                <option value="Connected">Connected (already connected on LinkedIn)</option>
                <option value="Not Connected">Not Connected (logging a prospect I haven't imported)</option>
              </select>
            </div>
          </div>
          {addError && <p style={{ color: 'var(--danger)' }}>{addError}</p>}
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-primary" disabled={addBusy} onClick={submitAddConnection}>
              {addBusy ? 'Adding…' : 'Add Connection'}
            </button>{' '}
            <button className="btn" onClick={closeAddConnection}>Cancel</button>
          </div>
        </div>
      )}

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
