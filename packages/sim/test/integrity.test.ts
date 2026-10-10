import { describe, it, expect } from 'vitest';
import { simConfig, activeContenders } from '@cr/content';
import { initState, step, seedRng, Btn } from '../src';

const KINDS = ['snatcher', 'vote-buyer', 'sleepy-voter', 'result-swapper', 'network-glitch', 'late-materials', 'spot-the-fake'] as const;

describe('C06 integrity', () => {
  it('spawns the seven threat kinds in equal counts on a course (C28 extends 3 -> 7)', () => {
    // integritySpawnSeq resets per run, so fairness is checked within ONE course's own
    // round-robin sequence (matching the C06 original), not aggregated across several.
    const state = initState(simConfig, seedRng(42), { capacity: 8 });
    const counts = new Map<string, number>(KINDS.map((k) => [k, 0]));
    for (const e of state.entities) {
      if (!e.isIntegrityHazard) continue;
      expect(KINDS).toContain(e.kind);
      counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
    }
    const vals = [...counts.values()];
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

  it('each of the 4 new threat kinds fails distinctly without ending the run or getting stuck', () => {
    for (const kind of ['result-swapper', 'network-glitch', 'late-materials', 'spot-the-fake']) {
      const state = initState(simConfig, seedRng(5), { capacity: 8 });
      state.carried = 8;
      state.invulnTicks = 0;
      state.entities = [
        {
          id: 1,
          kind,
          lane: 1,
          z: state.z,
          halfWidthMm: 800,
          halfLenMm: 1200,
          heightMm: 1200,
          active: true,
          isIntegrityHazard: true,
        },
      ];
      const beforeIntegrity = state.integrity;
      step(state, Btn.Gas, simConfig);
      expect(state.integrity, kind).toBeLessThan(beforeIntegrity);
      expect(state.phase, kind).toBe('running');
      expect(state.events.some((e) => e.type === 'integrityFail'), kind).toBe(true);
    }
  });
});

describe('C28 PVC pickup', () => {
  it('collecting a PVC grants a temporary Crowd multiplier that lifts a delivery', () => {
    const state = initState(simConfig, seedRng(21), { capacity: 8 });
    state.carried = 8;
    state.invulnTicks = 0;
    state.entities.push({
      id: 500,
      kind: 'pvc-pickup',
      lane: 1,
      z: state.z,
      halfWidthMm: 400,
      halfLenMm: 400,
      heightMm: 900,
      active: true,
    });
    step(state, Btn.Gas, simConfig);
    expect(state.pvcBuffTicks).toBeGreaterThan(0);
    expect(state.events.some((e) => e.type === 'pvcActive')).toBe(true);
    expect(state.integrity).toBe(100); // never a hazard — no integrity cost
    expect(state.carried).toBe(8); // never a hazard — no crowd dropped
  });
});

describe('C28 rival convoys', () => {
  it('a bump only costs speed, never a dent or integrity', () => {
    const state = initState(simConfig, seedRng(3), { capacity: 8 });
    state.invulnTicks = 0;
    state.entities.push({
      id: 600,
      kind: 'rival-convoy',
      lane: 1,
      z: state.z,
      halfWidthMm: 700,
      halfLenMm: 1600,
      heightMm: 1700,
      active: true,
      isRivalConvoy: true,
      value: 0,
    });
    const beforeSpeed = state.speed;
    step(state, Btn.Gas, simConfig);
    expect(state.events.some((e) => e.type === 'rivalBump')).toBe(true);
    expect(state.dents).toBe(0);
    expect(state.integrity).toBe(100);
    expect(state.phase).toBe('running');
    expect(state.speed).toBeLessThanOrEqual(beforeSpeed + simConfig.accelUm);
  });

  it('an unhit rival despawns into an Outpace Crowd bonus', () => {
    const state = initState(simConfig, seedRng(4), { capacity: 8 });
    state.entities = [
      {
        id: 601,
        kind: 'rival-convoy',
        lane: 0,
        z: state.z - simConfig.spawn.despawnBehindMm - 1000,
        halfWidthMm: 700,
        halfLenMm: 1600,
        heightMm: 1700,
        active: true,
        isRivalConvoy: true,
        value: 1,
      },
    ];
    state.finishZ = 10_000_000;
    const before = state.skillCrowd;
    step(state, Btn.Gas, simConfig);
    expect(state.skillCrowd).toBeGreaterThan(before);
    expect(state.events.some((e) => e.type === 'rivalOutpace')).toBe(true);
  });

  it('rival-convoy spawns round-robin all 4 ride models equally on a course', () => {
    // Same reset-per-run caveat as the integrity round-robin test above.
    const state = initState(simConfig, seedRng(42), { capacity: 8 });
    const counts = [0, 0, 0, 0];
    for (const e of state.entities) {
      if (!e.isRivalConvoy) continue;
      counts[e.value ?? 0] = (counts[e.value ?? 0] ?? 0) + 1;
    }
    expect(counts.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });
});
