import { calendar, hasStatePack, lagosLaunch, simConfig, stateIndex, stations, type StateIndex } from '@cr/content';

export interface TrailLeg {
  from: string;
  to: string;
}

/** Where the run is heading, using the active state's landmark order. */
export function legAt(
  zMm: number,
  landmarks: readonly string[] = lagosLaunch.landmarks,
  gateLabel = 'Border gate',
  course: typeof simConfig.course = simConfig.course,
  startLabel = 'Your street',
): TrailLeg {
  const c = course;
  const into = zMm - c.borderGateMm;
  if (into < 0) return { from: startLabel, to: gateLabel };
  const seg = Math.floor(into / c.segmentLengthMm);
  if (seg >= c.segmentCount) return { from: landmarks[landmarks.length - 1] ?? gateLabel, to: 'Grand Rally' };
  return {
    from: seg === 0 ? gateLabel : (landmarks[seg - 1] ?? gateLabel),
    to: landmarks[seg] ?? 'Grand Rally',
  };
}

export interface CampaignRow extends StateIndex {
  unlocksAt: string;
  /** Calendar time passed (Lagos early-open) and a playable pack is shipped. */
  open: boolean;
  /** Calendar unlocked but pack not shipped yet — show as pending content. */
  awaitingPack: boolean;
  note?: string;
}

export function campaignRows(now = Date.now()): CampaignRow[] {
  const byId = new Map(stateIndex.map((s) => [s.id, s]));
  const rows: CampaignRow[] = [];
  for (const unlock of calendar.unlocks) {
    const at = Date.parse(unlock.at);
    for (const id of unlock.states) {
      const row = byId.get(id);
      if (!row) continue;
      const calendarOpen = id === 'lagos' || at <= now;
      const pack = hasStatePack(id);
      rows.push({
        ...row,
        unlocksAt: unlock.at,
        open: calendarOpen && pack,
        awaitingPack: calendarOpen && !pack,
        note: unlock.note,
      });
    }
  }
  return rows;
}

/**
 * Copy for the two roadside signs. Lived as string literals inside GameRenderer
 * until C34 made 28 more states playable and every one of them opened with
 * "WELCOME TO LAGOS" over the gate and a Yoruba thank-you at the finish.
 *
 * The finish sub comes from the pack's own `farewellLine` where it has one. A
 * Yoruba farewell is right in Lagos and wrong in Kano, so states whose language
 * is not represented in the packs get a neutral line instead of a guess.
 */
export function gateSign(stateName: string, welcomeLine: string): { label: string; sub: string } {
  return { label: `WELCOME TO ${stateName.toUpperCase()}`, sub: welcomeLine };
}

export function finishSign(stateName: string, farewellLine?: string): { label: string; sub: string } {
  return { label: 'FINISH', sub: farewellLine ?? `${stateName} · Grand Rally` };
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
