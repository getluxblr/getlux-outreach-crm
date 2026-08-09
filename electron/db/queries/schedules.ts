import { getDb } from '../index';
import { nowIso } from './ids';
import { computeNextRunAt } from '../../../shared/schedule';

export function getSchedule(): any {
  return getDb().prepare('SELECT * FROM schedules ORDER BY created_at ASC LIMIT 1').get();
}

export function updateSchedule(fields: Partial<{ enabled: number; timezone: string; schedule_time: string; batch_size: number; max_per_day: number; last_run_at: string }>): any {
  const db = getDb();
  const current = getSchedule();
  if (!current) throw new Error('No schedule row found');

  const setClauses: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`);
    params.push(value);
  }

  const merged = { ...current, ...fields };
  const nextRunAt = computeNextRunAt(
    {
      enabled: !!merged.enabled,
      timezone: merged.timezone,
      scheduleTime: merged.schedule_time,
      lastRunAt: merged.last_run_at ?? null,
    },
  );

  setClauses.push('next_run_at = ?');
  params.push(nextRunAt);
  setClauses.push('updated_at = ?');
  params.push(nowIso());
  params.push(current.id);

  db.prepare(`UPDATE schedules SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
  return getSchedule();
}
