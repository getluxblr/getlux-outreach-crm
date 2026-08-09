import type {
  LinkedInAdapter,
  SendMessageResult,
  VerificationResult,
  VerificationBlockReason,
} from './adapter';

/**
 * MockLinkedInAdapter
 *
 * The ONLY LinkedInAdapter implementation shipped in this application. It
 * performs no network requests whatsoever — every "result" is generated
 * in-memory with Math.random() to simulate realistic outcomes (including
 * occasional CAPTCHA/rate-limit/unclear-profile scenarios) so the rest of
 * the app (Verification Queue, Batch Review & Send) can be exercised
 * end-to-end without ever touching linkedin.com.
 */
export class MockLinkedInAdapter implements LinkedInAdapter {
  async verifyProfile(linkedinUrl: string): Promise<VerificationResult> {
    // Small artificial delay so the UI can show a realistic "verifying..." state.
    await delay(150 + Math.random() * 250);

    const roll = Math.random();

    if (roll < 0.05) {
      return { status: 'Unverifiable', profile: null, blockReason: 'UNCLEAR_PROFILE' };
    }
    if (roll < 0.08) {
      return { status: 'Failed', profile: null, blockReason: 'CAPTCHA' };
    }
    if (roll < 0.1) {
      return { status: 'Failed', profile: null, blockReason: 'RATE_LIMIT' };
    }

    const companies = ['Verified NBFC Pvt Ltd', 'Existing Employer Bank', 'Fin Recovery Solutions'];
    const titles = ['Collections Manager', 'Recovery Officer', 'Credit Operations Lead'];

    return {
      status: 'Verified',
      profile: {
        linkedinUrl,
        currentCompany: pick(companies),
        currentTitle: pick(titles),
        connectionDegree: pick(['1st', '2nd', '3rd']),
        messageButtonAvailable: Math.random() > 0.05,
        existingConversationFound: Math.random() < 0.08,
      },
      blockReason: null,
    };
  }

  // NOTE: sendMessage() is legacy Mock Mode plumbing. It is still exposed
  // via `batch:run`/electron/services/batchRunner.ts for backward
  // compatibility and tests, but the Batch Review & Send screen
  // (src/pages/BatchSend.tsx) no longer calls it — that screen now uses an
  // explicit copy-to-clipboard + manual "Mark as Sent" workflow instead, so
  // there is no simulated/automated "sending" happening anywhere in the
  // active UI. This method still performs zero network requests.
  async sendMessage(_linkedinUrl: string, _message: string): Promise<SendMessageResult> {
    await delay(200 + Math.random() * 400);

    const roll = Math.random();

    if (roll < 0.04) {
      return blockedResult('CAPTCHA', 'LinkedIn displayed a verification or CAPTCHA screen. Batch stopped safely.');
    }
    if (roll < 0.07) {
      return blockedResult('RATE_LIMIT', 'Messaging limit reached. Batch stopped; try again later.');
    }
    if (roll < 0.09) {
      return blockedResult('LOGIN_REQUIRED', 'LinkedIn login is required. Please sign in and try again.');
    }

    return { status: 'Sent', blockReason: null, detail: 'Message recorded as sent (mock mode).' };
  }
}

function blockedResult(blockReason: VerificationBlockReason, detail: string): SendMessageResult {
  return { status: 'Failed', blockReason, detail };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const linkedInAdapter: LinkedInAdapter = new MockLinkedInAdapter();
