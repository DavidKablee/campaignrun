import type { Entity, SimState } from './types';
import type { SimConfig } from '@cr/content';

// AABB collision checks
export function checkCollision(state: SimState, config: SimConfig): Entity | null {
  if (state.invulnTicks > 0) return null;
  // Player bounds
  const pZ = state.z;
  const pHalfLen = config.player.halfLenMm;
  const pFront = pZ + pHalfLen;
  const pBack = pZ - pHalfLen;
  
  // Lane X is in 0..2000 units. 0=Left, 1000=Center, 2000=Right
  // Convert laneX to mm for collision if needed, but since entities are fixed to lanes,
  // we just check if they overlap in X. Let's assume lane spacing is config.laneSpacingMm.
  // 1000 units = laneSpacingMm. So Xmm = (laneX - 1000) * (laneSpacingMm / 1000)
  const pX = Math.floor((state.laneX - 1000) * config.laneSpacingMm / 1000);
  const pHalfWidth = config.player.halfWidthMm;
  const pLeft = pX - pHalfWidth;
  const pRight = pX + pHalfWidth;

  const pHeight = state.hopT > 0 ? config.hopHeightMm : 0;
  
  for (const ent of state.entities) {
    if (!ent.active) continue;
    
    // Z overlap
    const eFront = ent.z + ent.halfLenMm;
    const eBack = ent.z - ent.halfLenMm;
    if (pFront < eBack || pBack > eFront) continue;

    // X overlap
    const eX = (ent.lane - 1) * config.laneSpacingMm;
    const eLeft = eX - ent.halfWidthMm;
    const eRight = eX + ent.halfWidthMm;
    if (pRight < eLeft || pLeft > eRight) continue;

    // Y overlap (hop)
    if (pHeight > ent.heightMm) continue;

    return ent;
  }
  return null;
}
