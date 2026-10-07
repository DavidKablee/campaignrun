import { describe, expect, it } from 'vitest';
import { emptyUpgrades, missionDelta, runModifiers, upgradeCost, watDay, watWeek } from '../src/meta';

describe('C08 meta loop', () => {
  it('uses Africa/Lagos day boundaries', () => {
    expect(watDay(Date.parse('2026-10-07T22:30:00Z'))).toBe('2026-10-07');
    expect(watDay(Date.parse('2026-10-07T23:30:00Z'))).toBe('2026-10-08');
    expect(watWeek(Date.parse('2026-10-05T12:00:00Z'))).toBe('2026-W41');
  });
  it('caps each configured upgrade at five purchases', () => {
    expect(upgradeCost('magnet', 0)).toBeGreaterThan(0);
    expect(upgradeCost('magnet', 5)).toBeNull();
  });
  it('only advances run missions on completed runs', () => {
    expect(missionDelta({}, [], 30, 30, false)).toEqual({ progress: {}, completed: [] });
    const result = missionDelta({}, [], 18, 24, true);
    expect(result.completed).toEqual(expect.arrayContaining(['deliver', 'crowd']));
  });
  it('keeps modifiers capped and integer-only', () => {
    const levels = { ...emptyUpgrades(), magnet: 5, loading: 5, value: 5 };
    expect(runModifiers(levels)).toMatchObject({ magnetRadiusMm: 1250, loadSpeedPermille: 1300, rewardPermille: 1250 });
  });
});
