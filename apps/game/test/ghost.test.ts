import { describe, expect, it } from 'vitest';
import { simConfig } from '@cr/content';
import { encodeInputLog, Btn, type InputRecord } from '@cr/sim';
import { bytesToBase64, base64ToBytes, shouldReplaceGhost, type GhostRecord } from '../src/ghostStore';
import { computeGhostTrajectory } from '../src/ghostReplay';

describe('C29 ghost store (pure logic)', () => {
  it('base64 round-trips an encoded input log exactly', () => {
    const log: InputRecord[] = [
      { tick: 0, input: Btn.Gas },
      { tick: 12, input: Btn.Gas | Btn.Right },
      { tick: 300, input: 0 },
    ];
    const bytes = encodeInputLog(log);
    const roundTripped = base64ToBytes(bytesToBase64(bytes));
    expect([...roundTripped]).toEqual([...bytes]);
  });

  it('only replaces the stored ghost when the new run beats it on Crowd', () => {
    const makeGhost = (crowd: number): GhostRecord => ({
      stateId: 'lagos',
      seed: 1,
      contenderId: 'mama-ankara',
      rideId: 'okada',
      ticks: 100,
      crowd,
      log: '',
    });
    expect(shouldReplaceGhost(null, makeGhost(10))).toBe(true);
    expect(shouldReplaceGhost(makeGhost(50), makeGhost(60))).toBe(true);
    expect(shouldReplaceGhost(makeGhost(50), makeGhost(50))).toBe(false);
    expect(shouldReplaceGhost(makeGhost(50), makeGhost(40))).toBe(false);
  });
});

describe('C29 ghost replay (pure logic)', () => {
  function sampleGhost(): GhostRecord {
    const log: InputRecord[] = [
      { tick: 0, input: Btn.Gas },
      { tick: 40, input: Btn.Gas | Btn.Right },
      { tick: 80, input: Btn.Gas },
    ];
    return {
      stateId: 'lagos',
      seed: 42,
      contenderId: 'mama-ankara',
      rideId: 'okada',
      ticks: 120,
      crowd: 30,
      log: bytesToBase64(encodeInputLog(log)),
    };
  }

  it('produces one frame per recorded tick, moving forward and never backward in z', () => {
    const ghost = sampleGhost();
    const frames = computeGhostTrajectory(ghost, simConfig);
    expect(frames).toHaveLength(ghost.ticks);
    expect(frames[0]!.z).toBe(0);
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i]!.z).toBeGreaterThanOrEqual(frames[i - 1]!.z);
    }
    // the lane-change input at tick 40 should have moved laneX off centre by the end
    expect(frames[frames.length - 1]!.laneX).not.toBe(frames[0]!.laneX);
  });

  it('is fully deterministic — same ghost record replays identically every time', () => {
    const ghost = sampleGhost();
    const a = computeGhostTrajectory(ghost, simConfig);
    const b = computeGhostTrajectory(ghost, simConfig);
    expect(a).toEqual(b);
  });
});
