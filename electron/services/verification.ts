import { getDb } from '../db';
import { newId, nowIso } from '../db/queries/ids';
import { getContact, updateContact } from '../db/queries/contacts';
import { linkedInAdapter } from './linkedin/mockAdapter';
import { logActivity } from '../db/queries/activity';

const BLOCK_REASON_MESSAGES: Record<string, string> = {
  CAPTCHA: 'LinkedIn displayed a verification or CAPTCHA screen. Batch stopped safely.',
  LOGIN_REQUIRED: 'LinkedIn login is required. Please sign in and try again.',
  RATE_LIMIT: 'Messaging limit reached. Batch stopped; try again later.',
  RESTRICTION: 'Message button is unavailable for this profile. Contact skipped.',
  UNCLEAR_PROFILE: 'Current employer could not be verified. Contact skipped.',
};

export async function verifyContact(contactId: string): Promise<any> {
  const contact = getContact(contactId);
  if (!contact) throw new Error('Contact not found');

  const result = await linkedInAdapter.verifyProfile(contact.linkedin_url);
  const db = getDb();
  const id = newId();

  db.prepare(
    `INSERT INTO profile_verifications (
      id, contact_id, verified_at, status, verified_company, verified_title,
      message_button_available, existing_conversation_found, block_reason, mock_result_payload, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    contactId,
    nowIso(),
    result.status,
    result.profile?.currentCompany ?? null,
    result.profile?.currentTitle ?? null,
    result.profile ? (result.profile.messageButtonAvailable ? 1 : 0) : null,
    result.profile ? (result.profile.existingConversationFound ? 1 : 0) : 0,
    result.blockReason,
    JSON.stringify(result),
    nowIso(),
  );

  if (result.status === 'Verified' && result.profile) {
    updateContact(contactId, {
      verified_current_company: result.profile.currentCompany,
      verified_current_title: result.profile.currentTitle,
      connection_degree: result.profile.connectionDegree,
      message_availability: result.profile.messageButtonAvailable ? 'Available' : 'Unavailable',
      crm_pipeline_stage: result.profile.existingConversationFound ? 'Existing Conversation' : 'Verified',
      existing_conversation_flag: result.profile.existingConversationFound ? 1 : 0,
    });
    logActivity('profile_verified', `Verified profile for ${contact.full_name}`, { contactId });
  } else {
    const reasonMessage = result.blockReason ? BLOCK_REASON_MESSAGES[result.blockReason] : 'Verification failed.';
    updateContact(contactId, {
      crm_pipeline_stage: 'Skipped',
      failure_skip_reason: reasonMessage,
    });
    logActivity('profile_verification_failed', reasonMessage, { contactId, metadata: result });
  }

  return result;
}
