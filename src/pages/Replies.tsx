import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Replies(): JSX.Element {
  const [replies, setReplies] = useState<any[]>([]);
  const [contactId, setContactId] = useState('');
  const [text, setText] = useState('');

  const load = () => api.replies.list().then(setReplies);

  useEffect(() => { load(); }, []);

  const logReply = async () => {
    if (!contactId || !text) return;
    await api.replies.create(contactId, null, text);
    setText('');
    load();
  };

  const review = async (id: string) => {
    await api.replies.markReviewed(id);
    load();
  };

  return (
    <div>
      <h1>Replies Inbox</h1>
      <p className="page-subtitle">
        Log a reply text you received manually. Classification below is a keyword heuristic ("AI-assisted" stand-in)
        — it never auto-changes CRM stage; you must review it yourself.
      </p>

      <div className="panel">
        <div className="toolbar">
          <input type="text" placeholder="Contact ID" value={contactId} onChange={(e) => setContactId(e.target.value)} />
        </div>
        <textarea placeholder="Paste the reply text…" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-primary" onClick={logReply}>Log reply</button>
        </div>
      </div>

      <div className="panel">
        {replies.length === 0 && <div className="empty-state">No replies logged yet.</div>}
        {replies.length > 0 && (
          <table>
            <thead><tr><th>Contact</th><th>Category</th><th>Sentiment</th><th>Confidence</th><th>Reviewed</th><th>Text</th><th></th></tr></thead>
            <tbody>
              {replies.map((r) => (
                <tr key={r.id}>
                  <td>{r.contact_id}</td>
                  <td>{r.category}</td>
                  <td>{r.sentiment}</td>
                  <td>{(r.confidence * 100).toFixed(0)}%</td>
                  <td>{r.reviewed ? 'Yes' : 'No'}</td>
                  <td style={{ maxWidth: 320 }}>{r.reply_text}</td>
                  <td>{!r.reviewed && <button className="btn" onClick={() => review(r.id)}>Mark reviewed</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
