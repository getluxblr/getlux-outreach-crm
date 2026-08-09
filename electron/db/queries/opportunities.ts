import { getDb } from '../index';
import { newId, nowIso } from './ids';

export interface OpportunityInput {
  contact_id?: string | null;
  company_id?: string | null;
  stage?: string;
  deal_value_estimate?: number | null;
  proposal_status?: string | null;
  meeting_status?: string | null;
  meeting_date?: string | null;
  outcome?: string | null;
  notes?: string | null;
}

export function listOpportunities(): any[] {
  return getDb().prepare('SELECT * FROM opportunities ORDER BY updated_at DESC').all();
}

export function createOpportunity(input: OpportunityInput): string {
  const id = newId();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO opportunities (
        id, contact_id, company_id, stage, deal_value_estimate, proposal_status,
        meeting_status, meeting_date, outcome, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.contact_id ?? null,
      input.company_id ?? null,
      input.stage ?? 'Proposal Requested',
      input.deal_value_estimate ?? null,
      input.proposal_status ?? null,
      input.meeting_status ?? null,
      input.meeting_date ?? null,
      input.outcome ?? null,
      input.notes ?? null,
      now,
      now,
    );
  return id;
}

export function updateOpportunity(id: string, fields: Partial<OpportunityInput>): void {
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
  db.prepare(`UPDATE opportunities SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
}
