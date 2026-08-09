/**
 * LinkedIn Adapter Interface — COMPLIANCE-CRITICAL FILE
 * ============================================================================
 *
 * This file defines the *contract* that any LinkedIn integration must
 * implement. It intentionally contains NO logic that talks to linkedin.com.
 *
 * Getlux Outreach CRM ships ONLY with `MockLinkedInAdapter` (see
 * `./mockAdapter.ts`), which simulates verification and sending results
 * in-memory/randomly and never makes any network request. All "sending" in
 * this application writes to the local SQLite database only.
 *
 * Why this file exists (and what it is NOT):
 * - It is NOT an automation library. It does not scrape, click, log in, or
 *   otherwise interact with linkedin.com in any way.
 * - It does NOT bypass LinkedIn CAPTCHA, rate limits, login protections, or
 *   any other anti-automation control.
 * - It does NOT collect passwords, cookies, browser history, local storage,
 *   or private session data of any kind.
 *
 * How a REAL adapter would be added later (out of scope for this build):
 * A future, policy-compliant integration would implement this interface by
 * driving the user's OWN manual actions (e.g. the user reviews a draft and
 * clicks "send" themselves inside their own logged-in LinkedIn tab) or via
 * an approved browser-extension bridge that only reads what is already
 * visible on the screen and only acts when the user explicitly triggers
 * each individual action. Autonomous scraping or autonomous messaging
 * automation against linkedin.com is explicitly OUT OF SCOPE and MUST NOT
 * be implemented, in this codebase or any derivative of it.
 *
 * Whoever implements a real adapter must preserve every method signature
 * below so the rest of the app (batch runner, verification queue, etc.)
 * does not need to change.
 */

export interface LinkedInProfileSnapshot {
  linkedinUrl: string;
  currentCompany: string | null;
  currentTitle: string | null;
  connectionDegree: string | null;
  messageButtonAvailable: boolean;
  existingConversationFound: boolean;
}

export type VerificationBlockReason =
  | 'CAPTCHA'
  | 'LOGIN_REQUIRED'
  | 'RATE_LIMIT'
  | 'RESTRICTION'
  | 'UNCLEAR_PROFILE'
  | null;

export interface VerificationResult {
  status: 'Verified' | 'Unverifiable' | 'Failed';
  profile: LinkedInProfileSnapshot | null;
  blockReason: VerificationBlockReason;
}

export interface SendMessageResult {
  status: 'Sent' | 'Skipped' | 'Failed';
  blockReason: VerificationBlockReason;
  detail: string;
}

export interface LinkedInAdapter {
  /**
   * Reads publicly-visible profile information needed for outreach
   * (current company/title, message availability, existing conversation
   * status). Must never require credentials to be supplied to this method.
   */
  verifyProfile(linkedinUrl: string): Promise<VerificationResult>;

  /**
   * Simulates or performs sending a single message. A real implementation
   * must require the user to have explicitly approved this exact message
   * text beforehand (enforced by the CRM's Batch Review & Send screen, not
   * by this method) and must stop immediately on any CAPTCHA/login/rate
   * limit/restriction signal rather than retrying.
   */
  sendMessage(linkedinUrl: string, message: string): Promise<SendMessageResult>;
}
