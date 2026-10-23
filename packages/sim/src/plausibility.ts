import type { SimConfig } from '@cr/content';

export interface RunClaim {
  skillCrowd: number;
  displayCrowd: number;
  delivered: number;
  dents: number;
  capacity: number;
  integrity: number;
  finished: boolean;
}

/**
 * Rejects run claims the simulation could not have produced.
 *
 * This lived in the client until C41, where it only ever protected the local
 * board — the server took any number inside the schema's range, so the public
 * board was forgeable by anyone who could call the API. It belongs here, in
 * `@cr/sim`, because every bound it checks is derived from the sim's own
 * config: it is the inverse of `step()`, and the two must move together.
 *
 * Takes the config as a parameter rather than reading it at module scope, like
 * every other function in this package.
 */
export function isPlausibleRun(r: RunClaim, config: SimConfig): { ok: true } | { ok: false; reason: string } {
  if (!Number.isInteger(r.skillCrowd) || !Number.isInteger(r.delivered) || !Number.isInteger(r.dents)) {
    return { ok: false, reason: 'non-integer' };
  }
  if (r.skillCrowd < 0 || r.displayCrowd < 0 || r.delivered < 0) return { ok: false, reason: 'negative' };
  if (r.dents < 0 || r.dents > config.hit.maxDents) return { ok: false, reason: 'dents' };
  if (r.capacity < 1 || r.capacity > 200) return { ok: false, reason: 'capacity' };
  if (r.integrity < 0 || r.integrity > 100) return { ok: false, reason: 'integrity' };

  const segments = config.course.segmentCount;
  // Pickups + grand + loose roadside headroom.
  const maxDelivered = r.capacity * (segments + 2) + 40;
  if (r.delivered > maxDelivered) return { ok: false, reason: 'delivered' };

  if (r.skillCrowd > maxCrowdFor(r.delivered, config)) return { ok: false, reason: 'crowd' };
  if (r.displayCrowd < r.skillCrowd) return { ok: false, reason: 'display' };
  if (r.finished && r.dents >= config.hit.maxDents) return { ok: false, reason: 'finished-broken' };

  return { ok: true };
}

/**
 * The most Crowd a delivery total could possibly be worth.
 *
 * Every multiplier `deliverCrowd` can stack, plus the flat Crowd a run can
 * collect from outpacing rival convoys. The old version of this bound knew
 * about momentum, Full House and On Beat only — it was written before C28 and
 * C30 added the PVC buff, the Rally Saturday window and the signature-ride
 * bonus, which between them are another 2.4x. That was survivable while this
 * only guarded the local board; it would have rejected real Rally Saturday
 * runs the moment the server started enforcing it (C41).
 *
 * This is a sanity bound, not proof. It catches a claim the simulation could
 * not have produced; it does not catch a plausible claim that was never
 * played. Only server-side replay does that, and that is still owed from C12.
 */
export function maxCrowdFor(delivered: number, config: SimConfig): number {
  const b = config.bonuses;
  const multiplier =
    (config.momentum.max / 1000) *
    (b.fullHousePermille / 1000) *
    (b.onBeatPermille / 1000) *
    (b.pvcMultiplierPermille / 1000) *
    (b.rallySaturdayMultiplierPermille / 1000) *
    (b.signatureRideBonusPermille / 1000);

  // Rival outpacing adds flat Crowd per convoy passed, so it does not scale
  // with deliveries. Bound it by how many entities fit on the course at the
  // tightest legal spacing, which no run can exceed. C45: a state's hazards
  // can pack that spacing tighter, so the tightest legal spacing is now the
  // configured gap at the road floor — without this the bound would reject
  // honest runs through a busy state.
  const c = config.course;
  const courseMm = c.borderGateMm + c.segmentCount * c.segmentLengthMm + c.grandRallyMm + c.finishPadMm;
  const tightestGapMm = Math.max(1, Math.floor((config.spawn.gapMinMm * c.roadGapFloorPermille) / 1000));
  const maxEntities = Math.ceil(courseMm / tightestGapMm) + 2;

  return Math.ceil(delivered * multiplier) + maxEntities * b.rivalOutpaceCrowd;
}
