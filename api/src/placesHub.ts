import { distance, placeKey, places, stepToward, clampToBounds, type PlaceAction, type Spot } from '@cr/content';

/**
 * C82: who is standing where in a Mobilise place.
 *
 * In process memory on purpose: presence is "right now" and a restart clearing it is correct. It is
 * per-instance, so a second API process would split a place into two rooms; the BACKLOG note says
 * what to do (a shared pub/sub) if the API ever scales out. Nothing here is persisted and chat is
 * never stored: a phrase is an id that is relayed to the room and forgotten.
 *
 * The hub is deliberately free of HTTP and the database so the rules (capacity, cooldowns, company,
 * ttl) can be tested directly.
 */

export type HubEvent =
  | { type: 'join'; member: PublicMember }
  | { type: 'leave'; id: string }
  | { type: 'move'; id: string; x: number; z: number; tx: number; tz: number }
  | { type: 'act'; id: string; action: string }
  | { type: 'say'; id: string; phrase?: string; emoji?: string };

export type Sink = (event: HubEvent) => void;

/**
 * Set only for a player who opted in to show their Contender in Mobilise (C89, guardrail 13). Everyone
 * else is a plain citizen and carries `null`. The server fills it; a client cannot send it.
 */
export interface Look {
  contenderId: string;
}

export interface PublicMember {
  id: string;
  name: string;
  /** Seeds a plain citizen avatar. The Studio look is never sent (guardrail 10). */
  seed: number;
  look: Look | null;
  x: number;
  z: number;
  tx: number;
  tz: number;
}

interface Member {
  id: string;
  userId: string;
  name: string;
  seed: number;
  look: Look | null;
  roomId: string;
  x: number;
  z: number;
  tx: number;
  tz: number;
  /** When x,z were last committed; the walk since then is computed, not stored. */
  at: number;
  lastSeen: number;
  detachedAt: number | null;
  cooldowns: Map<string, number>;
  sinks: Set<Sink>;
}

interface Room {
  id: string;
  key: string;
  members: Map<string, Member>;
}

export type ActResult =
  | { ok: true; action: PlaceAction; withOthers: number }
  | { ok: false; reason: 'not-in-room' | 'cooldown' | 'company'; retryAfter?: number };

const DETACH_GRACE_MS = 8_000;

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h % 1_000_000;
}

export class PlaceHub {
  private rooms = new Map<string, Room>();
  private byUser = new Map<string, Member>();
  private counters = new Map<string, number>();
  private nextId = 1;

  constructor(private readonly random: () => number = Math.random) {}

  private position(m: Member, now: number): Spot {
    return stepToward({ x: m.x, z: m.z }, { x: m.tx, z: m.tz }, (now - m.at) / 1000, places.walkSpeedMetresPerSecond);
  }

  private view(m: Member, now: number): PublicMember {
    const p = this.position(m, now);
    return { id: m.id, name: m.name, seed: m.seed, look: m.look, x: p.x, z: p.z, tx: m.tx, tz: m.tz };
  }

  private emit(room: Room, event: HubEvent): void {
    for (const m of room.members.values()) for (const sink of m.sinks) sink(event);
  }

  /** Puts a player in the roomiest-not-full room of a place, or reconnects them to the one they are in. */
  join(
    user: { id: string; username: string },
    stateId: string,
    kind: string,
    look: Look | null,
    now: number,
  ): { member: Member; room: Room } {
    const key = placeKey(stateId, kind);
    const existing = this.byUser.get(user.id);
    if (existing) {
      const room = this.rooms.get(existing.roomId);
      if (room && room.key === key) {
        existing.lastSeen = now;
        existing.detachedAt = null;
        existing.look = look;
        return { member: existing, room };
      }
      this.leave(user.id);
    }

    let room = [...this.rooms.values()].find((r) => r.key === key && r.members.size < places.roomCapacity);
    if (!room) {
      const n = (this.counters.get(key) ?? 0) + 1;
      this.counters.set(key, n);
      room = { id: `${key}#${n}`, key, members: new Map() };
      this.rooms.set(room.id, room);
    }

    const angle = this.random() * Math.PI * 2;
    const radius = 2 + this.random() * 3;
    const spawn = clampToBounds({ x: Math.cos(angle) * radius, z: Math.sin(angle) * radius }, places.bounds);
    const member: Member = {
      id: `m${(this.nextId++).toString(36)}${Math.floor(this.random() * 1296).toString(36)}`,
      userId: user.id,
      name: user.username,
      seed: hashSeed(user.id),
      look,
      roomId: room.id,
      x: spawn.x,
      z: spawn.z,
      tx: spawn.x,
      tz: spawn.z,
      at: now,
      lastSeen: now,
      detachedAt: null,
      cooldowns: new Map(),
      sinks: new Set(),
    };
    this.emit(room, { type: 'join', member: this.view(member, now) });
    room.members.set(member.id, member);
    this.byUser.set(user.id, member);
    return { member, room };
  }

  /** Opt in or out while standing in a place: everyone in the room is told, so the avatar changes at once. */
  setLook(userId: string, look: Look | null, now: number): void {
    const m = this.byUser.get(userId);
    if (!m) return;
    m.look = look;
    const room = this.rooms.get(m.roomId);
    if (room) this.emit(room, { type: 'join', member: this.view(m, now) });
  }

  memberFor(userId: string, roomId: string): Member | null {
    const m = this.byUser.get(userId);
    return m && m.roomId === roomId ? m : null;
  }

  snapshot(roomId: string, now: number): PublicMember[] {
    const room = this.rooms.get(roomId);
    return room ? [...room.members.values()].map((m) => this.view(m, now)) : [];
  }

  /** The account behind a member id, for a report. Not exposed to other players. */
  userIdOf(roomId: string, memberId: string): string | null {
    return this.rooms.get(roomId)?.members.get(memberId)?.userId ?? null;
  }

  attach(member: Member, sink: Sink, now: number): void {
    member.sinks.add(sink);
    member.detachedAt = null;
    member.lastSeen = now;
  }

  detach(member: Member, sink: Sink, now: number): void {
    member.sinks.delete(sink);
    if (member.sinks.size === 0) member.detachedAt = now;
  }

  touch(member: Member, now: number): void {
    member.lastSeen = now;
  }

  leave(userId: string): void {
    const m = this.byUser.get(userId);
    if (!m) return;
    this.byUser.delete(userId);
    const room = this.rooms.get(m.roomId);
    if (!room) return;
    room.members.delete(m.id);
    if (room.members.size === 0) this.rooms.delete(room.id);
    else this.emit(room, { type: 'leave', id: m.id });
  }

  move(member: Member, target: Spot, now: number): void {
    const here = this.position(member, now);
    const to = clampToBounds(target, places.bounds);
    member.x = here.x;
    member.z = here.z;
    member.tx = to.x;
    member.tz = to.z;
    member.at = now;
    member.lastSeen = now;
    const room = this.rooms.get(member.roomId);
    if (room) this.emit(room, { type: 'move', id: member.id, x: here.x, z: here.z, tx: to.x, tz: to.z });
  }

  act(member: Member, action: PlaceAction, now: number): ActResult {
    const room = this.rooms.get(member.roomId);
    if (!room) return { ok: false, reason: 'not-in-room' };
    const ready = member.cooldowns.get(action.id) ?? 0;
    if (now < ready) return { ok: false, reason: 'cooldown', retryAfter: Math.ceil((ready - now) / 1000) };

    const here = this.position(member, now);
    let withOthers = 0;
    for (const other of room.members.values()) {
      if (other.id !== member.id && distance(here, this.position(other, now)) <= places.companyRadiusMetres) withOthers += 1;
    }
    if (action.needsCompany && withOthers === 0) return { ok: false, reason: 'company' };

    member.cooldowns.set(action.id, now + action.cooldownSeconds * 1000);
    member.lastSeen = now;
    this.emit(room, { type: 'act', id: member.id, action: action.id });
    return { ok: true, action, withOthers };
  }

  say(member: Member, what: { phrase?: string; emoji?: string }, now: number): void {
    const room = this.rooms.get(member.roomId);
    if (!room) return;
    member.lastSeen = now;
    this.emit(room, { type: 'say', id: member.id, ...what });
  }

  /** Drops players who went quiet. Called on a timer by the server and directly by tests. */
  sweep(now: number): number {
    const ttl = places.presenceTtlSeconds * 1000;
    let removed = 0;
    for (const m of [...this.byUser.values()]) {
      const gone = m.detachedAt !== null ? now - m.detachedAt > DETACH_GRACE_MS : now - m.lastSeen > ttl;
      if (gone || now - m.lastSeen > ttl * 3) {
        this.leave(m.userId);
        removed += 1;
      }
    }
    return removed;
  }

  /** Players per place, for the Mobilise button ("12 out in Kano"). Counts only, no names. */
  online(stateId?: string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const room of this.rooms.values()) {
      if (stateId && !room.key.startsWith(`${stateId}:`)) continue;
      out[room.key] = (out[room.key] ?? 0) + room.members.size;
    }
    return out;
  }

  clear(): void {
    this.rooms.clear();
    this.byUser.clear();
    this.counters.clear();
  }
}
