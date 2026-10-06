import { describe, expect, it } from 'vitest';
import {
  activeContenders,
  calendar,
  contenders,
  copy,
  rides,
  simConfig,
  stateSchema,
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
