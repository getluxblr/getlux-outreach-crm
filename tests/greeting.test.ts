import { describe, it, expect } from 'vitest';
import { selectGreeting } from '@shared/greeting';

describe('selectGreeting', () => {
  it('returns "Hi Sir," only for explicit He/Him', () => {
    expect(selectGreeting('He/Him')).toBe('Hi Sir,');
  });

  it("returns \"Hi Ma'am,\" only for explicit She/Her", () => {
    expect(selectGreeting('She/Her')).toBe("Hi Ma'am,");
  });

  it('returns "Hello," for null', () => {
    expect(selectGreeting(null)).toBe('Hello,');
  });

  it('returns "Hello," for undefined', () => {
    expect(selectGreeting(undefined)).toBe('Hello,');
  });

  it('never infers gender from anything other than the explicit pronoun value', () => {
    // Simulate a caller mistakenly passing a name-like string — must not be
    // treated as a valid pronoun and must fall back to neutral.
    expect(selectGreeting('Mr. Sharma' as unknown as 'He/Him')).toBe('Hello,');
  });
});
