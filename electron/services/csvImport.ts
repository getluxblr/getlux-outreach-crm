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
    });

    tally(summary, outcome);
  }

  logActivity('csv_import', `Imported ${sourceFilename}`, { metadata: summary });

  return summary;
}

function tally(summary: ImportSummary, outcome: ImportOutcome): void {
  if (outcome === 'imported') summary.imported++;
  else if (outcome === 'updated') summary.updated++;
  else if (outcome === 'duplicate') summary.duplicates++;
  else summary.invalid++;
}
