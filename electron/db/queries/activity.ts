import { getDb } from '../index';
import { newId, nowIso } from './ids';

export function logActivity(
  eventType: string,
  description: string,
  opts: { contactId?: string | null; companyId?: string | null; metadata?: any } = {},
): string {
  const id = newId();
  getDb()
    .prepare(
      `INSERT INTO activity_log (id, contact_id, company_id, event_type, description, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      opts.contactId ?? null,
      opts.companyId ?? null,
      eventType,
      description,
      opts.metadata ? JSON.stringify(opts.metadata) : null,
      nowIso(),
    );
  return id;
}

export function listActivity(limit = 500): any[] {
  return getDb().prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?').all(limit);
}
