import type { SimConfig } from '@cr/content';
import type { SimState } from './types';

/** World X millimetres for a discrete lane (0 left, 1 centre, 2 right). */
export function laneCenterMm(lane: 0 | 1 | 2, config: SimConfig): number {
  return (lane - 1) * config.laneSpacingMm;
}

/** Nearest lane to a lateral position, for entities that leave their lane (weavers, walkers). */
export function nearestLane(xMm: number, config: SimConfig): 0 | 1 | 2 {
  const lane = Math.round(xMm / config.laneSpacingMm) + 1;
  return Math.max(0, Math.min(2, lane)) as 0 | 1 | 2;
}

/** Player centre X in millimetres from laneX (0..2000). */
export function playerXmm(state: Pick<SimState, 'laneX'>, config: SimConfig): number {
  return Math.floor(((state.laneX - 1000) * config.laneSpacingMm) / 1000);
}
