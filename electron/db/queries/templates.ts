import { getDb } from '../index';
import { newId, nowIso } from './ids';

export function listTemplates(): any[] {
  return getDb().prepare('SELECT * FROM message_templates ORDER BY created_at ASC').all();
}

export function getTemplate(id: string): any {
  return getDb().prepare('SELECT * FROM message_templates WHERE id = ?').get(id);
}

export function createTemplate(name: string, body: string): string {
  const id = newId();
  const now = nowIso();
  getDb()
    .prepare('INSERT INTO message_templates (id, name, body, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)')
    .run(id, name, body, now, now);
  return id;
}

export function updateTemplate(id: string, fields: { name?: string; body?: string; is_active?: number }): void {
  const db = getDb();
  const setClauses: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`);
    params.push(value);
  }
  if (setClauses.length === 0) return;
  setClauses.push('updated_at = ?');
  params.push(nowIso());
  params.push(id);
  db.prepare(`UPDATE message_templates SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
}

export function deleteTemplate(id: string): void {
  getDb().prepare('DELETE FROM message_templates WHERE id = ?').run(id);
}
