// Shared TypeScript types/interfaces used by both the Electron main process
// and the React renderer. Keep this file free of Node/DOM-only APIs so it can
// be imported from either side (and from Vitest tests) without extra config.

export type Pronouns = 'He/Him' | 'She/Her' | null | undefined;

// Whether a contact is already a 1st-degree LinkedIn connection or not.
// Determines which template type (Invitation Note vs Connection Message)
// applies. Stored in the existing `contact_status` column — no schema
// change needed. Set manually on import (generic prospect CSV = 'Not
// Connected', LinkedIn's own Connections.csv export = 'Connected'); never
// inferred by scraping or logging into LinkedIn.
export type ConnectionStatus = 'Connected' | 'Not Connected';

export type TemplateType = 'Invitation Note' | 'Connection Message';

// LinkedIn invite notes are capped at ~300 characters by LinkedIn itself.
export const INVITATION_NOTE_CHAR_LIMIT = 300;

export type PipelineStage =
  | 'Imported'
  | 'Qualified'
  | 'Verification Pending'
  | 'Verified'
  | 'Queued'
  | 'Draft Ready'
  | 'Approved'
  | 'Draft Copied — Awaiting Manual Send'
  | 'Outreach Sent'
  | 'Delivered / Sent Successfully'
  | 'Replied'
  | 'Interested'
  | 'Not Interested'
  | 'Follow-up Required'
  | 'Meeting Requested'
  | 'Meeting Booked'
  | 'Proposal Requested'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'Do Not Contact'
  | 'Existing Conversation'
  | 'Skipped'
  | 'Failed';

export const PIPELINE_STAGES: PipelineStage[] = [
  'Imported',
  'Qualified',
  'Verification Pending',
  'Verified',
  'Queued',
  'Draft Ready',
  'Approved',
  'Draft Copied — Awaiting Manual Send',
  'Outreach Sent',
  'Delivered / Sent Successfully',
  'Replied',
  'Interested',
  'Not Interested',
  'Follow-up Required',
  'Meeting Requested',
  'Meeting Booked',
  'Proposal Requested',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
  'Do Not Contact',
  'Existing Conversation',
  'Skipped',
  'Failed',
];

export type ReplyCategory =
  | 'Positive/Interested'
  | 'Needs company profile'
  | 'Needs proposal'
  | 'Needs serviceable locations'
  | 'Needs pricing'
  | 'Needs meeting'
  | 'Follow up later'
  | 'Not interested'
  | 'Already has vendor'
  | 'Wrong person'
  | 'Do not contact'
  | 'No response'
  | 'Unclear reply';

export interface Contact {
  id: string;
  full_name: string;
  linkedin_url: string;
  linkedin_profile_id: string | null;
  profile_picture_url: string | null;
  csv_company: string | null;
  csv_position: string | null;
  verified_current_company: string | null;
  verified_current_title: string | null;
  pronouns_found: Pronouns;
  greeting_selected: string | null;
  qualification_reason: string | null;
  connection_degree: string | null;
  message_availability: string | null;
  contact_status: string | null;
  crm_pipeline_stage: PipelineStage;
  campaign: string | null;
  batch_number: number | null;
  message_variation_used: string | null;
  full_sent_message: string | null;
  sent_at: string | null;
  reply_at: string | null;
  latest_reply_text: string | null;
  reply_sentiment_status: string | null;
  interest_level: string | null;
  proposal_status: string | null;
  meeting_status: string | null;
  follow_up_date: string | null;
  assigned_owner: string | null;
  notes: string | null;
  do_not_contact_flag: number;
  existing_conversation_flag: number;
  failure_skip_reason: string | null;
  email: string | null;
  phone: string | null;
  connected_on: string | null;
  source_filename: string | null;
  imported_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QualificationResult {
  qualified: boolean;
  reason: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  type: TemplateType;
}

// Manually-entered LinkedIn account snapshot (Settings screen / dashboard
// cards). Entered by hand from what the user sees in their own LinkedIn
// account, or from LinkedIn's own data-export tool — this app never logs
// into LinkedIn or reads these numbers itself.
export interface LinkedInDataSnapshot {
  totalConnections: number;
  pendingSent: number;
  pendingReceived: number;
  lastUpdated: string | null; // ISO string, set automatically on save
}

export interface ClassifyReplyResult {
  category: ReplyCategory;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  requiresUserReview: true;
}

export interface ScheduleConfig {
  enabled: boolean;
  timezone: string;
  scheduleTime: string; // HH:mm, 24h
  lastRunAt: string | null; // ISO string
}

export interface DedupeResult<T> {
  unique: T[];
  duplicates: T[];
}
