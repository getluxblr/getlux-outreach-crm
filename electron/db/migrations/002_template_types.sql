-- Adds template typing (Invitation Note vs Connection Message) so the app
-- can auto-select the right draft for a contact based on whether they are
-- already a 1st-degree LinkedIn connection. Existing seeded/user templates
-- default to 'Connection Message' (they were all sending-to-connections
-- copy before this migration); the 3 short Invitation Note templates are
-- backfilled separately by seedInvitationTemplates() in electron/db/index.ts
-- so upgrading installs (message_templates already non-empty) still get them.

ALTER TABLE message_templates ADD COLUMN type TEXT NOT NULL DEFAULT 'Connection Message';

CREATE INDEX IF NOT EXISTS idx_templates_type ON message_templates(type);
