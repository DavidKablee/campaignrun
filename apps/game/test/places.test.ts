import { describe, expect, it } from 'vitest';
import { places } from '@cr/content';
import { actionById, applyPlaceEvent, inviteHash, parseInvite, rewardLine, walkedTo, type Members, type PlaceMember } from '../src/places/placesModel';

const member = (id: string, over: Partial<PlaceMember> = {}): PlaceMember => ({
  id,
  name: id,
  seed: 1,
  look: null,
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
});
