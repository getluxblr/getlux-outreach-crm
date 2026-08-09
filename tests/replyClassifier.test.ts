import { describe, it, expect } from 'vitest';
import { classifyReply } from '@shared/replyClassifier';

describe('classifyReply', () => {
  it('always requires user review', () => {
    expect(classifyReply('Interested, tell me more').requiresUserReview).toBe(true);
    expect(classifyReply('').requiresUserReview).toBe(true);
    expect(classifyReply('random gibberish text').requiresUserReview).toBe(true);
  });

  it('classifies empty text as No response', () => {
    const r = classifyReply('');
    expect(r.category).toBe('No response');
  });

  it('classifies do-not-contact requests', () => {
    const r = classifyReply('Please do not contact me again');
    expect(r.category).toBe('Do not contact');
    expect(r.sentiment).toBe('negative');
  });

  it('classifies positive interest', () => {
    const r = classifyReply('This sounds good, tell me more');
    expect(r.category).toBe('Positive/Interested');
    expect(r.sentiment).toBe('positive');
  });

  it('classifies pricing questions', () => {
    const r = classifyReply('What is your pricing for this?');
    expect(r.category).toBe('Needs pricing');
  });

  it('classifies not interested', () => {
    const r = classifyReply('Not interested at this time');
    expect(r.category).toBe('Not interested');
    expect(r.sentiment).toBe('negative');
  });

  it('falls back to Unclear reply for ambiguous text', () => {
    const r = classifyReply('Okay noted, thanks');
    expect(r.category).toBe('Unclear reply');
  });

  it('returns a confidence between 0 and 1', () => {
    const r = classifyReply('Can we schedule a call?');
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });
});
