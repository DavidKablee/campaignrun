import type { SimConfig } from '@cr/content';

export type StarName = 'none' | 'foothold' | 'majority' | 'landslide';

/** Ride-scaled Crowd target. Thresholds are permille of this number. */
export function crowdTarget(capacity: number, config: SimConfig): number {
  return capacity * config.tiers.crowdPerCapacity;
}

export function starForCrowd(crowd: number, capacity: number, config: SimConfig): StarName {
  const target = crowdTarget(capacity, config);
  if (target <= 0) return 'none';
  const permille = Math.floor((crowd * 1000) / target);
  const t = config.tiers;
  if (permille >= t.landslidePermille) return 'landslide';
  if (permille >= t.majorityPermille) return 'majority';
  if (permille >= t.footholdPermille) return 'foothold';
  return 'none';
}
