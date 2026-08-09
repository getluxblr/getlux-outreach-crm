import { getDb } from '../index';
import { newId, nowIso } from './ids';
import { classifyReply } from '../../../shared/replyClassifier';

export function listReplies(): any[] {
  return getDb().prepare('SELECT * FROM replies ORDER BY received_at DESC').all();
}

export function createReply(contactId: string, outreachMessageId: string | null, text: string): string {
  const classification = classifyReply(text);
  const id = newId();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO replies (
        id, contact_id, outreach_message_id, reply_text, category, sentiment, confidence,
        requires_user_review, reviewed, received_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
    )
    .run(
      id,
      contactId,
      outreachMessageId,
      text,
      classification.category,
      classification.sentiment,
      classification.confidence,
      now,
      now,
    );

  getDb()
    .prepare('UPDATE contacts SET latest_reply_text = ?, reply_at = ?, reply_sentiment_status = ?, updated_at = ? WHERE id = ?')
    .run(text, now, classification.sentiment, now, contactId);

  return id;
}

export function markReplyReviewed(id: string): void {
  getDb().prepare('UPDATE replies SET reviewed = 1 WHERE id = ?').run(id);
}
