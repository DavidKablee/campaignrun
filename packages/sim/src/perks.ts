import type { SimConfig } from '@cr/content';
import type { SimState } from './types';

const HORN_RANGE_MM = 28_000;
const WEAVE_LOOK_MM = 45_000;

/** Clear obstacles ahead. Beacon perk covers all lanes and longer range. */
export function blastHorn(state: SimState, config: SimConfig, doubled: boolean): void {
  const range = doubled ? HORN_RANGE_MM * 2 : HORN_RANGE_MM;
  const lanes = doubled ? new Set([0, 1, 2]) : new Set([state.targetLane]);
  let cleared = 0;
  for (const ent of state.entities) {
    if (!ent.active || ent.isZone || ent.isPickup) continue;
    if (ent.z < state.z || ent.z > state.z + range) continue;
    if (!lanes.has(ent.lane)) continue;
    // Horn clears hoppable clutter; solid vehicles stay.
    if (ent.heightMm >= config.hopHeightMm) continue;
    ent.active = false;
    cleared++;
  }
  if (cleared > 0) state.events.push({ type: 'horn', payload: cleared });
}

/** Market Weave: nudge out of a lane that has a hazard ahead. */
export function applyMarketWeave(state: SimState): void {
  const blocked = state.entities.some(
    (e) =>
      e.active &&
      !e.isZone &&
      !e.isPickup &&
      e.lane === state.targetLane &&
      e.z > state.z &&
      e.z < state.z + WEAVE_LOOK_MM,
  );
  if (!blocked) return;
  const free = ([0, 1, 2] as const).filter(
    (lane) =>
      lane !== state.targetLane &&
      !state.entities.some(
        (e) =>
          e.active &&
          !e.isZone &&
          !e.isPickup &&
          e.lane === lane &&
          e.z > state.z &&
          e.z < state.z + WEAVE_LOOK_MM,
      ),
  );
  if (free.length === 0) return;
  // Prefer centre, else the only free side — deterministic pick.
  state.targetLane = free.includes(1) ? 1 : free[0]!;
}
