import { describe, it, expect } from 'vitest';
import { simConfig, activeContenders } from '@cr/content';
import { initState, step, seedRng, Btn } from '../src';

const KINDS = ['snatcher', 'vote-buyer', 'sleepy-voter'] as const;

describe('C06 integrity', () => {
  it('spawns the three threat kinds in equal counts on a course', () => {
    const state = initState(simConfig, seedRng(42), { capacity: 8 });
    const counts = { snatcher: 0, 'vote-buyer': 0, 'sleepy-voter': 0 };
    for (const e of state.entities) {
      if (!e.isIntegrityHazard) continue;
      expect(KINDS).toContain(e.kind);
      counts[e.kind as keyof typeof counts]++;
    }
    const vals = [counts.snatcher, counts['vote-buyer'], counts['sleepy-voter']];
    expect(vals.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    // Round-robin: kinds differ by at most one spawn.
    expect(Math.max(...vals) - Math.min(...vals)).toBeLessThanOrEqual(1);
  });

  it('same seed yields identical integrity layouts for every Contender', () => {
    const layouts = activeContenders.map((c) => {
      const state = initState(simConfig, seedRng(99), { contenderId: c.id, capacity: 8 });
      return state.entities
        .filter((e) => e.isIntegrityHazard)
        .map((e) => `${e.kind}@${e.lane}@${e.z}`)
        .join('|');
    });
    for (let i = 1; i < layouts.length; i++) {
      expect(layouts[i]).toBe(layouts[0]);
    }
  });

  it('hit fails integrity; dodge succeeds', () => {
    const fail = initState(simConfig, seedRng(7), { capacity: 8 });
    fail.carried = 8;
    fail.invulnTicks = 0;
    fail.laneX = 1000;
    fail.targetLane = 1;
    fail.entities.push({
      id: 99001,
      kind: 'snatcher',
      lane: 1,
      z: fail.z,
      halfWidthMm: 800,
      halfLenMm: 1200,
      heightMm: 1200,
      active: true,
      isIntegrityHazard: true,
    });
    const before = fail.integrity;
    step(fail, Btn.Gas, simConfig);
    expect(fail.integrity).toBeLessThan(before);
    expect(fail.events.some((e) => e.type === 'integrityFail')).toBe(true);
    expect(fail.carried).toBeLessThan(8);

    const ok = initState(simConfig, seedRng(8), { capacity: 8 });
    ok.integrity = 50;
    ok.entities = [
      {
        id: 99002,
        kind: 'vote-buyer',
        lane: 0,
        z: ok.z - simConfig.spawn.despawnBehindMm - 1000,
        halfWidthMm: 500,
        halfLenMm: 500,
        heightMm: 1200,
        active: true,
        isIntegrityHazard: true,
      },
    ];
    ok.finishZ = 10_000_000;
    step(ok, Btn.Gas, simConfig);
    expect(ok.integrity).toBeGreaterThan(50);
    expect(ok.events.some((e) => e.type === 'integritySuccess')).toBe(true);
  });
});
