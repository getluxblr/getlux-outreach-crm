import React, { useState } from 'react';
import { api } from '../api';

export default function ExportBackup(): JSX.Element {
  const [status, setStatus] = useState<string | null>(null);

  const exportContacts = async () => {
    const result = await api.exportData.contactsCsv();
    setStatus(result.saved ? `Saved ${result.rowCount} contacts to ${result.filePath}` : 'Export cancelled.');
  };

  const exportMessages = async () => {
    const result = await api.exportData.messagesCsv();
    setStatus(result.saved ? `Saved ${result.rowCount} messages to ${result.filePath}` : 'Export cancelled.');
  };

  return (
    <div>
      <h1>Data Export &amp; Backup</h1>
      <p className="page-subtitle">Export real data to CSV files on disk. The SQLite database itself is your full backup.</p>
      <div className="panel">
        <div className="toolbar">
          <button className="btn btn-primary" onClick={exportContacts}>Export Contacts (CSV)</button>
          <button className="btn btn-primary" onClick={exportMessages}>Export Outreach Messages (CSV)</button>
        </div>
        {status && <p>{status}</p>}
      </div>
      <div className="panel">
        <h2>outreach-state.json</h2>
        <p>
          A portable queue-progress backup format is documented in <code>outreach-state.example.json</code> at the
          project root. The SQLite database remains the source of truth; this file only tracks batch queue progress
          for resuming.
        </p>
      </div>
    </div>
  );
}
