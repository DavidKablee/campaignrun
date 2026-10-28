/**
 * What a state's road hazards look like in the air. Client-only: the hazards' numbers live in the
 * sim's road profile, this only tints the fog, shortens its draw distance a little and switches the
 * drifting dust on. Never so thick that an obstacle appears inside the reaction window.
 */
export interface Atmosphere {
  /** Mix toward `tint` (0..1). */
  tintAmount: number;
  tint: string;
  /** Multiplier on the fog far plane. */
  farMul: number;
  /** Draw the drifting dust motes. */
  dust: boolean;
}

/** The fog never closes in further than this (m): obstacles spawn ~40 m out and need reading time. */
export const MIN_FOG_FAR = 70;

const DUST = '#d2b27c';
const HEAT = '#f1d3a0';
const MIST = '#c9d3d3';
const WET = '#8fa0a8';

const BY_HAZARD: Record<string, Partial<Atmosphere> & { tint: string; tintAmount: number }> = {
  'dust-plume': { tint: DUST, tintAmount: 0.18, farMul: 0.95, dust: true },
  'dust-storm': { tint: DUST, tintAmount: 0.4, farMul: 0.78, dust: true },
  'heat-shimmer': { tint: HEAT, tintAmount: 0.25, farMul: 1, dust: false },
  'river-fog': { tint: MIST, tintAmount: 0.4, farMul: 0.82, dust: false },
  'low-visibility': { tint: MIST, tintAmount: 0.3, farMul: 0.75, dust: false },
  'rain-slick': { tint: WET, tintAmount: 0.2, farMul: 0.95, dust: false },
  'flash-flood': { tint: WET, tintAmount: 0.25, farMul: 0.9, dust: false },
  'flood-sheet': { tint: WET, tintAmount: 0.15, farMul: 0.97, dust: false },
};

export function atmosphereFor(hazards: readonly string[]): Atmosphere | null {
  let best: { tint: string; tintAmount: number } | null = null;
  let farMul = 1;
  let dust = false;
  for (const id of hazards) {
    const a = BY_HAZARD[id];
    if (!a) continue;
    if (!best || a.tintAmount > best.tintAmount) best = { tint: a.tint, tintAmount: a.tintAmount };
    farMul = Math.min(farMul, a.farMul ?? 1);
    dust = dust || !!a.dust;
  }
  return best ? { ...best, farMul, dust } : null;
}
