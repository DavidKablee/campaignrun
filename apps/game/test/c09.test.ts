import { describe, expect, it } from 'vitest';
import { challengeMet, todaysChallenge } from '../src/daily';
import { submitLocalBoard } from '../src/localBoard';
import { isPlausibleRun } from '@cr/sim';
import { simConfig } from '@cr/content';
import { validateUsername } from '../src/username';

const baseClaim = {
  skillCrowd: 20,
  displayCrowd: 22,
  delivered: 18,
  dents: 1,
  capacity: 8,
  integrity: 90,
  finished: true,
};

describe('C09 plausibility', () => {
  it('accepts a normal finished run', () => {
    expect(isPlausibleRun(baseClaim, simConfig)).toEqual({ ok: true });
  });
  it('rejects impossible crowd', () => {
    expect(isPlausibleRun({ ...baseClaim, skillCrowd: 50_000 }, simConfig).ok).toBe(false);
  });
  it('rejects display below skill', () => {
    expect(isPlausibleRun({ ...baseClaim, displayCrowd: 10 }, simConfig).ok).toBe(false);
  });
  it('rejects finished with max dents', () => {
    expect(isPlausibleRun({ ...baseClaim, dents: 3 }, simConfig).ok).toBe(false);
  });
});

describe('C09 username', () => {
  it('accepts a short handle', () => {
    expect(validateUsername('Road Queen')).toEqual({ ok: true, name: 'Road Queen' });
  });
  it('rejects length and banned civic terms', () => {
    expect(validateUsername('ab').ok).toBe(false);
    expect(validateUsername('INEC Fan').ok).toBe(false);
    expect(validateUsername('poll watcher').ok).toBe(false);
  });
});

describe('C09 daily challenge', () => {
  it('is stable for a WAT day', () => {
    const a = todaysChallenge(Date.parse('2026-10-08T10:00:00+01:00'));
    const b = todaysChallenge(Date.parse('2026-10-08T22:00:00+01:00'));
    expect(a.id).toBe(b.id);
    expect(a.day).toBe('2026-10-08');
  });
  it('checks clean / crowd goals', () => {
    const clean = { kind: 'clean' as const, id: 'x', day: 'd', label: '', target: 0, reward: 1 };
    expect(challengeMet(clean, { finished: true, dents: 0, delivered: 1, crowd: 1, integrity: 100, star: 'foothold' })).toBe(true);
    expect(challengeMet(clean, { finished: true, dents: 1, delivered: 1, crowd: 1, integrity: 100, star: 'foothold' })).toBe(false);
  });
});

describe('C09 local board', () => {
  it('posts a plausible run and sorts by crowd', () => {
    const first = submitLocalBoard([], 'Mama Bus', baseClaim, 'lagos', Date.parse('2026-10-08T12:00:00+01:00'));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = submitLocalBoard(
      first.board,
      'Okada Kid',
      { ...baseClaim, skillCrowd: 28, displayCrowd: 30, delivered: 22 },
      'lagos',
      Date.parse('2026-10-08T12:00:00+01:00'),
    );
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.board[0]!.name).toBe('Okada Kid');
  });
  it('rejects impossible scores before they touch the board', () => {
    const bad = submitLocalBoard([], 'Mama Bus', { ...baseClaim, skillCrowd: 99_999, displayCrowd: 99_999 }, 'lagos');
    expect(bad.ok).toBe(false);
  });
});
