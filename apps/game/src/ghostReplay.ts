import { initState, step, seedRng, decodeInputLog } from '@cr/sim';
import { rides, type SimConfig } from '@cr/content';
import { base64ToBytes, type GhostRecord } from './ghostStore';

export interface GhostFrame {
  laneX: number;
  z: number;
}

/**
 * Re-simulates a stored ghost's input log, tick by tick, and snapshots its position at every
 * tick. This runs once up front (fast — it's pure arithmetic, no rendering) so the render loop
 * can just index into the result by the live run's own tick counter. Positional only: the ghost
 * doesn't need the same course layout as the live run (different seed is fine — it's a replay
 * of a past run on this road, not a reaction to this run's hazards).
 */
export function computeGhostTrajectory(ghost: GhostRecord, config: SimConfig): GhostFrame[] {
  const ride = rides.find((r) => r.id === ghost.rideId) ?? rides[0]!;
  const records = decodeInputLog(base64ToBytes(ghost.log));
  const state = initState(config, seedRng(ghost.seed), {
    capacity: ride.capacity,
    contenderId: ghost.contenderId,
    rideSize: ride.size,
    ridePloughsLight: ride.ploughsLight,
    rideFreeHit: ride.freeHitPerRun,
    rideMagnetBonusMm: ride.magnetBonusMm,
  });
  const frames: GhostFrame[] = new Array(ghost.ticks);
  let ri = 0;
  let bits = 0;
  for (let tick = 0; tick < ghost.ticks; tick++) {
    while (ri < records.length && records[ri]!.tick === tick) {
      bits = records[ri]!.input;
      ri++;
    }
    frames[tick] = { laneX: state.laneX, z: state.z };
    step(state, bits, config);
  }
  return frames;
}
