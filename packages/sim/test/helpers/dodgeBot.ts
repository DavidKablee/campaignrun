import {
  rideSimTraits,
  rides,
  roadProfile,
  simConfig,
  stateRoad,
  type SimConfig,
} from '@cr/content';
import { Btn, initState, seedRng, step, type Entity, type SimState } from '../../src';

/** An entity as the bot sees it: anything with a velocity or a lateral position of its own. */
type Seen = Entity & { vz?: number; xMm?: number; awake?: boolean };

const LANE_CHANGE_LOOKAHEAD_TICKS = 100;
const HOP_LOOKAHEAD_TICKS = 28;

function laneX(lane: number, config: SimConfig): number {
  return (lane - 1) * config.laneSpacingMm;
}

/**
 * Ticks until the player's front meets this entity's back if both keep their
 * current speeds, or Infinity if they never overlap in z. Movers use their own
 * velocity, so a slow lorry is a threat that closes slowly and an oncoming
 * okada one that closes fast.
 */
function ticksToImpact(state: SimState, e: Seen, config: SimConfig): number {
  const closing = Math.floor(state.speed / 1000) - (e.vz ?? 0);
  const gap = e.z - e.halfLenMm - (state.z + config.player.halfLenMm);
  if (gap < -(e.halfLenMm * 2 + config.player.halfLenMm * 2)) return Infinity;
  if (gap <= 0) return 0;
  if (closing <= 0) return Infinity;
  return gap / closing;
}

function blocksLane(e: Seen, lane: number, config: SimConfig): boolean {
  const x = e.xMm ?? laneX(e.lane, config);
  const cx = laneX(lane, config);
  return Math.abs(x - cx) < e.halfWidthMm + config.player.halfWidthMm + 150;
}

/** One tick of bot input: brake in zones, otherwise look ahead, change lane or hop around trouble. */
export function botInput(state: SimState, config: SimConfig): number {
  const zone = state.entities.find(
    (e) =>
      e.isZone &&
      !e.consumed &&
      (e.zoneKind === 'pickup' || e.zoneKind === 'venue' || e.zoneKind === 'grand') &&
      Math.abs(e.z - state.z) < config.zones.halfLenMm + 4000,
  );
  if (zone) {
    let bits: number = Btn.Brake;
    if (zone.zoneKind !== 'pickup' && state.beatWindowTicks > 0 && state.tick % 7 === 0) bits |= Btn.Tap;
    return bits;
  }

  const threats = (state.entities as Seen[]).filter(
    (e) =>
      e.active &&
      !e.isZone &&
      !e.isPickup &&
      !e.isRivalConvoy &&
      e.kind !== 'pvc-pickup' &&
      (e.awake !== false) &&
      ticksToImpact(state, e, config) < LANE_CHANGE_LOOKAHEAD_TICKS,
  );

  const lane = state.targetLane;
  const blocked = (l: number) => threats.some((e) => blocksLane(e, l, config));
  // Hopping clears anything lower than the hop; the player cannot tell in advance, the bot can.
  const hoppable = (e: Seen) => e.heightMm < config.hopHeightMm;

  let bits: number = Btn.Gas;
  if (blocked(lane)) {
    const order = ([1, 0, 2] as const)
      .filter((l) => l !== lane)
      .sort((a, b) => Math.abs(a - lane) - Math.abs(b - lane));
    const free = order.find((l) => !blocked(l));
    if (free !== undefined && state.laneX === lane * 1000) {
      // One-shot bits need a blank tick behind them.
      if (state.tick % 2 === 0) bits |= free < lane ? Btn.Left : Btn.Right;
    } else {
      const imminent = threats.filter((e) => blocksLane(e, lane, config) && ticksToImpact(state, e, config) < HOP_LOOKAHEAD_TICKS);
      if (imminent.length > 0 && imminent.every(hoppable) && state.hopT === 0 && state.tick % 2 === 0) bits |= Btn.Up;
    }
  }
  return bits;
}

export interface BotRun {
  phase: SimState['phase'];
  dents: number;
  ticks: number;
  crowd: number;
  state: SimState;
}

export function runBot(
  seed: number,
  opts: { rideId?: string; stateId?: string; contenderId?: string; config?: SimConfig; maxSeconds?: number } = {},
): BotRun {
  const config = opts.config ?? simConfig;
  const road = stateRoad(opts.stateId ?? 'lagos')!;
  const ride = rides.find((r) => r.id === (opts.rideId ?? 'danfo'))!;
  const state = initState(config, seedRng(seed), {
    ...rideSimTraits(ride),
    road: roadProfile(road.hazards),
    contenderId: opts.contenderId ?? 'mama-ankara',
  });
  const max = config.tickHz * (opts.maxSeconds ?? 400);
  while (state.phase === 'running' && state.tick < max) step(state, botInput(state, config), config);
  return { phase: state.phase, dents: state.dents, ticks: state.tick, crowd: state.skillCrowd, state };
}

export function summarise(seeds: number[], opts: Parameters<typeof runBot>[1] = {}) {
  let finished = 0;
  let dents = 0;
  let crowd = 0;
  for (const s of seeds) {
    const r = runBot(s, opts);
    if (r.phase === 'finished') finished++;
    dents += r.dents;
    crowd += r.crowd;
  }
  return { n: seeds.length, finishRate: finished / seeds.length, meanDents: dents / seeds.length, meanCrowd: crowd / seeds.length };
}
