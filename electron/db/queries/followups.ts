import { getDb } from '../index';
import { newId, nowIso } from './ids';

export interface FollowUpInput {
  contact_id?: string | null;
  company_id?: string | null;
  due_date: string;
  notes?: string | null;
}

export function listFollowUps(): any[] {
  return getDb().prepare('SELECT * FROM follow_up_tasks ORDER BY due_date ASC').all();
}

export function listFollowUpsDueToday(): any[] {
  const today = new Date().toISOString().slice(0, 10);
  return getDb()
    .prepare("SELECT * FROM follow_up_tasks WHERE due_date LIKE ? AND status = 'Open'")
    .all(`${today}%`);
}

export function createFollowUp(input: FollowUpInput): string {
  const id = newId();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO follow_up_tasks (id, contact_id, company_id, due_date, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'Open', ?, ?, ?)`,
    )
    .run(id, input.contact_id ?? null, input.company_id ?? null, input.due_date, input.notes ?? null, now, now);
  return id;
}

export function updateFollowUp(id: string, fields: Partial<{ status: string; notes: string; outcome: string; due_date: string }>): void {
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
  db.prepare(`UPDATE follow_up_tasks SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
}
