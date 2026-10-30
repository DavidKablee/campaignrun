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

  it('only lets Rally the crowd count when someone is close by', () => {
    const hub = new PlaceHub(() => 0);
    const a = hub.join(user(1), 'kano', 'market', null, 0).member;
    expect(hub.act(a, action('rally'), 0)).toMatchObject({ ok: false, reason: 'company' });
    hub.join(user(2), 'kano', 'market', null, 0);
    expect(hub.act(a, action('rally'), 0).ok).toBe(true);
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
});
