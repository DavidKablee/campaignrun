import { travelCaps } from '@cr/content';
import { watDay } from './meta';

export interface TravelProgress {
  day: string;
  runsToday: number;
  byState: Record<string, number>;
  statesTouched: string[];
}

export function emptyTravel(now = Date.now()): TravelProgress {
  return { day: watDay(now), runsToday: 0, byState: {}, statesTouched: [] };
}

export function syncTravelDay(progress: TravelProgress, now = Date.now()): TravelProgress {
  const day = watDay(now);
  return progress.day === day ? progress : emptyTravel(now);
}

export type TravelBlockReason = 'runs' | 'states' | 'state-runs';

export function canTravel(progress: TravelProgress, stateId: string, now = Date.now()): { ok: true } | { ok: false; reason: TravelBlockReason } {
  const cur = syncTravelDay(progress, now);
  if (cur.runsToday >= travelCaps.maxRunsPerDay) return { ok: false, reason: 'runs' };
  const stateRuns = cur.byState[stateId] ?? 0;
  if (stateRuns >= travelCaps.maxRunsPerStatePerDay) return { ok: false, reason: 'state-runs' };
  const touchingNew = !cur.statesTouched.includes(stateId);
  if (touchingNew && cur.statesTouched.length >= travelCaps.maxStatesPerDay) return { ok: false, reason: 'states' };
  return { ok: true };
}

export function noteTravel(progress: TravelProgress, stateId: string, now = Date.now()): TravelProgress {
  const cur = syncTravelDay(progress, now);
  const statesTouched = cur.statesTouched.includes(stateId) ? cur.statesTouched : [...cur.statesTouched, stateId];
  return {
    day: cur.day,
    runsToday: cur.runsToday + 1,
    byState: { ...cur.byState, [stateId]: (cur.byState[stateId] ?? 0) + 1 },
    statesTouched,
  };
}
