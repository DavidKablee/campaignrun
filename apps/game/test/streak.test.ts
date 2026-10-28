import { beforeEach, describe, expect, it } from 'vitest';
import { metaConfig } from '@cr/content';
import { useContenderStore } from '../src/contenderStore';
import { useGameStore } from '../src/state';
import { watWeek } from '../src/meta';

const win = { delivered: 10, crowd: 12, finished: true };
const crash = { delivered: 3, crowd: 3, finished: false, broke: true };

describe('rally streak', () => {
  beforeEach(() => {
    useContenderStore.getState().clear();
    useGameStore.setState({ streak: 0, freezeWeek: null, coins: 0, lastStreakBonus: 0, lastStreakNote: '' });
  });

  it('grows with each finished rally and pays more as it grows', () => {
    const g = useGameStore.getState();
    g.recordMetaRun(win);
    const first = useGameStore.getState().lastMetaReward;
    expect(useGameStore.getState().streak).toBe(1);
    expect(useGameStore.getState().lastStreakBonus).toBe(0);
    g.recordMetaRun(win);
    expect(useGameStore.getState().streak).toBe(2);
    expect(useGameStore.getState().lastStreakBonus).toBe(metaConfig.rewards.streakBonusPermillePerStep);
    expect(useGameStore.getState().lastMetaReward).toBeGreaterThanOrEqual(first);
  });

  it('lets the weekly freeze absorb one breakdown, then the next one ends the streak', () => {
    useGameStore.setState({ streak: 4 });
    useGameStore.getState().recordMetaRun(crash);
    expect(useGameStore.getState().streak).toBe(4);
    expect(useGameStore.getState().lastStreakNote).toBe('frozen');
    expect(useGameStore.getState().freezeWeek).toBe(watWeek());

    useGameStore.getState().recordMetaRun(crash);
    expect(useGameStore.getState().streak).toBe(0);
    expect(useGameStore.getState().lastStreakNote).toBe('lost');
  });

  it('leaves the streak alone for a quick rally, finished or not', () => {
    useGameStore.setState({ streak: 3 });
    useGameStore.getState().recordMetaRun({ delivered: 5, crowd: 6, finished: false, quick: true });
    expect(useGameStore.getState().streak).toBe(3);
    expect(useGameStore.getState().freezeWeek).toBeNull();
  });

  it('pays a quick rally less finishing money than a full one for the same delivery', () => {
    useGameStore.getState().recordMetaRun({ delivered: 5, crowd: 6, finished: false, quick: true });
    const quick = useGameStore.getState().lastMetaReward;
    useGameStore.getState().recordMetaRun({ delivered: 5, crowd: 6, finished: true });
    const full = useGameStore.getState().lastMetaReward;
    expect(quick).toBeLessThan(full);
  });
});
