import { describe, it, expect } from 'vitest';
import { simConfig, activeContenders, rides } from '@cr/content';
import { initState, step, seedRng, Btn } from '../src';

/**
 * Equal-power check: same clean course (zones only), same inputs, no hazard RNG.
 * Perk toys that rewrite the road are out of scope here; tradeoffs must stay mild.
 */
function runClean(seedNum: number, contenderId: string, capacity: number): number {
  const state = initState(simConfig, seedRng(seedNum), { contenderId, capacity });
  state.entities = state.entities.filter((e) => e.isZone);
  let ticks = 0;
  const MAX_TICKS = simConfig.tickHz * 120;
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
  it('active Contenders stay within ±3% mean Crowd on trek (clean course)', () => {
    const RUNS = 200;
    const trek = rides.find((r) => r.id === 'trek')!;
    const averages = new Map<string, number>();

    for (const c of activeContenders) {
      let sum = 0;
      for (let i = 0; i < RUNS; i++) {
        sum += runClean(i * 997 + 17, c.id, trek.capacity);
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
