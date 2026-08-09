import { PIPELINE_STAGES, type PipelineStage } from './types';

// Adjacency list of allowed forward/lateral transitions. The pipeline is
// mostly linear (Imported -> Qualified -> ... -> Won/Lost) but several
// terminal/exception stages (Do Not Contact, Skipped, Failed, Existing
// Conversation) can be reached from most "in-flight" stages, and a few
// stages allow branching (e.g. Replied -> Interested | Not Interested |
// Follow-up Required).
const TERMINAL_EXCEPTIONS: PipelineStage[] = [
  'Do Not Contact',
  'Skipped',
  'Failed',
  'Existing Conversation',
];

const TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  Imported: ['Qualified', 'Skipped', 'Do Not Contact'],
  Qualified: ['Verification Pending', 'Skipped', 'Do Not Contact'],
  'Verification Pending': ['Verified', 'Skipped', 'Failed', 'Do Not Contact'],
  Verified: ['Queued', 'Existing Conversation', 'Skipped', 'Do Not Contact'],
  Queued: ['Draft Ready', 'Skipped', 'Do Not Contact'],
  'Draft Ready': ['Approved', 'Skipped', 'Do Not Contact'],
  Approved: ['Outreach Sent', 'Skipped', 'Failed', 'Do Not Contact'],
  'Outreach Sent': ['Delivered / Sent Successfully', 'Failed', 'Existing Conversation'],
  'Delivered / Sent Successfully': ['Replied', 'Follow-up Required'],
  Replied: ['Interested', 'Not Interested', 'Follow-up Required', 'Do Not Contact'],
  Interested: ['Meeting Requested', 'Proposal Requested', 'Follow-up Required', 'Not Interested'],
  'Not Interested': ['Do Not Contact', 'Follow-up Required'],
  'Follow-up Required': ['Interested', 'Not Interested', 'Meeting Requested', 'Proposal Requested', 'Do Not Contact'],
  'Meeting Requested': ['Meeting Booked', 'Follow-up Required', 'Not Interested'],
  'Meeting Booked': ['Proposal Requested', 'Negotiation', 'Follow-up Required'],
  'Proposal Requested': ['Proposal Sent', 'Follow-up Required'],
  'Proposal Sent': ['Negotiation', 'Won', 'Lost', 'Follow-up Required'],
  Negotiation: ['Won', 'Lost', 'Follow-up Required'],
  Won: [],
  Lost: [],
  'Do Not Contact': [],
  'Existing Conversation': [],
  Skipped: ['Qualified'],
  Failed: ['Verification Pending', 'Queued'],
};

/**
 * canTransition
 *
 * Validates whether moving a contact from one pipeline stage to another is
 * an allowed transition. Same-stage "transitions" are allowed as no-ops.
 */
export function canTransition(from: PipelineStage, to: PipelineStage): boolean {
  if (!PIPELINE_STAGES.includes(from) || !PIPELINE_STAGES.includes(to)) return false;
  if (from === to) return true;
  const allowed = TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export { TERMINAL_EXCEPTIONS };

// ---------------------------------------------------------------------------
// Metrics formulas
// ---------------------------------------------------------------------------

function safePercent(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

/** Reply Rate = Replies / Sent * 100 */
export function calcReplyRate(replies: number, sent: number): number {
  return safePercent(replies, sent);
}

/** Positive Reply Rate = Interested Replies / Sent * 100 */
export function calcPositiveReplyRate(positiveReplies: number, sent: number): number {
  return safePercent(positiveReplies, sent);
}

/** Proposal Conversion Rate = Proposal Requests / Replies * 100 */
export function calcProposalConversionRate(proposalRequests: number, replies: number): number {
  return safePercent(proposalRequests, replies);
}

/** Win Rate = Won / Total Opportunities * 100 */
export function calcWinRate(won: number, totalOpportunities: number): number {
  return safePercent(won, totalOpportunities);
}

/** Campaign Conversion Rate = Positive Leads / Sent * 100 */
export function calcCampaignConversionRate(positiveLeads: number, sent: number): number {
  return safePercent(positiveLeads, sent);
}
