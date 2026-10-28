import { beforeEach, describe, expect, it } from 'vitest';
import { useContenderStore } from '../src/contenderStore';
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
