import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Templates(): JSX.Element {
  const [templates, setTemplates] = useState<any[]>([]);
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
    await api.templates.create(newName, newBody);
    setNewName('');
    setNewBody('');
    load();
  };

  return (
    <div>
      <h1>Templates Manager</h1>
      <p className="page-subtitle">
        10 seeded outreach templates with {'{{GREETING}}'} and {'{{COMPANY}}'} placeholders. Edit freely — factual
        claims (Getlux services, client list, sender details) should stay accurate.
      </p>

      <div className="panel">
        {templates.map((t) => (
          <div key={t.id} className="panel" style={{ marginBottom: 10 }}>
            <div className="toolbar">
              <strong>{t.name}</strong>
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
        ))}
      </div>

      <div className="panel">
        <h2>Add a new template</h2>
        <input type="text" placeholder="Template name" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ marginBottom: 8, width: '100%' }} />
        <textarea rows={6} placeholder="Body ({{GREETING}} / {{COMPANY}} placeholders supported)" value={newBody} onChange={(e) => setNewBody(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={addTemplate}>Add template</button>
        </div>
      </div>
    </div>
  );
}
