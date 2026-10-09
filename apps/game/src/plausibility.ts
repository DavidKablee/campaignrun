import { simConfig } from '@cr/content';

export interface RunClaim {
  skillCrowd: number;
  displayCrowd: number;
  delivered: number;
  dents: number;
  capacity: number;
  integrity: number;
  finished: boolean;
}

/** Reject impossible local / future-server score claims before they touch boards. */
export function isPlausibleRun(r: RunClaim): { ok: true } | { ok: false; reason: string } {
  if (!Number.isInteger(r.skillCrowd) || !Number.isInteger(r.delivered) || !Number.isInteger(r.dents)) {
    return { ok: false, reason: 'non-integer' };
  }
  if (r.skillCrowd < 0 || r.displayCrowd < 0 || r.delivered < 0) return { ok: false, reason: 'negative' };
  if (r.dents < 0 || r.dents > simConfig.hit.maxDents) return { ok: false, reason: 'dents' };
  if (r.capacity < 1 || r.capacity > 200) return { ok: false, reason: 'capacity' };
  if (r.integrity < 0 || r.integrity > 100) return { ok: false, reason: 'integrity' };

  const segments = simConfig.course.segmentCount;
  // Pickups + grand + loose roadside headroom.
  const maxDelivered = r.capacity * (segments + 2) + 40;
  if (r.delivered > maxDelivered) return { ok: false, reason: 'delivered' };

  // Max crowd mult ≈ momentum.max/1000 * fullHouse * onBeat.
  const maxMult =
    (simConfig.momentum.max / 1000) *
    (simConfig.bonuses.fullHousePermille / 1000) *
    (simConfig.bonuses.onBeatPermille / 1000);
  const maxCrowd = Math.ceil(r.delivered * maxMult) + 2;
  if (r.skillCrowd > maxCrowd) return { ok: false, reason: 'crowd' };
  if (r.displayCrowd < r.skillCrowd) return { ok: false, reason: 'display' };
  if (r.finished && r.dents >= simConfig.hit.maxDents) return { ok: false, reason: 'finished-broken' };

  return { ok: true };
}
