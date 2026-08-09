import { getSetting, setSetting } from './settings';
import { nowIso } from './ids';
import type { LinkedInDataSnapshot } from '../../../shared/types';

// Manually-entered LinkedIn account numbers (LinkedIn Data screen). Stored
// as a single JSON blob in the existing app_settings key/value table — no
// new table/migration needed. Nothing here is ever read from linkedin.com;
// the user types these numbers in by hand after looking at their own
// LinkedIn account.
const SETTINGS_KEY = 'linkedin_data';

const DEFAULT_SNAPSHOT: LinkedInDataSnapshot = {
  totalConnections: 0,
  pendingSent: 0,
  pendingReceived: 0,
  lastUpdated: null,
};

export function getLinkedInData(): LinkedInDataSnapshot {
  const raw = getSetting(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SNAPSHOT };
  try {
    const parsed = JSON.parse(raw);
    return {
      totalConnections: Number(parsed.totalConnections) || 0,
      pendingSent: Number(parsed.pendingSent) || 0,
      pendingReceived: Number(parsed.pendingReceived) || 0,
      lastUpdated: parsed.lastUpdated ?? null,
    };
  } catch {
    return { ...DEFAULT_SNAPSHOT };
  }
}

export interface UpdateLinkedInDataInput {
  totalConnections: number;
  pendingSent: number;
  pendingReceived: number;
}

// lastUpdated is always set server-side to "now" on save — the caller
// cannot backdate it. This is what powers the "stale data" warning badge.
export function updateLinkedInData(input: UpdateLinkedInDataInput): LinkedInDataSnapshot {
  const snapshot: LinkedInDataSnapshot = {
    totalConnections: Number(input.totalConnections) || 0,
    pendingSent: Number(input.pendingSent) || 0,
    pendingReceived: Number(input.pendingReceived) || 0,
    lastUpdated: nowIso(),
  };
  setSetting(SETTINGS_KEY, JSON.stringify(snapshot));
  return snapshot;
}
