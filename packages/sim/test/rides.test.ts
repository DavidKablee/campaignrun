import { describe, expect, it } from 'vitest';
import { rideSimTraits, rides, simConfig } from '@cr/content';
import { Btn, initState, seedRng, step } from '../src';

const ride = (id: string) => rides.find((r) => r.id === id)!;

/** A run on a clean road (zones only), so nothing here depends on hazard RNG. */
function cleanRun(id: string, input: number, ticks: number) {
  const state = initState(simConfig, seedRng(4242), { ...rideSimTraits(ride(id)) });
  state.entities = state.entities.filter((e) => e.isZone);
  for (let i = 0; i < ticks; i++) step(state, input, simConfig);
  return state;
}

/**
 * C44. Before this chunk the sim knew four things about a ride — its size
 * class, whether it ploughed light barriers, whether it ate one hit, and its
 * magnet radius — so the seven rides on the ladder all drove identically and
 * differed only in how many people they seated. These are the differences.
 */
describe('C44: rides drive differently', () => {
  it('a heavier ride takes longer to cross a lane', () => {
    const okada = cleanRun('okada', Btn.Left, 1);
    const grand = cleanRun('grand-convoy', Btn.Left, 1);
    // One tick of travel each: the light ride has moved further off centre.
    expect(1000 - okada.laneX).toBeGreaterThan(1000 - grand.laneX);

    const ticksToLane = (id: string) => {
      const state = initState(simConfig, seedRng(1), { ...rideSimTraits(ride(id)) });
      let t = 0;
      step(state, Btn.Left, simConfig);
      while (state.laneX > 0 && t < 600) {
        step(state, Btn.Left, simConfig);
        t++;
      }
      return t;
    };
    expect(ticksToLane('grand-convoy')).toBeGreaterThan(ticksToLane('okada'));
  });

  it('each ride tops out at its own ceiling', () => {
    const top = (id: string) => cleanRun(id, Btn.Gas, 600).speed;
    expect(top('okada')).toBeGreaterThan(top('keke'));
    expect(top('keke')).toBeGreaterThan(top('grand-convoy'));
    expect(top('grand-convoy')).toBeGreaterThan(top('trek'));
    // The ceiling is the config's top speed scaled by the ride, nothing else.
    for (const r of rides) {
      const expected = Math.floor((simConfig.maxSpeedUm * r.handling.topSpeedPermille) / 1000);
      expect(top(r.id)).toBe(expected);
    }
  });

  it('a heavier ride is slower to pick up speed', () => {
    const after = (id: string) => cleanRun(id, Btn.Gas, 10).speed;
    expect(after('okada')).toBeGreaterThan(after('keke'));
    expect(after('keke')).toBeGreaterThan(after('coaster'));
  });

  it('a heavier ride has to brake earlier for a load zone', () => {
    const ticksToLoadSpeed = (id: string) => {
      const state = initState(simConfig, seedRng(9), { ...rideSimTraits(ride(id)) });
      state.entities = state.entities.filter((e) => e.isZone);
      for (let i = 0; i < 600; i++) step(state, Btn.Gas, simConfig);
      let t = 0;
      while (state.speed > simConfig.zones.brakeToActSpeedUm && t < 600) {
        step(state, Btn.Brake, simConfig);
        t++;
      }
      return t;
    };
    expect(ticksToLoadSpeed('grand-convoy')).toBeGreaterThan(ticksToLoadSpeed('keke'));
    expect(ticksToLoadSpeed('keke')).toBeGreaterThan(ticksToLoadSpeed('trek'));
  });

  it('a heavier ride gets less airtime out of a hop', () => {
    const airtime = (id: string) => cleanRun(id, Btn.Up, 1).hopT;
    expect(airtime('trek')).toBeGreaterThan(airtime('keke'));
    expect(airtime('keke')).toBeGreaterThan(airtime('grand-convoy'));
    // Never zero, whatever a pack asks for: a ride that cannot hop cannot play.
    for (const r of rides) expect(airtime(r.id)).toBeGreaterThan(0);
  });

  it('a knock scatters the share of the crowd the ride says it does', () => {
    const scattered = (id: string) => {
      const state = initState(simConfig, seedRng(11), { ...rideSimTraits(ride(id)) });
      state.entities = [
        {
          id: 9001,
          kind: 'car',
          lane: 1,
          z: state.z + 2000,
          halfWidthMm: 900,
          halfLenMm: 1600,
          heightMm: 1700,
          active: true,
        },
      ];
      state.carried = 100;
      for (let i = 0; i < 60 && state.carried === 100; i++) step(state, Btn.Gas, simConfig);
      return 100 - state.carried;
    };
    // The okada has nothing holding anyone on; the convoy barely spills.
    expect(scattered('okada')).toBeGreaterThan(scattered('keke'));
    expect(scattered('keke')).toBeGreaterThan(scattered('grand-convoy'));
    expect(scattered('okada')).toBe(35); // 250 permille x 1400 = 350 of 100 carried
  });

  it('every ride can still build momentum to the maximum', () => {
    // The regression this chunk found: the threshold was 1050 permille of the
    // config's top speed, which the speed clamp made unreachable, so momentum
    // sat at its minimum for every run ever played. Measuring it against the
    // ride's own ceiling is what keeps a slow ride from inheriting that cliff.
    for (const r of rides) {
      const state = cleanRun(r.id, Btn.Gas, 600);
      expect(state.momentum, r.id).toBe(simConfig.momentum.max);
    }
  });

  it('a Grand Convoy meets more rival traffic than a keke', () => {
    const rivals = (id: string) => {
      let total = 0;
      for (let seed = 0; seed < 40; seed++) {
        const state = initState(simConfig, seedRng(seed * 7919 + 3), { ...rideSimTraits(ride(id)) });
        total += state.entities.filter((e) => e.isRivalConvoy).length;
      }
      return total;
    };
    expect(rivals('grand-convoy')).toBeGreaterThan(rivals('keke'));
    expect(rivals('keke')).toBe(rivals('trek'));
  });

  it('is deterministic per ride, which is what the ghost replay rests on', () => {
    const fingerprint = (id: string) => {
      const state = initState(simConfig, seedRng(77), { ...rideSimTraits(ride(id)) });
      for (let i = 0; i < 1200; i++) {
        step(state, Btn.Gas | (i % 17 === 0 ? Btn.Left : 0) | (i % 29 === 0 ? Btn.Up : 0), simConfig);
      }
      return `${state.z}|${state.laneX}|${state.dents}|${state.skillCrowd}|${state.rng.a}`;
    };
    for (const r of rides) expect(fingerprint(r.id)).toBe(fingerprint(r.id));
    expect(fingerprint('keke')).not.toBe(fingerprint('grand-convoy'));
  });

  it('drives exactly as it did before C44 when a pack omits the handling block', () => {
    const neutral = initState(simConfig, seedRng(5), { capacity: 30 });
    for (let i = 0; i < 300; i++) step(neutral, Btn.Gas | (i % 13 === 0 ? Btn.Right : 0), simConfig);
    const keke = initState(simConfig, seedRng(5), { ...rideSimTraits(ride('keke')) });
    for (let i = 0; i < 300; i++) step(keke, Btn.Gas | (i % 13 === 0 ? Btn.Right : 0), simConfig);
    expect(`${keke.z}|${keke.laneX}|${keke.speed}`).toBe(`${neutral.z}|${neutral.laneX}|${neutral.speed}`);
  });
});
