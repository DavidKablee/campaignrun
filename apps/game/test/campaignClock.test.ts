import { afterEach, describe, expect, it } from 'vitest';
import { calendar } from '@cr/content';
import {
  applyRemoteConfig,
  daysLeft,
  daysLeftLabel,
  isClosed,
  remoteNotice,
  resetRemoteConfig,
  unlockMsFor,
} from '../src/campaignClock';
import { campaignRows } from '../src/trail';

const CLOSE = Date.parse(calendar.closeAt);
const DAY = 86_400_000;

afterEach(() => resetRemoteConfig());

describe('the bundled calendar', () => {
  it('counts down to the bundled close and closes at it', () => {
    expect(daysLeft(CLOSE - 3 * DAY)).toBe(3);
    expect(isClosed(CLOSE - 1)).toBe(false);
    expect(isClosed(CLOSE)).toBe(true);
    expect(daysLeftLabel(CLOSE - DAY)).toBe('1 day left');
    expect(daysLeftLabel(CLOSE - 5 * DAY, true)).toBe('5d left');
    expect(daysLeftLabel(CLOSE + DAY)).toBe('Closed');
  });
});

describe('remote config from flags.json', () => {
  it('moves the close date and keeps the notice to one short line', () => {
    const later = new Date(CLOSE + 30 * DAY).toISOString();
    applyRemoteConfig({ calendar: { closeAt: later }, notice: '  The date moved.\n  Same game.  ' });
    expect(daysLeft(CLOSE)).toBe(30);
    expect(remoteNotice()).toBe('The date moved. Same game.');
    applyRemoteConfig({ notice: 'x'.repeat(500) });
    expect(remoteNotice()).toHaveLength(200);
  });

  it('ignores dates that are malformed or far outside the game', () => {
    for (const bad of ['tomorrow', '1999-01-01T00:00:00Z', '2090-01-01T00:00:00Z', 42, null, {}]) {
      applyRemoteConfig({ calendar: { closeAt: bad } });
      expect(daysLeft(CLOSE - DAY)).toBe(1);
    }
    applyRemoteConfig('not an object');
    applyRemoteConfig(null);
    expect(remoteNotice()).toBe('');
  });

  it('moves one state\'s unlock week and ignores unknown ids', () => {
    const bundled = calendar.unlocks.find((u) => u.states.includes('osun'))!.at;
    const moved = new Date(Date.parse(bundled) + 14 * DAY).toISOString();
    applyRemoteConfig({ calendar: { unlocks: { osun: moved, atlantis: moved } } });
    expect(unlockMsFor('osun', bundled)).toBe(Date.parse(moved));
    expect(unlockMsFor('kano', bundled)).toBe(Date.parse(bundled));
    const rows = campaignRows(Date.parse(bundled) + DAY);
    expect(rows.find((r) => r.id === 'osun')!.open).toBe(false);
    expect(rows.find((r) => r.id === 'osun')!.unlocksAt).toBe(moved);
    expect(rows.some((r) => r.id === 'atlantis')).toBe(false);
  });

  it('resets to the bundled dates when the next fetch has nothing usable', () => {
    applyRemoteConfig({ calendar: { closeAt: new Date(CLOSE + 10 * DAY).toISOString() } });
    applyRemoteConfig({});
    expect(daysLeft(CLOSE - DAY)).toBe(1);
  });
});

describe('after the close', () => {
  it('opens every state that has a pack for practice', () => {
    const rows = campaignRows(CLOSE + DAY);
    const withPacks = rows.filter((r) => !r.awaitingPack);
    expect(withPacks.length).toBeGreaterThan(0);
    expect(withPacks.every((r) => r.open)).toBe(true);
  });

  it('keeps later states locked before the close', () => {
    const rows = campaignRows(Date.parse('2026-10-20T00:00:00Z'));
    expect(rows.find((r) => r.id === 'fct')!.open).toBe(false);
  });
});
