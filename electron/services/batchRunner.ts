import { BrowserWindow } from 'electron';
import { linkedInAdapter } from './linkedin/mockAdapter';
import { getContact, updateContact } from '../db/queries/contacts';
import { createMessage, markMessageSent, markMessageFailed } from '../db/queries/messages';
import {
  createBatchRun,
  startBatchRun,
  appendBatchLog,
  updateBatchCounters,
  finishBatchRun,
  getBatchRun,
} from '../db/queries/batches';
import { logActivity } from '../db/queries/activity';

export interface BatchContactInput {
  contactId: string;
  message: string;
  templateId: string | null;
  greeting: string;
  company: string;
}

const activeStopFlags = new Map<string, boolean>();

export function requestStopBatch(batchRunId: string): void {
  activeStopFlags.set(batchRunId, true);
}

function sendProgress(win: BrowserWindow | null, payload: any): void {
  if (win && !win.isDestroyed()) {
    win.webContents.send('batch:progress', payload);
  }
}

export async function runBatch(
  win: BrowserWindow | null,
  campaignId: string | null,
  items: BatchContactInput[],
): Promise<string> {
  const batchRunId = createBatchRun({ campaign_id: campaignId, batch_size: items.length });
  startBatchRun(batchRunId);
  activeStopFlags.set(batchRunId, false);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    if (activeStopFlags.get(batchRunId)) {
      appendBatchLog(batchRunId, { type: 'stopped', message: 'User stopped the batch.' });
      finishBatchRun(batchRunId, 'Stopped', 'User stopped the batch.');
      sendProgress(win, { batchRunId, done: true, stopped: true, sent, skipped, failed, remaining: items.length - i });
      activeStopFlags.delete(batchRunId);
      return batchRunId;
    }

    const item = items[i];
    const contact = getContact(item.contactId);
    if (!contact) {
      skipped++;
      continue;
    }

    sendProgress(win, {
      batchRunId,
      current: { name: contact.full_name, company: item.company, status: 'sending' },
      sent,
      skipped,
      failed,
      remaining: items.length - i,
    });

    if (contact.existing_conversation_flag) {
      appendBatchLog(batchRunId, {
        type: 'skipped',
        contactId: contact.id,
        reason: 'An existing LinkedIn conversation was found. No duplicate message was sent.',
      });
      updateContact(contact.id, { crm_pipeline_stage: 'Existing Conversation' });
      skipped++;
      continue;
    }
    if (contact.do_not_contact_flag) {
      appendBatchLog(batchRunId, {
        type: 'skipped',
        contactId: contact.id,
        reason: 'This contact has opted out and is marked Do Not Contact.',
      });
      skipped++;
      continue;
    }

    const messageId = createMessage({
      contact_id: contact.id,
      campaign_id: campaignId,
      batch_run_id: batchRunId,
      template_id: item.templateId,
      greeting_used: item.greeting,
      company_used: item.company,
      final_message: item.message,
      status: 'Approved',
    });

    const result = await linkedInAdapter.sendMessage(contact.linkedin_url, item.message);

    if (result.status === 'Sent') {
      markMessageSent(messageId, JSON.stringify(result));
      updateContact(contact.id, {
        crm_pipeline_stage: 'Outreach Sent',
        full_sent_message: item.message,
        sent_at: new Date().toISOString(),
        message_variation_used: item.templateId,
      });
      logActivity('message_sent', `Mock message sent to ${contact.full_name}`, { contactId: contact.id, metadata: result });
      sent++;
      appendBatchLog(batchRunId, { type: 'sent', contactId: contact.id });
    } else {
      markMessageFailed(messageId, JSON.stringify(result));
      updateContact(contact.id, { crm_pipeline_stage: 'Failed', failure_skip_reason: result.detail });
      logActivity('message_failed', result.detail, { contactId: contact.id, metadata: result });
      failed++;
      appendBatchLog(batchRunId, { type: 'failed', contactId: contact.id, reason: result.detail });

      // Per compliance spec: stop the whole batch safely on CAPTCHA/login/rate-limit/restriction.
      if (result.blockReason) {
        finishBatchRun(batchRunId, 'Stopped', result.detail);
        updateBatchCounters(batchRunId, { sent_count: sent, skipped_count: skipped, failed_count: failed });
        sendProgress(win, { batchRunId, done: true, stopped: true, blockReason: result.blockReason, detail: result.detail, sent, skipped, failed, remaining: items.length - i - 1 });
        activeStopFlags.delete(batchRunId);
        return batchRunId;
      }
    }

    updateBatchCounters(batchRunId, { sent_count: sent, skipped_count: skipped, failed_count: failed });
  }

  finishBatchRun(batchRunId, 'Completed');
  updateBatchCounters(batchRunId, { sent_count: sent, skipped_count: skipped, failed_count: failed });
  sendProgress(win, { batchRunId, done: true, stopped: false, sent, skipped, failed, remaining: 0 });
  activeStopFlags.delete(batchRunId);
  return batchRunId;
}

export function getBatchStatus(batchRunId: string) {
  return getBatchRun(batchRunId);
}
