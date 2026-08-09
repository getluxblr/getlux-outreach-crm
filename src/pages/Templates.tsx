import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { INVITATION_NOTE_CHAR_LIMIT, type TemplateType } from '../../shared/types';

const TABS: TemplateType[] = ['Invitation Note', 'Connection Message'];

export default function Templates(): JSX.Element {
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TemplateType>('Connection Message');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState('');
  const [newName, setNewName] = useState('');
  const [newBody, setNewBody] = useState('');

  const load = () => api.templates.list().then(setTemplates);

  useEffect(() => { load(); }, []);

  const startEdit = (t: any) => {
    setEditingId(t.id);
    setDraftBody(t.body);
  };

  const saveEdit = async (id: string) => {
    await api.templates.update(id, { body: draftBody });
    setEditingId(null);
    load();
  };

  const addTemplate = async () => {
    if (!newName || !newBody) return;
    await api.templates.create(newName, newBody, activeTab);
    setNewName('');
    setNewBody('');
    load();
  };

  const visible = templates.filter((t) => (t.type || 'Connection Message') === activeTab);

  return (
    <div>
      <h1>Templates Manager</h1>
      <p className="page-subtitle">
        Two template types: <strong>Invitation Note</strong> (for prospects not yet connected on LinkedIn — LinkedIn
        caps invite notes at roughly {INVITATION_NOTE_CHAR_LIMIT} characters, so keep these short) and{' '}
        <strong>Connection Message</strong> (for prospects you're already connected to). Both use{' '}
        {'{{GREETING}}'} and {'{{COMPANY}}'} placeholders — edit freely, but factual claims (Getlux services, client
        list, sender details) should stay accurate.
      </p>

      <div className="toolbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`btn${activeTab === tab ? ' btn-primary' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="panel">
        {visible.length === 0 && <div className="empty-state">No {activeTab} templates yet.</div>}
        {visible.map((t) => {
          const charCount = editingId === t.id ? draftBody.length : t.body.length;
          const overLimit = activeTab === 'Invitation Note' && charCount > INVITATION_NOTE_CHAR_LIMIT;
          return (
            <div key={t.id} className="panel" style={{ marginBottom: 10 }}>
              <div className="toolbar">
                <strong>{t.name}</strong>
                <span className={`badge ${overLimit ? 'badge-danger' : 'badge-info'}`}>
                  {charCount} chars{activeTab === 'Invitation Note' ? ` / ${INVITATION_NOTE_CHAR_LIMIT} limit` : ''}
                </span>
                {editingId !== t.id && <button className="btn" onClick={() => startEdit(t)}>Edit</button>}
              </div>
              {editingId === t.id ? (
                <>
                  <textarea rows={8} value={draftBody} onChange={(e) => setDraftBody(e.target.value)} />
                  <div style={{ marginTop: 8 }}>
                    <button className="btn btn-primary" onClick={() => saveEdit(t.id)}>Save</button>{' '}
                    <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13 }}>{t.body}</pre>
              )}
            </div>
          );
        })}
      </div>

      <div className="panel">
        <h2>Add a new {activeTab} template</h2>
        {activeTab === 'Invitation Note' && (
          <p className="page-subtitle">
            Keep it under {INVITATION_NOTE_CHAR_LIMIT} characters after substitution — LinkedIn enforces this limit
            on invite notes.
          </p>
        )}
        <input
          type="text"
          placeholder="Template name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ marginBottom: 8, width: '100%' }}
        />
        <textarea rows={6} placeholder="Body ({{GREETING}} / {{COMPANY}} placeholders supported)" value={newBody} onChange={(e) => setNewBody(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          <span className="badge badge-info">{newBody.length} chars</span>{' '}
          <button className="btn btn-primary" onClick={addTemplate}>Add {activeTab} template</button>
        </div>
      </div>
    </div>
  );
}
