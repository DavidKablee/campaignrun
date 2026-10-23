import { describe, expect, it } from 'vitest';
import { limits } from '@cr/content';
import { snoozeUntil } from '../src/emailPrompt';

const HOUR = 3600_000;
const ladder = limits.auth.emailPromptSnoozeHours;

describe('snoozeUntil', () => {
  const now = Date.parse('2026-10-22T12:00:00.000Z');

  it('waits the first rung on the first "not now"', () => {
    expect(snoozeUntil(0, now).getTime()).toBe(now + ladder[0]! * HOUR);
  });

  it('waits longer each time', () => {
    const waits = ladder.map((_, i) => snoozeUntil(i, now).getTime() - now);
    const sorted = [...waits].sort((a, b) => a - b);
    expect(waits).toEqual(sorted);
    expect(new Set(waits).size).toBe(waits.length);
  });

  it('repeats the last rung forever rather than running off the end', () => {
    const last = snoozeUntil(ladder.length - 1, now).getTime();
    expect(snoozeUntil(ladder.length, now).getTime()).toBe(last);
    expect(snoozeUntil(9_999, now).getTime()).toBe(last);
  });

  it('lands on a real rung for a nonsense count', () => {
    // A negative or fractional count out of the database must not produce an
    // Invalid Date, which would be stored as a null and ask again immediately.
    expect(snoozeUntil(-5, now).getTime()).toBe(now + ladder[0]! * HOUR);
    expect(snoozeUntil(1.9, now).getTime()).toBe(now + ladder[1]! * HOUR);
  });
});
