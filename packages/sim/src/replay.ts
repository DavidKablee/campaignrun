import {
  contenders,
  rideSimTraits,
  rides,
  roadProfile,
  runConfig,
  runModifiers,
  stateRoad,
  type SimConfig,
  type UpgradeLevels,
} from '@cr/content';
import type { InputRecord } from './inputlog';
import { seedRng } from './rng';
import { initState, step } from './step';

/**
 * Everything a run depends on besides the player's thumbs. The course is a pure
 * function of the seed and the state is a pure function of these inputs, so a
 * claimed score can be checked by playing the same inputs again.
 */
export interface ReplaySpec {
  seed: number;
  log: InputRecord[];
  stateId: string;
  rideId: string;
  contenderId: string;
  upgrades: UpgradeLevels;
  /** Rally Saturday's ×2 window was open when the run started. */
  rallySaturday: boolean;
  /** A quick rally: the short course. Only the client's casual modes use it. */
  quick?: boolean;
}

export interface ReplayResult {
  phase: 'finished' | 'breakdown' | 'running';
  ticks: number;
  skillCrowd: number;
  displayCrowd: number;
  delivered: number;
  dents: number;
  integrity: number;
}

/** Ten minutes of play. A run is ~3 minutes; this only stops a log that never ends the run. */
const MAX_REPLAY_SECONDS = 600;

/**
 * Plays a recorded input log back and reports where it ended up.
 *
 * It builds the run exactly as the game does (same ride traits, same road, same
 * upgrades, same signature-ride bonus), so any difference in the result is a
 * different run, not a different setup. Returns null when the spec names a
 * state, ride or Contender that does not exist.
 */
export function replayRun(config: SimConfig, spec: ReplaySpec): ReplayResult | null {
  const road = stateRoad(spec.stateId);
  const ride = rides.find((r) => r.id === spec.rideId);
  if (!road || !ride || !contenders.some((c) => c.id === spec.contenderId)) return null;

  const cfg = runConfig(config, spec.quick === true);
  const state = initState(cfg, seedRng(spec.seed), {
    ...rideSimTraits(ride),
    road: roadProfile(road.hazards),
    contenderId: spec.contenderId,
    upgrades: runModifiers(spec.upgrades),
    signatureRideBonusPermille: road.signatureRide === ride.id ? config.bonuses.signatureRideBonusPermille : 1000,
    rallySaturdayMultiplierPermille: spec.rallySaturday ? config.bonuses.rallySaturdayMultiplierPermille : 1000,
  });

  const maxTicks = config.tickHz * MAX_REPLAY_SECONDS;
  let ri = 0;
  let bits = 0;
  while (state.phase === 'running' && state.tick < maxTicks) {
    while (ri < spec.log.length && spec.log[ri]!.tick <= state.tick) {
      bits = spec.log[ri]!.input;
      ri++;
    }
    step(state, bits, cfg);
  }

  return {
    phase: state.phase,
    ticks: state.tick,
    skillCrowd: state.skillCrowd,
    displayCrowd: state.displayCrowd,
    delivered: state.delivered,
    dents: state.dents,
    integrity: state.integrity,
  };
}

export interface ReplayClaim {
  crowd: number;
  delivered: number;
  dents: number;
  integrity: number;
}

export type ReplayVerdict = { ok: true; contenderId: string } | { ok: false; reason: 'unknown' | 'unfinished' | 'mismatch' };

/**
 * Does this log really produce this score?
 *
 * The Contender is not in the spec when the player has not consented to share
 * it (guardrail 10), and it must not be guessed from anything else, so every
 * Contender is tried and the claim stands if one of them reproduces it exactly.
 * That is also why a replay proves the run was played and not what the player
 * chose: the server learns nothing it was not told.
 */
export function verifyReplay(
  config: SimConfig,
  spec: Omit<ReplaySpec, 'contenderId'> & { contenderId?: string | null },
  claim: ReplayClaim,
): ReplayVerdict {
  const candidates = spec.contenderId ? [spec.contenderId] : contenders.map((c) => c.id);
  let known = false;
  let ended = false;
  for (const contenderId of candidates) {
    const got = replayRun(config, { ...spec, contenderId });
    if (!got) continue;
    known = true;
    if (got.phase === 'running') continue;
    ended = true;
    if (
      got.skillCrowd === claim.crowd &&
      got.delivered === claim.delivered &&
      got.dents === claim.dents &&
      got.integrity === claim.integrity
    ) {
      return { ok: true, contenderId };
    }
  }
  if (!known) return { ok: false, reason: 'unknown' };
  return { ok: false, reason: ended ? 'mismatch' : 'unfinished' };
}
