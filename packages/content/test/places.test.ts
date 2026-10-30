import { describe, expect, it } from 'vitest';
import { analytics, clampToBounds, localsFor, distance, places, placesDay, stepToward } from '../src';

describe('Mobilise places (C82)', () => {
  it('has unique ids for kinds, actions and phrases', () => {
    for (const list of [places.kinds, places.actions, places.phrases]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('gives every phrase an English and a Pidgin line', () => {
    for (const p of places.phrases) {
      expect(p.en.length).toBeGreaterThan(2);
      expect(p.pcm.length).toBeGreaterThan(2);
    }
  });

  it('keeps chat to presets: no phrase asks for or names a person, party or number', () => {
    for (const p of places.phrases) {
      expect(`${p.en} ${p.pcm}`).not.toMatch(/\d|https?:|@/);
    }
  });

  it('caps daily rewards above zero and below what the actions could pay in a day', () => {
    expect(places.daily.coins).toBeGreaterThan(0);
    const best = Math.max(...places.actions.map((a) => a.coins));
    expect(places.daily.coins).toBeGreaterThanOrEqual(best);
    expect(places.daily.supporters).toBeLessThanOrEqual(10);
  });

  it('has a wave that pays nothing, so a free social action exists', () => {
    const wave = places.actions.find((a) => a.id === 'wave');
    expect(wave?.coins).toBe(0);
    expect(wave?.supporters).toBe(0);
  });

  it('registers its analytics events', () => {
    for (const e of ['mobilise_open', 'place_join', 'place_action', 'place_say', 'place_invite']) {
      expect(analytics.events).toContain(e);
    }
  });

  it('shows fewer locals as a place fills, never below the minimum', () => {
    expect(places.locals.min).toBeLessThanOrEqual(places.locals.max);
    expect(localsFor(1, places.locals)).toBe(places.locals.max);
    expect(localsFor(places.roomCapacity, places.locals)).toBe(places.locals.min);
  });

  it('walks toward a target and stops on it', () => {
    const a = stepToward({ x: 0, z: 0 }, { x: 10, z: 0 }, 1, 2.4);
    expect(a.x).toBeCloseTo(2.4);
    expect(stepToward({ x: 0, z: 0 }, { x: 1, z: 0 }, 5, 2.4)).toEqual({ x: 1, z: 0 });
    expect(distance({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
  });

  it('clamps a target to the place and ignores junk numbers', () => {
    const b = places.bounds;
    expect(clampToBounds({ x: 999, z: -999 }, b)).toEqual({ x: b.halfX, z: -b.halfZ });
    expect(clampToBounds({ x: Number.NaN, z: 2 }, b)).toEqual({ x: 0, z: 2 });
  });

  it('rolls the daily cap over at midnight Lagos time', () => {
    expect(placesDay(Date.UTC(2026, 9, 30, 22, 59))).toBe('2026-10-30');
    expect(placesDay(Date.UTC(2026, 9, 30, 23, 0))).toBe('2026-10-31');
  });
});
