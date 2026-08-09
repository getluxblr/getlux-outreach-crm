import { getDb } from '../index';
import { newId, nowIso } from './ids';

export interface CreateMessageInput {
  contact_id: string;
  campaign_id?: string | null;
  batch_run_id?: string | null;
  template_id?: string | null;
  greeting_used?: string | null;
  company_used?: string | null;
  final_message: string;
  status?: string;
}

export function listMessages(contactId?: string): any[] {
  const db = getDb();
  if (contactId) {
    return db
      .prepare('SELECT * FROM outreach_messages WHERE contact_id = ? ORDER BY created_at DESC')
      .all(contactId);
  }
  return db.prepare('SELECT * FROM outreach_messages ORDER BY created_at DESC').all();
}

export function createMessage(input: CreateMessageInput): string {
  const id = newId();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO outreach_messages (
        id, contact_id, campaign_id, batch_run_id, template_id, greeting_used, company_used,
        final_message, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.contact_id,
      input.campaign_id ?? null,
      input.batch_run_id ?? null,
      input.template_id ?? null,
      input.greeting_used ?? null,
      input.company_used ?? null,
      input.final_message,
      input.status ?? 'Draft',
      now,
    );
  return id;
}

export function markMessageSent(id: string, mockSendResult: string): void {
  getDb()
    .prepare("UPDATE outreach_messages SET status = 'Sent (mock)', mock_send_result = ?, sent_at = ? WHERE id = ?")
    .run(mockSendResult, nowIso(), id);
}

export function markMessageFailed(id: string, mockSendResult: string): void {
  getDb()
    .prepare("UPDATE outreach_messages SET status = 'Failed', mock_send_result = ? WHERE id = ?")
    .run(mockSendResult, id);
}

// Used by the copy-to-clipboard draft workflow: the user copied the draft
// and pasted/sent it themselves inside their own LinkedIn tab, then came
// back and explicitly clicked "Mark as Sent". This never fires
// automatically and never touches linkedin.com.
export function markMessageManualSent(id: string): void {
  getDb()
    .prepare("UPDATE outreach_messages SET status = 'Sent (Manual)', sent_at = ? WHERE id = ?")
    .run(nowIso(), id);
}

// Used when the user copies a draft to their clipboard, before they've
// confirmed sending it.
export function markMessageDraftCopied(id: string): void {
  getDb()
    .prepare("UPDATE outreach_messages SET status = 'Draft Copied' WHERE id = ?")
    .run(id);
}
