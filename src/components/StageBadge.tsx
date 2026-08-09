import React from 'react';

const GREEN = new Set(['Won', 'Delivered / Sent Successfully', 'Meeting Booked', 'Proposal Sent']);
const BLUE = new Set(['Queued', 'Draft Ready', 'Approved', 'Verified', 'Verification Pending', 'Qualified', 'Imported', 'Interested', 'Replied']);
const AMBER = new Set(['Follow-up Required', 'Skipped', 'Meeting Requested', 'Proposal Requested', 'Negotiation', 'Existing Conversation', 'Draft Copied — Awaiting Manual Send']);
const RED = new Set(['Failed', 'Lost', 'Do Not Contact', 'Not Interested']);

export default function StageBadge({ stage }: { stage: string }): JSX.Element {
  let cls = 'badge-info';
  if (GREEN.has(stage)) cls = 'badge-success';
  else if (AMBER.has(stage)) cls = 'badge-warning';
  else if (RED.has(stage)) cls = 'badge-danger';
  else if (BLUE.has(stage)) cls = 'badge-info';

  return <span className={`badge ${cls}`}>{stage}</span>;
}
