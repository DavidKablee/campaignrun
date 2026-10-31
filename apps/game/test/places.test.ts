import { afterEach, describe, expect, it, vi } from 'vitest';
import { places } from '@cr/content';
import { usePlacesStore } from '../src/places/placesStore';
import { actionById, applyPlaceEvent, applyPollEvent, pollFromView, inviteHash, parseInvite, rewardLine, roomPlace, walkedTo, type Members, type PlaceMember } from '../src/places/placesModel';

const member = (id: string, over: Partial<PlaceMember> = {}): PlaceMember => ({
  id,
  name: id,
  seed: 1,
  look: null,
  title: null,
  x: 0,
  z: 0,
  tx: 0,
  tz: 0,
  ...over,
});

describe('Mobilise client model (C82)', () => {
  it('adds, moves and removes members from room events', () => {
    let m: Members = {};
    m = applyPlaceEvent(m, { type: 'join', member: member('a') });
    m = applyPlaceEvent(m, { type: 'join', member: member('b') });
    m = applyPlaceEvent(m, { type: 'move', id: 'a', x: 1, z: 2, tx: 5, tz: 6 });
    expect(m.a).toMatchObject({ x: 1, z: 2, tx: 5, tz: 6 });
    m = applyPlaceEvent(m, { type: 'leave', id: 'b' });
    expect(Object.keys(m)).toEqual(['a']);
  });

  it('ignores a move for someone who is not here, and leaves members alone on act and say', () => {
    const m: Members = { a: member('a') };
    expect(applyPlaceEvent(m, { type: 'move', id: 'zzz', x: 1, z: 1, tx: 1, tz: 1 })).toBe(m);
    expect(applyPlaceEvent(m, { type: 'act', id: 'a', action: 'wave' })).toBe(m);
    expect(applyPlaceEvent(m, { type: 'say', id: 'a', phrase: 'greet' })).toBe(m);
  });

  it('walks a member at the shared speed', () => {
    const p = walkedTo(member('a', { tx: 10 }), 1);
    expect(p.x).toBeCloseTo(places.walkSpeedMetresPerSecond);
  });

  it('finds an action by id', () => {
    expect(actionById('canvass')?.label).toBe('Canvass');
    expect(actionById('nope')).toBeUndefined();
  });

  it('words the reward, including the daily limit', () => {
    expect(rewardLine({ coins: 3, supporters: 1, capped: false })).toBe('+₦3 · +1 Following');
    expect(rewardLine({ coins: 6, supporters: 2, capped: true })).toBe('+₦6 · +2 Following · daily limit reached');
    expect(rewardLine({ coins: 0, supporters: 0, capped: true })).toMatch(/today's limit/i);
    expect(rewardLine({ coins: 0, supporters: 0, capped: false })).toBe('');
  });

  it('round-trips an invite link and ignores places that do not exist', () => {
    expect(parseInvite(inviteHash('lagos', 'market'))).toEqual({ stateId: 'lagos', kind: 'market' });
    expect(parseInvite('#mobilise=nowhere.moon')).toBeNull();
    expect(parseInvite('#mobilise=lagos.market.extra')).toBeNull();
    expect(parseInvite('#mobilise=lagos')).toBeNull();
    expect(parseInvite('#c=abc')).toBeNull();
  });

  it('every action has a short dock label that fits a small button', () => {
    for (const a of places.actions) {
      expect(a.short.length).toBeGreaterThan(0);
      expect(a.short.length).toBeLessThanOrEqual(8);
    }
  });

  it('carries a room number in an invite, and ignores a malformed one (C90)', () => {
    expect(inviteHash('kano', 'market', 'kano:market#3')).toBe('#mobilise=kano.market.3');
    expect(inviteHash('kano', 'market', null)).toBe('#mobilise=kano.market');
    expect(parseInvite('#mobilise=kano.market.3')).toEqual({ stateId: 'kano', kind: 'market', roomId: 'kano:market#3' });
    expect(parseInvite('#mobilise=kano.market.x')).toBeNull();
    expect(parseInvite('#mobilise=kano.market.3.4')).toBeNull();
  });

  it('knows the national square as a place and no state (C90)', () => {
    expect(parseInvite(inviteHash('naija', 'square'))).toEqual({ stateId: 'naija', kind: 'square' });
    expect(parseInvite('#mobilise=naija.market')).toBeNull();
    expect(parseInvite('#mobilise=kano.square')).toBeNull();
    expect(roomPlace('naija:square#2')).toEqual({ stateId: 'naija', kind: 'square' });
    expect(roomPlace('kano:market#12')).toEqual({ stateId: 'kano', kind: 'market' });
    expect(roomPlace('kano:square#1')).toBeNull();
    expect(roomPlace('junk')).toBeNull();
  });

  describe('muting players (C90)', () => {
    const saved: Record<string, string> = {};
    afterEach(() => {
      vi.unstubAllGlobals();
      usePlacesStore.setState({ members: {}, mutedNames: [] });
      for (const k of Object.keys(saved)) delete saved[k];
    });

    it('mutes by board name so it holds in another room, and remembers it on the device', () => {
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => saved[k] ?? null,
        setItem: (k: string, v: string) => {
          saved[k] = v;
        },
      });
      usePlacesStore.setState({ members: { a: member('a', { name: 'noisy' }), b: member('b', { name: 'kind' }) }, mutedNames: [] });
      usePlacesStore.getState().mute('a');
      expect(usePlacesStore.getState().isMuted('a')).toBe(true);
      expect(usePlacesStore.getState().isMuted('b')).toBe(false);
      expect(JSON.parse(saved['cr-places-muted']!)).toEqual(['noisy']);

      // Another room, a new member id, the same name: still muted.
      usePlacesStore.setState({ members: { z: member('z', { name: 'noisy' }) } });
      expect(usePlacesStore.getState().isMuted('z')).toBe(true);
    });

    it('does not break when the device will not store anything', () => {
      vi.stubGlobal('localStorage', {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      });
      usePlacesStore.setState({ members: { a: member('a', { name: 'noisy' }) }, mutedNames: [] });
      usePlacesStore.getState().mute('a');
      expect(usePlacesStore.getState().isMuted('a')).toBe(true);
    });
  });

  describe('polls on screen (C92)', () => {
    const view = { pollId: 'polfood', by: 'm1', endsIn: 45_000, counts: { party: 0, home: 0 } };

    it('opens a poll from the room event with a local close time and no vote yet', () => {
      const p = applyPollEvent(null, { type: 'poll', poll: view }, 1_000)!;
      expect(p).toMatchObject({ pollId: 'polfood', closesAt: 46_000, closed: false, voted: null });
    });

    it('updates counts from votes, keeps your own choice, and ignores another poll', () => {
      const open = { ...pollFromView(view, 0), voted: 'party' };
      const next = applyPollEvent(open, { type: 'vote', poll: { ...view, counts: { party: 2, home: 1 } } }, 5_000)!;
      expect(next.counts).toEqual({ party: 2, home: 1 });
      expect(next.voted).toBe('party');
      const other = applyPollEvent(open, { type: 'vote', poll: { ...view, pollId: 'polrice', counts: { chicken: 9 } } }, 5_000);
      expect(other).toBe(open);
    });

    it('closes on the end event with the final counts, and a joiner sees an open poll with their vote', () => {
      const open = pollFromView(view, 0);
      const done = applyPollEvent(open, { type: 'pollend', poll: { ...view, endsIn: 0, counts: { party: 3, home: 1 } } }, 45_000)!;
      expect(done).toMatchObject({ closed: true, counts: { party: 3, home: 1 }, closesAt: 45_000 });
      expect(pollFromView({ ...view, endsIn: 20_000 }, 100, 'home')).toMatchObject({ voted: 'home', closed: false, closesAt: 20_100 });
      expect(pollFromView({ ...view, endsIn: 0 }, 100).closed).toBe(true);
    });

    it('leaves the people in the room alone', () => {
      const m: Members = { a: member('a') };
      expect(applyPlaceEvent(m, { type: 'poll', poll: view })).toBe(m);
      expect(applyPlaceEvent(m, { type: 'vote', poll: view })).toBe(m);
    });
  });
});
