import { describe, it, expect } from 'vitest';
import { computeNextRunAt } from '@shared/schedule';

describe('computeNextRunAt', () => {
  it('returns null when disabled', () => {
    const result = computeNextRunAt({
      enabled: false,
      timezone: 'Asia/Kolkata',
      scheduleTime: '09:00',
      lastRunAt: null,
    });
    expect(result).toBeNull();
  });

  it('schedules later today if the time has not yet passed', () => {
    // "now" is 2026-08-09T02:00:00Z == 07:30 IST — before 09:00 IST.
    const now = new Date('2026-08-09T02:00:00Z');
    const result = computeNextRunAt(
      { enabled: true, timezone: 'Asia/Kolkata', scheduleTime: '09:00', lastRunAt: null },
      now,
    );
    expect(result).not.toBeNull();
    const resultDate = new Date(result as string);
    expect(resultDate.getTime()).toBeGreaterThan(now.getTime());
    // Should still be the same UTC calendar day as "now" (09:00 IST == 03:30 UTC).
    expect(resultDate.toISOString().slice(0, 10)).toBe('2026-08-09');
  });

  it('schedules tomorrow if today\'s time has already passed', () => {
    // "now" is 2026-08-09T12:00:00Z == 17:30 IST — after 09:00 IST.
    const now = new Date('2026-08-09T12:00:00Z');
    const result = computeNextRunAt(
      { enabled: true, timezone: 'Asia/Kolkata', scheduleTime: '09:00', lastRunAt: null },
      now,
    );
    const resultDate = new Date(result as string);
    expect(resultDate.getTime()).toBeGreaterThan(now.getTime());
    expect(resultDate.toISOString().slice(0, 10)).toBe('2026-08-10');
  });

  it('does not schedule a run before lastRunAt even if in the future relative to now', () => {
    const now = new Date('2026-08-09T02:00:00Z');
    const lastRunAt = new Date('2026-08-09T03:30:00Z').toISOString(); // already ran at 09:00 IST today
    const result = computeNextRunAt(
      { enabled: true, timezone: 'Asia/Kolkata', scheduleTime: '09:00', lastRunAt },
      now,
    );
    const resultDate = new Date(result as string);
    expect(resultDate.getTime()).toBeGreaterThan(new Date(lastRunAt).getTime());
    expect(resultDate.toISOString().slice(0, 10)).toBe('2026-08-10');
  });
});
