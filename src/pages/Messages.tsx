import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Messages(): JSX.Element {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => { api.messages.list().then(setMessages); }, []);

  return (
    <div>
      <h1>Messages &amp; Conversation History</h1>
      <p className="page-subtitle">Every drafted/sent (mock) outreach message, exactly as recorded.</p>
      <div className="panel">
        {messages.length === 0 && <div className="empty-state">No messages yet. Run a batch from Batch Review &amp; Send.</div>}
        {messages.length > 0 && (
          <table>
            <thead><tr><th>Contact</th><th>Status</th><th>Sent at</th><th>Message</th></tr></thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id}>
                  <td>{m.contact_id}</td>
                  <td>{m.status}</td>
                  <td>{m.sent_at}</td>
                  <td style={{ whiteSpace: 'pre-wrap', maxWidth: 480 }}>{m.final_message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
