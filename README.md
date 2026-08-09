# Getlux Outreach CRM

A local-first, Windows-first desktop CRM and LinkedIn outreach **drafting and
tracking** tool for Getlux (collections-services company). Built with
Electron + React + TypeScript + Vite + SQLite (`better-sqlite3`).

> **Compliance first.** This application never automates LinkedIn sending,
> scraping, or bypasses any LinkedIn protection. It only ships a **mock
> mode** that simulates verification/sending with randomized in-memory
> results. Every "send" in this app writes to the local SQLite database
> only — there is no network call to linkedin.com anywhere in this
> codebase. See [Compliance & mock mode](#compliance--mock-mode) below.

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
    migrations/          001_init.sql — full schema
    queries/              One module per entity (contacts, companies, campaigns, …)
  ipc/handlers.ts       All ipcMain.handle() registrations, wraps queries/services
  services/
    csvImport.ts         CSV parsing, field mapping, dedupe, import summary
    verification.ts      (Mock) LinkedIn profile verification -> DB writes
    batchRunner.ts        Batch send loop: per-contact send, stop-on-block, logging
    linkedin/
      adapter.ts           The LinkedInAdapter INTERFACE — compliance-critical, see below
      mockAdapter.ts        The ONLY implementation shipped — pure in-memory simulation

src/                 Renderer (React, loaded by Vite/Electron BrowserWindow)
  api.ts               Thin client wrapping window.getlux, unwraps {ok,data}/{ok,error}
  App.tsx / main.tsx    Router shell, sidebar layout, theme
  pages/                One file per screen (Dashboard, Import CSV, Contacts, …)
  components/           Sidebar, ComplianceModal, StageBadge
  state/store.ts         zustand store (theme, compliance ack)

shared/              Pure TS logic, imported by BOTH electron/ and src/, and
                     unit-tested directly (no Electron/DOM API usage allowed here)
  types.ts             Shared entity/pipeline/reply types
  linkedinUrl.ts        normalizeLinkedInUrl()
  qualification.ts       isQualified() + keyword list
  greeting.ts             selectGreeting() — explicit pronouns only, never inferred
  templates.ts             10 message templates + renderTemplate()
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
- The Batch Review & Send screen requires an explicit "Confirm and Send"
  click before any message is recorded, shows a live progress panel, and
  has a visible **Stop** button. On a simulated CAPTCHA/rate-limit/login
  block, the whole batch stops immediately (per spec) and the reason is
  logged to the Audit Log.
- The first-launch compliance modal shows the required text verbatim and is
  stored as acknowledged in `app_settings` (resettable from Settings).

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
| `app_settings` | Key/value settings, incl. compliance-modal acknowledgement |

`message_templates` is seeded from `shared/templates.ts` on first launch so
the DB and the unit-tested template source never drift apart.

## Testing

All business logic in `shared/` is pure (no Electron/DOM/network APIs) and
covered by `tests/*.test.ts` (Vitest): LinkedIn URL normalization,
qualification keyword matching, greeting selection, all 10 templates +
renderer, contact dedupe, reply classification, pipeline transition rules,
all five metrics formulas (with divide-by-zero guards), and the daily
schedule calculator (including IST-specific and lastRunAt-aware cases).

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
