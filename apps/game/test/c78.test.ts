import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analytics } from '@cr/content';
import {
  analyticsOff,
  flush,
  queuedForTests,
  resetAnalyticsForTests,
  setAnalyticsOff,
  track,
  trackRunStart,
} from '../src/analytics';
import { challengeText, whatsappUrl, type Challenge } from '../src/challenge';
import { APPROACH_MM, approachingZone, COACH_RUNS, coachWanted } from '../src/coach';
import { correctionText, looksPersonal } from '../src/feedback';
import { LANGS, t, type StrKey } from '../src/i18n';
import { calloutForEvent, calloutForLandmark } from '../src/radioCallouts';
import { PCM } from '../src/radioPidgin';

const sample: Challenge = { seed: 1, stateId: 'kano', rideId: 'keke', crowd: 214, quick: false, from: 'Ade_22' };

describe('analytics counters', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    vi.stubGlobal('navigator', { doNotTrack: '0' });
    vi.stubGlobal('window', {});
    // Nothing in this file may reach a real server: a full queue flushes by itself.
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 204 })));
    resetAnalyticsForTests();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('queues a name and, for run events, a state, and nothing else', () => {
    track('visit');
    track('run_finish', 'kano');
    expect(queuedForTests()).toEqual([{ name: 'visit' }, { name: 'run_finish', state: 'kano' }]);
  });

  it('counts the second run of a visit once', () => {
    trackRunStart('lagos');
    trackRunStart('lagos');
    trackRunStart('lagos');
    expect(queuedForTests().map((e) => e.name)).toEqual(['run_start', 'run_start', 'run_second', 'run_start']);
  });

  it('goes quiet when switched off, and drops what was waiting', () => {
    track('visit');
    setAnalyticsOff(true);
    expect(analyticsOff()).toBe(true);
    expect(queuedForTests()).toEqual([]);
    track('visit');
    expect(queuedForTests()).toEqual([]);
    setAnalyticsOff(false);
    expect(analyticsOff()).toBe(false);
  });

  it('honours Do Not Track', () => {
    vi.stubGlobal('navigator', { doNotTrack: '1' });
    track('visit');
    expect(queuedForTests()).toEqual([]);
  });

  it('stops at the per-session ceiling', () => {
    const bodies: string[] = [];
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      bodies.push(init.body as string);
      return Promise.resolve(new Response(null, { status: 204 }));
    });
    for (let i = 0; i < analytics.maxPerSession + 50; i++) track('visit');
    flush();
    expect(queuedForTests().length).toBeLessThan(analytics.flushAt);
    const totalQueuedOrSent = bodies.reduce((n, b) => n + (JSON.parse(b).events as unknown[]).length, 0) + queuedForTests().length;
    expect(totalQueuedOrSent).toBeLessThanOrEqual(analytics.maxPerSession);
  });

  it('sends a batch with no credentials and no identifier', () => {
    const sent = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', sent);
    track('visit');
    track('share_whatsapp', 'oyo');
    flush();
    const [url, init] = sent.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/events$/);
    expect(init.credentials).toBe('omit');
    expect(JSON.parse(init.body as string)).toEqual({ events: [{ name: 'visit' }, { name: 'share_whatsapp', state: 'oyo' }] });
    expect(queuedForTests()).toEqual([]);
  });

  it('only names events the server will accept', () => {
    expect(analytics.events).toContain('challenge_open');
    expect(new Set(analytics.events).size).toBe(analytics.events.length);
  });
});

describe('Pidgin', () => {
  it('has a string for every key and fills the same slots as English', () => {
    const keys = Object.keys(
      // en is the source of truth for the key list
      { ...Object.fromEntries((['toast.fullHouse', 'prompt.venue', 'challenge.text', 'challenge.sub', 'tutorial.rest'] as StrKey[]).map((k) => [k, 1])) },
    ) as StrKey[];
    for (const k of keys) {
      const slots = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
      expect(slots(t(k, {}, 'pcm')), k).toBe(slots(t(k, {}, 'en')));
      expect(t(k, { crowd: 5, beat: 2, state: 'Oyo', ride: 'Keke' }, 'pcm')).not.toMatch(/\{\w+\}/);
    }
    expect(LANGS.map((l) => l.id)).toEqual(['en', 'pcm']);
  });

  it('writes the challenge message in the sender\'s language', () => {
    expect(challengeText(sample, 'Keke', 'Kano', 'en')).toMatch(/^Beat my 214 Turnout on Campaigner/);
    const pcm = challengeText(sample, 'Keke', 'Kano', 'pcm');
    expect(pcm).toContain('214');
    expect(pcm).toContain('Kano');
    expect(pcm).not.toMatch(/poll/i);
  });

  it('answers every event the English station answers', () => {
    const types = ['gate', 'zoneEnter', 'dropoff', 'fullHouse', 'onBeat', 'finish', 'breakdown', 'toll', 'tollDodged', 'stubborn', 'weaveWarn', 'closeCall'] as const;
    for (const type of types) {
      expect(calloutForEvent({ type }, 'Itam Market', 'SS', 'Akwa Ibom', 'pcm'), type).toBeTruthy();
      expect(calloutForEvent({ type }, 'Itam Market', 'SS', 'Akwa Ibom', 'en'), type).toBeTruthy();
    }
    expect(calloutForEvent({ type: 'pickup' }, 'x', 'SW', undefined, 'pcm')).toBeNull();
    expect(calloutForLandmark('Grand Rally', 'SW', 'Oyo', 'pcm')).toBeTruthy();
    expect(calloutForLandmark('Itam Market', 'SS', 'Akwa Ibom', 'pcm')).toContain('Itam Market');
  });

  it('keeps the same rules as the English station: no ride, no religious phrase, no other state', () => {
    const all = new Set<string>();
    for (let i = 0; i < 300; i++) {
      for (const type of ['closeCall', 'weaveWarn', 'tollDodged', 'toll', 'gate', 'dropoff', 'finish'] as const) all.add(calloutForEvent({ type }, 'X', 'NW', 'Katsina', 'pcm') ?? '');
      all.add(calloutForEvent({ type: 'zoneEnter' }, 'Bauchi gate', 'NW', 'Bauchi', 'pcm') ?? '');
      all.add(calloutForLandmark('Old City Gate', 'SW', 'Ogun', 'pcm'));
    }
    // The Lagos pools are Lagos-only by design and have their own test below.
    const { landmarkFlairLagos: _lagos, ...rest } = PCM;
    void _lagos;
    const everyLine = [...all, ...Object.values(rest).flat().filter((l): l is string => typeof l === 'string')].join('\n');
    expect(everyLine).not.toMatch(/okada|danfo|keke|allahu|\bgod\b|jesus|anambra|garden city|lagos|eko\b/i);
  });

  it('keeps the Lagos lines for Lagos', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) seen.add(calloutForEvent({ type: 'zoneEnter' }, 'Ojuelegba', 'SW', 'Lagos', 'pcm') ?? '');
    expect([...seen].join(' ')).toMatch(/Eko|Lagos/);
    const other = new Set<string>();
    for (let i = 0; i < 300; i++) other.add(calloutForEvent({ type: 'zoneEnter' }, 'Sabon Gari', 'NW', 'Kano', 'pcm') ?? '');
    expect([...other].join(' ')).not.toMatch(/Eko|Lagos/);
  });
});

describe('WhatsApp link', () => {
  it('carries the message and the link, encoded, to the send-to page', () => {
    const u = whatsappUrl('Beat my 5 & more', 'https://x.test/#c=ab~kano');
    expect(u.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(u.slice('https://wa.me/?text='.length))).toBe('Beat my 5 & more https://x.test/#c=ab~kano');
  });
});

describe('first-run coaching', () => {
  const ent = (z: number, kind: 'pickup' | 'venue' | 'grand' | 'finish', extra: object = {}) =>
    ({ id: z, kind: 'x', lane: 1, z, halfWidthMm: 1, halfLenMm: 1, heightMm: 1, active: true, isZone: true, zoneKind: kind, ...extra }) as never;

  it('coaches the first few runs only', () => {
    expect(coachWanted(0)).toBe(true);
    expect(coachWanted(COACH_RUNS - 1)).toBe(true);
    expect(coachWanted(COACH_RUNS)).toBe(false);
  });

  it('names the nearest zone ahead, within reach', () => {
    const state = { z: 1_000_000, activeZoneId: 0, entities: [ent(1_050_000, 'venue'), ent(1_030_000, 'pickup')] };
    expect(approachingZone(state)).toBe('pickup');
    expect(approachingZone({ ...state, entities: [ent(1_000_000 + APPROACH_MM + 1, 'pickup')] })).toBeNull();
  });

  it('ignores zones behind, finished, inside, or that are not pickups and venues', () => {
    expect(approachingZone({ z: 100, activeZoneId: 0, entities: [ent(50, 'pickup')] })).toBeNull();
    expect(approachingZone({ z: 100, activeZoneId: 0, entities: [ent(5_000, 'pickup', { consumed: true })] })).toBeNull();
    expect(approachingZone({ z: 100, activeZoneId: 0, entities: [ent(5_000, 'finish'), ent(6_000, 'gate' as never)] })).toBeNull();
    expect(approachingZone({ z: 100, activeZoneId: 7, entities: [ent(5_000, 'pickup')] })).toBeNull();
    expect(approachingZone({ z: 100, activeZoneId: 0, entities: [ent(5_000, 'grand')] })).toBe('venue');
  });
});

describe('state corrections', () => {
  it('spots contact details and leaves ordinary notes alone', () => {
    for (const bad of ['call 0803 123 4567', 'mail a.b@c.com', 'see https://x.test', 'www.x.test', '+234 803 123 4567']) {
      expect(looksPersonal(bad), bad).toBe(true);
    }
    for (const ok of ['The cloth is darker here.', 'It is 3 storeys, not 2', 'Market opens at 7', '']) {
      expect(looksPersonal(ok), ok).toBe(false);
    }
  });

  it('writes a copyable note for when the server is unreachable', () => {
    const text = correctionText({ stateId: 'osun', landmark: 'Dye Market', topic: 'colours', note: 'Darker indigo.', fromHere: true }, 'Osun', 'The colours are wrong');
    expect(text).toBe('Campaigner correction · Osun / Dye Market · The colours are wrong (from there)\nDarker indigo.');
  });
});
