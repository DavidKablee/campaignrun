import { places, stateIndex, stepToward, type PlaceAction } from '@cr/content';

/** What the server tells everyone in a room. Mirrors `HubEvent` in the API. */
export type PlaceEvent =
  | { type: 'join'; member: PlaceMember }
  | { type: 'leave'; id: string }
  | { type: 'move'; id: string; x: number; z: number; tx: number; tz: number }
  | { type: 'act'; id: string; action: string }
  | { type: 'say'; id: string; phrase?: string; emoji?: string };

export interface PlaceMember {
  id: string;
  name: string;
  seed: number;
  color: string | null;
  x: number;
  z: number;
  tx: number;
  tz: number;
}

export type Members = Record<string, PlaceMember>;

/** Applies a room event to the member list. Pure, so it is easy to test. */
export function applyPlaceEvent(members: Members, e: PlaceEvent): Members {
  switch (e.type) {
    case 'join':
      return { ...members, [e.member.id]: e.member };
    case 'leave': {
      const { [e.id]: _gone, ...rest } = members;
      return rest;
    }
    case 'move': {
      const m = members[e.id];
      return m ? { ...members, [e.id]: { ...m, x: e.x, z: e.z, tx: e.tx, tz: e.tz } } : members;
    }
    default:
      return members;
  }
}

export function actionById(id: string): PlaceAction | undefined {
  return places.actions.find((a) => a.id === id);
}

/** Where a member is after `seconds` more of walking, the same maths the server uses. */
export function walkedTo(m: PlaceMember, seconds: number) {
  return stepToward({ x: m.x, z: m.z }, { x: m.tx, z: m.tz }, seconds, places.walkSpeedMetresPerSecond);
}

/** The line shown after an action: what it paid, or why it did not. */
export function rewardLine(r: { coins: number; supporters: number; capped: boolean }): string {
  const parts: string[] = [];
  if (r.coins > 0) parts.push(`+₦${r.coins}`);
  if (r.supporters > 0) parts.push(`+${r.supporters} Following`);
  if (parts.length === 0) return r.capped ? "That's today's limit from the field. Come back tomorrow." : '';
  return parts.join(' · ') + (r.capped ? ' · daily limit reached' : '');
}

/** The address that lands a friend in the same place: `#mobilise=<state>.<kind>`. */
export function inviteHash(stateId: string, kind: string): string {
  return `#mobilise=${stateId}.${kind}`;
}

/** Reads an invite from an address bar hash. Anything that is not a known state and kind is ignored. */
export function parseInvite(hash: string): { stateId: string; kind: string } | null {
  const m = /^#mobilise=([a-z0-9-]+)\.([a-z]+)$/.exec(hash);
  if (!m) return null;
  const [, stateId, kind] = m as unknown as [string, string, string];
  if (!stateIndex.some((s) => s.id === stateId)) return null;
  if (!places.kinds.some((k) => k.id === kind)) return null;
  return { stateId, kind };
}
