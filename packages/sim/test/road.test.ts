import { describe, expect, it } from 'vitest';
import { rideSimTraits, rides, roadProfile, simConfig, type Hazard } from '@cr/content';
import { Btn, buildCourse, checkCollision, initState, seedRng, step, type RoadProfile } from '../src';

const ride = (id: string) => rides.find((r) => r.id === id)!;

/** The real hazard sets of three shipped states, named for what they test. */
const FLOODED: Hazard[] = ['flood-sheet', 'creek-crossing', 'go-slow']; // Bayelsa
const PACKED: Hazard[] = ['crowd-surge', 'rain-slick', 'go-slow']; // Cross River
const BLIND: Hazard[] = ['dust-storm', 'low-visibility', 'go-slow']; // Borno
const BENDS: Hazard[] = ['switchback', 'rocky-ridge', 'go-slow']; // Adamawa

function startState(id: string, hazards: Hazard[] | RoadProfile, seed = 4242) {
  const road = Array.isArray(hazards) ? roadProfile(hazards) : hazards;
  return initState(simConfig, seedRng(seed), { ...rideSimTraits(ride(id)), road });
}

/** A run on a clean road (zones only): isolates handling from the obstacle mix. */
function cleanRun(id: string, hazards: Hazard[], input: number, ticks: number) {
  const state = startState(id, hazards);
  state.entities = state.entities.filter((e) => e.isZone);
  for (let i = 0; i < ticks; i++) step(state, input, simConfig);
  return state;
}

/** Everything the course generator laid down across `seeds` runs, by kind. */
function obstacleMix(hazards: Hazard[], seeds = 30): { total: number; byKind: Record<string, number> } {
  const byKind: Record<string, number> = {};
  let total = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const state = startState('keke', hazards, seed * 7919 + 3);
    for (const e of state.entities) {
      if (e.isZone) continue;
      byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
      total++;
    }
  }
  return { total, byKind };
}

/**
 * C45. Until this chunk a state's `hazards` were three words of flavour that
 * nothing read: every one of the 38 states generated the same road from the
 * same table, so the only reason to change ride was the seat count. The road
 * now reweights that table and multiplies the player's own handling.
 */
describe('C45: the road differs per state', () => {
  it('a state with no hazards is the road the sim always had', () => {
    const withNeutral = startState('keke', []);
    const withNothing = initState(simConfig, seedRng(4242), { ...rideSimTraits(ride('keke')) });
    buildCourse(withNeutral, simConfig);
    buildCourse(withNothing, simConfig);
    expect(JSON.stringify(withNeutral.entities)).toBe(JSON.stringify(withNothing.entities));
  });

  it('a flood state is actually full of floodwater', () => {
    const flooded = obstacleMix(FLOODED);
    const plain = obstacleMix([]);
    // 2600 x 1800 permille, clamped to 4000 — but the rest of the table grows
    // a little too (go-slow adds traffic), so the honest measure is the share
    // of the road that is water, not the raw count.
    expect(flooded.byKind['flood-patch']! / flooded.total).toBeGreaterThan(
      2.5 * (plain.byKind['flood-patch']! / plain.total),
    );
  });

  it('floodwater is what makes a big ride the wrong ride there', () => {
    // C26 already blocks size L on a flood patch and lets S/M through. C45
    // only changes how much floodwater there is, which is the whole mechanism
    // of this chunk: the road leans on rules the sim already has.
    const walls = (id: string, hazards: Hazard[]) => {
      const state = startState(id, hazards, 9001);
      let blocked = 0;
      for (const e of state.entities.filter((x) => x.sizeTag === 'flood')) {
        state.z = e.z;
        state.targetLane = e.lane;
        state.laneX = e.lane * 1000;
        state.hopT = 0;
        if (checkCollision(state, simConfig)?.id === e.id) blocked++;
      }
      return blocked;
    };
    expect(walls('coaster', FLOODED)).toBeGreaterThan(walls('coaster', []));
    expect(walls('keke', FLOODED)).toBe(0);
  });

  it('a packed road puts more in your way than an open one', () => {
    expect(obstacleMix(PACKED).total).toBeGreaterThan(obstacleMix([]).total);
  });

  it('a road that hides what is coming blocks two lanes at once more often', () => {
    const pairs = (hazards: Hazard[]) => {
      let found = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const state = startState('keke', hazards, seed * 104729 + 11);
        const solid = state.entities.filter((e) => !e.isZone).sort((a, b) => a.z - b.z);
        for (let i = 1; i < solid.length; i++) {
          if (solid[i]!.z - solid[i - 1]!.z <= 1000 && solid[i]!.lane !== solid[i - 1]!.lane) found++;
        }
      }
      return found;
    };
    expect(pairs(BLIND)).toBeGreaterThan(pairs([]));
  });

  it('the road lowers the ride ceiling, and the two multiply', () => {
    const coaster = ride('coaster');
    const road = roadProfile(FLOODED);
    const expected = Math.floor(
      (Math.floor((simConfig.maxSpeedUm * coaster.handling.topSpeedPermille) / 1000) * road.topSpeedPermille) / 1000,
    );
    const state = cleanRun('coaster', FLOODED, Btn.Gas, 600);
    expect(state.speed).toBe(expected);
    expect(state.speed).toBeLessThan(cleanRun('coaster', [], Btn.Gas, 600).speed);
  });

  it('never takes the gas away: every ride still outruns its own coast speed', () => {
    // The failure this guards is a road that multiplies a slow ride below the
    // coast speed, where the speed clamp pins it and the gas pedal stops
    // meaning anything. The clamps in road.json are what prevent it.
    for (const hazards of [FLOODED, PACKED, BLIND, BENDS]) {
      for (const r of rides) {
        const state = cleanRun(r.id, hazards, Btn.Gas, 600);
        expect(state.speed, `${r.id} on ${hazards.join('+')}`).toBeGreaterThan(simConfig.baseSpeedUm);
      }
    }
  });

  it('every ride still builds momentum to the maximum on every kind of road', () => {
    // C44 found momentum had never worked because its threshold was measured
    // against a speed the clamp made unreachable. The road multiplies that
    // ceiling again, so the same cliff is one bad number away.
    for (const hazards of [FLOODED, PACKED, BLIND, BENDS]) {
      for (const r of rides) {
        const state = cleanRun(r.id, hazards, Btn.Gas, 900);
        expect(state.momentum, `${r.id} on ${hazards.join('+')}`).toBe(simConfig.momentum.max);
      }
    }
  });

  it('a road of tight bends slows every lane change on it', () => {
    const ticksToLane = (hazards: Hazard[]) => {
      const state = startState('keke', hazards, 1);
      state.entities = state.entities.filter((e) => e.isZone);
      let t = 0;
      step(state, Btn.Left, simConfig);
      while (state.laneX > 0 && t < 600) {
        step(state, Btn.Left, simConfig);
        t++;
      }
      return t;
    };
    expect(ticksToLane(BENDS)).toBeGreaterThan(ticksToLane([]));
  });

  it('a slick road lengthens the brake into a zone', () => {
    const toBrakeSpeed = (hazards: Hazard[]) => {
      const state = cleanRun('keke', hazards, Btn.Gas, 600);
      let t = 0;
      while (state.speed > simConfig.zones.brakeToActSpeedUm && t < 600) {
        step(state, Btn.Brake, simConfig);
        t++;
      }
      return t;
    };
    // Cross River is rain-slick: 820 permille of the brake, so the same stop
    // takes more ticks even though it starts from a lower top speed.
    expect(toBrakeSpeed(PACKED)).toBeGreaterThan(toBrakeSpeed([]));
  });

  it('is deterministic per road, which is what the ghost replay rests on', () => {
    const fingerprint = (hazards: Hazard[]) => {
      const state = startState('keke', hazards, 77);
      for (let i = 0; i < 1200; i++) step(state, i % 120 < 60 ? Btn.Gas : Btn.Gas | Btn.Left, simConfig);
      return `${state.z}:${state.laneX}:${state.speed}:${state.entities.length}`;
    };
    expect(fingerprint(FLOODED)).toBe(fingerprint(FLOODED));
    expect(fingerprint(FLOODED)).not.toBe(fingerprint([]));
  });

  it('a hazard can make an obstacle rare, never delete it from the road', () => {
    // Hand-built, not from a pack: the floor is in the generator, so it has to
    // hold for a road no shipped state produces.
    const starved: RoadProfile = { ...roadProfile([]), obstacleWeightPermille: { pothole: 200 } };
    let potholes = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const state = startState('keke', { ...starved }, seed * 31 + 5);
      potholes += state.entities.filter((e) => e.kind === 'pothole').length;
    }
    expect(potholes).toBeGreaterThan(0);
  });
});
