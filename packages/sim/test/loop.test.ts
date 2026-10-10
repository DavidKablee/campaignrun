import { describe, it, expect } from 'vitest';
import { initState, step } from '../src/step';
import { starForCrowd } from '../src/stars';
import { seedRng } from '../src/rng';
import { encodeInputLog, decodeInputLog } from '../src/inputlog';
import type { SimConfig } from '@cr/content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Btn } from '../src/types';
import { playerXmm, laneCenterMm } from '../src/geometry';

const simConfig = JSON.parse(
  readFileSync(join(__dirname, '../../content/data/sim.json'), 'utf8'),
) as SimConfig;

function hashState(s: ReturnType<typeof initState>): string {
  return [
    s.tick,
    s.laneX,
    s.targetLane,
    s.z,
    s.speed,
    s.hopT,
    s.dents,
    s.momentum,
    s.carried,
    s.skillCrowd,
    s.displayCrowd,
    s.phase,
    s.entities.filter((e) => e.active).length,
    s.rng.a,
    s.rng.b,
    s.rng.c,
    s.rng.d,
  ].join('|');
}

describe('determinism', () => {
  it('same seed + inputs → identical hash over 10_000 steps', () => {
    const inputs: number[] = [];
    for (let i = 0; i < 10000; i++) {
      let inp = Btn.Gas;
      if (i % 47 === 0) inp |= Btn.Left;
      if (i % 53 === 0) inp |= Btn.Right;
      if (i % 61 === 0) inp |= Btn.Up;
      if (i % 71 === 0) inp |= Btn.Brake;
      inputs.push(inp);
    }

    const run = () => {
      const state = initState(simConfig, seedRng(42), { capacity: 15 });
      for (const inp of inputs) step(state, inp, simConfig);
      return hashState(state);
    };

    expect(run()).toBe(run());
  });

  it('100 random seeds stay deterministic across two runs each', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const inputs: number[] = [];
      for (let i = 0; i < 500; i++) {
        inputs.push(Btn.Gas | (i % 30 === 0 ? Btn.Left : 0) | (i % 37 === 0 ? Btn.Right : 0));
      }
      const a = initState(simConfig, seedRng(seed), { capacity: 8 });
      const b = initState(simConfig, seedRng(seed), { capacity: 8 });
      for (const inp of inputs) {
        step(a, inp, simConfig);
        step(b, inp, simConfig);
      }
      expect(hashState(a)).toBe(hashState(b));
    }
  });
});

describe('input log replay', () => {
  it('replaying recorded inputs reproduces live skillCrowd', () => {
    const live = initState(simConfig, seedRng(7), { capacity: 15 });
    const records: { tick: number; input: number }[] = [];
    let lastLogged = -1;
    for (let i = 0; i < 3000 && live.phase === 'running'; i++) {
      let input: number = Btn.Gas;
      if (i % 40 === 0) input = Btn.Gas | Btn.Left;
      else if (i % 55 === 0) input = Btn.Brake;
      if (input !== lastLogged) {
        records.push({ tick: live.tick, input });
        lastLogged = input;
      }
      step(live, input, simConfig);
    }

    const bytes = encodeInputLog(records);
    const decoded = decodeInputLog(bytes);
    expect(decoded).toEqual(records);

    const replay = initState(simConfig, seedRng(7), { capacity: 15 });
    let ri = 0;
    let cur = 0;
    while (replay.phase === 'running' && replay.tick < live.tick) {
      while (ri < decoded.length && decoded[ri]!.tick <= replay.tick) {
        cur = decoded[ri]!.input;
        ri++;
      }
      step(replay, cur, simConfig);
    }
    expect(replay.skillCrowd).toBe(live.skillCrowd);
    expect(replay.z).toBe(live.z);
    expect(replay.dents).toBe(live.dents);
  });
});

describe('controls', () => {
  it('edge-triggered lane: hold Left only moves one lane', () => {
    const state = initState(simConfig, seedRng(1), { capacity: 8 });
    expect(state.targetLane).toBe(1);
    step(state, Btn.Left, simConfig);
    expect(state.targetLane).toBe(0);
    for (let i = 0; i < 30; i++) step(state, Btn.Left, simConfig);
    expect(state.targetLane).toBe(0);
    // release then press again — already at 0, stays
    step(state, 0, simConfig);
    step(state, Btn.Right, simConfig);
    expect(state.targetLane).toBe(1);
  });

  it('hop clears low potholes', () => {
    const state = initState(simConfig, seedRng(2), { capacity: 8 });
    // Clear course entities ahead and plant a pothole on player
    state.entities = [
      {
        id: 99,
        kind: 'pothole',
        lane: 1,
        z: state.z + 500,
        halfWidthMm: 900,
        halfLenMm: 700,
        heightMm: 150,
        active: true,
      },
    ];
    state.finishZ = 999999999;
    state.hopT = simConfig.hopTicks;
    state.invulnTicks = 0;
    step(state, Btn.Gas, simConfig);
    expect(state.dents).toBe(0);
  });

  it('hop clears every obstacle shorter than hopHeightMm and hits the rest', () => {
    const hoppable = simConfig.obstacles.filter((o) => o.heightMm < simConfig.hopHeightMm);
    const solid = simConfig.obstacles.filter((o) => o.heightMm >= simConfig.hopHeightMm);
    expect(hoppable.map((o) => o.kind)).toEqual(['pothole', 'cones', 'tyres', 'barricade', 'jersey', 'narrow-gate', 'flood-patch']);
    expect(solid.map((o) => o.kind)).toEqual(['roadworks', 'car', 'danfo', 'trailer']);

    for (const o of simConfig.obstacles) {
      const state = initState(simConfig, seedRng(2), { capacity: 8 });
      state.entities = [
        {
          id: 99,
          kind: o.kind,
          lane: 1,
          z: state.z + 200,
          halfWidthMm: o.halfWidthMm,
          halfLenMm: o.halfLenMm,
          heightMm: o.heightMm,
          active: true,
        },
      ];
      state.finishZ = 999999999;
      state.hopT = simConfig.hopTicks;
      state.invulnTicks = 0;
      step(state, Btn.Gas, simConfig);
      expect(state.dents, o.kind).toBe(o.heightMm < simConfig.hopHeightMm ? 0 : 1);
    }
  });

  it('gas and brake bounds', () => {
    const state = initState(simConfig, seedRng(3), { capacity: 8 });
    const initSpeed = state.speed;
    step(state, Btn.Gas, simConfig);
    expect(state.speed).toBeGreaterThan(initSpeed);
    step(state, Btn.Brake, simConfig);
    expect(state.speed).toBeLessThan(initSpeed + simConfig.accelUm);
  });
});

describe('geometry contract', () => {
  it('lane centres and playerXmm agree at discrete lanes', () => {
    expect(laneCenterMm(0, simConfig)).toBe(-simConfig.laneSpacingMm);
    expect(laneCenterMm(1, simConfig)).toBe(0);
    expect(laneCenterMm(2, simConfig)).toBe(simConfig.laneSpacingMm);
    const s = initState(simConfig, seedRng(0), { capacity: 8 });
    s.laneX = 0;
    expect(playerXmm(s, simConfig)).toBe(laneCenterMm(0, simConfig));
    s.laneX = 1000;
    expect(playerXmm(s, simConfig)).toBe(0);
    s.laneX = 2000;
    expect(playerXmm(s, simConfig)).toBe(laneCenterMm(2, simConfig));
  });
});

describe('pickup / venue loop', () => {
  it('capacity clamps pickups', () => {
    const state = initState(simConfig, seedRng(9), { capacity: 8 });
    state.entities = [
      {
        id: 1,
        kind: 'supporter',
        lane: 1,
        z: state.z + 200,
        halfWidthMm: 500,
        halfLenMm: 500,
        heightMm: 1000,
        active: true,
        isPickup: true,
        value: 100,
      },
    ];
    state.finishZ = 999999999;
    step(state, Btn.Gas, simConfig);
    expect(state.carried).toBe(8);
  });

  it('C30: Rally Saturday doubles delivered Crowd, off by default', () => {
    const run = (rallySaturdayMultiplierPermille?: number) => {
      const state = initState(simConfig, seedRng(11), { capacity: 10, rallySaturdayMultiplierPermille });
      state.carried = 10;
      state.entities = [
        {
          id: 1,
          kind: 'venue',
          lane: 1,
          z: state.z,
          halfWidthMm: simConfig.zones.halfWidthMm,
          halfLenMm: simConfig.zones.halfLenMm,
          heightMm: 500,
          active: true,
          isZone: true,
          zoneKind: 'venue',
          consumed: false,
        },
      ];
      state.finishZ = 999999999;
      state.speed = simConfig.brakeSpeedUm;
      for (let i = 0; i < simConfig.zones.unloadTicks + 2; i++) step(state, Btn.Brake, simConfig);
      return state.skillCrowd;
    };
    const normal = run();
    const doubled = run(simConfig.bonuses.rallySaturdayMultiplierPermille);
    expect(normal).toBeGreaterThan(0);
    expect(doubled).toBe(normal * 2);
  });

  it('only delivered supporters become skillCrowd', () => {
    const state = initState(simConfig, seedRng(11), { capacity: 10 });
    state.carried = 10;
    state.entities = [
      {
        id: 1,
        kind: 'venue',
        lane: 1,
        z: state.z,
        halfWidthMm: simConfig.zones.halfWidthMm,
        halfLenMm: simConfig.zones.halfLenMm,
        heightMm: 500,
        active: true,
        isZone: true,
        zoneKind: 'venue',
        consumed: false,
      },
    ];
    state.finishZ = 999999999;
    state.speed = simConfig.brakeSpeedUm;
    // Enter zone then brake for loadTicks
    for (let i = 0; i < simConfig.zones.unloadTicks + 2; i++) {
      step(state, Btn.Brake, simConfig);
    }
    expect(state.carried).toBe(0);
    expect(state.skillCrowd).toBeGreaterThan(0);
    expect(state.delivered).toBe(10);
  });

  it('Full House only when arriving full', () => {
    const full = initState(simConfig, seedRng(12), { capacity: 8 });
    full.carried = 8;
    full.entities = [
      {
        id: 1,
        kind: 'venue',
        lane: 1,
        z: full.z,
        halfWidthMm: simConfig.zones.halfWidthMm,
        halfLenMm: simConfig.zones.halfLenMm,
        heightMm: 500,
        active: true,
        isZone: true,
        zoneKind: 'venue',
        consumed: false,
      },
    ];
    full.finishZ = 999999999;
    full.speed = simConfig.brakeSpeedUm;
    const events: string[] = [];
    for (let i = 0; i < simConfig.zones.unloadTicks + 2; i++) {
      step(full, Btn.Brake, simConfig);
      for (const e of full.events) events.push(e.type);
    }
    expect(events).toContain('fullHouse');

    const partial = initState(simConfig, seedRng(13), { capacity: 8 });
    partial.carried = 4;
    partial.entities = [
      {
        id: 1,
        kind: 'venue',
        lane: 1,
        z: partial.z,
        halfWidthMm: simConfig.zones.halfWidthMm,
        halfLenMm: simConfig.zones.halfLenMm,
        heightMm: 500,
        active: true,
        isZone: true,
        zoneKind: 'venue',
        consumed: false,
      },
    ];
    partial.finishZ = 999999999;
    partial.speed = simConfig.brakeSpeedUm;
    const events2: string[] = [];
    for (let i = 0; i < simConfig.zones.unloadTicks + 2; i++) {
      step(partial, Btn.Brake, simConfig);
      for (const e of partial.events) events2.push(e.type);
    }
    expect(events2).not.toContain('fullHouse');
  });

  it('3 dents cause breakdown', () => {
    const state = initState(simConfig, seedRng(14), { capacity: 8 });
    state.finishZ = 999999999;
    for (let d = 0; d < 3; d++) {
      state.invulnTicks = 0;
      state.entities = [
        {
          id: 100 + d,
          kind: 'car',
          lane: 1,
          z: state.z + 300,
          halfWidthMm: 900,
          halfLenMm: 2200,
          heightMm: 2200,
          active: true,
        },
      ];
      step(state, Btn.Gas, simConfig);
    }
    expect(state.phase).toBe('breakdown');
    expect(state.dents).toBe(3);
  });
});

describe('course timing', () => {
  it('scripted bot finishes between 75 and 100 seconds', () => {
    const state = initState(simConfig, seedRng(99), { capacity: 15 });
    // Timing measures course length + zone dwell, not dodge skill (covered elsewhere).
    state.entities = state.entities.filter((e) => e.isZone);

    let ticks = 0;
    const maxTicks = simConfig.tickHz * 120;
    while (state.phase === 'running' && ticks < maxTicks) {
      let input: number = Btn.Gas;
      const nearZone = state.entities.find(
        (e) =>
          e.isZone &&
          !e.consumed &&
          (e.zoneKind === 'pickup' || e.zoneKind === 'venue' || e.zoneKind === 'grand') &&
          Math.abs(e.z - state.z) < simConfig.zones.halfLenMm + 3000,
      );
      if (nearZone) input = Btn.Brake;
      step(state, input, simConfig);
      ticks++;
    }

    expect(state.phase).toBe('finished');
    const seconds = ticks / simConfig.tickHz;
    expect(seconds).toBeGreaterThanOrEqual(75);
    expect(seconds).toBeLessThanOrEqual(100);
  });
});

function campaignBot(capacity: number, seed: number) {
  const state = initState(simConfig, seedRng(seed), { capacity });
  state.entities = state.entities.filter((e) => e.isZone);
  let ticks = 0;
  const maxTicks = simConfig.tickHz * 120;
  while (state.phase === 'running' && ticks < maxTicks) {
    let input: number = Btn.Gas;
    const nearZone = state.entities.find(
      (e) =>
        e.isZone &&
        !e.consumed &&
        (e.zoneKind === 'pickup' || e.zoneKind === 'venue' || e.zoneKind === 'grand') &&
        Math.abs(e.z - state.z) < simConfig.zones.halfLenMm + 3000,
    );
    if (nearZone) input = Btn.Brake;
    step(state, input, simConfig);
    ticks++;
  }
  return state;
}

describe('ride tiers', () => {
  it('a clean run on Trek and Okada reaches Landslide', () => {
    for (const id of ['trek', 'okada'] as const) {
      const capacity = id === 'trek' ? 8 : 15;
      const state = campaignBot(capacity, 21);
      expect(state.phase, id).toBe('finished');
      expect(state.delivered, id).toBeGreaterThan(0);
      expect(starForCrowd(state.skillCrowd, capacity, simConfig), id).toBe('landslide');
    }
  });

  it('star thresholds scale with capacity', () => {
    const small = starForCrowd(8, 8, simConfig);
    const sameRatio = starForCrowd(15, 15, simConfig);
    expect(small).toBe(sameRatio);
    expect(starForCrowd(0, 8, simConfig)).toBe('none');
  });
});

describe('spawn weights', () => {
  it('buildCourse creates pickups, venues, finish, and hazards', () => {
    const state = initState(simConfig, seedRng(55), { capacity: 15 });
    const kinds = new Set(state.entities.map((e) => e.kind));
    expect(kinds.has('pickup-zone')).toBe(true);
    expect(kinds.has('venue')).toBe(true);
    expect(kinds.has('grand-rally')).toBe(true);
    expect(kinds.has('finish')).toBe(true);
    expect(kinds.has('gate')).toBe(true);
    const pickups = state.entities.filter((e) => e.zoneKind === 'pickup');
    expect(pickups.length).toBe(simConfig.course.segmentCount);
    for (const p of pickups) {
      expect(p.groupSize).toBeGreaterThanOrEqual(1);
      const maxG = Math.floor((state.capacity * (simConfig.groupSizeMinPermille + simConfig.groupSizeSpanPermille)) / 1000);
      expect(p.groupSize!).toBeLessThanOrEqual(Math.max(1, maxG));
    }
  });
});
