import { describe, expect, it } from 'vitest';
import { simConfig } from '@cr/content';
import { Btn, initState, seedRng, step, type SimState } from '../src';

const chaos = simConfig.chaos;
const agberos = (s: SimState) => s.entities.filter((e) => e.isToll);
const venues = (s: SimState) => s.entities.filter((e) => e.zoneKind === 'venue');

/** A state with only the zones and one agbero, the player already inside its footprint. */
function onAgbero(carried: number) {
  const state = initState(simConfig, seedRng(7));
  const toll = agberos(state)[0]!;
  state.entities = state.entities.filter((e) => e.isZone || e === toll);
  state.z = toll.z - 900;
  state.laneX = toll.lane * 1000;
  state.targetLane = toll.lane;
  state.carried = carried;
  return { state, toll };
}

describe('chaos moments', () => {
  it('place the same agbero tolls on every seed, without a roll', () => {
    const layouts = [1, 2, 99, 123456].map((seed) =>
      agberos(initState(simConfig, seedRng(seed))).map((e) => [e.lane, e.z]),
    );
    expect(layouts[0]!.length).toBe(Math.floor(simConfig.course.segmentCount / chaos.agberoEverySegments));
    for (const l of layouts) expect(l).toEqual(layouts[0]);
  });

  it('mark every Nth venue as stubborn, and only venues', () => {
    const state = initState(simConfig, seedRng(5));
    const flags = venues(state).map((v) => v.stubborn === true);
    flags.forEach((stubborn, s) => expect(stubborn).toBe(s % chaos.stubbornEverySegments === chaos.stubbornEverySegments - 1));
    expect(state.entities.filter((e) => e.stubborn && e.zoneKind !== 'venue')).toEqual([]);
  });

  it('cost load and speed on a hit, but never a dent', () => {
    const { state } = onAgbero(10);
    state.speed = simConfig.baseSpeedUm;
    step(state, 0, simConfig);
    expect(state.events.some((e) => e.type === 'toll')).toBe(true);
    expect(state.dents).toBe(0);
    expect(state.phase).toBe('running');
    expect(state.carried).toBe(10 - Math.floor((10 * chaos.tollDropPermille) / 1000));
    expect(state.speed).toBeLessThan(simConfig.baseSpeedUm);
  });

  it('pay a little Turnout for a clean pass, and not for a hit', () => {
    const { state, toll } = onAgbero(0);
    const other = ((toll.lane + 1) % 3) as 0 | 1 | 2;
    state.laneX = other * 1000;
    state.targetLane = other;
    state.z = toll.z + simConfig.spawn.despawnBehindMm + 2000;
    step(state, 0, simConfig);
    expect(state.events.some((e) => e.type === 'tollDodged')).toBe(true);
    expect(state.skillCrowd).toBe(chaos.tollDodgeCrowd);

    const hit = onAgbero(0);
    step(hit.state, 0, simConfig);
    hit.state.z = hit.toll.z + simConfig.spawn.despawnBehindMm + 2000;
    step(hit.state, 0, simConfig);
    expect(hit.state.skillCrowd).toBe(0);
  });

  it('make a stubborn venue slower to unload than a plain one', () => {
    const needed = (stubborn: boolean) => {
      const state = initState(simConfig, seedRng(3));
      const venue = venues(state).find((v) => (v.stubborn === true) === stubborn)!;
      state.entities = state.entities.filter((e) => e.isZone);
      state.z = venue.z - 500;
      state.speed = simConfig.zones.brakeToActSpeedUm;
      step(state, Btn.Brake, simConfig);
      return { needed: state.zoneNeeded, stubbornEvent: state.events.some((e) => e.type === 'stubborn') };
    };
    const plain = needed(false);
    const slow = needed(true);
    expect(plain.stubbornEvent).toBe(false);
    expect(slow.stubbornEvent).toBe(true);
    expect(slow.needed).toBe(Math.floor((plain.needed * (1000 + chaos.stubbornExtraPermille)) / 1000));
  });
});
