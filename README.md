# Getlux Outreach CRM

A local-first, Windows-first desktop CRM and LinkedIn outreach **drafting and
tracking** tool for Getlux (collections-services company). Built with
Electron + React + TypeScript + Vite + SQLite (`better-sqlite3`).

> **Compliance first.** This application never logs into LinkedIn, never
> scrapes LinkedIn, and never automates sending anything to LinkedIn. It
> only drafts messages, which a human copies and pastes into LinkedIn
> themselves, then manually confirms as sent (**Copy to Clipboard** →
> **Mark as Sent**, see "LinkedIn Data tab & manual copy-paste draft
> workflow" below). LinkedIn connection numbers are entered by hand or
> imported from LinkedIn's own official data-export tool — never scraped.
> Profile verification still ships a **mock mode** that simulates results
> with randomized in-memory data. There is no network call to
> linkedin.com anywhere in this codebase. See
> [Compliance & mock mode](#compliance--mock-mode) below.

## A note on this sandbox build

This scaffold was built in a network-restricted sandbox that blocks all
package registry hosts (`registry.npmjs.org`, etc. — confirmed via
`403 host_not_allowed` from the egress policy). `npm install` could not be
executed or verified here. All shared business logic (`shared/*.ts`) was
independently smoke-tested using the globally available `tsx`/`typescript`
tools with hand-written assertions that mirror every `tests/*.test.ts`
case, and the full TypeScript source tree was type-checked with a global
`tsc` (filtering only "module not found" noise that's expected without
`node_modules`) — no logic or type errors were found. On a machine with
normal npm registry access, `npm install && npm test && npm run build`
should complete cleanly; if anything surfaces, it will be ordinary
dependency-version drift, not a structural issue.

## Quick start

```bash
npm install
npm run dev        # boots Vite (renderer) + Electron together
npm test           # runs the full Vitest suite (all pure logic in shared/)
npm run build      # builds renderer (Vite) + electron (tsc), type-checked
npm run dist:win   # packages a Windows installer — run on Windows or CI (see below)
```

`npm run dev` runs two processes concurrently (via `concurrently`):
Vite dev server on `http://localhost:5173`, and Electron (waits for Vite via
`wait-on`, compiles `electron/` with `tsc`, then launches
`electron dist-electron/electron/main.js` pointed at the dev server URL).

## Building a Windows installer

This sandbox is Linux, so a `.exe` cannot be produced here — but the
`electron-builder` config (in `package.json`'s `"build"` key) is correct and
ready to run on Windows:

```bash
npm run build       # compile renderer + electron
npm run dist:win     # electron-builder --win nsis portable
```

This produces both an NSIS installer and a portable `.exe` under `release/`.

### Building via GitHub Actions

`.github/workflows/build-windows.yml` builds on `windows-latest`, runs
`npm ci && npm test && npm run build && npm run dist:win`, and uploads the
installer as a workflow artifact. Trigger it manually (`workflow_dispatch`)
or by pushing a `v*` tag.

## Publishing this repo to GitHub (not done automatically)

```bash
git remote add origin https://github.com/<your-org>/getlux-outreach-crm.git
git branch -M main
git push -u origin main
```

(No push has been performed as part of this build — only local commits.)

## Architecture overview

```
electron/            Main process (Node) — Electron entry, IPC, SQLite, services
  main.ts             Creates the BrowserWindow, initializes the DB, registers IPC
  preload.ts           contextBridge — exposes a typed `window.getlux` API only
  db/
    index.ts            Opens better-sqlite3, runs migrations, seeds templates
    migrations/          001_init.sql — full schema; 002_template_types.sql — adds template `type`
    queries/              One module per entity (contacts, companies, campaigns, …, linkedinData)
  ipc/handlers.ts       All ipcMain.handle() registrations, wraps queries/services
  services/
    csvImport.ts         CSV parsing, field mapping, LinkedIn-export detection, dedupe, import summary
    verification.ts      (Mock) LinkedIn profile verification -> DB writes
    batchRunner.ts        Legacy Mock Mode send loop — no longer called by the UI, see below
    linkedin/
      adapter.ts           The LinkedInAdapter INTERFACE — compliance-critical, see below
      mockAdapter.ts        The ONLY implementation shipped — pure in-memory simulation

src/                 Renderer (React, loaded by Vite/Electron BrowserWindow)
  api.ts               Thin client wrapping window.getlux, unwraps {ok,data}/{ok,error}
  App.tsx / main.tsx    Router shell, sidebar layout, theme
  pages/                One file per screen (Dashboard, LinkedIn Data, Import CSV, Contacts, …)
  components/           Sidebar, ComplianceModal, StageBadge
  state/store.ts         zustand store (theme, compliance ack)

shared/              Pure TS logic, imported by BOTH electron/ and src/, and
                     unit-tested directly (no Electron/DOM API usage allowed here)
  types.ts             Shared entity/pipeline/reply types, TemplateType, LinkedInDataSnapshot
  linkedinUrl.ts        normalizeLinkedInUrl()
  qualification.ts       isQualified() + keyword list
  greeting.ts             selectGreeting() — explicit pronouns only, never inferred
  templates.ts             10 Connection Message + 3 Invitation Note templates + renderTemplate()
  dedupe.ts                 dedupeContacts() by normalized LinkedIn URL
  replyClassifier.ts         classifyReply() — keyword heuristic, requiresUserReview: true always
  pipeline.ts                 canTransition() + all metrics formulas
  schedule.ts                  computeNextRunAt() — daily schedule calculator (Intl-based, no deps)

tests/               Vitest tests for every function in shared/
sample-data/         ~25-row sample Connections.csv (fictional people)
```

## Compliance & mock mode

- `electron/services/linkedin/adapter.ts` defines the `LinkedInAdapter`
  interface (`verifyProfile`, `sendMessage`) with an extensive comment
  explaining exactly what it is and is not. It contains **zero** logic that
  talks to linkedin.com.
- `electron/services/linkedin/mockAdapter.ts` is the **only**
  implementation shipped. It uses `Math.random()` to simulate realistic
  outcomes (verified/unverifiable, sent/CAPTCHA/rate-limit/login-required)
  with small `setTimeout` delays for UI realism — no network calls at all.
- The **current** Batch Review & Send screen (see "LinkedIn Data tab &
  manual copy-paste draft workflow" below) requires an explicit **Copy to
  Clipboard** click per contact, then a separate explicit **Mark as Sent**
  click after the human has actually sent the message themselves inside
  LinkedIn — nothing is ever recorded as sent automatically. The older
  Mock Mode simulator described above (`batchRunner.ts`/`mockAdapter.ts`)
  still exists in the codebase and is still network-free, but the UI no
  longer drives it.
- The first-launch compliance modal shows the required text verbatim,
  explicitly states that LinkedIn connection data is entered manually or
  imported via LinkedIn's own official data-export tool (never scraped,
  never logged into), and that all messages are drafted for manual
  copy-paste sending only. It's stored as acknowledged in `app_settings`
  (resettable from Settings).

### Swapping in a real LinkedIn adapter later (out of scope for this build)

A future, policy-compliant integration would implement the
`LinkedInAdapter` interface by driving the **user's own manual actions**
(the user reviews a draft and clicks "send" themselves inside their own
logged-in LinkedIn tab) or via an **approved browser-extension bridge**
that only reads what's already visible on screen and only acts on explicit
per-action user triggers. Autonomous scraping or autonomous messaging
automation against linkedin.com is explicitly **out of scope** and must
not be implemented — in this codebase or any derivative of it. To swap in
a real adapter: implement `LinkedInAdapter` in a new file (e.g.
`realAdapter.ts`), keep the exact method signatures, and change the single
import in `electron/services/verification.ts` and
`electron/services/batchRunner.ts` from `mockAdapter` to the new module.

## Database schema summary

SQLite via `better-sqlite3`, migration file `electron/db/migrations/001_init.sql`,
run automatically on first launch (tracked in a `_migrations` table).

| Table | Purpose |
|---|---|
| `contacts` | Every imported/qualified/outreached person — full CRM field set from the spec (pipeline stage, qualification reason, greeting, sent message, replies, DNC flag, etc.) |
| `companies` | Company/account records with pipeline stage, deal value estimate, owner |
| `profile_verifications` | One row per (mock) verification attempt, incl. block reason |
| `campaigns` | Named outreach segments (e.g. "NBFC Decision Makers") |
| `batch_runs` | One row per batch send, with live counters + a JSON log kept even if stopped early |
| `message_templates` | The 10 seeded templates + any user-added ones |
| `outreach_messages` | Every drafted/sent/failed message, with the exact final text |
| `replies` | Logged reply text + keyword-classified category/sentiment (always `requires_user_review = 1`) |
| `opportunities` | Proposal/negotiation/won/lost tracking |
| `follow_up_tasks` | Follow-up due dates, status, outcome |
| `activity_log` | Full audit trail (imports, verifications, sends, failures, stop reasons) — also powers the Audit Log screen |
| `schedules` | Single-row daily scheduler config (disabled by default) |
| `app_settings` | Key/value settings, incl. compliance-modal acknowledgement and the manually-entered LinkedIn Data snapshot |

`message_templates` is seeded from `shared/templates.ts` on first launch so
the DB and the unit-tested template source never drift apart. Since
`electron/db/migrations/002_template_types.sql`, each template row has a
`type` column (`'Invitation Note'` or `'Connection Message'`) — see below.

## LinkedIn Data tab & manual copy-paste draft workflow

Two features work together to keep this app strictly "draft-only," never
touching linkedin.com:

**LinkedIn Data screen** (`src/pages/LinkedInData.tsx`, `/linkedin-data`
route) — a manual-entry form for Total Connections, Pending Sent Requests,
and Pending Received Requests. You type in what you see in your own
LinkedIn account (or copy it from LinkedIn's own official data-export
tool); "Last updated" is set automatically, server-side, when you click
Save — it can't be backdated by the renderer. These numbers are persisted
as a single JSON blob in the existing `app_settings` key/value table (see
`electron/db/queries/linkedinData.ts`) — no scraping, no login, no new
table needed. The Dashboard shows these same four numbers as metric cards
and flags a "Update your LinkedIn numbers" badge once the data is more
than 7 days old.

**Two template types** (`shared/templates.ts`): `CONNECTION_MESSAGE_TEMPLATES`
(the original 10, for contacts already 1st-degree connected) and
`INVITATION_NOTE_TEMPLATES` (3 new, short templates for contacts who are
not yet connected — LinkedIn caps invite notes at ~300 characters, enforced
visually in the Templates screen). Both reuse the exact same
`selectGreeting()` explicit-pronoun-only rule from `shared/greeting.ts` —
"Hi Sir," only if the contact's pronoun field is explicitly `He/Him`, "Hi
Ma'am," only if explicitly `She/Her`, otherwise generic "Hello," — never
inferred from a name. Which type applies to a given contact is decided by
`contact_status` (`'Connected'` / `'Not Connected'`), which is set on CSV
import — see below.

**Import CSV** now supports two source formats, auto-detected
case-insensitively from the header row: LinkedIn's own official
"Connections" data export (Settings & Privacy → Data Privacy → Get a copy
of your data → columns `First Name, Last Name, URL, Email Address, Company,
Position, Connected On`) marks contacts `contact_status = 'Connected'`, and
a generic prospect list marks them `'Not Connected'`. Either way, this only
ever reads a local CSV file you've already downloaded yourself — nothing in
this app logs into linkedin.com or scrapes it.

**Batch Review & Send** (`src/pages/BatchSend.tsx`) auto-selects the
correct draft type per contact (Invitation Note vs Connection Message)
based on `contact_status`. For each contact you can review/edit the text,
then:
1. Click **Copy to Clipboard** — writes the draft to your OS clipboard via
   `navigator.clipboard.writeText` and sets the contact's pipeline stage to
   `Draft Copied — Awaiting Manual Send`.
2. Paste it into LinkedIn yourself and send it, inside your own logged-in
   LinkedIn tab.
3. Come back and click **Mark as Sent** — the *only* action in this entire
   codebase that sets a contact's stage to `Outreach Sent`. It is always a
   deliberate, explicit click by a human, never automatic, and never
   gated behind anything that could fire on its own.

The legacy Mock Mode batch simulator (`electron/services/batchRunner.ts`,
`electron/services/linkedin/mockAdapter.ts`) still exists and is still
network-request-free, but the Batch Review & Send screen no longer calls
it — it's superseded by the copy-to-clipboard workflow above.

## Standalone demo (`docs/index.html`, GitHub Pages)

`docs/index.html` (mirrored 1:1 from `getlux-crm-demo.html` at the repo
root) is a single-file, dependency-free HTML/CSS/JS preview of this same
product logic — no build step, deployed directly via GitHub Pages. It
mirrors the same explicit-pronoun-only greeting rule, the same
Invitation Note / Connection Message template split with the same LinkedIn
character-limit note, the same LinkedIn-export-vs-generic-prospect CSV
detection, and the same copy-to-clipboard + manual "Mark as Sent"
workflow — no auto-progress "sending" simulation. It's the one file in
this project that deliberately uses `localStorage` (for LinkedIn Data
numbers, template edits, and demo contacts), since it's a real deployed
static webpage, not an Electron app with a database. Whenever the demo's
logic changes, keep both copies in sync.

## Testing

All business logic in `shared/` is pure (no Electron/DOM/network APIs) and
covered by `tests/*.test.ts` (Vitest): LinkedIn URL normalization,
qualification keyword matching, greeting selection, all 10 Connection
Message templates + all 3 Invitation Note templates (including a
character-limit check) + the renderer, contact dedupe, reply
classification, pipeline transition rules (including the new `Draft
Copied — Awaiting Manual Send` stage), all five metrics formulas (with
divide-by-zero guards), and the daily schedule calculator (including
IST-specific and lastRunAt-aware cases).

## Known simplifications

- Companies are not auto-linked to contacts on import (contacts store a raw
  `csv_company` string; the Companies screen is a separate CRUD surface you
  populate as needed) — wiring that up automatically was left out to keep
  the highest-priority pieces (schema, pure logic, tests, import, queue,
  batch send, dashboard, pipeline) solid within scope.
- Reports & Analytics shows campaign-wise performance and the overall
  funnel; company-wise/role-wise/template-wise breakdowns and CSV/PDF
  report exports beyond Contacts/Messages are left as straightforward
  follow-up queries against the existing schema.
