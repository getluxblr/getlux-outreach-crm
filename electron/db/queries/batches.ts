import { getDb } from '../index';
import { newId, nowIso } from './ids';

export interface CreateBatchInput {
  campaign_id?: string | null;
  batch_size: number;
}

export function createBatchRun(input: CreateBatchInput): string {
  const id = newId();
  getDb()
    .prepare(
      `INSERT INTO batch_runs (id, campaign_id, batch_size, status, log, created_at)
       VALUES (?, ?, ?, 'Pending', '[]', ?)`,
    )
    .run(id, input.campaign_id ?? null, input.batch_size, nowIso());
  return id;
}

export function startBatchRun(id: string): void {
  getDb().prepare("UPDATE batch_runs SET status = 'Running', started_at = ? WHERE id = ?").run(nowIso(), id);
}

export function appendBatchLog(id: string, entry: any): void {
  const db = getDb();
  const row = db.prepare('SELECT log FROM batch_runs WHERE id = ?').get(id) as { log: string } | undefined;
  const log = row?.log ? JSON.parse(row.log) : [];
  log.push({ ...entry, at: nowIso() });
  db.prepare('UPDATE batch_runs SET log = ? WHERE id = ?').run(JSON.stringify(log), id);
}

export function updateBatchCounters(
  id: string,
  counters: Partial<{ sent_count: number; reply_count: number; skipped_count: number; failed_count: number }>,
): void {
  const db = getDb();
  const setClauses: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(counters)) {
    setClauses.push(`${key} = ?`);
    params.push(value);
  }
  if (setClauses.length === 0) return;
  params.push(id);
  db.prepare(`UPDATE batch_runs SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
}

export function finishBatchRun(id: string, status: 'Stopped' | 'Completed' | 'Failed', stopReason?: string): void {
  getDb()
    .prepare('UPDATE batch_runs SET status = ?, stop_reason = ?, ended_at = ? WHERE id = ?')
    .run(status, stopReason ?? null, nowIso(), id);
}

export function getBatchRun(id: string): any {
  return getDb().prepare('SELECT * FROM batch_runs WHERE id = ?').get(id);
}

export function listBatchRuns(): any[] {
  return getDb().prepare('SELECT * FROM batch_runs ORDER BY created_at DESC').all();
}
