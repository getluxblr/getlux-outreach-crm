-- Getlux Outreach CRM — initial schema
-- All ids are TEXT (uuid v4, generated in application code). Timestamps are
-- ISO-8601 TEXT strings. Booleans are stored as INTEGER 0/1.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  company_type TEXT, -- NBFC | Bank | Fintech | Lender | Collection Agency | Financial Services | Other
  location TEXT,
  website TEXT,
  linkedin_company_url TEXT,
  related_contacts_count INTEGER NOT NULL DEFAULT 0,
  active_opportunities INTEGER NOT NULL DEFAULT 0,
  outreach_history TEXT,
  last_contact_date TEXT,
  next_follow_up_date TEXT,
  account_owner TEXT,
  notes TEXT,
  service_requirement TEXT,
  proposal_status TEXT,
  deal_value_estimate REAL,
  pipeline_stage TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  linkedin_url_normalized TEXT NOT NULL,
  linkedin_profile_id TEXT,
  profile_picture_url TEXT,
  csv_company TEXT,
  csv_position TEXT,
  verified_current_company TEXT,
  verified_current_title TEXT,
  pronouns_found TEXT, -- 'He/Him' | 'She/Her' | NULL
  greeting_selected TEXT,
  qualification_reason TEXT,
  connection_degree TEXT,
  message_availability TEXT,
  contact_status TEXT,
  crm_pipeline_stage TEXT NOT NULL DEFAULT 'Imported',
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  batch_number INTEGER,
  message_variation_used TEXT,
  full_sent_message TEXT,
  sent_at TEXT,
  reply_at TEXT,
  latest_reply_text TEXT,
  reply_sentiment_status TEXT,
  interest_level TEXT,
  proposal_status TEXT,
  meeting_status TEXT,
  follow_up_date TEXT,
  assigned_owner TEXT,
  notes TEXT,
  do_not_contact_flag INTEGER NOT NULL DEFAULT 0,
  existing_conversation_flag INTEGER NOT NULL DEFAULT 0,
  failure_skip_reason TEXT,
  email TEXT,
  phone TEXT,
  connected_on TEXT,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  source_filename TEXT,
  imported_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (linkedin_url_normalized)
);

CREATE INDEX IF NOT EXISTS idx_contacts_pipeline_stage ON contacts(crm_pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_contacts_campaign ON contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);

CREATE TABLE IF NOT EXISTS profile_verifications (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  verified_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL, -- Verified | Unverifiable | Skipped | Failed
  verified_company TEXT,
  verified_title TEXT,
  message_button_available INTEGER,
  existing_conversation_found INTEGER NOT NULL DEFAULT 0,
  block_reason TEXT, -- CAPTCHA | Login Required | Rate Limit | Restriction | Unclear Profile | NULL
  mock_result_payload TEXT, -- JSON blob from the mock verification simulator
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_verifications_contact ON profile_verifications(contact_id);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_criteria TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'Active', -- Active | Paused | Completed | Archived
  templates_used TEXT, -- JSON array of template ids
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS batch_runs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  batch_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending | Running | Stopped | Completed | Failed
  started_at TEXT,
  ended_at TEXT,
  sent_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  stop_reason TEXT,
  log TEXT, -- JSON array of per-contact log entries, kept even if stopped early
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS outreach_messages (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  batch_run_id TEXT REFERENCES batch_runs(id) ON DELETE SET NULL,
  template_id TEXT REFERENCES message_templates(id) ON DELETE SET NULL,
  greeting_used TEXT,
  company_used TEXT,
  final_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft', -- Draft | Approved | Sent (mock) | Skipped | Failed
  mock_send_result TEXT, -- JSON payload describing the simulated outcome
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_contact ON outreach_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign ON outreach_messages(campaign_id);

CREATE TABLE IF NOT EXISTS replies (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  outreach_message_id TEXT REFERENCES outreach_messages(id) ON DELETE SET NULL,
  reply_text TEXT NOT NULL,
  category TEXT,
  sentiment TEXT,
  confidence REAL,
  requires_user_review INTEGER NOT NULL DEFAULT 1,
  reviewed INTEGER NOT NULL DEFAULT 0,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_replies_contact ON replies(contact_id);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'Proposal Requested',
  deal_value_estimate REAL,
  proposal_status TEXT,
  proposal_sent_at TEXT,
  meeting_status TEXT,
  meeting_date TEXT,
  outcome TEXT, -- Won | Lost | Open
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS follow_up_tasks (
  id TEXT PRIMARY KEY,
  contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open', -- Open | Done | Cancelled
  notes TEXT,
  outcome TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_followups_due ON follow_up_tasks(due_date);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_contact ON activity_log(contact_id);

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  schedule_time TEXT NOT NULL DEFAULT '09:00',
  batch_size INTEGER NOT NULL DEFAULT 10,
  max_per_day INTEGER NOT NULL DEFAULT 1000,
  last_run_at TEXT,
  next_run_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Audit log is a superset view over activity_log for compliance-relevant
-- events (batch stop reasons, compliance modal acknowledgement, exports).
-- Reusing activity_log keeps a single source of truth; the app filters by
-- event_type in the Audit Log screen.
