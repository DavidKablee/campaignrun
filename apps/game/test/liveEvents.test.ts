import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calendar, liveEvents } from '@cr/content';
import { applyRemoteConfig, isFinalWeek, resetRemoteConfig } from '../src/campaignClock';
import { currentTour, isRallySaturdayAhead, isRallySaturdayWindow, liveBanners, tourBonusFor, watWeekday } from '../src/liveEvents';
import { computeWeather } from '../src/weather';
import { useContenderStore } from '../src/contenderStore';
import { useGameStore } from '../src/state';

// Lagos is UTC+1 all year. Saturday 31 Oct 2026 begins at 23:00 UTC on Friday 30 Oct.
const SAT_START = Date.UTC(2026, 9, 30, 23, 0);
const HOUR = 3_600_000;
const DAY = 86_400_000;
const THU = Date.UTC(2026, 10, 12, 10); // Thu 12 Nov 2026, 11:00 Lagos
const CLOSE = Date.parse(calendar.closeAt);

afterEach(() => {
  resetRemoteConfig();
  vi.useRealTimers();
});

describe('Rally Saturday', () => {
  it('starts and ends at midnight Lagos time', () => {
    expect(watWeekday(SAT_START - 1)).toBe(5);
    expect(watWeekday(SAT_START)).toBe(6);
    expect(watWeekday(SAT_START + 24 * HOUR - 1)).toBe(6);
    expect(watWeekday(SAT_START + 24 * HOUR)).toBe(0);
  });

  it('is announced all Saturday, and live from 6 pm to 9 pm', () => {
    expect(isRallySaturdayAhead(SAT_START + HOUR)).toBe(true);
    expect(isRallySaturdayWindow(SAT_START + HOUR)).toBe(false);
    expect(isRallySaturdayWindow(SAT_START + 18 * HOUR)).toBe(true);
    expect(isRallySaturdayWindow(SAT_START + 21 * HOUR - 1)).toBe(true);
    expect(isRallySaturdayWindow(SAT_START + 21 * HOUR)).toBe(false);
    expect(isRallySaturdayAhead(SAT_START + 18 * HOUR)).toBe(false);
    expect(isRallySaturdayAhead(THU)).toBe(false);
  });

  it('agrees with the weather rule the sim multiplier is read from, minute by minute', () => {
    for (let m = 0; m < 24 * 60; m += 15) {
      const now = SAT_START + m * 60_000;
      expect(isRallySaturdayWindow(now)).toBe(computeWeather(now, 'SW', 0).isRallySaturday);
    }
  });

  it('is not announced after the close', () => {
    const closedSaturday = CLOSE + ((6 - new Date(CLOSE + HOUR).getUTCDay() + 7) % 7) * DAY + 19 * HOUR;
    expect(isRallySaturdayWindow(closedSaturday)).toBe(false);
  });
});

describe('the Weekly Tour', () => {
  it('names one open state outside Lagos and keeps it all week', () => {
    const monday = Date.UTC(2026, 10, 8, 23, 0); // Mon 9 Nov 00:00 Lagos
    const first = currentTour(monday + 30 * 60_000)!;
    expect(first.kind).toBe('tour');
    expect(first.stateId).not.toBe('lagos');
    // The batch that unlocks at 06:00 Lagos on Monday must not change the pick.
    expect(currentTour(monday + 7 * HOUR)!.stateId).toBe(first.stateId);
    expect(currentTour(monday + 6 * DAY + 22 * HOUR)!.stateId).toBe(first.stateId);
    expect(currentTour(monday + 6 * DAY + 22 * HOUR)!.periodKey).toBe(first.periodKey);
  });

  it('moves to another week key, and across the run of weeks features more than one state', () => {
    const seen = new Set<string>();
    const keys = new Set<string>();
    for (let w = 0; w < 10; w++) {
      const tour = currentTour(Date.UTC(2026, 10, 9, 12) + w * 7 * DAY)!;
      seen.add(tour.stateId);
      keys.add(tour.periodKey);
    }
    expect(keys.size).toBe(10);
    expect(seen.size).toBeGreaterThan(2);
  });

  it('is the same for every player and never needs an account', () => {
    expect(currentTour(THU)).toEqual(currentTour(THU));
  });

  it('can be told which state to feature, but only an open known one', () => {
    const base = currentTour(THU)!.stateId;
    const other = base === 'kano' ? 'rivers' : 'kano';
    applyRemoteConfig({ featured: other });
    expect(currentTour(THU)!.stateId).toBe(other);
    applyRemoteConfig({ featured: 'fct' }); // not open until 4 Jan
    expect(currentTour(THU)!.stateId).toBe(base);
    applyRemoteConfig({ featured: 'atlantis' });
    expect(currentTour(THU)!.stateId).toBe(base);
  });

  it('ends when the campaign closes', () => {
    expect(currentTour(CLOSE)).toBeNull();
    expect(liveBanners(CLOSE)).toEqual([]);
  });
});

describe('the Final Week', () => {
  const FINALE = Date.parse(calendar.finaleAt);

  it('runs from Saturday midnight Lagos time before the close until the close', () => {
    expect(isFinalWeek(Date.parse(calendar.finalWeekFrom) - 1)).toBe(false);
    expect(isFinalWeek(Date.parse(calendar.finalWeekFrom))).toBe(true);
    expect(CLOSE - Date.parse(calendar.finalWeekFrom)).toBeGreaterThan(6.9 * DAY);
    expect(CLOSE - Date.parse(calendar.finalWeekFrom)).toBeLessThanOrEqual(7 * DAY);
    expect(isFinalWeek(CLOSE)).toBe(false);
  });

  it('features the finale state and can pay once a day', () => {
    const early = currentTour(FINALE + 2 * DAY)!;
    expect(early.kind).toBe('tour');
    const d1 = currentTour(CLOSE - 3 * DAY)!;
    const d2 = currentTour(CLOSE - 2 * DAY)!;
    expect(d1.kind).toBe('final');
    expect(d1.stateId).toBe(liveEvents.finalWeekStateId);
    expect(d1.coins).toBe(liveEvents.finalWeekDailyBonus);
    expect(d1.periodKey).not.toBe(d2.periodKey);
  });

  it('moves with the close date when the close is moved remotely', () => {
    const later = new Date(CLOSE + 10 * DAY).toISOString();
    applyRemoteConfig({ calendar: { closeAt: later } });
    expect(isFinalWeek(CLOSE - 3 * DAY)).toBe(false);
    expect(isFinalWeek(CLOSE + 8 * DAY)).toBe(true);
  });
});

describe('tourBonusFor', () => {
  it('pays a finished run in the featured state once per period', () => {
    const tour = currentTour(THU)!;
    const hit = tourBonusFor({ finished: true, stateId: tour.stateId }, null, THU);
    expect(hit).toMatchObject({ coins: liveEvents.tourBonus, periodKey: tour.periodKey });
    expect(tourBonusFor({ finished: true, stateId: tour.stateId }, tour.periodKey, THU)).toBeNull();
  });

  it('pays nothing for a breakdown, another state or a closed campaign', () => {
    const tour = currentTour(THU)!;
    expect(tourBonusFor({ finished: false, stateId: tour.stateId }, null, THU)).toBeNull();
    expect(tourBonusFor({ finished: true, stateId: tour.stateId === 'lagos' ? 'kano' : 'lagos' }, null, THU)).toBeNull();
    expect(tourBonusFor({ finished: true, stateId: tour.stateId }, null, CLOSE + DAY)).toBeNull();
  });
});

describe('banners', () => {
  it('shows the tour, marks it done once paid, and adds Rally Saturday on a Saturday', () => {
    const tour = currentTour(THU)!;
    expect(liveBanners(THU, null)[0]!.line).toContain(tour.stateName);
    expect(liveBanners(THU, tour.periodKey)[0]!.line).toMatch(/bonus is in/);
    expect(liveBanners(THU).some((b) => b.id === 'saturday')).toBe(false);
    expect(liveBanners(SAT_START + HOUR).find((b) => b.id === 'saturday')!.line).toMatch(/Tonight/);
    expect(liveBanners(SAT_START + 19 * HOUR).find((b) => b.id === 'saturday')!.line).toMatch(/until 9 pm/);
  });
});

describe('what a finished run pays', () => {
  beforeEach(() => {
    useContenderStore.getState().clear();
    useGameStore.setState({ coins: 0, streak: 0, freezeWeek: null, tourClaimedKey: null, lastEventCoins: 0, lastEventNote: '' });
    vi.useFakeTimers();
  });

  const win = { delivered: 10, crowd: 12, finished: true };

  it('adds the tour bonus to the first finished rally in the featured state, and only that one', () => {
    vi.setSystemTime(THU);
    const tour = currentTour(THU)!;
    useGameStore.getState().recordMetaRun({ ...win, stateId: tour.stateId });
    const first = useGameStore.getState();
    expect(first.lastEventCoins).toBe(liveEvents.tourBonus);
    expect(first.lastEventNote).toContain('Weekly Tour');
    expect(first.tourClaimedKey).toBe(tour.periodKey);
    useGameStore.setState({ streak: 0 });
    useGameStore.getState().recordMetaRun({ ...win, stateId: tour.stateId });
    expect(useGameStore.getState().lastEventCoins).toBe(0);
  });

  it('pays nothing extra for a quick rally, a breakdown or another state', () => {
    vi.setSystemTime(THU);
    const tour = currentTour(THU)!;
    useGameStore.getState().recordMetaRun({ delivered: 5, crowd: 6, finished: false, quick: true, stateId: tour.stateId });
    useGameStore.getState().recordMetaRun({ delivered: 3, crowd: 3, finished: false, broke: true, stateId: tour.stateId });
    useGameStore.getState().recordMetaRun({ ...win, stateId: 'lagos' });
    expect(useGameStore.getState().tourClaimedKey).toBeNull();
    expect(useGameStore.getState().lastEventCoins).toBe(0);
  });
});
