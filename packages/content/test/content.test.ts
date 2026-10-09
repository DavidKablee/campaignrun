import { describe, expect, it } from 'vitest';
import {
  activeContenders,
  calendar,
  availableStatePacks,
  contenders,
  copy,
  isRidePlayable,
  lagosLaunch,
  loadStatePack,
  outfits,
  rides,
  shippedStatePacks,
  simConfig,
  stateIndex,
  stations,
  integrityEvents,
  stateSchema,
  travelCaps,
  legal,
  venueTypeSchema,
} from '../src/index';
import { collectStrings, findViolations, hashTerm, loadHashes, readAllDataFiles, readJsonDir } from '../src/guardrails';

describe('content packs', () => {
  it('has six active original Contenders with in-run-only perks', () => {
    expect(activeContenders).toHaveLength(6);
    expect(new Set(contenders.map((c) => c.id)).size).toBe(contenders.length);
  });

  it('ride ladder is monotonic', () => {
    for (let i = 1; i < rides.length; i++) {
      expect(rides[i]!.capacity).toBeGreaterThan(rides[i - 1]!.capacity);
      expect(rides[i]!.followingGate).toBeGreaterThan(rides[i - 1]!.followingGate);
    }
    expect(rides.find((r) => r.id === 'okada')!.followingGate).toBe(150);
    const okada = rides.find((r) => r.id === 'okada')!;
    const keke = rides.find((r) => r.id === 'keke')!;
    expect(isRidePlayable(okada, 149)).toBe(false);
    expect(isRidePlayable(okada, 150)).toBe(true);
    expect(isRidePlayable(keke, 1_499)).toBe(false);
    expect(isRidePlayable(keke, 1_500)).toBe(true);
    // C26: full roster is playable (gated by Following, not a playable:false lock).
    expect(rides.filter((r) => r.playable).map((r) => r.id)).toEqual(['trek', 'okada', 'keke', 'hilux', 'danfo', 'coaster', 'grand-convoy']);
  });

  it('sim config sanity', () => {
    expect(simConfig.maxSpeedUm).toBeGreaterThan(simConfig.baseSpeedUm);
    expect(simConfig.spawn.gapMinMm).toBeLessThanOrEqual(simConfig.spawn.gapMaxMm);
    expect(simConfig.runTicks / simConfig.tickHz).toBeGreaterThanOrEqual(75);
    expect(simConfig.runTicks / simConfig.tickHz).toBeLessThanOrEqual(100);
  });

  it('disclosure is present and neutral', () => {
    expect(copy.disclosure).toMatch(/not polls/i);
    expect(copy.disclosure).toMatch(/Fictional game/);
  });
  it('legal copy carries a versioned consent gate', () => {
    expect(legal.version.length).toBeGreaterThan(0);
    expect(legal.contenderConsentBody).toMatch(/consent/i);
    expect(legal.privacyBody.length).toBeGreaterThan(20);
  });
});

describe('characters', () => {
  it('every active Contender has a look and a valid default outfit', () => {
    const { options, characters } = outfits;
    for (const c of activeContenders) {
      const ch = characters[c.id];
      expect(ch, c.id).toBeDefined();
      expect(options.tops.map((o) => o.id)).toContain(ch!.outfit.top);
      expect(options.bottoms.map((o) => o.id)).toContain(ch!.outfit.bottom);
      expect(options.footwear.map((o) => o.id)).toContain(ch!.outfit.footwear);
      expect(options.headwear.map((o) => o.id)).toContain(ch!.outfit.headwear);
    }
  });
  it('obstacles include hoppable and non-hoppable kinds', () => {
    const low = simConfig.obstacles.filter((o) => o.heightMm < simConfig.hopHeightMm);
    const high = simConfig.obstacles.filter((o) => o.heightMm >= simConfig.hopHeightMm);
    expect(low.length).toBeGreaterThanOrEqual(4);
    expect(high.length).toBeGreaterThanOrEqual(3);
  });
});

describe('integrity events', () => {
  it('ships three generic threats with civic facts', () => {
    expect(integrityEvents.map((e) => e.id).sort()).toEqual(['sleepy-voter', 'snatcher', 'vote-buyer']);
    for (const e of integrityEvents) {
      expect(e.title.length).toBeGreaterThan(3);
      expect(e.civicFact.length).toBeGreaterThan(20);
      expect(e.verified).toBe(true);
    }
  });
});

describe('campaign map data', () => {
  it('lists every calendar state once, with a station', () => {
    const ids = calendar.unlocks.flatMap((u) => u.states);
    expect(new Set(stateIndex.map((s) => s.id))).toEqual(new Set(ids));
    expect(stateIndex).toHaveLength(ids.length);
    expect(ids.filter((s) => s !== 'fct')).toHaveLength(36);
    for (const row of stateIndex) {
      expect(stations.some((st) => st.id === row.audioStem)).toBe(true);
    }
    expect(stateIndex.find((s) => s.id === 'lagos')!.audioStem).toBe('sw-fuji');
  });
});

describe('calendar', () => {
  const stateIds = calendar.unlocks.flatMap((u) => u.states);
  it('unlocks 36 states plus FCT, no duplicates', () => {
    expect(new Set(stateIds).size).toBe(stateIds.length);
    expect(stateIds.filter((s) => s !== 'fct')).toHaveLength(36);
    expect(stateIds).toContain('fct');
  });
  it('every unlock is Monday 06:00 WAT (05:00Z)', () => {
    for (const u of calendar.unlocks) {
      const d = new Date(u.at);
      expect(d.getUTCDay()).toBe(1);
      expect(d.getUTCHours()).toBe(5);
      expect(d.getUTCMinutes()).toBe(0);
    }
  });
  it('closes 23:59 WAT on Fri 15 Jan 2027', () => {
    const d = new Date(calendar.closeAt);
    expect(d.toISOString()).toBe('2027-01-15T22:59:00.000Z');
    expect(d.getUTCDay()).toBe(5);
  });
});

describe('JSON-only state addition', () => {
  it('every file in data/states parses against the schema (no code change needed)', () => {
    const files = readJsonDir('states');
    expect(files.length).toBeGreaterThanOrEqual(2);
    for (const f of files) expect(() => stateSchema.parse(f.json), f.file).not.toThrow();
  });
  it('palaces cannot be venues', () => {
    expect(venueTypeSchema.safeParse('palace').success).toBe(false);
  });
  it('loads a registered state pack without application-specific code', async () => {
    expect(availableStatePacks()).toContain('lagos');
    const state = await loadStatePack('lagos');
    expect(state.id).toBe('lagos');
    expect(lagosLaunch.landmarks).toEqual(state.landmarks.map((landmark) => landmark.name));
    expect(lagosLaunch.welcomeLine).toBe(state.welcomeLines[0]);
    expect(lagosLaunch.audioStem).toBe(state.audioStem);
    await expect(loadStatePack('not-a-state')).rejects.toThrow('Unknown state pack');
  });
  it('ships the 26 Oct week as JSON-only packs', async () => {
    expect(shippedStatePacks()).toEqual(expect.arrayContaining(['kano', 'rivers', 'anambra', 'kaduna']));
    for (const id of ['kano', 'rivers', 'anambra', 'kaduna'] as const) {
      const pack = await loadStatePack(id);
      expect(pack.id).toBe(id);
      expect(pack.landmarks).toHaveLength(5);
      expect(stateIndex.some((s) => s.id === id && s.audioStem === pack.audioStem)).toBe(true);
    }
    expect(travelCaps.maxRunsPerDay).toBeGreaterThan(0);
  });
});

describe('guardrail lint', () => {
  it('no banned words or hashed terms in any content file', () => {
    const hashes = loadHashes();
    for (const f of readAllDataFiles()) {
      if (f.file === 'blocklist.hashes.json') continue;
      for (const s of collectStrings(f.json)) expect(findViolations(s, hashes), `${f.file}: ${s}`).toEqual([]);
    }
  });
  it('detects banned wording and hashed terms', () => {
    expect(findViolations('our candidate wins', new Set())).not.toEqual([]);
    const h = new Set([hashTerm('Banned Name')]);
    expect(findViolations('hello b4nn3d n4me there', h)).not.toEqual([]);
    expect(findViolations('hello world', h)).toEqual([]);
  });
});
