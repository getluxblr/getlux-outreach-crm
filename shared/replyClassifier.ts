import type { ClassifyReplyResult, ReplyCategory } from './types';

/**
 * classifyReply
 *
 * A simple keyword-based heuristic classifier that stands in for an
 * "AI-assisted" reply triage step. This is intentionally NOT a call to any
 * LLM or external service — it is deterministic and offline so it can be
 * unit-tested. A real implementation could later replace the keyword rules
 * below with an LLM call, but regardless of implementation, the UI must
 * ALWAYS require explicit user review before a reply classification is
 * allowed to change a contact's CRM pipeline stage — hence
 * `requiresUserReview` is hardcoded to `true` and must never be set to
 * `false` by any caller.
 */
export function classifyReply(text: string): ClassifyReplyResult {
  const t = (text || '').toLowerCase().trim();

  const rules: Array<{ category: ReplyCategory; sentiment: 'positive' | 'neutral' | 'negative'; keywords: string[] }> = [
    {
      category: 'Do not contact',
      sentiment: 'negative',
      keywords: ['do not contact', "don't contact", 'stop messaging', 'remove me', 'unsubscribe', 'opt out', 'opt-out'],
    },
    {
      category: 'Not interested',
      sentiment: 'negative',
      keywords: ['not interested', 'no thanks', 'not required', 'not looking for', 'no need'],
    },
    {
      category: 'Already has vendor',
      sentiment: 'negative',
      keywords: ['already have a vendor', 'already working with', 'existing partner', 'already have an agency', 'already tied up'],
    },
    {
      category: 'Wrong person',
      sentiment: 'neutral',
      keywords: ['wrong person', 'not the right person', 'reach out to', 'please contact', 'not my department'],
    },
    {
      category: 'Needs pricing',
      sentiment: 'neutral',
      keywords: ['pricing', 'price', 'cost', 'rate card', 'quote', 'charges'],
    },
    {
      category: 'Needs proposal',
      sentiment: 'positive',
      keywords: ['send proposal', 'share proposal', 'proposal please', 'send a proposal'],
    },
    {
      category: 'Needs company profile',
      sentiment: 'positive',
      keywords: ['company profile', 'share profile', 'more details', 'send details', 'brochure'],
    },
    {
      category: 'Needs serviceable locations',
      sentiment: 'neutral',
      keywords: ['which locations', 'serviceable location', 'which cities', 'do you cover', 'coverage area'],
    },
    {
      category: 'Needs meeting',
      sentiment: 'positive',
      keywords: ['schedule a call', 'set up a meeting', 'can we meet', 'book a call', 'available for a call', 'hop on a call'],
    },
    {
      category: 'Follow up later',
      sentiment: 'neutral',
      keywords: ['follow up later', 'not right now', 'circle back', 'reach out later', 'maybe later', 'next quarter'],
    },
    {
      category: 'Positive/Interested',
      sentiment: 'positive',
      keywords: ['interested', 'sounds good', 'tell me more', 'let\'s connect', 'yes please', 'sure, share', 'go ahead'],
    },
  ];

  if (!t) {
    return { category: 'No response', sentiment: 'neutral', confidence: 1, requiresUserReview: true };
  }

  for (const rule of rules) {
    const hit = rule.keywords.find((kw) => t.includes(kw));
    if (hit) {
      // Confidence scales loosely with keyword specificity (longer phrase = higher confidence).
      const confidence = Math.min(0.95, 0.55 + hit.length / 40);
      return { category: rule.category, sentiment: rule.sentiment, confidence, requiresUserReview: true };
    }
  }

  return { category: 'Unclear reply', sentiment: 'neutral', confidence: 0.3, requiresUserReview: true };
}
