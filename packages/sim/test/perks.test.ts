import { describe, it, expect } from 'vitest';
import { simConfig } from '@cr/content';
import { initState, step, seedRng, Btn } from '../src';

describe('Contender perks', () => {
  it('market-weave steers out of a blocked lane', () => {
    const state = initState(simConfig, seedRng(1), { contenderId: 'baba-bullabaa' });
    state.perkActiveTicks = 120;
    state.targetLane = 1;
    state.entities.push({
      id: 9001,
      kind: 'cones',
      lane: 1,
      z: state.z + 20_000,
      halfWidthMm: 400,
      halfLenMm: 400,
      heightMm: 600,
      active: true,
      isPickup: false,
      isZone: false,
      isIntegrityHazard: false,
      value: 0,
      consumed: false,
    });
    step(state, Btn.Gas, simConfig);
    expect(state.targetLane).not.toBe(1);
  });

  it('reboot prevents breakdown once when ready', () => {
    const state = initState(simConfig, seedRng(2), { contenderId: 'mr-tiko' });
    state.dents = simConfig.hit.maxDents - 1;
    state.perkCooldownTicks = 0;
    state.invulnTicks = 0;
    state.entities.push({
      id: 9002,
      kind: 'danfo',
      lane: 1,
      z: state.z,
      halfWidthMm: configHalf(state),
      halfLenMm: 1100,
      heightMm: 2400,
      active: true,
      isPickup: false,
      isZone: false,
      isIntegrityHazard: false,
      value: 0,
      consumed: false,
    });
    // Align player on centre lane X
    state.laneX = 1000;
    state.targetLane = 1;
    step(state, Btn.Gas, simConfig);
    expect(state.phase).toBe('running');
    expect(state.dents).toBeLessThan(simConfig.hit.maxDents);
    expect(state.perkCooldownTicks).toBeGreaterThan(0);
  });

  it('steady-beat advances less z than a normal tick at same speed', () => {
    const a = initState(simConfig, seedRng(3), { contenderId: 'prof-sarah' });
    const b = initState(simConfig, seedRng(3), { contenderId: 'prof-sarah' });
    a.speed = b.speed = simConfig.maxSpeedUm;
    a.perkActiveTicks = 120;
    const za = a.z;
    const zb = b.z;
    step(a, Btn.Gas, simConfig);
    step(b, Btn.Gas, simConfig);
    expect(a.z - za).toBeLessThan(b.z - zb);
  });

  it('horn clears hoppable clutter ahead', () => {
    const state = initState(simConfig, seedRng(4), { contenderId: 'comrade-yale' });
    state.hornCooldownTicks = 0;
    state.entities.push({
      id: 9003,
      kind: 'cones',
      lane: 1,
      z: state.z + 10_000,
      halfWidthMm: 400,
      halfLenMm: 400,
      heightMm: 600,
      active: true,
      isPickup: false,
      isZone: false,
      isIntegrityHazard: false,
      value: 0,
      consumed: false,
    });
    step(state, Btn.Horn, simConfig);
    expect(state.entities.find((e) => e.id === 9003)?.active).toBe(false);
    expect(state.hornCooldownTicks).toBeGreaterThan(0);
  });
});

function configHalf(state: { laneX: number }): number {
  // Wide enough to overlap the player AABB on the centre lane.
  return Math.max(500, Math.abs(state.laneX) + simConfig.player.halfWidthMm);
}
