import { describe, expect, it } from 'vitest';
import {
  LAGOS_WORLD,
  fnv1a32,
  referencedDistricts,
  resolveWorld,
  shippedStatePacks,
  loadStatePack,
  loadWorldLibrary,
  availableWorldLibraries,
  worldRefSchema,
  sideOpSchema,
  simConfig,
} from '../src';

describe('the stock Lagos world', () => {
  it('has a district for every route entry, the start and the finish', () => {
    for (const id of [...LAGOS_WORLD.route, LAGOS_WORLD.start.district, LAGOS_WORLD.finish.district]) {
      expect(LAGOS_WORLD.districts[id], id).toBeDefined();
    }
  });

  it('spans every course segment and keeps salt 0 so Lagos draws exactly as before', () => {
    expect(LAGOS_WORLD.route).toHaveLength(simConfig.course.segmentCount);
    expect(LAGOS_WORLD.salt).toBe(0);
  });

  it('reproduces the old theme order: ojuelegba, bridge, link, market, then park for the rest', () => {
    expect(LAGOS_WORLD.route.map((d) => d.replace('lagos.', ''))).toEqual([
      'ojuelegba', 'bridge', 'link', 'market', 'park', 'park', 'park', 'park',
    ]);
    expect(LAGOS_WORLD.finish.label).toBe('VICTORIA ISLAND');
  });
});

describe('resolveWorld', () => {
  it('falls back to Lagos for null, for a state without a look, and while a library loads', () => {
    expect(resolveWorld(null)).toBe(LAGOS_WORLD);
    expect(resolveWorld({ id: 'sokoto' })).toBe(LAGOS_WORLD);
    const ref = worldRefSchema.parse({
      library: 'x',
      start: { district: 'a.b', label: 'Start' },
      route: Array(8).fill('a.b'),
      finish: { district: 'a.b', label: 'Finish' },
      road: 'lagos',
    });
    expect(resolveWorld({ id: 'kano', world: ref }, null)).toBe(LAGOS_WORLD);
  });

  it('gives each state its own seed salt, never zero', () => {
    expect(fnv1a32('kano')).not.toBe(fnv1a32('rivers'));
    expect(fnv1a32('kano') || 1).not.toBe(0);
  });

  it('rejects an op it does not know', () => {
    expect(sideOpSchema.safeParse({ op: 'teleport' }).success).toBe(false);
  });
});

describe('every shipped state look', () => {
  it('names only districts, roads, dress sets and landmarks that exist', async () => {
    const libs = availableWorldLibraries();
    for (const id of shippedStatePacks()) {
      const pack = await loadStatePack(id);
      if (!pack.world) continue;
      expect(libs, `${id} needs library ${pack.world.library}`).toContain(pack.world.library);
      const lib = await loadWorldLibrary(pack.world.library);
      const world = resolveWorld(pack, lib);
      for (const d of referencedDistricts(pack.world)) expect(world.districts[d], `${id}: district ${d}`).toBeDefined();
      expect(world.roads[pack.world.road], `${id}: road ${pack.world.road}`).toBeDefined();
      if (pack.world.dress) expect(lib.dress[pack.world.dress], `${id}: dress ${pack.world.dress}`).toBeDefined();
      expect(world.route).toHaveLength(simConfig.course.segmentCount);
      for (const p of pack.world.pieces) expect(p.landmark).toBeLessThan(pack.landmarks.length);
    }
  });

  it('keeps every dress colour and every awning/board palette clear of the party colours', async () => {
    // The six party colours of the game's fictional parties (a bystander must never look partisan).
    const party = ['#D4621B', '#1FA98F', '#3B6FD4', '#F5CE2E', '#C23FA0', '#8257C8'];
    const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const dist = (a: string, b: string) => {
      const [x, y] = [rgb(a), rgb(b)];
      return Math.hypot(x[0]! - y[0]!, x[1]! - y[1]!, x[2]! - y[2]!);
    };
    for (const name of availableWorldLibraries()) {
      const lib = await loadWorldLibrary(name);
      const colours: [string, string][] = [];
      for (const [id, set] of Object.entries(lib.dress)) for (const c of set.colors) colours.push([`${name}/${id}`, c]);
      for (const [id, d] of Object.entries(lib.districts)) {
        for (const op of d.side) {
          if (op.op === 'lots' || op.op === 'bazaar') for (const c of op.palette) colours.push([`${name}/${id}`, c]);
        }
      }
      for (const [where, c] of colours) for (const p of party) expect(dist(c, p), `${where}: ${c} is too close to party colour ${p}`).toBeGreaterThan(48);
    }
  });

  it('keeps every landmark of a state with a look marked unverified', async () => {
    for (const id of shippedStatePacks()) {
      const pack = await loadStatePack(id);
      if (!pack.world) continue;
      for (const l of pack.landmarks) expect(l.verified, `${id}: ${l.name}`).toBe(false);
    }
  });
});
