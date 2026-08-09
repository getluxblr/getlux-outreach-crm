import { getDb } from '../index';
import { newId, nowIso } from './ids';

export interface CompanyInput {
  name: string;
  industry?: string | null;
  company_type?: string | null;
  location?: string | null;
  website?: string | null;
  linkedin_company_url?: string | null;
  account_owner?: string | null;
  notes?: string | null;
  service_requirement?: string | null;
  proposal_status?: string | null;
  deal_value_estimate?: number | null;
  pipeline_stage?: string | null;
}

export function listCompanies(search?: string): any[] {
  const db = getDb();
  if (search) {
    return db
      .prepare('SELECT * FROM companies WHERE name LIKE ? ORDER BY updated_at DESC')
      .all(`%${search}%`);
  }
  return db.prepare('SELECT * FROM companies ORDER BY updated_at DESC').all();
}

export function getCompany(id: string): any {
  return getDb().prepare('SELECT * FROM companies WHERE id = ?').get(id);
}

export function createCompany(input: CompanyInput): string {
  const id = newId();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO companies (
        id, name, industry, company_type, location, website, linkedin_company_url,
        account_owner, notes, service_requirement, proposal_status, deal_value_estimate,
        pipeline_stage, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.name,
      input.industry ?? null,
      input.company_type ?? null,
      input.location ?? null,
      input.website ?? null,
      input.linkedin_company_url ?? null,
      input.account_owner ?? null,
      input.notes ?? null,
      input.service_requirement ?? null,
      input.proposal_status ?? null,
      input.deal_value_estimate ?? null,
      input.pipeline_stage ?? null,
      now,
      now,
    );
  return id;
}

export function updateCompany(id: string, fields: Partial<CompanyInput>): void {
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
  db.prepare(`UPDATE companies SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
}

export function deleteCompany(id: string): void {
  getDb().prepare('DELETE FROM companies WHERE id = ?').run(id);
}
