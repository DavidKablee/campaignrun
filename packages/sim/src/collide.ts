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
  
  const isMagnet = state.perkActiveTicks > 0 && state.activeContenderId === 'captain-kobo';
  const magnetRadius = (isMagnet ? 900 : 0) + state.upgrades.magnetRadiusMm + state.rideMagnetBonusMm;

  const hopClear = state.hopT > 0;

  for (const ent of state.entities) {
    if (!ent.active) continue;
    if (ent.isZone) continue;

    const eFront = ent.z + ent.halfLenMm;
    const eBack = ent.z - ent.halfLenMm;
    if (pFront < eBack || pBack > eFront) continue;
    // Asleep means not in play yet.
    if (ent.awake === false) continue;

    // A weaving vehicle or a walker is wherever it has got to, not in its lane.
    const eX = ent.xMm ?? laneCenterMm(ent.lane, config);
    const eLeft = eX - ent.halfWidthMm;
    const eRight = eX + ent.halfWidthMm;

    if (ent.isPickup) {
      if (pRight + magnetRadius < eLeft || pLeft - magnetRadius > eRight) continue;
    } else {
      if (pRight < eLeft || pLeft > eRight) continue;
      if (hopClear && config.hopHeightMm > ent.heightMm) continue;
      // C26 ride size-class rules (spec §4.3): narrow gaps block M/L, only S
      // passes; floods block L only; light barriers are ploughed by rides
      // with ploughsLight (Danfo+) — all three make the hazard transparent
      // to this ride rather than ending in a hit.
      if (ent.sizeTag === 'narrow' && state.rideSize === 'S') continue;
      if (ent.sizeTag === 'flood' && state.rideSize !== 'L') continue;
      if (ent.sizeTag === 'light' && state.ridePloughsLight) continue;
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
