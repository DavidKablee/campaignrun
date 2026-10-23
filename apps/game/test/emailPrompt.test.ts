import { describe, expect, it } from 'vitest';
import { limits } from '@cr/content';
import { emailPromptDue, runsFromBest } from '../src/emailPrompt';

const RUNS = limits.auth.emailPromptAfterRuns;
const now = Date.parse('2026-10-22T12:00:00.000Z');
const base = { email: null, runs: RUNS, promptAfter: null, now };

describe('emailPromptDue', () => {
  it('never asks an account that already has an email', () => {
    expect(emailPromptDue({ ...base, email: 'a@example.com' })).toBe(false);
  });

  it('waits until the player has runs worth keeping', () => {
    expect(emailPromptDue({ ...base, runs: RUNS - 1 })).toBe(false);
    expect(emailPromptDue({ ...base, runs: RUNS })).toBe(true);
  });

  it('respects a snooze that has not run out', () => {
    const later = new Date(now + 3600_000).toISOString();
    expect(emailPromptDue({ ...base, promptAfter: later })).toBe(false);
  });

  it('asks again once the snooze has passed', () => {
    const past = new Date(now - 1000).toISOString();
    expect(emailPromptDue({ ...base, promptAfter: past })).toBe(true);
  });

  it('asks rather than going silent when the stored date is unreadable', () => {
    // Failing closed here means an account that can never be moved to another
    // device and is never told so.
    expect(emailPromptDue({ ...base, promptAfter: 'not-a-date' })).toBe(true);
  });
});

describe('runsFromBest', () => {
  it('counts every region, not just the best one', () => {
    expect(runsFromBest({ lagos: { runs: 2 }, kano: { runs: 5 } })).toBe(7);
  });

  it('is zero for an account that has posted nothing', () => {
    expect(runsFromBest({})).toBe(0);
  });
});
