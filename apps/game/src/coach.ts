import type { SimState } from '@cr/sim';

/**
 * First-run coaching.
 *
 * The first-run card teaches two moves (lane, hop). Everything else is taught where it matters: when
 * a pickup or a venue is close, the prompt says so a few seconds early, so the player is already
 * thinking about the brake when the zone starts. That early prompt is for the first few runs only;
 * after that the in-zone prompt is enough and a veteran should not be told twice.
 */
export const COACH_RUNS = 3;
/** How far ahead (mm) a zone starts being announced: about three seconds at base speed. */
export const APPROACH_MM = 70_000;

const KEY = 'cr-coach-runs';

export function coachRuns(): number {
  try {
    const n = Number(localStorage.getItem(KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function bumpCoachRuns(): void {
  try {
    localStorage.setItem(KEY, String(coachRuns() + 1));
  } catch {
    /* private mode: the player is simply coached again next visit */
  }
}

export function coachWanted(runsSoFar = coachRuns()): boolean {
  return runsSoFar < COACH_RUNS;
}

/**
 * The kind of zone the convoy is about to reach, or null. Zones the player is already inside, has
 * finished, or is far from are ignored, and only the nearest one counts.
 */
export function approachingZone(
  state: Pick<SimState, 'z' | 'entities' | 'activeZoneId'>,
  reachMm: number = APPROACH_MM,
): 'pickup' | 'venue' | null {
  if (state.activeZoneId !== 0) return null;
  let best: { z: number; kind: 'pickup' | 'venue' } | null = null;
  for (const e of state.entities) {
    if (!e.isZone || e.consumed) continue;
    if (e.zoneKind !== 'pickup' && e.zoneKind !== 'venue' && e.zoneKind !== 'grand') continue;
    const ahead = e.z - state.z;
    if (ahead <= 0 || ahead > reachMm) continue;
    if (best === null || e.z < best.z) best = { z: e.z, kind: e.zoneKind === 'pickup' ? 'pickup' : 'venue' };
  }
  return best ? best.kind : null;
}
