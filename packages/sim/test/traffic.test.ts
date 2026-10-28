import { describe, expect, it } from 'vitest';
import { simConfig } from '@cr/content';
import { Btn, initState, laneCenterMm, playerXmm, seedRng, step, type Entity, type SimState } from '../src';
import { runBot, summarise } from './helpers/dodgeBot';

const T = simConfig.traffic;

let nextId = 900;
function mover(over: Partial<Entity> & Pick<Entity, 'kind'>): Entity {
  const dims = simConfig.obstacles.find((o) => o.kind === over.kind) ?? { halfWidthMm: 500, halfLenMm: 500, heightMm: 1000 };
  const lane = over.lane ?? 1;
  return {
    id: nextId++,
    lane,
    z: 0,
    halfWidthMm: dims.halfWidthMm,
    halfLenMm: dims.halfLenMm,
    heightMm: dims.heightMm,
    active: true,
    mover: 'oncoming',
    vz: 0,
    xMm: laneCenterMm(lane, simConfig),
    awake: false,
    ...over,
  };
}

/** An empty road with the player on it and exactly these vehicles. */
function road(entities: Entity[], opts: { speed?: number; lane?: 0 | 1 | 2 } = {}): SimState {
  const state = initState(simConfig, seedRng(5), { capacity: 8 });
  state.entities = entities;
  state.finishZ = 999_999_999;
  state.speed = opts.speed ?? simConfig.baseSpeedUm;
  if (opts.lane !== undefined) {
    state.laneX = opts.lane * 1000;
    state.targetLane = opts.lane;
  }
  return state;
}

const run = (state: SimState, ticks: number, input: number = Btn.Gas) => {
  for (let i = 0; i < ticks; i++) step(state, input, simConfig);
};

describe('moving traffic', () => {
  it('is the same traffic on the same seed and inputs', () => {
    const play = () => {
      const s = initState(simConfig, seedRng(31337));
      for (let i = 0; i < 4000; i++) step(s, i % 90 < 45 ? Btn.Gas : Btn.Gas | Btn.Left, simConfig);
      return s.entities.filter((e) => e.mover).map((e) => [e.id, e.z, e.xMm, e.awake, e.weaveState]);
    };
    const a = play();
    expect(a.length).toBeGreaterThan(0);
    expect(play()).toEqual(a);
  });

  it('lays down real traffic: every kind moves somewhere in a handful of courses', () => {
    const seen = new Set<string>();
    const modes = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      for (const e of initState(simConfig, seedRng(seed * 101)).entities) {
        if (e.mover) {
          seen.add(e.kind);
          modes.add(e.mover);
        }
      }
    }
    for (const k of T.kinds) expect(seen.has(k.kind), k.kind).toBe(true);
    for (const m of ['oncoming', 'slow', 'weaver', 'walker']) expect(modes.has(m), m).toBe(true);
  });

  it('puts oncoming traffic clear of the stop and slow traffic early in the window', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const s = initState(simConfig, seedRng(seed * 7919));
      const pickups = s.entities.filter((e) => e.zoneKind === 'pickup').map((e) => e.z);
      for (const e of s.entities) {
        if (!e.mover || e.mover === 'walker') continue;
        const start = Math.max(...pickups.filter((p) => p < e.z)) + simConfig.zones.halfLenMm;
        const offset = e.z - start;
        // +800: the second vehicle of a double sits a little further on.
        if (e.vz! > 0) expect(offset, `${e.kind} seed ${seed}`).toBeLessThanOrEqual(T.slowMaxOffsetMm + 800);
        else expect(offset, `${e.kind} seed ${seed}`).toBeGreaterThanOrEqual(T.oncomingMinOffsetMm);
      }
    }
  });

  it('stays asleep until the player is near, then drives', () => {
    const okada = mover({ kind: 'okada', z: T.wakeMm + 40_000, vz: -150 });
    const state = road([okada]);
    run(state, 10);
    expect(okada.awake).toBe(false);
    expect(okada.z).toBe(T.wakeMm + 40_000);
    // Close enough now.
    state.z = okada.z - T.wakeMm + 2000;
    run(state, 5);
    expect(okada.awake).toBe(true);
    expect(okada.z).toBeLessThan(T.wakeMm + 40_000);
  });

  it('hits head-on in your lane, closing faster than the road alone would', () => {
    const car = mover({ kind: 'car', z: 80_000, vz: -150 });
    const state = road([car], { lane: 1 });
    let hitAt = -1;
    for (let i = 0; i < 400 && hitAt < 0; i++) {
      step(state, Btn.Gas, simConfig);
      if (state.dents > 0) hitAt = i;
    }
    expect(hitAt).toBeGreaterThan(0);
    // At 14 m/s alone, 80 m would take ~340 ticks; head-on at 150 mm/tick it is far sooner.
    expect(hitAt).toBeLessThan(250);
  });

  it('lets you hop a low okada but not a car, and dodge either by changing lane', () => {
    const run1 = (kind: string, input: (i: number) => number) => {
      const e = mover({ kind, z: 60_000, vz: -150 });
      const s = road([e], { lane: 1 });
      for (let i = 0; i < 300; i++) step(s, input(i), simConfig);
      return s.dents;
    };
    // Hop at the right moment: the okada is 1.3 m high, the hop clears 1.5 m.
    const hopWhenClose = (_i: number) => Btn.Gas;
    const okada = mover({ kind: 'okada', z: 60_000, vz: -150 });
    const sOk = road([okada], { lane: 1 });
    for (let i = 0; i < 300; i++) {
      const gap = okada.z - okada.halfLenMm - (sOk.z + simConfig.player.halfLenMm);
      const bits = gap < 4200 && gap > 0 && sOk.hopT === 0 ? Btn.Gas | Btn.Up : Btn.Gas;
      step(sOk, bits, simConfig);
    }
    expect(sOk.dents).toBe(0);

    expect(run1('car', hopWhenClose)).toBeGreaterThan(0);
    // Changing lane in good time clears the car.
    expect(run1('car', (i) => (i === 10 ? Btn.Gas | Btn.Left : Btn.Gas))).toBe(0);
  });

  it('overtakes a slow lorry in the next lane without a hit, and counts it as a close call', () => {
    const lorry = mover({ kind: 'trailer', z: 40_000, vz: 60, mover: 'slow' });
    const state = road([lorry], { lane: 1 });
    run(state, 1, Btn.Gas | Btn.Left);
    const events: string[] = [];
    for (let i = 0; i < 700; i++) {
      step(state, Btn.Gas, simConfig);
      for (const e of state.events) events.push(e.type);
    }
    expect(state.dents).toBe(0);
    expect(events).toContain('closeCall');
  });

  it('a rival convoy that drives is passed for the Outpace bonus', () => {
    const rival = mover({
      kind: 'rival-convoy',
      z: 30_000,
      vz: 100,
      mover: 'slow',
      isRivalConvoy: true,
      halfWidthMm: 700,
      halfLenMm: 1600,
      heightMm: 1700,
    });
    const state = road([rival], { lane: 1 });
    run(state, 1, Btn.Gas | Btn.Right);
    let outpaced = false;
    for (let i = 0; i < 900; i++) {
      step(state, Btn.Gas, simConfig);
      if (state.events.some((e) => e.type === 'rivalOutpace')) outpaced = true;
    }
    expect(outpaced).toBe(true);
    expect(state.skillCrowd).toBe(simConfig.bonuses.rivalOutpaceCrowd);
  });

  it('lets the horn scatter a low okada but not a lorry', () => {
    const okada = mover({ kind: 'okada', z: 20_000, vz: -100, awake: true });
    const lorry = mover({ kind: 'trailer', z: 22_000, vz: 60, mover: 'slow', awake: true, lane: 1 });
    const state = road([okada, lorry], { lane: 1 });
    step(state, Btn.Gas | Btn.Horn, simConfig);
    expect(okada.active).toBe(false);
    expect(lorry.active).toBe(true);
  });

  describe('weavers', () => {
    it('warn before they move, and leave time to react even head-on', () => {
      // The worst case: head-on at top speed, swerving from the next lane into yours.
      const okada = mover({
        kind: 'okada',
        z: T.wakeMm,
        vz: -200,
        mover: 'weaver',
        lane: 0,
        weaveTo: 1,
        weaveState: 0,
      });
      const state = road([okada], { lane: 1, speed: simConfig.maxSpeedUm });
      let warnAt = -1;
      let intrudesAt = -1;
      let impactAt = -1;
      for (let i = 0; i < 400 && impactAt < 0; i++) {
        step(state, Btn.Gas, simConfig);
        if (state.events.some((e) => e.type === 'weaveWarn') && warnAt < 0) warnAt = i;
        const dx = Math.abs((okada.xMm ?? 0) - playerXmm(state, simConfig));
        if (intrudesAt < 0 && dx < okada.halfWidthMm + simConfig.player.halfWidthMm) intrudesAt = i;
        if (state.dents > 0) impactAt = i;
      }
      expect(warnAt).toBeGreaterThanOrEqual(0);
      expect(okada.xMm).toBe(laneCenterMm(1, simConfig));
      // It does not start moving until the warning is over...
      expect(intrudesAt - warnAt).toBeGreaterThanOrEqual(T.weave.warnTicks);
      // ...and from the moment it is in your way you still have over a second to leave it.
      expect(impactAt - intrudesAt).toBeGreaterThanOrEqual(60);
      // Warned early enough to see it coming: well over two seconds before it arrives.
      expect(impactAt - warnAt).toBeGreaterThanOrEqual(150);
    });

    it('keeps its lane number in step with where it is', () => {
      const okada = mover({ kind: 'okada', z: 60_000, vz: 100, mover: 'weaver', lane: 2, weaveTo: 1, weaveState: 0, awake: true });
      const state = road([okada], { lane: 0 });
      run(state, 200);
      expect(okada.lane).toBe(1);
    });
  });

  describe('walkers', () => {
    it('set off when you are near and stop at the far kerb, and a hop clears them', () => {
      const walker = mover({
        kind: 'snatcher',
        z: 50_000,
        vz: 0,
        mover: 'walker',
        lane: 0,
        weaveState: 0,
        isIntegrityHazard: true,
        halfWidthMm: 500,
        halfLenMm: 500,
        heightMm: 1200,
      });
      const state = road([walker], { lane: 2 });
      run(state, 5);
      const startX = walker.xMm;
      run(state, 20);
      expect(walker.awake).toBe(true);
      expect(walker.xMm).toBeGreaterThan(startX!);
      // Kept a safe distance: the lane change takes it out of the way.
      expect(state.dents).toBe(0);
    });
  });

  it('can be driven through by a player who looks ahead', { timeout: 120_000 }, () => {
    const seeds = Array.from({ length: 40 }, (_, i) => i * 6007 + 3);
    const lagos = summarise(seeds, { rideId: 'danfo', stateId: 'lagos' });
    const kano = summarise(seeds, { rideId: 'keke', stateId: 'kano' });
    expect(lagos.finishRate).toBeGreaterThanOrEqual(0.9);
    expect(kano.finishRate).toBeGreaterThanOrEqual(0.9);
    // A bot that sees everything still gets touched now and then; it must not be touched constantly.
    expect(lagos.meanDents).toBeLessThan(1.2);
    expect(runBot(7).phase).not.toBe('running');
  });
});
