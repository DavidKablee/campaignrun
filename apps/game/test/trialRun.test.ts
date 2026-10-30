import { beforeEach, describe, expect, it } from 'vitest';
import { useContenderStore } from '../src/contenderStore';
import { copy, metaConfig } from '@cr/content';
import { hasPlayed } from '../src/meta';
import { useGameStore } from '../src/state';

const finishedRun = { delivered: 10, crowd: 12, finished: true };

describe('first-minute trial run', () => {
  beforeEach(() => {
    useContenderStore.getState().clear();
  });

  it('does not lock a Contender nobody picked, so the first real pick stays free', () => {
    useGameStore.getState().recordMetaRun(finishedRun);
    expect(useContenderStore.getState().contenderLocked).toBe(false);

    useContenderStore.getState().setActiveContender('captain-kobo');
    expect(useContenderStore.getState().contenderGraceUsed).toBe(false);
  });

  it('still locks a picked Contender after a finished run', () => {
    useContenderStore.getState().setActiveContender('mama-ankara');
    useGameStore.getState().recordMetaRun(finishedRun);
    expect(useContenderStore.getState().contenderLocked).toBe(true);
  });

  it('keeps how far a broken-down run got', () => {
    useGameStore.getState().setRunResult({
      skillCrowd: 0,
      displayCrowd: 0,
      delivered: 0,
      dents: 3,
      integrity: 0,
      capacity: 8,
      phase: 'breakdown',
      progress: 34,
      reached: 'Ojuelegba',
    });
    const s = useGameStore.getState();
    expect(s.lastRunProgress).toBe(34);
    expect(s.lastRunReached).toBe('Ojuelegba');
  });
});

describe('who counts as a first-timer', () => {
  it('treats a fresh install as unplayed', () => {
    expect(hasPlayed({ following: 0, startingStory: null, hasBest: false })).toBe(false);
  });

  it('does not count the Grassroots Start gift as a run', () => {
    const gift = metaConfig.starts.find((x) => x.id === 'grassroots')!.following;
    expect(gift).toBeGreaterThan(0);
    expect(hasPlayed({ following: gift, startingStory: 'grassroots', hasBest: false })).toBe(false);
  });

  it('counts supporters earned on the road, on top of a gift', () => {
    const gift = metaConfig.starts.find((x) => x.id === 'grassroots')!.following;
    expect(hasPlayed({ following: gift + 3, startingStory: 'grassroots', hasBest: false })).toBe(true);
    expect(hasPlayed({ following: 3, startingStory: null, hasBest: false })).toBe(true);
  });

  it('counts a recorded best as played', () => {
    expect(hasPlayed({ following: 0, startingStory: null, hasBest: true })).toBe(true);
  });
});

describe('first-minute copy', () => {
  it('says the roster lock is the first full run, not any run', () => {
    expect(copy.rosterLock).toMatch(/full campaign run/i);
    expect(copy.rosterLock).toMatch(/quick rallies never lock/i);
  });
});
