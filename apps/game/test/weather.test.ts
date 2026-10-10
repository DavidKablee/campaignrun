import { describe, expect, it } from 'vitest';
import { computeWeather } from '../src/weather';

// All timestamps constructed as UTC, then +1h lands in WAT — e.g. 2026-12-15T02:00:00Z is
// 2026-12-15 03:00 WAT.
const ts = (iso: string) => Date.parse(iso);

describe('C30 weather (pure, no live clock reads)', () => {
  it('reports day phase as a smooth 0..1 position in the WAT day', () => {
    const midnight = computeWeather(ts('2026-10-10T23:00:00Z'), 'SW', 1); // 00:00 WAT
    const noon = computeWeather(ts('2026-10-10T11:00:00Z'), 'SW', 1); // 12:00 WAT
    expect(midnight.dayPhase).toBeCloseTo(0, 2);
    expect(noon.dayPhase).toBeCloseTo(0.5, 2);
  });

  it('is night before 6am and from 7pm WAT, never in between', () => {
    expect(computeWeather(ts('2026-10-10T04:00:00Z'), 'SW', 1).isNight).toBe(true); // 05:00 WAT
    expect(computeWeather(ts('2026-10-10T10:00:00Z'), 'SW', 1).isNight).toBe(false); // 11:00 WAT
    expect(computeWeather(ts('2026-10-10T18:30:00Z'), 'SW', 1).isNight).toBe(true); // 19:30 WAT
  });

  it('NEPA outage is only ever possible at night, and is deterministic per run seed', () => {
    const day = computeWeather(ts('2026-10-10T10:00:00Z'), 'SW', 3); // seed%100=3 < 35, but it's day
    expect(day.isNepaOut).toBe(false);
    const nightSameSeed1 = computeWeather(ts('2026-10-10T20:00:00Z'), 'SW', 3);
    const nightSameSeed2 = computeWeather(ts('2026-10-10T20:00:00Z'), 'SW', 3);
    expect(nightSameSeed1.isNepaOut).toBe(nightSameSeed2.isNepaOut);
    const nightLowSeed = computeWeather(ts('2026-10-10T20:00:00Z'), 'SW', 3); // 3 < 35
    const nightHighSeed = computeWeather(ts('2026-10-10T20:00:00Z'), 'SW', 90); // 90 >= 35
    expect(nightLowSeed.isNepaOut).toBe(true);
    expect(nightHighSeed.isNepaOut).toBe(false);
  });

  it('harmattan only applies Dec-Jan in a northern zone', () => {
    expect(computeWeather(ts('2026-12-15T12:00:00Z'), 'NE', 1).isHarmattan).toBe(true);
    expect(computeWeather(ts('2027-01-10T12:00:00Z'), 'NW', 1).isHarmattan).toBe(true);
    expect(computeWeather(ts('2026-12-15T12:00:00Z'), 'SW', 1).isHarmattan).toBe(false); // wrong zone
    expect(computeWeather(ts('2026-06-15T12:00:00Z'), 'NE', 1).isHarmattan).toBe(false); // wrong month
  });

  it('rainy season only applies Apr-Oct in a southern zone', () => {
    expect(computeWeather(ts('2026-07-15T12:00:00Z'), 'SS', 1).isRainySeason).toBe(true);
    expect(computeWeather(ts('2026-07-15T12:00:00Z'), 'NE', 1).isRainySeason).toBe(false); // wrong zone
    expect(computeWeather(ts('2026-12-15T12:00:00Z'), 'SW', 1).isRainySeason).toBe(false); // wrong month
  });

  it('Rally Saturday is only Saturday 6-9pm WAT', () => {
    // 2026-10-10 is a Saturday.
    expect(computeWeather(ts('2026-10-10T17:30:00Z'), 'SW', 1).isRallySaturday).toBe(true); // 18:30 WAT
    expect(computeWeather(ts('2026-10-10T19:30:00Z'), 'SW', 1).isRallySaturday).toBe(true); // 20:30 WAT, still inside
    expect(computeWeather(ts('2026-10-10T16:30:00Z'), 'SW', 1).isRallySaturday).toBe(false); // 17:30 WAT, too early
    expect(computeWeather(ts('2026-10-10T20:00:00Z'), 'SW', 1).isRallySaturday).toBe(false); // 21:00 WAT, window closed
    expect(computeWeather(ts('2026-10-11T18:30:00Z'), 'SW', 1).isRallySaturday).toBe(false); // Sunday
  });
});
