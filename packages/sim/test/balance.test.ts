import { describe, it, expect } from 'vitest';
import {
  simConfig,
  activeContenders,
  rideSimTraits,
  rides,
  roadProfile,
  type Hazard,
  type Ride,
} from '@cr/content';
import { initState, step, seedRng, Btn } from '../src';

/**
 * Equal-power check: same clean course (zones only), same inputs, no hazard RNG.
 * Perk toys that rewrite the road are out of scope here; tradeoffs must stay mild.
 */
function runClean(seedNum: number, contenderId: string, ride: Ride, hazards: Hazard[] = []): number {
  // C44: through `rideSimTraits`, so the bot drives the handling the game
  // ships. Spelled out by hand, this call site silently tested a neutral
  // version of every ride. C45 adds the road the same way.
  const state = initState(simConfig, seedRng(seedNum), {
    contenderId,
    ...rideSimTraits(ride),
    road: roadProfile(hazards),
  });
  state.entities = state.entities.filter((e) => e.isZone);
  let ticks = 0;
  const MAX_TICKS = simConfig.tickHz * 400;
  while (state.phase === 'running' && ticks < MAX_TICKS) {
    let input: number = Btn.Gas;
    const nearZone = state.entities.find(
      (e) =>
        e.isZone &&
        !e.consumed &&
        (e.zoneKind === 'pickup' || e.zoneKind === 'venue' || e.zoneKind === 'grand') &&
        Math.abs(e.z - state.z) < simConfig.zones.halfLenMm + 4000,
    );
    if (nearZone) {
      input = Btn.Brake;
      if (nearZone.zoneKind !== 'pickup' && state.beatWindowTicks > 0) input |= Btn.Tap;
    }
    step(state, input, simConfig);
    ticks++;
  }
  return state.skillCrowd;
}

describe('C05 balance bot', () => {
  it('active Contenders stay within ±3% mean Crowd on trek (clean course)', { timeout: 60000 }, () => {
    const RUNS = 80;
    const trek = rides.find((r) => r.id === 'trek')!;
    const averages = new Map<string, number>();

    for (const c of activeContenders) {
      let sum = 0;
      for (let i = 0; i < RUNS; i++) {
        sum += runClean(i * 997 + 17, c.id, trek);
      }
      averages.set(c.id, sum / RUNS);
    }

    const values = [...averages.values()];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    expect(mean).toBeGreaterThan(0);

    for (const [id, avg] of averages) {
      const delta = Math.abs(avg - mean) / mean;
      expect(delta, `${id} avg=${avg.toFixed(2)} mean=${mean.toFixed(2)}`).toBeLessThanOrEqual(0.03);
    }
  });
});

describe('C26 balance bot — all 7 ride classes', () => {
  // Acceptance criteria #4 from the spec: ±3% mean Crowd parity per Contender,
  // per ride class, never actually checked past trek before this chunk.
  const RUNS = 60;

  for (const ride of rides) {
    it(`active Contenders stay within ±3% mean Crowd on ${ride.id} (${ride.rideClass}, clean course)`, { timeout: 60000 }, () => {
      const averages = new Map<string, number>();
      for (const c of activeContenders) {
        let sum = 0;
        for (let i = 0; i < RUNS; i++) {
          sum += runClean(i * 619 + 31, c.id, ride);
        }
        averages.set(c.id, sum / RUNS);
      }

      const values = [...averages.values()];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      expect(mean).toBeGreaterThan(0);

      for (const [id, avg] of averages) {
        const delta = Math.abs(avg - mean) / mean;
        expect(delta, `${ride.id}/${id} avg=${avg.toFixed(2)} mean=${mean.toFixed(2)}`).toBeLessThanOrEqual(0.03);
      }
    });
  }
});

describe('C45 balance bot — the hardest shipped roads', () => {
  // Guardrail 5 says the six Contenders are statistically equal. C45 lets a
  // state multiply top speed, pickup, braking and lane change for the whole
  // run, and two of the six trade on exactly those stats — so parity has to be
  // re-checked somewhere other than a neutral road.
  const RUNS = 120;
  const ROADS: { name: string; hazards: Hazard[] }[] = [
    { name: 'Adamawa (switchback, rocky ridge)', hazards: ['switchback', 'rocky-ridge', 'go-slow'] },
    { name: 'Borno (dust storm, low visibility)', hazards: ['dust-storm', 'low-visibility', 'go-slow'] },
    { name: 'Bayelsa (flood sheet, creek crossing)', hazards: ['flood-sheet', 'creek-crossing', 'go-slow'] },
  ];

  for (const road of ROADS) {
    it(`active Contenders stay within ±3% mean Crowd on ${road.name}`, () => {
      const keke = rides.find((r) => r.id === 'keke')!;
      const averages = new Map<string, number>();
      for (const c of activeContenders) {
        let sum = 0;
        for (let i = 0; i < RUNS; i++) sum += runClean(i * 619 + 31, c.id, keke, road.hazards);
        averages.set(c.id, sum / RUNS);
      }

      const values = [...averages.values()];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      expect(mean).toBeGreaterThan(0);
      for (const [id, avg] of averages) {
        const delta = Math.abs(avg - mean) / mean;
        expect(delta, `${road.name}/${id} avg=${avg.toFixed(2)} mean=${mean.toFixed(2)}`).toBeLessThanOrEqual(0.03);
      }
    });
  }
});
