import { normalizeLinkedInUrl } from './linkedinUrl';
import type { DedupeResult } from './types';

/**
 * dedupeContacts
 *
 * Deduplicates a list of contact-like records by normalized LinkedIn URL.
 * The first occurrence of a normalized URL is kept as "unique"; every
 * subsequent occurrence with the same normalized URL is reported as a
 * "duplicate". Records with an empty/unparseable URL are treated as unique
 * (never silently dropped) since we can't safely dedupe them.
 */
export function dedupeContacts<T extends { linkedin_url: string }>(
  contacts: T[],
): DedupeResult<T> {
  const seen = new Set<string>();
  const unique: T[] = [];
  const duplicates: T[] = [];

  for (const contact of contacts) {
    const normalized = normalizeLinkedInUrl(contact.linkedin_url);
    if (!normalized) {
      unique.push(contact);
      continue;
    }
    if (seen.has(normalized)) {
      duplicates.push(contact);
    } else {
      seen.add(normalized);
      unique.push(contact);
    }
  }

  return { unique, duplicates };
}
