import { describe, expect, it } from 'vitest';
import { places } from '@cr/content';
import { PlaceHub, type HubEvent } from '../src/placesHub';

const user = (n: number) => ({ id: `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`, username: `player${n}` });
const action = (id: string) => places.actions.find((a) => a.id === id)!;

describe('place hub (C82)', () => {
  it('fills a room to capacity, then opens a second one', () => {
    const hub = new PlaceHub();
    const rooms = new Set<string>();
    for (let i = 0; i < places.roomCapacity + 1; i++) rooms.add(hub.join(user(i), 'kano', 'market', null, 0).room.id);
    expect(rooms.size).toBe(2);
    expect(hub.online('kano')['kano:market']).toBe(places.roomCapacity + 1);
  });

  it('keeps one presence per player: joining another place leaves the first', () => {
    const hub = new PlaceHub();
    const a = hub.join(user(1), 'kano', 'market', null, 0);
    const b = hub.join(user(1), 'kano', 'park', null, 1);
    expect(hub.memberFor(user(1).id, a.room.id)).toBeNull();
    expect(hub.memberFor(user(1).id, b.room.id)).not.toBeNull();
    expect(hub.online()).toEqual({ 'kano:park': 1 });
  });

  it('reconnects a player to the same member instead of duplicating them', () => {
    const hub = new PlaceHub();
    const a = hub.join(user(1), 'kano', 'market', null, 0);
    const b = hub.join(user(1), 'kano', 'market', null, 5);
    expect(b.member.id).toBe(a.member.id);
    expect(hub.snapshot(a.room.id, 5)).toHaveLength(1);
  });

  it('never puts an email, account id or Contender in what other players see', () => {
    const hub = new PlaceHub();
    const { room } = hub.join(user(7), 'lagos', 'market', null, 0);
    const text = JSON.stringify(hub.snapshot(room.id, 0));
    expect(text).not.toContain(user(7).id);
    expect(text).not.toMatch(/contender|email/i);
  });

  it('walks a player toward their target at the set speed and clamps to the place', () => {
    const hub = new PlaceHub(() => 0);
    const { member, room } = hub.join(user(1), 'kano', 'market', null, 0);
    hub.move(member, { x: 500, z: 0 }, 0);
    const [m] = hub.snapshot(room.id, 1000);
    expect(m!.tx).toBe(places.bounds.halfX);
    expect(m!.x).toBeCloseTo(member.x + places.walkSpeedMetresPerSecond, 1);
  });

  it('enforces an action cooldown per player', () => {
    const hub = new PlaceHub();
    const { member } = hub.join(user(1), 'kano', 'market', null, 0);
    expect(hub.act(member, action('canvass'), 0).ok).toBe(true);
    const again = hub.act(member, action('canvass'), 1000);
    expect(again).toMatchObject({ ok: false, reason: 'cooldown' });
    expect(hub.act(member, action('canvass'), action('canvass').cooldownSeconds * 1000).ok).toBe(true);
  });

  it('counts Rally the crowd as solo until someone is close by (C90)', () => {
    const hub = new PlaceHub(() => 0);
    const a = hub.join(user(1), 'kano', 'market', null, 0).member;
    expect(hub.act(a, action('rally'), 0)).toMatchObject({ ok: true, solo: true });
    hub.join(user(2), 'kano', 'market', null, 0);
    expect(hub.act(a, action('rally'), 100_000)).toMatchObject({ ok: true, solo: false });
  });

  it('relays actions and phrases to everyone in the room', () => {
    const hub = new PlaceHub();
    const a = hub.join(user(1), 'kano', 'market', null, 0).member;
    const b = hub.join(user(2), 'kano', 'market', null, 0).member;
    const heard: HubEvent[] = [];
    hub.attach(b, (e) => heard.push(e), 0);
    hub.say(a, { phrase: 'greet' }, 1);
    hub.act(a, action('wave'), 2);
    expect(heard.map((e) => e.type)).toEqual(['say', 'act']);
  });

  it('drops players who go quiet and tells the room', () => {
    const hub = new PlaceHub();
    const a = hub.join(user(1), 'kano', 'market', null, 0).member;
    const b = hub.join(user(2), 'kano', 'market', null, 0).member;
    const heard: HubEvent[] = [];
    hub.attach(b, (e) => heard.push(e), 0);
    hub.touch(b, places.presenceTtlSeconds * 1000);
    expect(hub.sweep(places.presenceTtlSeconds * 1000 + 1)).toBe(1);
    expect(hub.online()).toEqual({ 'kano:market': 1 });
    expect(heard).toEqual([{ type: 'leave', id: a.id }]);
  });

  it('drops a player shortly after their stream closes', () => {
    const hub = new PlaceHub();
    const a = hub.join(user(1), 'kano', 'market', null, 0).member;
    const sink = () => undefined;
    hub.attach(a, sink, 0);
    hub.detach(a, sink, 1000);
    expect(hub.sweep(2000)).toBe(0);
    expect(hub.sweep(10_000)).toBe(1);
  });

  it('a plain citizen carries exactly the public fields and no Contender (C89)', () => {
    const hub = new PlaceHub();
    const { room } = hub.join(user(1), 'kano', 'market', null, 0);
    const [m] = hub.snapshot(room.id, 0);
    expect(Object.keys(m!).sort()).toEqual(['id', 'look', 'name', 'seed', 'tx', 'tz', 'x', 'z']);
    expect(m!.look).toBeNull();
  });

  it('shows a Contender only for a player who opted in, and tells the room when that changes (C89)', () => {
    const hub = new PlaceHub();
    const a = hub.join(user(1), 'kano', 'market', { contenderId: 'captain-kobo' }, 0);
    const b = hub.join(user(2), 'kano', 'market', null, 0);
    const seen: HubEvent[] = [];
    hub.attach(b.member, (e) => seen.push(e), 0);

    const byName = (name: string) => hub.snapshot(a.room.id, 0).find((m) => m.name === name)!;
    expect(byName('player1').look).toEqual({ contenderId: 'captain-kobo' });
    expect(byName('player2').look).toBeNull();

    hub.setLook(user(1).id, null, 1);
    expect(byName('player1').look).toBeNull();
    const told = seen.find((e) => e.type === 'join' && e.member.name === 'player1');
    expect(told && told.type === 'join' && told.member.look).toBeNull();

    hub.setLook(user(2).id, { contenderId: 'mama-ankara' }, 2);
    expect(byName('player2').look).toEqual({ contenderId: 'mama-ankara' });
  });

  it('rejoining with a different choice replaces the look (C89)', () => {
    const hub = new PlaceHub();
    hub.join(user(1), 'kano', 'market', { contenderId: 'captain-kobo' }, 0);
    const again = hub.join(user(1), 'kano', 'market', null, 5);
    expect(hub.snapshot(again.room.id, 5)[0]!.look).toBeNull();
  });

  describe('meeting anyone (C90)', () => {
    it('tops up the fullest room that has space before opening another', () => {
      const hub = new PlaceHub();
      for (let i = 0; i < places.roomCapacity; i++) hub.join(user(i), 'kano', 'market', null, 0);
      const second = hub.join(user(50), 'kano', 'market', null, 0).room;
      hub.join(user(51), 'kano', 'market', null, 0);
      // The first room is full; the second is where everyone goes until it fills too.
      expect(hub.listRooms().map((r) => r.count).sort((a, b) => a - b)).toEqual([2, places.roomCapacity]);
      // A leaver in the first room makes it the fullest with space.
      hub.leave(user(0).id);
      const next = hub.join(user(52), 'kano', 'market', null, 0).room;
      expect(next.id).not.toBe(second.id);
    });

    it('lands a player in the room they asked for when it is the same place and has space', () => {
      const hub = new PlaceHub();
      for (let i = 0; i < places.roomCapacity; i++) hub.join(user(i), 'kano', 'market', null, 0);
      const small = hub.join(user(60), 'kano', 'market', null, 0).room;
      hub.join(user(61), 'kano', 'market', null, 0);
      const first = hub.listRooms().find((r) => r.roomId !== small.id)!;
      expect(first.count).toBe(places.roomCapacity);
      // Leave a seat in the first room, then ask for the small one from outside.
      hub.leave(user(0).id);
      const joined = hub.join(user(70), 'kano', 'market', null, 0, small.id);
      expect(joined.room.id).toBe(small.id);
      expect(joined.landed).toBe('requested');
    });

    it('falls back to another room when the requested one is full, gone or a different place', () => {
      const hub = new PlaceHub();
      const full = hub.join(user(0), 'kano', 'market', null, 0).room;
      for (let i = 1; i < places.roomCapacity; i++) hub.join(user(i), 'kano', 'market', null, 0);
      const full1 = hub.join(user(90), 'kano', 'market', null, 0, full.id);
      expect(full1.landed).toBe('assigned');
      expect(full1.room.id).not.toBe(full.id);
      expect(hub.join(user(91), 'kano', 'market', null, 0, 'kano:market#999').landed).toBe('assigned');
      expect(hub.join(user(92), 'kano', 'park', null, 0, full.id).room.key).toBe('kano:park');
    });

    it('moves a player already in a place to another room of it, without a duplicate', () => {
      const hub = new PlaceHub();
      for (let i = 0; i < places.roomCapacity; i++) hub.join(user(i), 'kano', 'market', null, 0);
      const mover = hub.join(user(80), 'kano', 'market', null, 0);
      const target = hub.join(user(81), 'kano', 'market', null, 0).room;
      expect(mover.room.id).toBe(target.id);
      hub.leave(user(0).id);
      const first = hub.listRooms().find((r) => r.roomId !== target.id)!.roomId;
      const back = hub.join(user(80), 'kano', 'market', null, 5, first);
      expect(back.room.id).toBe(first);
      expect(hub.online()['kano:market']).toBe(places.roomCapacity + 1);
    });

    it('lists rooms with a place and counts, and never a name or id', () => {
      const hub = new PlaceHub();
      hub.join(user(1), 'kano', 'market', null, 0);
      hub.join(user(2), 'naija', 'square', null, 0);
      const rooms = hub.listRooms();
      expect(rooms.map((r) => r.key).sort()).toEqual(['kano:market', 'naija:square']);
      expect(rooms.every((r) => r.capacity === places.roomCapacity)).toBe(true);
      expect(JSON.stringify(rooms)).not.toMatch(/player|0000/);
    });

    it('puts a dropped player back where they were standing, within the window only', () => {
      const hub = new PlaceHub();
      const a = hub.join(user(1), 'kano', 'market', null, 0);
      hub.move(a.member, { x: 9, z: -7 }, 0);
      hub.sweep(60_000 * 10); // long gone: nobody is attached
      const window = places.rooms.rejoinSeconds * 1000;
      expect(hub.online()).toEqual({});
      const again = hub.join(user(1), 'kano', 'market', null, 60_000 * 10 + window + 1);
      // Past the window: a fresh spawn near the middle, not the spot they left.
      expect(Math.hypot(again.member.x - 9, again.member.z + 7)).toBeGreaterThan(1);
    });

    it('remembers the spot when they come back inside the window', () => {
      const hub = new PlaceHub();
      const a = hub.join(user(2), 'kano', 'market', null, 0);
      hub.move(a.member, { x: 9, z: -7 }, 0);
      hub.move(a.member, { x: 9, z: -7 }, 10_000); // arrived long since
      hub.touch(a.member, 10_000);
      const t = 10_000 + places.presenceTtlSeconds * 1000 + 1;
      hub.sweep(t);
      expect(hub.online()).toEqual({});
      const again = hub.join(user(2), 'kano', 'market', null, t + 1000);
      expect(again.member.x).toBeCloseTo(9, 0);
      expect(again.member.z).toBeCloseTo(-7, 0);
    });

    it('lets a solo player rally for a share, with no Board activity, and still refuses where the share is zero', () => {
      const hub = new PlaceHub();
      const a = hub.join(user(1), 'kano', 'market', null, 0);
      const rally = action('rally');
      const res = hub.act(a.member, rally, 0);
      expect(res.ok && res.solo).toBe(true);
      expect(rally.soloPercent).toBeGreaterThan(0);
      const refuse = { ...rally, id: 'rally2', soloPercent: 0 };
      expect(hub.act(a.member, refuse, 1)).toEqual({ ok: false, reason: 'company' });
    });

    it('is not solo when a real player is close', () => {
      const hub = new PlaceHub();
      const a = hub.join(user(1), 'kano', 'market', null, 0);
      const b = hub.join(user(2), 'kano', 'market', null, 0);
      hub.move(b.member, { x: a.member.x, z: a.member.z }, 0);
      const res = hub.act(a.member, action('rally'), 1000);
      expect(res.ok && res.solo).toBe(false);
    });
  });
});
