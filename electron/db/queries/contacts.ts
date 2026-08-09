import { getDb } from '../index';
import { newId, nowIso } from './ids';
import { normalizeLinkedInUrl } from '../../../shared/linkedinUrl';
import type { Contact } from '../../../shared/types';

export interface ContactFilters {
  search?: string;
  pipelineStage?: string;
  campaignId?: string;
  qualifiedOnly?: boolean;
  doNotContact?: boolean;
}

export function listContacts(filters: ContactFilters = {}): Contact[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: any[] = [];

  if (filters.search) {
    clauses.push('(full_name LIKE ? OR csv_company LIKE ? OR verified_current_company LIKE ? OR linkedin_url LIKE ?)');
    const like = `%${filters.search}%`;
    params.push(like, like, like, like);
  }
  if (filters.pipelineStage) {
    clauses.push('crm_pipeline_stage = ?');
    params.push(filters.pipelineStage);
  }
  if (filters.campaignId) {
    clauses.push('campaign_id = ?');
    params.push(filters.campaignId);
  }
  if (filters.qualifiedOnly) {
    clauses.push("qualification_reason IS NOT NULL AND qualification_reason != ''");
  }
  if (filters.doNotContact !== undefined) {
    clauses.push('do_not_contact_flag = ?');
    params.push(filters.doNotContact ? 1 : 0);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT * FROM contacts ${where} ORDER BY created_at DESC`;
  return db.prepare(sql).all(...params) as Contact[];
}

export function getContact(id: string): Contact | undefined {
  return getDb().prepare('SELECT * FROM contacts WHERE id = ?').get(id) as Contact | undefined;
}

export function findByNormalizedUrl(normalizedUrl: string): Contact | undefined {
  return getDb()
    .prepare('SELECT * FROM contacts WHERE linkedin_url_normalized = ?')
    .get(normalizedUrl) as Contact | undefined;
}

export interface UpsertContactInput {
  full_name: string;
  linkedin_url: string;
  csv_company?: string | null;
  csv_position?: string | null;
  email?: string | null;
  phone?: string | null;
  connected_on?: string | null;
  source_filename?: string | null;
  qualification_reason?: string | null;
  crm_pipeline_stage?: string;
}

export type ImportOutcome = 'imported' | 'updated' | 'duplicate' | 'invalid';

export function upsertContactFromImport(
  input: UpsertContactInput,
): { outcome: ImportOutcome; id: string | null } {
  const db = getDb();

  if (!input.full_name || !input.linkedin_url) {
    return { outcome: 'invalid', id: null };
  }

  const normalized = normalizeLinkedInUrl(input.linkedin_url);
  if (!normalized) {
    return { outcome: 'invalid', id: null };
  }

  const existing = findByNormalizedUrl(normalized);
  const now = nowIso();

  if (existing) {
    db.prepare(
      `UPDATE contacts SET
        full_name = ?, csv_company = ?, csv_position = ?, email = COALESCE(?, email),
        phone = COALESCE(?, phone), connected_on = COALESCE(?, connected_on),
        source_filename = ?, imported_at = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      input.full_name,
      input.csv_company ?? existing.csv_company,
      input.csv_position ?? existing.csv_position,
      input.email ?? null,
      input.phone ?? null,
      input.connected_on ?? null,
      input.source_filename ?? existing.source_filename,
      now,
      now,
      existing.id,
    );
    return { outcome: 'updated', id: existing.id };
  }

  const id = newId();
  db.prepare(
    `INSERT INTO contacts (
      id, full_name, linkedin_url, linkedin_url_normalized, csv_company, csv_position,
      email, phone, connected_on, source_filename, imported_at,
      qualification_reason, crm_pipeline_stage, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.full_name,
    input.linkedin_url,
    normalized,
    input.csv_company ?? null,
    input.csv_position ?? null,
    input.email ?? null,
    input.phone ?? null,
    input.connected_on ?? null,
    input.source_filename ?? null,
    now,
    input.qualification_reason ?? null,
    input.crm_pipeline_stage ?? 'Imported',
    now,
    now,
  );
  return { outcome: 'imported', id };
}

export function updateContact(id: string, fields: Partial<Contact>): void {
  const db = getDb();
  const existing = getContact(id);
  if (!existing) throw new Error('Contact not found');

  const allowed: (keyof Contact)[] = [
    'full_name', 'linkedin_url', 'linkedin_profile_id', 'profile_picture_url',
    'csv_company', 'csv_position', 'verified_current_company', 'verified_current_title',
    'pronouns_found', 'greeting_selected', 'qualification_reason', 'connection_degree',
    'message_availability', 'contact_status', 'crm_pipeline_stage',
    'batch_number', 'message_variation_used', 'full_sent_message', 'sent_at', 'reply_at',
    'latest_reply_text', 'reply_sentiment_status', 'interest_level', 'proposal_status',
    'meeting_status', 'follow_up_date', 'assigned_owner', 'notes', 'do_not_contact_flag',
    'existing_conversation_flag', 'failure_skip_reason', 'email', 'phone',
  ];

  const setClauses: string[] = [];
  const params: any[] = [];
  for (const key of allowed) {
    if (key in fields) {
      setClauses.push(`${key} = ?`);
      params.push((fields as any)[key]);
    }
  }
  if (setClauses.length === 0) return;
  setClauses.push('updated_at = ?');
  params.push(nowIso());
  params.push(id);

  db.prepare(`UPDATE contacts SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
}

export function deleteContact(id: string): void {
  getDb().prepare('DELETE FROM contacts WHERE id = ?').run(id);
}

export function countContactsByStage(): Record<string, number> {
  const rows = getDb()
    .prepare('SELECT crm_pipeline_stage as stage, COUNT(*) as count FROM contacts GROUP BY crm_pipeline_stage')
    .all() as { stage: string; count: number }[];
  const result: Record<string, number> = {};
  for (const row of rows) result[row.stage] = row.count;
  return result;
}
