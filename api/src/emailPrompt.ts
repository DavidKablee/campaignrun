import { limits } from '@cr/content';

/**
 * How long "not now" lasts.
 *
 * A name-only account cannot be reached from a second device and cannot be
 * recovered if its device is lost, so the ask has to come back — a permanent
 * "never" would quietly promise a saved campaign the account cannot keep. It
 * also must not come back every run. The ladder in content does both: each
 * dismissal waits longer than the last, and the final rung repeats forever.
 */
export function snoozeUntil(dismissals: number, now: number = Date.now()): Date {
  const ladder = limits.auth.emailPromptSnoozeHours;
  // Clamped at both ends: a negative or absurd count out of the database must
  // still land on a real rung rather than `undefined` hours.
  const rung = Math.min(Math.max(Math.trunc(dismissals), 0), ladder.length - 1);
  return new Date(now + ladder[rung]! * 3600_000);
}
