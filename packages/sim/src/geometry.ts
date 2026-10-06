import type { SimConfig } from '@cr/content';
import type { SimState } from './types';

/** World X millimetres for a discrete lane (0 left, 1 centre, 2 right). */
export function laneCenterMm(lane: 0 | 1 | 2, config: SimConfig): number {
  return (lane - 1) * config.laneSpacingMm;
}

/** Player centre X in millimetres from laneX (0..2000). */
export function playerXmm(state: Pick<SimState, 'laneX'>, config: SimConfig): number {
  return Math.floor(((state.laneX - 1000) * config.laneSpacingMm) / 1000);
}
