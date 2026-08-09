import { describe, it, expect } from 'vitest';
import { isQualified } from '@shared/qualification';

describe('isQualified', () => {
  it('qualifies an obvious collections role', () => {
    const result = isQualified('Collections Manager', '', 'ABC Finance');
    expect(result.qualified).toBe(true);
    expect(result.reason).toMatch(/collection/i);
  });

  it('qualifies based on company containing NBFC', () => {
    const result = isQualified('Team Lead', '', 'XYZ NBFC Ltd');
    expect(result.qualified).toBe(true);
    expect(result.reason).toMatch(/nbfc/i);
  });

  it('qualifies based on headline keyword', () => {
    const result = isQualified('Manager', 'Working in debt recovery operations', 'Acme');
    expect(result.qualified).toBe(true);
    expect(result.reason).toMatch(/debt recovery/i);
  });

  it('is case-insensitive', () => {
    const result = isQualified('COLLECTION HEAD', '', 'acme bank');
    expect(result.qualified).toBe(true);
  });

  it('does not qualify an unrelated role', () => {
    const result = isQualified('Graphic Designer', 'Creative professional', 'Design Studio');
    expect(result.qualified).toBe(false);
    expect(result.reason).toMatch(/no qualifying/i);
  });

  it('handles null/undefined inputs safely', () => {
    const result = isQualified(null, undefined, null);
    expect(result.qualified).toBe(false);
  });

  it('reports multiple matched keywords', () => {
    const result = isQualified('Credit and Collections Manager', '', 'Some Bank');
    expect(result.qualified).toBe(true);
    expect(result.reason).toMatch(/credit/i);
    expect(result.reason).toMatch(/collection/i);
    expect(result.reason).toMatch(/bank/i);
  });
});
