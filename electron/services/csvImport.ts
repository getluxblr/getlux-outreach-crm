import Papa from 'papaparse';
import { upsertContactFromImport, ImportOutcome } from '../db/queries/contacts';
import { isQualified } from '../../shared/qualification';
import { logActivity } from '../db/queries/activity';

export interface CsvFieldMapping {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  linkedinUrl: string;
  company?: string;
  position?: string;
  connectedOn?: string;
  email?: string;
  phone?: string;
}

export interface ImportSummary {
  imported: number;
  updated: number;
  duplicates: number;
  invalid: number;
  skipped: number;
  total: number;
}

// Column names (case-insensitive, exact) used by LinkedIn's own official
// self-service data export (Settings & Privacy -> Data Privacy -> Get a
// copy of your data -> "Connections"). Detecting this format lets Import
// CSV auto-map columns and mark these contacts connectionStatus =
// 'Connected'. This only ever reads a file the user has already downloaded
// themselves from LinkedIn's export tool — nothing here logs into or
// scrapes linkedin.com.
const LINKEDIN_EXPORT_HEADERS = ['first name', 'last name', 'url', 'company', 'position', 'connected on'];

/**
 * detectLinkedInExportFormat
 *
 * Returns true if the given CSV headers look like LinkedIn's official
 * Connections.csv export (case-insensitive match on the known column set).
 */
export function detectLinkedInExportFormat(headers: string[]): boolean {
  const lower = headers.map((h) => h.trim().toLowerCase());
  return LINKEDIN_EXPORT_HEADERS.every((needed) => lower.includes(needed));
}

/**
 * autoMapLinkedInExport
 *
 * Builds a CsvFieldMapping for a detected LinkedIn Connections.csv export,
 * matching headers case-insensitively.
 */
export function autoMapLinkedInExport(headers: string[]): CsvFieldMapping {
  const find = (needle: string) => headers.find((h) => h.trim().toLowerCase() === needle) || '';
  return {
    firstName: find('first name'),
    lastName: find('last name'),
    linkedinUrl: find('url'),
    company: find('company'),
    position: find('position'),
    connectedOn: find('connected on'),
    email: find('email address') || find('email'),
  };
}

export function parseCsv(content: string): { headers: string[]; rows: Record<string, string>[] } {
  // LinkedIn's Connections.csv export has a few notes lines before the real
  // header row; skip any leading lines that don't look like the header.
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });
  const headers = parsed.meta.fields || [];
  return { headers, rows: parsed.data };
}

export function previewCsv(content: string, limit = 20): { headers: string[]; rows: Record<string, string>[] } {
  const { headers, rows } = parseCsv(content);
  return { headers, rows: rows.slice(0, limit) };
}

export function importCsv(
  content: string,
  mapping: CsvFieldMapping,
  sourceFilename: string,
  connectionStatus: 'Connected' | 'Not Connected' = 'Not Connected',
): ImportSummary {
  const { rows } = parseCsv(content);

  const summary: ImportSummary = { imported: 0, updated: 0, duplicates: 0, invalid: 0, skipped: 0, total: rows.length };

  for (const row of rows) {
    const linkedin_url = mapping.linkedinUrl ? row[mapping.linkedinUrl] : '';
    let full_name = '';
    if (mapping.fullName) {
      full_name = row[mapping.fullName] || '';
    } else {
      const first = mapping.firstName ? row[mapping.firstName] || '' : '';
      const last = mapping.lastName ? row[mapping.lastName] || '' : '';
      full_name = `${first} ${last}`.trim();
    }
    const csv_company = mapping.company ? row[mapping.company] || null : null;
    const csv_position = mapping.position ? row[mapping.position] || null : null;
    const email = mapping.email ? row[mapping.email] || null : null;
    const phone = mapping.phone ? row[mapping.phone] || null : null;
    const connected_on = mapping.connectedOn ? row[mapping.connectedOn] || null : null;

    if (!full_name || !linkedin_url) {
      summary.invalid++;
      continue;
    }

    const qualification = isQualified(csv_position, '', csv_company);

    const { outcome } = upsertContactFromImport({
      full_name,
      linkedin_url,
      csv_company,
      csv_position,
      email,
      phone,
      connected_on,
      source_filename: sourceFilename,
      qualification_reason: qualification.qualified ? qualification.reason : null,
      crm_pipeline_stage: qualification.qualified ? 'Qualified' : 'Imported',
      contact_status: connectionStatus,
    });

    tally(summary, outcome);
  }

  logActivity('csv_import', `Imported ${sourceFilename}`, { metadata: summary });

  return summary;
}

export interface ManualContactInput {
  full_name: string;
  linkedin_url?: string | null;
  company?: string | null;
  position?: string | null;
  pronouns_found?: string | null; // 'He/Him' | 'She/Her' | null — explicit only, never inferred
  connection_status?: 'Connected' | 'Not Connected';
}

/**
 * createManualContact
 *
 * Adds a single contact from the Contacts screen's "Add Connection" quick
 * form — reuses the exact same upsertContactFromImport()/isQualified()
 * logic a CSV import row uses (dedupe by normalized LinkedIn URL,
 * qualification keyword match, default pipeline stage) so there is no
 * separate create-contact code path. This never talks to linkedin.com;
 * the LinkedIn URL is only stored for later use by the "Connect on
 * LinkedIn" button, which just opens a normal browser tab.
 */
export function createManualContact(input: ManualContactInput): { outcome: ImportOutcome; id: string | null } {
  const full_name = (input.full_name || '').trim();
  const csv_company = input.company?.trim() || null;
  const csv_position = input.position?.trim() || null;
  const linkedin_url = (input.linkedin_url || '').trim();
  const connection_status = input.connection_status || 'Connected';

  const qualification = isQualified(csv_position, '', csv_company);

  const result = upsertContactFromImport({
    full_name,
    linkedin_url,
    csv_company,
    csv_position,
    source_filename: 'Manual entry (Add Connection)',
    qualification_reason: qualification.qualified ? qualification.reason : null,
    crm_pipeline_stage: qualification.qualified ? 'Qualified' : 'Imported',
    contact_status: connection_status,
    pronouns_found: input.pronouns_found ?? null,
  });

  if (result.id) {
    logActivity('manual_contact_add', `Added connection: ${full_name}`, { contactId: result.id });
  }

  return result;
}

function tally(summary: ImportSummary, outcome: ImportOutcome): void {
  if (outcome === 'imported') summary.imported++;
  else if (outcome === 'updated') summary.updated++;
  else if (outcome === 'duplicate') summary.duplicates++;
  else summary.invalid++;
}
