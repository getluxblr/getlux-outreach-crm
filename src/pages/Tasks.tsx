import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Tasks(): JSX.Element {
  const [tasks, setTasks] = useState<any[]>([]);
  const [dueToday, setDueToday] = useState<any[]>([]);
  const [contactId, setContactId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const load = () => {
    api.followups.list().then(setTasks);
    api.followups.dueToday().then(setDueToday);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!dueDate) return;
    await api.followups.create({ contact_id: contactId || null, due_date: dueDate, notes });
    setContactId('');
    setDueDate('');
    setNotes('');
    load();
  };

  const complete = async (id: string) => {
    await api.followups.update(id, { status: 'Done' });
    load();
  };

  const suggestDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().slice(0, 10));
  };

  return (
    <div>
      <h1>Tasks &amp; Follow-ups</h1>
      <p className="page-subtitle">{dueToday.length} follow-up(s) due today.</p>

      <div className="panel">
        <div className="toolbar">
          <input type="text" placeholder="Contact ID (optional)" value={contactId} onChange={(e) => setContactId(e.target.value)} />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <button className="btn" onClick={() => suggestDate(3)}>+3 days</button>
          <button className="btn" onClick={() => suggestDate(7)}>+7 days</button>
          <button className="btn" onClick={() => suggestDate(14)}>+14 days</button>
          <button className="btn btn-primary" onClick={create}>Add follow-up</button>
        </div>
        <textarea placeholder="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="panel">
        {tasks.length === 0 && <div className="empty-state">No follow-up tasks yet.</div>}
        {tasks.length > 0 && (
          <table>
            <thead><tr><th>Contact</th><th>Due date</th><th>Status</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.contact_id}</td>
                  <td>{t.due_date}</td>
                  <td>{t.status}</td>
                  <td>{t.notes}</td>
                  <td>{t.status === 'Open' && <button className="btn" onClick={() => complete(t.id)}>Mark done</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
