import React, { useState } from 'react';
import { api } from '../api';

const FIELD_OPTIONS = [
  { key: 'fullName', label: 'Full Name (single column)' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'linkedinUrl', label: 'LinkedIn URL (required)' },
  { key: 'company', label: 'Company' },
  { key: 'position', label: 'Position' },
  { key: 'connectedOn', label: 'Connected On' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
];

export default function ImportCsv(): JSX.Element {
  const [filename, setFilename] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [detectedLinkedInExport, setDetectedLinkedInExport] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'Connected' | 'Not Connected'>('Not Connected');
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const pickFile = async () => {
    setError(null);
    try {
      const result = await api.csv.openAndRead();
      if (!result) return;
      setFilename(result.filename);
      setContent(result.content);
      const preview = await api.csv.preview(result.content);
      setHeaders(preview.headers);
      setPreviewRows(preview.rows);
      setSummary(null);

      // Detect LinkedIn's own official "Connections" data-export format
      // (First Name, Last Name, URL, Email Address, Company, Position,
      // Connected On) — case-insensitively — vs. a generic prospect list.
      const detection = await api.csv.detectLinkedInExport(preview.headers);
      setDetectedLinkedInExport(detection.isLinkedInExport);

      if (detection.isLinkedInExport && detection.mapping) {
        setMapping(detection.mapping);
        setConnectionStatus('Connected');
      } else {
        // Best-effort auto-mapping for a generic prospect list (not yet connected).
        const auto: Record<string, string> = {};
        const find = (needle: string) => preview.headers.find((h) => h.toLowerCase().includes(needle));
        auto.firstName = find('first name') || '';
        auto.lastName = find('last name') || '';
        auto.linkedinUrl = find('url') || find('linkedin') || '';
        auto.company = find('company') || '';
        auto.position = find('position') || '';
        auto.connectedOn = find('connected on') || '';
        auto.email = find('email') || '';
        setMapping(auto);
        setConnectionStatus('Not Connected');
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const runImport = async () => {
    setError(null);
    if (!mapping.linkedinUrl) {
      setError('You must map a LinkedIn URL column before importing.');
      return;
    }
    try {
      const result = await api.csv.import(content, mapping, filename, connectionStatus);
      setSummary(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h1>Import CSV</h1>
      <p className="page-subtitle">
        Import either LinkedIn's own official <strong>Connections</strong> data export (Settings &amp; Privacy → Data
        Privacy → Get a copy of your data), or a generic prospect list you're not yet connected to. Nothing here
        talks to linkedin.com, logs into LinkedIn, or scrapes anything — this only reads a local file you choose and
        that you already downloaded yourself.
      </p>

      <div className="panel">
        <div className="toolbar">
          <button className="btn btn-primary" onClick={pickFile}>Choose CSV file…</button>
          {filename && <span>{filename}</span>}
        </div>
        {headers.length > 0 && (
          <p>
            {detectedLinkedInExport ? (
              <span className="badge badge-success">
                Detected LinkedIn Connections export format — these contacts will be marked "Connected"
              </span>
            ) : (
              <span className="badge badge-info">
                Detected a generic prospect list — these contacts will be marked "Not Connected"
              </span>
            )}
          </p>
        )}
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      </div>

      {headers.length > 0 && (
        <div className="panel">
          <h2>Field mapping</h2>
          <div className="card-grid">
            {FIELD_OPTIONS.map((f) => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{f.label}</label>
                <select
                  value={mapping[f.key] || ''}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                >
                  <option value="">— none —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
              Connection status for these contacts
            </label>
            <select value={connectionStatus} onChange={(e) => setConnectionStatus(e.target.value as any)}>
              <option value="Not Connected">Not Connected (drafts will use Invitation Note templates)</option>
              <option value="Connected">Connected (drafts will use Connection Message templates)</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={runImport}>Import</button>
        </div>
      )}

      {previewRows.length > 0 && (
        <div className="panel">
          <h2>Preview (first {previewRows.length} rows)</h2>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i}>
                    {headers.map((h) => <td key={h}>{row[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {summary && (
        <div className="panel">
          <h2>Import summary</h2>
          <div className="card-grid">
            <div className="metric-card"><div className="metric-value">{summary.imported}</div><div className="metric-label">Imported</div></div>
            <div className="metric-card"><div className="metric-value">{summary.updated}</div><div className="metric-label">Updated</div></div>
            <div className="metric-card"><div className="metric-value">{summary.duplicates}</div><div className="metric-label">Duplicates</div></div>
            <div className="metric-card"><div className="metric-value">{summary.invalid}</div><div className="metric-label">Invalid</div></div>
            <div className="metric-card"><div className="metric-value">{summary.skipped}</div><div className="metric-label">Skipped</div></div>
            <div className="metric-card"><div className="metric-value">{summary.total}</div><div className="metric-label">Total Rows</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
