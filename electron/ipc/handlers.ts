import { ipcMain, BrowserWindow, dialog, shell } from 'electron';
import fs from 'node:fs';
import Papa from 'papaparse';
import { getDb } from '../db';
import * as ContactsQ from '../db/queries/contacts';
import * as CompaniesQ from '../db/queries/companies';
import * as CampaignsQ from '../db/queries/campaigns';
import * as TemplatesQ from '../db/queries/templates';
import * as MessagesQ from '../db/queries/messages';
import * as RepliesQ from '../db/queries/replies';
import * as OpportunitiesQ from '../db/queries/opportunities';
import * as FollowUpsQ from '../db/queries/followups';
import * as ActivityQ from '../db/queries/activity';
import * as SchedulesQ from '../db/queries/schedules';
import * as SettingsQ from '../db/queries/settings';
import * as BatchesQ from '../db/queries/batches';
import * as LinkedInDataQ from '../db/queries/linkedinData';
import { previewCsv, importCsv, detectLinkedInExportFormat, autoMapLinkedInExport, createManualContact } from '../services/csvImport';
import { verifyContact } from '../services/verification';
import { runBatch, requestStopBatch, BatchContactInput } from '../services/batchRunner';
import {
  calcReplyRate,
  calcPositiveReplyRate,
  calcProposalConversionRate,
  calcWinRate,
} from '../../shared/pipeline';

function handle(channel: string, fn: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any): void {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return { ok: true, data: await fn(event, ...args) };
    } catch (err: any) {
      return { ok: false, error: err?.message || String(err) };
    }
  });
}

export function registerIpcHandlers(getWin: () => BrowserWindow | null): void {
  // Contacts
  handle('contacts:list', (_e, filters) => ContactsQ.listContacts(filters));
  handle('contacts:get', (_e, id) => ContactsQ.getContact(id));
  handle('contacts:update', (_e, id, fields) => ContactsQ.updateContact(id, fields));
  handle('contacts:delete', (_e, id) => ContactsQ.deleteContact(id));
  handle('contacts:countByStage', () => ContactsQ.countContactsByStage());
  handle('contacts:createManual', (_e, input) => createManualContact(input));

  // Companies
  handle('companies:list', (_e, search) => CompaniesQ.listCompanies(search));
  handle('companies:get', (_e, id) => CompaniesQ.getCompany(id));
  handle('companies:create', (_e, input) => CompaniesQ.createCompany(input));
  handle('companies:update', (_e, id, fields) => CompaniesQ.updateCompany(id, fields));
  handle('companies:delete', (_e, id) => CompaniesQ.deleteCompany(id));

  // Campaigns
  handle('campaigns:list', () => CampaignsQ.listCampaigns());
  handle('campaigns:get', (_e, id) => CampaignsQ.getCampaign(id));
  handle('campaigns:create', (_e, input) => CampaignsQ.createCampaign(input));
  handle('campaigns:update', (_e, id, fields) => CampaignsQ.updateCampaign(id, fields));
  handle('campaigns:delete', (_e, id) => CampaignsQ.deleteCampaign(id));
  handle('campaigns:performance', (_e, id) => CampaignsQ.getCampaignPerformance(id));

  // Templates
  handle('templates:list', () => TemplatesQ.listTemplates());
  handle('templates:create', (_e, name, body, type) => TemplatesQ.createTemplate(name, body, type));
  handle('templates:update', (_e, id, fields) => TemplatesQ.updateTemplate(id, fields));
  handle('templates:delete', (_e, id) => TemplatesQ.deleteTemplate(id));

  // LinkedIn Data (manual entry snapshot — never scraped/logged in)
  handle('linkedinData:get', () => LinkedInDataQ.getLinkedInData());
  handle('linkedinData:update', (_e, fields) => LinkedInDataQ.updateLinkedInData(fields));

  // Messages
  handle('messages:list', (_e, contactId) => MessagesQ.listMessages(contactId));
  handle('messages:create', (_e, input) => MessagesQ.createMessage(input));
  handle('messages:markManualSent', (_e, id) => MessagesQ.markMessageManualSent(id));
  handle('messages:markDraftCopied', (_e, id) => MessagesQ.markMessageDraftCopied(id));

  // Replies
  handle('replies:list', () => RepliesQ.listReplies());
  handle('replies:create', (_e, contactId, outreachMessageId, text) =>
    RepliesQ.createReply(contactId, outreachMessageId, text),
  );
  handle('replies:markReviewed', (_e, id) => RepliesQ.markReplyReviewed(id));

  // Opportunities
  handle('opportunities:list', () => OpportunitiesQ.listOpportunities());
  handle('opportunities:create', (_e, input) => OpportunitiesQ.createOpportunity(input));
  handle('opportunities:update', (_e, id, fields) => OpportunitiesQ.updateOpportunity(id, fields));

  // Follow-ups
  handle('followups:list', () => FollowUpsQ.listFollowUps());
  handle('followups:dueToday', () => FollowUpsQ.listFollowUpsDueToday());
  handle('followups:create', (_e, input) => FollowUpsQ.createFollowUp(input));
  handle('followups:update', (_e, id, fields) => FollowUpsQ.updateFollowUp(id, fields));

  // Activity / Audit log
  handle('activity:list', (_e, limit) => ActivityQ.listActivity(limit));

  // Schedule
  handle('schedule:get', () => SchedulesQ.getSchedule());
  handle('schedule:update', (_e, fields) => SchedulesQ.updateSchedule(fields));

  // Settings
  handle('settings:get', (_e, key) => SettingsQ.getSetting(key));
  handle('settings:set', (_e, key, value) => SettingsQ.setSetting(key, value));
  handle('settings:getAll', () => SettingsQ.getAllSettings());

  // CSV Import
  handle('csv:preview', (_e, content) => previewCsv(content));
  handle('csv:detectLinkedInExport', (_e, headers) => ({
    isLinkedInExport: detectLinkedInExportFormat(headers),
    mapping: detectLinkedInExportFormat(headers) ? autoMapLinkedInExport(headers) : null,
  }));
  handle('csv:import', (_e, content, mapping, sourceFilename, connectionStatus) =>
    importCsv(content, mapping, sourceFilename, connectionStatus),
  );
  handle('csv:openAndRead', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import Connections CSV',
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    return { filePath, filename: filePath.split(/[\\/]/).pop(), content };
  });

  // Shell — opens a URL in the user's normal default browser (a plain new
  // tab), exactly like clicking a hyperlink. Never used to log into
  // LinkedIn, click anything on linkedin.com, or automate any site.
  handle('shell:openExternal', async (_e, url: string) => {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      throw new Error('Only http(s) URLs can be opened.');
    }
    await shell.openExternal(url);
    return { opened: true };
  });

  // Verification
  handle('verification:verifyContact', (_e, contactId) => verifyContact(contactId));

  // Batch send
  handle('batch:run', (_e, campaignId, items: BatchContactInput[]) => runBatch(getWin(), campaignId, items));
  handle('batch:stop', (_e, batchRunId) => requestStopBatch(batchRunId));
  handle('batch:list', () => BatchesQ.listBatchRuns());
  handle('batch:get', (_e, id) => BatchesQ.getBatchRun(id));

  // Dashboard metrics
  handle('dashboard:metrics', () => computeDashboardMetrics());

  // Export
  handle('export:contactsCsv', async () => exportTableToCsv('contacts', 'Export Contacts'));
  handle('export:messagesCsv', async () => exportTableToCsv('outreach_messages', 'Export Outreach Messages'));
}

function computeDashboardMetrics() {
  const db = getDb();
  const count = (sql: string, params: any[] = []) => (db.prepare(sql).get(...params) as any)?.c ?? 0;

  const totalImported = count('SELECT COUNT(*) as c FROM contacts');
  const qualified = count("SELECT COUNT(*) as c FROM contacts WHERE qualification_reason IS NOT NULL AND qualification_reason != ''");
  const verified = count("SELECT COUNT(*) as c FROM contacts WHERE crm_pipeline_stage = 'Verified'");
  // Counts both legacy Mock Mode sends and the current manual
  // copy-to-clipboard workflow's "Mark as Sent" confirmations.
  const sent = count("SELECT COUNT(*) as c FROM outreach_messages WHERE status IN ('Sent (mock)', 'Sent (Manual)')");
  const replies = count('SELECT COUNT(*) as c FROM replies');
  const positiveReplies = count("SELECT COUNT(*) as c FROM replies WHERE category = 'Positive/Interested'");
  const interested = count("SELECT COUNT(*) as c FROM contacts WHERE crm_pipeline_stage = 'Interested'");
  const proposalRequests = count("SELECT COUNT(*) as c FROM opportunities WHERE stage = 'Proposal Requested'");
  const proposalsSent = count("SELECT COUNT(*) as c FROM opportunities WHERE stage = 'Proposal Sent'");
  const meetingsBooked = count("SELECT COUNT(*) as c FROM opportunities WHERE meeting_status = 'Booked'");
  const won = count("SELECT COUNT(*) as c FROM opportunities WHERE outcome = 'Won'");
  const lost = count("SELECT COUNT(*) as c FROM opportunities WHERE outcome = 'Lost'");
  const totalOpportunities = count('SELECT COUNT(*) as c FROM opportunities');
  const followUpsDueToday = FollowUpsQ.listFollowUpsDueToday().length;
  const skipped = count("SELECT COUNT(*) as c FROM contacts WHERE crm_pipeline_stage = 'Skipped'");
  const existingConversations = count("SELECT COUNT(*) as c FROM contacts WHERE existing_conversation_flag = 1");
  const failedMessages = count("SELECT COUNT(*) as c FROM outreach_messages WHERE status = 'Failed'");

  const today = new Date().toISOString().slice(0, 10);
  const sentToday = count(
    "SELECT COUNT(*) as c FROM outreach_messages WHERE status IN ('Sent (mock)', 'Sent (Manual)') AND sent_at LIKE ?",
    [`${today}%`],
  );
  const repliesToday = count('SELECT COUNT(*) as c FROM replies WHERE received_at LIKE ?', [`${today}%`]);

  return {
    totalImported,
    qualified,
    verified,
    sent,
    replies,
    replyRate: calcReplyRate(replies, sent),
    positiveReplyRate: calcPositiveReplyRate(positiveReplies, sent),
    interested,
    proposalRequests,
    proposalsSent,
    proposalConversionRate: calcProposalConversionRate(proposalRequests, replies),
    meetingsBooked,
    won,
    lost,
    winRate: calcWinRate(won, totalOpportunities),
    followUpsDueToday,
    skipped,
    existingConversations,
    failedMessages,
    sentToday,
    repliesToday,
  };
}

async function exportTableToCsv(table: 'contacts' | 'outreach_messages', dialogTitle: string) {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM ${table}`).all();
  const csv = Papa.unparse(rows as any[]);

  const result = await dialog.showSaveDialog({
    title: dialogTitle,
    defaultPath: `${table}-export-${new Date().toISOString().slice(0, 10)}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  if (result.canceled || !result.filePath) return { saved: false };
  fs.writeFileSync(result.filePath, csv, 'utf-8');
  return { saved: true, filePath: result.filePath, rowCount: rows.length };
}
