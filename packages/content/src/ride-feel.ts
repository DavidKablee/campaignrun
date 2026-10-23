import type { Ride } from './schemas';

/**
 * What a ride is like to drive, in words the player can read.
 *
 * Before C44 a ride was its capacity and a sentence of flavour text: the sim
 * knew about `size`, `ploughsLight`, `freeHitPerRun` and `magnetBonusMm` and
 * nothing else, so every rung of the ladder handled identically and a keke was
 * a danfo with fewer seats. The handling numbers added in C44 live in
 * `rides.json` as permille of the sim's own base values, which makes them
 * precise for `step()` and meaningless to a player — so the translation into
 * "Lane change, 30% worse" happens here, once, rather than in whichever screen
 * happens to show a ride.
 *
 * Pure and content-only: no React, no sim import. The sim takes the resolved
 * numbers through `rideSimTraits` and never reads this module.
 */

export type StatTone = 'up' | 'down' | 'even';

export interface RideStat {
  id: string;
  /** Short enough for a card row. */
  label: string;
  /** Permille of the sim's base value for this stat. 1000 = the base. */
  permille: number;
  /** False for the two stats a player wants *low* — scatter and rival traffic. */
  higherIsBetter: boolean;
  /** Signed percentage away from the base, for display: -30 reads "30% worse". */
  deltaPercent: number;
  /** 'up' = better than the baseline ride, whichever direction the number went. */
  tone: StatTone;
}

interface StatDef {
  id: string;
  label: string;
  higherIsBetter: boolean;
  read: (ride: Ride) => number;
}

/**
 * Order matters: this is the order the stats appear on a ride card, handling
 * first and costs last.
 */
const STATS: StatDef[] = [
  { id: 'lane-change', label: 'Lane change', higherIsBetter: true, read: (r) => r.handling.laneChangePermille },
  { id: 'pickup', label: 'Pickup', higherIsBetter: true, read: (r) => r.handling.accelPermille },
  { id: 'top-speed', label: 'Top speed', higherIsBetter: true, read: (r) => r.handling.topSpeedPermille },
  { id: 'braking', label: 'Braking', higherIsBetter: true, read: (r) => r.handling.brakeDecelPermille },
  { id: 'hop', label: 'Hop airtime', higherIsBetter: true, read: (r) => r.handling.hopPermille },
  {
    id: 'scatter',
    label: 'Crowd scattered by a knock',
    higherIsBetter: false,
    read: (r) => r.hitDropPermille,
  },
  { id: 'rival-draw', label: 'Rival attention', higherIsBetter: false, read: (r) => r.rivalDrawPermille },
];

function toneFor(permille: number, higherIsBetter: boolean): StatTone {
  if (permille === 1000) return 'even';
  const better = permille > 1000 ? higherIsBetter : !higherIsBetter;
  return better ? 'up' : 'down';
}

/** Every stat, baseline ones included. */
export function rideStats(ride: Ride): RideStat[] {
  return STATS.map((def) => {
    const permille = def.read(ride);
    return {
      id: def.id,
      label: def.label,
      permille,
      higherIsBetter: def.higherIsBetter,
      deltaPercent: Math.round(permille / 10) - 100,
      tone: toneFor(permille, def.higherIsBetter),
    };
  });
}

/**
 * Only the stats that differ from the baseline — what a card should show. The
 * keke is the baseline, so this is empty for it, which is the honest reading of
 * "Balanced" rather than seven rows of 0%.
 */
export function rideDifferences(ride: Ride): RideStat[] {
  return rideStats(ride).filter((s) => s.tone !== 'even');
}

/**
 * Everything the sim needs to know about a ride, under the names `initState`
 * expects.
 *
 * One function because two callers have to agree exactly: the live run and the
 * ghost re-simulation. The ghost replays a stored input log, so a handling
 * number it fails to apply puts the ghost car somewhere the player never drove.
 * Until C44 both call sites spelled the same eight fields out by hand.
 */
export function rideSimTraits(ride: Ride) {
  return {
    capacity: ride.capacity,
    rideSize: ride.size,
    ridePloughsLight: ride.ploughsLight,
    rideFreeHit: ride.freeHitPerRun,
    rideMagnetBonusMm: ride.magnetBonusMm,
    rideHandling: ride.handling,
    rideHitDropPermille: ride.hitDropPermille,
    rideRivalDrawPermille: ride.rivalDrawPermille,
  };
}
