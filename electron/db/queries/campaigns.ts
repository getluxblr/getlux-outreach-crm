import { getDb } from '../index';
import { newId, nowIso } from './ids';
import { calcReplyRate, calcPositiveReplyRate, calcCampaignConversionRate } from '../../../shared/pipeline';

export interface CampaignInput {
  name: string;
  description?: string | null;
  target_criteria?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  notes?: string | null;
}

export function listCampaigns(): any[] {
  return getDb().prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
}

export function getCampaign(id: string): any {
  return getDb().prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
}

export function createCampaign(input: CampaignInput): string {
  const id = newId();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO campaigns (id, name, description, target_criteria, start_date, end_date, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.name,
      input.description ?? null,
      input.target_criteria ?? null,
      input.start_date ?? null,
      input.end_date ?? null,
      input.status ?? 'Active',
      input.notes ?? null,
      now,
      now,
    );
  return id;
}

export function updateCampaign(id: string, fields: Partial<CampaignInput>): void {
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
  db.prepare(`UPDATE campaigns SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
}

export function deleteCampaign(id: string): void {
  getDb().prepare('DELETE FROM campaigns WHERE id = ?').run(id);
}

export function getCampaignPerformance(campaignId: string) {
  const db = getDb();
  const sent = (db
    .prepare("SELECT COUNT(*) as c FROM outreach_messages WHERE campaign_id = ? AND status = 'Sent (mock)'")
    .get(campaignId) as any).c;
  const replies = (db
    .prepare('SELECT COUNT(*) as c FROM replies r JOIN contacts c ON c.id = r.contact_id WHERE c.campaign_id = ?')
    .get(campaignId) as any).c;
  const positiveReplies = (db
    .prepare(
      "SELECT COUNT(*) as c FROM replies r JOIN contacts c ON c.id = r.contact_id WHERE c.campaign_id = ? AND r.category = 'Positive/Interested'",
    )
    .get(campaignId) as any).c;
  const proposalsRequested = (db
    .prepare("SELECT COUNT(*) as c FROM opportunities o JOIN contacts c ON c.id = o.contact_id WHERE c.campaign_id = ? AND o.stage IN ('Proposal Requested','Proposal Sent')")
    .get(campaignId) as any).c;
  const won = (db
    .prepare("SELECT COUNT(*) as c FROM opportunities o JOIN contacts c ON c.id = o.contact_id WHERE c.campaign_id = ? AND o.outcome = 'Won'")
    .get(campaignId) as any).c;
  const lost = (db
    .prepare("SELECT COUNT(*) as c FROM opportunities o JOIN contacts c ON c.id = o.contact_id WHERE c.campaign_id = ? AND o.outcome = 'Lost'")
    .get(campaignId) as any).c;

  return {
    sent,
    replies,
    positiveReplies,
    proposalsRequested,
    won,
    lost,
    replyRate: calcReplyRate(replies, sent),
    positiveReplyRate: calcPositiveReplyRate(positiveReplies, sent),
    conversionRate: calcCampaignConversionRate(positiveReplies, sent),
  };
}
