import type { SimConfig } from '@cr/content';
import { laneCenterMm, nearestLane, playerXmm } from './geometry';
import type { Entity, SimState } from './types';

/** Where the kerb is, laterally: a walker who has crossed the road stops here. */
const KERB_MM = 4400;

/**
 * Moves the traffic one tick. Integers only, and nothing here reads a clock or
 * a random number: a vehicle's position is a function of the tick it woke on,
 * so the same inputs on the same seed always meet the same traffic.
 *
 * A mover sleeps until the player is `wakeMm` behind it. It is drawn only once
 * awake, so it never pops into motion in view, and it does not drift about in
 * the half of the course nobody has reached yet.
 */
export function updateTraffic(state: SimState, config: SimConfig): void {
  const t = config.traffic;
  const pHalfLen = config.player.halfLenMm;
  const px = playerXmm(state, config);

  for (const e of state.entities) {
    if (!e.mover || !e.active) continue;
    if (!e.awake) {
      if (e.z - state.z > t.wakeMm) continue;
      e.awake = true;
    }

    e.z += e.vz ?? 0;
    const rel = e.z - state.z;

    if (e.mover === 'weaver') swerve(state, e, rel, config);
    else if (e.mover === 'walker') walk(e, rel, config);

    // Passed without touching it: how near it went decides whether it counts.
    if (!e.passed && rel < -(e.halfLenMm + pHalfLen)) {
      e.passed = true;
      const x = e.xMm ?? laneCenterMm(e.lane, config);
      if (e.mover !== 'walker' && Math.abs(x - px) < t.closeCallMm) {
        state.events.push({ type: 'closeCall', payload: e.id });
      }
    }
  }
}

/** Warn, then slide into the neighbouring lane. The warning is what makes it fair. */
function swerve(state: SimState, e: Entity, rel: number, config: SimConfig): void {
  const w = config.traffic.weave;
  if (e.weaveState === 0) {
    if (rel > 0 && rel < w.triggerMm) {
      e.weaveState = 1;
      e.weaveWait = w.warnTicks;
      state.events.push({ type: 'weaveWarn', payload: e.id });
    }
  } else if (e.weaveState === 1) {
    e.weaveWait = (e.weaveWait ?? 0) - 1;
    if (e.weaveWait <= 0) e.weaveState = 2;
  } else if (e.weaveState === 2) {
    const target = laneCenterMm(e.weaveTo ?? e.lane, config);
    const x = e.xMm ?? laneCenterMm(e.lane, config);
    const next = x < target ? Math.min(target, x + w.mmPerTick) : Math.max(target, x - w.mmPerTick);
    e.xMm = next;
    if (next === target) e.weaveState = 3;
    e.lane = nearestLane(next, config);
  }
}

/** A person on foot: sets off across the road when the player is close, and stops at the far kerb. */
function walk(e: Entity, rel: number, config: SimConfig): void {
  const t = config.traffic.walker;
  if (e.weaveState === 0 && rel > 0 && rel < t.triggerMm) e.weaveState = 2;
  if (e.weaveState !== 2) return;
  const dir = e.lane === 0 ? 1 : e.lane === 2 ? -1 : e.weaveTo === 0 ? -1 : 1;
  const x = e.xMm ?? laneCenterMm(e.lane, config);
  const next = Math.max(-KERB_MM, Math.min(KERB_MM, x + dir * t.mmPerTick));
  e.xMm = next;
  if (Math.abs(next) >= KERB_MM) e.weaveState = 3;
  e.lane = nearestLane(next, config);
}
