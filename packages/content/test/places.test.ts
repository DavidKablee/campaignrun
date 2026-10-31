import { describe, expect, it } from 'vitest';
import { analytics, clampToBounds, contenders, jobsForDay, parties, localsFor, distance, places, placesDay, stepToward } from '../src';

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

  it('describes one national square that is not a state or a kind (C90)', async () => {
    const { stateIndex } = await import('../src');
    expect(stateIndex.some((s) => s.id === places.square.stateId)).toBe(false);
    expect(places.kinds.some((k) => k.id === places.square.id)).toBe(false);
    expect(places.kinds.some((k) => k.id === places.square.scenery)).toBe(true);
  });

  it('lets only an action that needs company pay a solo share, and never the whole reward (C90)', () => {
    for (const a of places.actions) {
      if (!a.needsCompany) expect(a.soloPercent).toBe(0);
      expect(a.soloPercent).toBeLessThan(100);
    }
    expect(places.actions.some((a) => a.needsCompany && a.soloPercent > 0)).toBe(true);
  });

  it('sizes rooms and friends sensibly (C90)', () => {
    expect(places.rooms.busyAt).toBeLessThanOrEqual(places.roomCapacity);
    expect(places.friends.max).toBeGreaterThan(0);
  });

  describe('Campaign Jobs (C91)', () => {
    const days = Array.from({ length: 90 }, (_, i) => new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10));

    it('only names actions and titles that exist, and ids are unique', () => {
      const ids = places.jobs.pool.map((j) => j.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const j of places.jobs.pool) {
        if (j.type === 'action') expect(places.actions.some((a) => a.id === j.action)).toBe(true);
        else expect(j.action).toBeUndefined();
      }
      for (const m of places.streak.milestones) expect(places.titles.some((t) => t.id === m.title)).toBe(true);
      const dayList = places.streak.milestones.map((m) => m.days);
      expect([...dayList].sort((a, b) => a - b)).toEqual(dayList);
    });

    it('picks the same jobs for a day every time, and a full set every day', () => {
      for (const d of days) {
        expect(jobsForDay(d).map((j) => j.id)).toEqual(jobsForDay(d).map((j) => j.id));
        expect(jobsForDay(d)).toHaveLength(places.jobs.perDay);
      }
    });

    it('never asks for two social jobs, or the same thing twice, in one day', () => {
      for (const d of days) {
        const jobs = jobsForDay(d);
        expect(jobs.filter((j) => j.social).length).toBeLessThanOrEqual(1);
        const keys = jobs.map((j) => `${j.type}:${j.action ?? ''}`);
        expect(new Set(keys).size).toBe(keys.length);
      }
    });

    it('varies from day to day, so there is a reason to come back', () => {
      const sets = new Set(days.map((d) => jobsForDay(d).map((j) => j.id).sort().join(',')));
      expect(sets.size).toBeGreaterThan(10);
    });

    it('keeps a day of jobs well inside the daily caps', () => {
      for (const d of days) {
        const jobs = jobsForDay(d);
        const coins = jobs.reduce((n, j) => n + j.coins, 0) + places.jobs.allDone.coins;
        expect(coins).toBeLessThanOrEqual(places.daily.coins);
      }
    });

    it('titles are plain labels from a closed list with no names, parties or slogans', () => {
      for (const t of places.titles) expect(t.label).not.toMatch(/\d|https?:|@|party|vote|president|governor/i);
    });
  });

  describe('topic packs and polls (C92)', () => {
    it('has well over a hundred phrases, every one in a known topic, every topic well stocked', () => {
      expect(places.phrases.length).toBeGreaterThanOrEqual(140);
      const topics = places.topics.map((t) => t.id);
      expect(new Set(topics).size).toBe(topics.length);
      for (const p of places.phrases) expect(topics).toContain(p.tag);
      for (const t of topics) expect(places.phrases.filter((p) => p.tag === t).length).toBeGreaterThanOrEqual(8);
    });

    it('never says the same thing twice in English within a topic', () => {
      for (const t of places.topics) {
        const lines = places.phrases.filter((p) => p.tag === t.id).map((p) => p.en.toLowerCase());
        expect(new Set(lines).size).toBe(lines.length);
      }
    });

    it('names no Contender, party or person, and carries no link or number, in any phrase or poll', () => {
      const names = [...contenders.map((c) => c.name), ...parties.map((p) => p.name)].map((n) => n.toLowerCase());
      const texts = [
        ...places.phrases.flatMap((p) => [p.en, p.pcm]),
        ...places.polls.items.flatMap((q) => [q.en, q.pcm, ...q.options.flatMap((o) => [o.en, o.pcm])]),
      ];
      for (const text of texts) {
        expect(text).not.toMatch(/\d|https?:|@|www\./i);
        for (const n of names) expect(text.toLowerCase()).not.toContain(n);
      }
    });

    it('has polls with two or three options, unique ids, in a known topic, none shared with a phrase id', () => {
      const ids = places.polls.items.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
      const phraseIds = new Set(places.phrases.map((p) => p.id));
      for (const q of places.polls.items) {
        expect(places.topics.some((t) => t.id === q.topic)).toBe(true);
        expect(phraseIds.has(q.id)).toBe(false);
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
      }
      expect(places.polls.items.length).toBeGreaterThanOrEqual(6);
    });

    it('closes a poll in well under a minute and does not let one player flood the room', () => {
      expect(places.polls.seconds).toBeLessThanOrEqual(60);
      expect(places.polls.cooldownSeconds).toBeGreaterThanOrEqual(places.polls.seconds);
    });
  });
});
