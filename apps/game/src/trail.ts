import { calendar, lagos, simConfig, stateIndex, stations, type StateIndex } from '@cr/content';

export interface TrailLeg {
  from: string;
  to: string;
}

/** Where the run is heading, using the Lagos landmark order. */
export function legAt(zMm: number): TrailLeg {
  const c = simConfig.course;
  const stops = lagos.landmarks.map((l) => l.name);
  const into = zMm - c.borderGateMm;
  if (into < 0) return { from: 'Your street', to: 'Lagos gate' };
  const seg = Math.floor(into / c.segmentLengthMm);
  if (seg >= c.segmentCount) return { from: stops[stops.length - 1] ?? 'Lagos', to: 'Grand Rally' };
  return {
    from: seg === 0 ? 'Lagos gate' : (stops[seg - 1] ?? 'Lagos gate'),
    to: stops[seg] ?? 'Grand Rally',
  };
}

export interface CampaignRow extends StateIndex {
  unlocksAt: string;
  /** The playable pack is open even before its calendar Monday. Later states wait. */
  open: boolean;
  note?: string;
}

const SHIPPED = new Set(['lagos']);

export function campaignRows(now = Date.now()): CampaignRow[] {
  const byId = new Map(stateIndex.map((s) => [s.id, s]));
  const rows: CampaignRow[] = [];
  for (const unlock of calendar.unlocks) {
    const at = Date.parse(unlock.at);
    for (const id of unlock.states) {
      const row = byId.get(id);
      if (!row) continue;
      rows.push({
        ...row,
        unlocksAt: unlock.at,
        open: SHIPPED.has(id) || at <= now,
        note: unlock.note,
      });
    }
  }
  return rows;
}

export function stationFor(stem: string) {
  return stations.find((s) => s.id === stem) ?? stations[0]!;
}

export function formatUnlock(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  }).format(new Date(iso));
}
