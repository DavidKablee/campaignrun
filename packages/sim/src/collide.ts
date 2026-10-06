import type { Entity, SimState } from './types';
import type { SimConfig } from '@cr/content';
import { playerXmm, laneCenterMm } from './geometry';

/** AABB collision for obstacles/pickups (not zones). */
export function checkCollision(state: SimState, config: SimConfig): Entity | null {
  if (state.invulnTicks > 0) return null;

  const pZ = state.z;
  const pHalfLen = config.player.halfLenMm;
  const pFront = pZ + pHalfLen;
  const pBack = pZ - pHalfLen;
  const pX = playerXmm(state, config);
  const pHalfWidth = config.player.halfWidthMm;
  const pLeft = pX - pHalfWidth;
  const pRight = pX + pHalfWidth;
  
  const isMagnet = state.perkActiveTicks > 0 && state.activeContenderId === 'mr-obiliki';
  const magnetRadius = isMagnet ? 2000 : 0;

  const hopClear = state.hopT > 0;

  for (const ent of state.entities) {
    if (!ent.active) continue;
    if (ent.isZone) continue;

    const eFront = ent.z + ent.halfLenMm;
    const eBack = ent.z - ent.halfLenMm;
    if (pFront < eBack || pBack > eFront) continue;

    const eX = laneCenterMm(ent.lane, config);
    const eLeft = eX - ent.halfWidthMm;
    const eRight = eX + ent.halfWidthMm;
    
    if (ent.isPickup) {
      if (pRight + magnetRadius < eLeft || pLeft - magnetRadius > eRight) continue;
    } else {
      if (pRight < eLeft || pLeft > eRight) continue;
      if (hopClear && config.hopHeightMm > ent.heightMm) continue;
    }

    return ent;
  }
  return null;
}

/** Find zone entity the player currently overlaps. */
export function findOverlappingZone(state: SimState, config: SimConfig): Entity | null {
  const pZ = state.z;
  const pHalfLen = config.player.halfLenMm;
  const pFront = pZ + pHalfLen;
  const pBack = pZ - pHalfLen;
  const pX = playerXmm(state, config);
  const pHalfWidth = config.player.halfWidthMm;
  const pLeft = pX - pHalfWidth;
  const pRight = pX + pHalfWidth;

  for (const ent of state.entities) {
    if (!ent.active || !ent.isZone || ent.consumed) continue;
    const eFront = ent.z + ent.halfLenMm;
    const eBack = ent.z - ent.halfLenMm;
    if (pFront < eBack || pBack > eFront) continue;
    const eX = laneCenterMm(ent.lane, config);
    const eLeft = eX - ent.halfWidthMm;
    const eRight = eX + ent.halfWidthMm;
    if (pRight < eLeft || pLeft > eRight) continue;
    return ent;
  }
  return null;
}
