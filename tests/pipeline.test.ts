import { describe, it, expect } from 'vitest';
import {
  canTransition,
  calcReplyRate,
  calcPositiveReplyRate,
  calcProposalConversionRate,
  calcWinRate,
  calcCampaignConversionRate,
} from '@shared/pipeline';

describe('canTransition', () => {
  it('allows a valid forward transition', () => {
    expect(canTransition('Imported', 'Qualified')).toBe(true);
  });

  it('allows same-stage no-op transition', () => {
    expect(canTransition('Qualified', 'Qualified')).toBe(true);
  });

  it('disallows an invalid skip-ahead transition', () => {
    expect(canTransition('Imported', 'Won')).toBe(false);
  });

  it('disallows transitions out of terminal Won stage', () => {
    expect(canTransition('Won', 'Negotiation')).toBe(false);
  });

  it('rejects unknown stage names', () => {
    expect(canTransition('Imported', 'NotAStage' as any)).toBe(false);
  });

  it('allows branching from Replied to multiple outcomes', () => {
    expect(canTransition('Replied', 'Interested')).toBe(true);
    expect(canTransition('Replied', 'Not Interested')).toBe(true);
    expect(canTransition('Replied', 'Follow-up Required')).toBe(true);
  });
});

describe('metrics formulas', () => {
  it('calcReplyRate handles normal case', () => {
    expect(calcReplyRate(25, 100)).toBe(25);
  });

  it('calcReplyRate guards against division by zero', () => {
    expect(calcReplyRate(0, 0)).toBe(0);
  });

  it('calcPositiveReplyRate computes correctly', () => {
    expect(calcPositiveReplyRate(10, 100)).toBe(10);
  });

  it('calcProposalConversionRate computes correctly', () => {
    expect(calcProposalConversionRate(5, 20)).toBe(25);
  });

  it('calcProposalConversionRate guards against division by zero', () => {
    expect(calcProposalConversionRate(5, 0)).toBe(0);
  });

  it('calcWinRate computes correctly', () => {
    expect(calcWinRate(3, 12)).toBe(25);
  });

  it('calcCampaignConversionRate computes correctly', () => {
    expect(calcCampaignConversionRate(8, 200)).toBe(4);
  });

  it('all formulas guard against negative/zero denominators', () => {
    expect(calcReplyRate(5, -1)).toBe(0);
    expect(calcWinRate(5, 0)).toBe(0);
  });
});
