import { isPlace, placeKey, places, stepToward, type PlaceAction } from '@cr/content';

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
  /** Their Contender, only for a player who opted in; everyone else is a plain citizen (guardrail 13). */
  look: { contenderId: string } | null;
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

/**
 * The address that lands a friend in the same place: `#mobilise=<state>.<kind>`, or with a room
 * number, `#mobilise=<state>.<kind>.3`, which asks for that exact room (if it still has space).
 */
export function inviteHash(stateId: string, kind: string, roomId?: string | null): string {
  const n = roomId ? /#(\d{1,6})$/.exec(roomId)?.[1] : undefined;
  return `#mobilise=${stateId}.${kind}${n ? `.${n}` : ''}`;
}

export interface PlaceTarget {
  stateId: string;
  kind: string;
  /** A room to prefer, `kano:market#3`. */
  roomId?: string;
}

/** Reads an invite from an address bar hash. Anything that is not a known place is ignored. */
export function parseInvite(hash: string): PlaceTarget | null {
  const m = /^#mobilise=([a-z0-9-]+)\.([a-z]+)(?:\.(\d{1,6}))?$/.exec(hash);
  if (!m) return null;
  const [, stateId, kind, room] = m as unknown as [string, string, string, string | undefined];
  if (!isPlace(stateId, kind)) return null;
  return room ? { stateId, kind, roomId: `${placeKey(stateId, kind)}#${room}` } : { stateId, kind };
}

/** Splits `kano:market#3` into the place it is in. */
export function roomPlace(roomId: string): { stateId: string; kind: string } | null {
  const m = /^([a-z0-9-]+):([a-z]+)#\d+$/.exec(roomId);
  return m && isPlace(m[1]!, m[2]!) ? { stateId: m[1]!, kind: m[2]! } : null;
}
