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

  // Edit modal — same shape/pattern as Add Connection, pre-filled from the
  // contact being edited. This is what lets someone fix a bad/missing
  // LinkedIn URL (e.g. entered by hand) after the fact.
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_ADD_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  // Per-row action buttons that used to be the whole of the Qualified Queue
  // and Verification Queue screens. Same API calls, same busy-state
  // handling as those pages had — this never talks to linkedin.com; "Run
  // Mock Verification" is the same pre-existing mock-only simulation.
  const [verifyBusyId, setVerifyBusyId] = useState<string | null>(null);

  const sendToVerification = async (id: string) => {
    await api.contacts.update(id, { crm_pipeline_stage: 'Verification Pending' });
    load();
  };

  const runMockVerification = async (id: string) => {
    setVerifyBusyId(id);
    try {
      await api.verification.verifyContact(id);
    } finally {
      setVerifyBusyId(null);
      load();
    }
  };

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

  const openEditConnection = (c: any) => {
    setEditForm({
      fullName: c.full_name || '',
      company: c.csv_company || '',
      position: c.csv_position || '',
      linkedinUrl: c.linkedin_url || '',
      pronouns: c.pronouns_found || '',
      connectionStatus: c.contact_status === 'Not Connected' ? 'Not Connected' : 'Connected',
    });
    setEditError(null);
    setEditingContactId(c.id);
  };

  const closeEditConnection = () => {
    setEditingContactId(null);
    setEditError(null);
  };

  // Updates the existing contact record — same validation/normalization of
  // the LinkedIn URL as Add Connection (same error message on invalid
  // input), writing to the same columns updateContact() already allows.
  const submitEditConnection = async () => {
    if (!editingContactId) return;
    setEditError(null);
    if (!editForm.fullName.trim()) {
      setEditError('Name is required.');
      return;
    }
    if (!editForm.linkedinUrl.trim()) {
      setEditError('LinkedIn Profile URL is required.');
      return;
    }
    const normalizedLinkedinUrl = toOpenableLinkedInUrl(editForm.linkedinUrl);
    if (!normalizedLinkedinUrl) {
      setEditError(LINKEDIN_URL_ERROR);
      return;
    }
    setEditBusy(true);
    try {
      await api.contacts.update(editingContactId, {
        full_name: editForm.fullName.trim(),
        linkedin_url: normalizedLinkedinUrl,
        csv_company: editForm.company.trim() || null,
        csv_position: editForm.position.trim() || null,
        pronouns_found: editForm.pronouns || null,
        contact_status: editForm.connectionStatus,
      });
      setEditingContactId(null);
      load();
    } catch (e: any) {
      setEditError(e.message || 'Could not save this contact.');
    } finally {
      setEditBusy(false);
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

      {editingContactId && (
        <div className="panel">
          <h2>Edit Contact</h2>
          <p className="page-subtitle">
            Fix or update this contact's details — for example, correct a bad or missing LinkedIn URL.
          </p>
          <div className="card-grid">
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Name</label>
              <input
                type="text"
                value={editForm.fullName}
                onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Company</label>
              <input
                type="text"
                value={editForm.company}
                onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Position / Title</label>
              <input
                type="text"
                value={editForm.position}
                onChange={(e) => setEditForm((f) => ({ ...f, position: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>LinkedIn Profile URL</label>
              <input
                type="text"
                placeholder="https://www.linkedin.com/in/…"
                value={editForm.linkedinUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                Pronoun (used only for the explicit greeting rule — never inferred from name)
              </label>
              <select
                value={editForm.pronouns}
                onChange={(e) => setEditForm((f) => ({ ...f, pronouns: e.target.value }))}
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
                value={editForm.connectionStatus}
                onChange={(e) => setEditForm((f) => ({ ...f, connectionStatus: e.target.value as 'Connected' | 'Not Connected' }))}
                style={{ width: '100%' }}
              >
                <option value="Connected">Connected (already connected on LinkedIn)</option>
                <option value="Not Connected">Not Connected (logging a prospect I haven't imported)</option>
              </select>
            </div>
          </div>
          {editError && <p style={{ color: 'var(--danger)' }}>{editError}</p>}
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-primary" disabled={editBusy} onClick={submitEditConnection}>
              {editBusy ? 'Saving…' : 'Save Changes'}
            </button>{' '}
            <button className="btn" onClick={closeEditConnection}>Cancel</button>
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
                <th>Action</th>
                <th></th>
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
                  <td>
                    {c.crm_pipeline_stage === 'Qualified' && (
                      <button className="btn btn-primary" onClick={() => sendToVerification(c.id)}>
                        Send to Verification
                      </button>
                    )}
                    {c.crm_pipeline_stage === 'Verification Pending' && (
                      <button
                        className="btn btn-primary"
                        disabled={verifyBusyId === c.id}
                        onClick={() => runMockVerification(c.id)}
                      >
                        {verifyBusyId === c.id ? 'Verifying…' : 'Run Mock Verification'}
                      </button>
                    )}
                  </td>
                  <td>
                    <button className="btn" onClick={() => openEditConnection(c)}>Edit</button>
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
