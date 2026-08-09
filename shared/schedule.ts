import type { ScheduleConfig } from './types';

// Implemented with plain Date + Intl math (no date-fns-tz dependency) so the
// scheduler has no extra runtime dependency beyond what Node/Electron/browsers
// already ship. Works for any IANA timezone, including ones with DST.

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  // Treat the formatted wall-clock time as if it were UTC to compute what
  // UTC instant that wall-clock time corresponds to; the difference from
  // `date` is the timezone's offset at that instant.
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - date.getTime();
}

/**
 * Builds the UTC Date corresponding to a given wall-clock date/time in a
 * specific IANA timezone.
 */
function zonedWallTimeToUtc(
  year: number,
  month: number, // 1-indexed
  day: number,
  hours: number,
  minutes: number,
  timeZone: string,
): Date {
  // First guess treating the wall time as UTC, then correct using the
  // timezone offset at that approximate instant (handles DST edges well
  // enough for a once-a-day scheduler).
  const naiveUtc = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const offsetMs = getTimeZoneOffsetMs(new Date(naiveUtc), timeZone);
  return new Date(naiveUtc - offsetMs);
}

function getZonedYmd(date: Date, timeZone: string): { year: number; month: number; day: number } {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

/**
 * computeNextRunAt
 *
 * Given a daily schedule config (enabled, IANA timezone, HH:mm scheduleTime,
 * and the last run timestamp), compute the next run time as an ISO string.
 *
 * Rules:
 * - If disabled, returns null (scheduler is paused; see "Schedule is
 *   paused." error message in the spec for the corresponding UI state).
 * - Otherwise: find today's occurrence of scheduleTime in the given
 *   timezone. If that occurrence is still in the future relative to `now`,
 *   AND it's after lastRunAt (or there was no last run), use it. Otherwise
 *   use tomorrow's occurrence.
 */
export function computeNextRunAt(
  config: ScheduleConfig,
  now: Date = new Date(),
): string | null {
  if (!config.enabled) return null;

  const [hoursStr, minutesStr] = (config.scheduleTime || '09:00').split(':');
  const hours = Number(hoursStr) || 0;
  const minutes = Number(minutesStr) || 0;

  const { year, month, day } = getZonedYmd(now, config.timezone);

  const buildOccurrence = (dayOffset: number): Date => {
    // Use a local Date only to add the day offset in a DST-agnostic way,
    // then re-derive the zoned wall date/time from scratch.
    const base = new Date(Date.UTC(year, month - 1, day));
    base.setUTCDate(base.getUTCDate() + dayOffset);
    return zonedWallTimeToUtc(
      base.getUTCFullYear(),
      base.getUTCMonth() + 1,
      base.getUTCDate(),
      hours,
      minutes,
      config.timezone,
    );
  };

  let candidate = buildOccurrence(0);

  const lastRun = config.lastRunAt ? new Date(config.lastRunAt) : null;

  const isCandidateUsable = (c: Date): boolean => {
    if (c.getTime() <= now.getTime()) return false;
    if (lastRun && c.getTime() <= lastRun.getTime()) return false;
    return true;
  };

  if (!isCandidateUsable(candidate)) {
    candidate = buildOccurrence(1);
  }

  return candidate.toISOString();
}
