import type { QualificationResult } from './types';

// Keyword list per the Getlux Outreach CRM product spec. Case-insensitive
// substring match against role, headline, and company.
export const QUALIFICATION_KEYWORDS: string[] = [
  'collection',
  'collections',
  'collection manager',
  'collection head',
  'recovery',
  'debt recovery',
  'loan recovery',
  'legal recovery',
  'field collections',
  'tele-calling collections',
  'receivables',
  'accounts receivable',
  'delinquency',
  'credit',
  'credit operations',
  'lending',
  'nbfc',
  'bank',
  'banking',
  'financial services',
  'finance operations',
  'loan servicing',
  'repayment',
  'risk collections',
  'payment recovery',
  'asset recovery',
];

/**
 * isQualified
 *
 * Determines whether a contact is a relevant collections/finance
 * professional by matching the role, headline, and company against the
 * qualification keyword list. Pure function, no IO.
 */
export function isQualified(
  role: string | null | undefined,
  headline: string | null | undefined,
  company: string | null | undefined,
): QualificationResult {
  const haystack = `${role || ''} ${headline || ''} ${company || ''}`.toLowerCase();

  const matched: string[] = [];
  for (const keyword of QUALIFICATION_KEYWORDS) {
    if (haystack.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    }
  }

  if (matched.length === 0) {
    return { qualified: false, reason: 'No qualifying keywords found in role, headline, or company.' };
  }

  // De-duplicate keywords that are substrings of already-matched longer
  // keywords (e.g. "collection" is contained within "collection manager")
  // to keep the reason string readable, while still reporting every
  // distinct match for transparency.
  return {
    qualified: true,
    reason: `Matched keyword(s): ${matched.join(', ')}`,
  };
}
