import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  availableWorldLibraries,
  hasStatePack,
  loadStatePack,
  loadWorldLibrary,
  outfits,
  shippedStatePacks,
  venueTypeSchema,
  type District,
  type WorldLibrary,
} from '@cr/content';
import { installCanvasStub } from './helpers/canvasStub';

vi.mock('../src/render/assets', () => ({
  loadAsset: () => new Promise(() => {}),
  preloadBiome: async () => {},
  biomeAssetIds: () => [],
  buildInstancedProp: () => {
    throw new Error('not used');
  },
}));

/**
 * The content names things by id; the renderer has to have a builder for each.
 * A district that names a lot style nobody wrote would throw in the middle of a
 * run, so the whole data set is checked here against the real registries.
 */
describe('every id the world data names has a builder', () => {
  let reg: {
    LOT_STYLES: Record<string, unknown>;
    FLORA: Record<string, unknown>;
    CROPS: Record<string, unknown>;
    KERBSIDE_ITEMS: string[];
    WALL_KINDS: readonly string[];
    PIECES: Record<string, unknown>;
    SKYLINES: Record<string, unknown>;
    VENUE_BACKDROP_KINDS: string[];
    NPC_GARMENTS: { tops: readonly string[]; headwear: readonly string[] };
    facade: (v: number, set: string) => unknown;
    shop: (v: number, set: string) => unknown;
    road: (style: string) => unknown;
  };
  const libs: { name: string; lib: WorldLibrary }[] = [];

  beforeAll(async () => {
    installCanvasStub();
    const [lots, flora, regional, pieces, skyline, venues, character, tex] = await Promise.all([
      import('../src/render/world/lots'),
      import('../src/render/world/flora'),
      import('../src/render/world/regional'),
      import('../src/render/world/pieces'),
      import('../src/render/world/skyline'),
      import('../src/render/world/venues'),
      import('../src/render/character'),
      import('../src/render/textures'),
    ]);
    // Importing the world module registers every state's pieces.
    await import('../src/render/world');
    reg = {
      LOT_STYLES: lots.LOT_STYLES,
      FLORA: flora.FLORA,
      CROPS: flora.CROPS,
      KERBSIDE_ITEMS: regional.KERBSIDE_ITEMS,
      WALL_KINDS: regional.WALL_KINDS,
      PIECES: pieces.PIECES,
      SKYLINES: skyline.SKYLINES,
      VENUE_BACKDROP_KINDS: venues.VENUE_BACKDROP_KINDS,
      NPC_GARMENTS: character.NPC_GARMENTS,
      facade: (v, set) => tex.facadeTexture(v, set),
      shop: (v, set) => tex.shopTexture(v, set),
      road: (style) => tex.roadTexture(style),
    };
    for (const name of availableWorldLibraries()) libs.push({ name, lib: await loadWorldLibrary(name) });
  });

  function allDistricts(): { where: string; d: District }[] {
    return libs.flatMap(({ name, lib }) => Object.entries(lib.districts).map(([id, d]) => ({ where: `${name}/${id}`, d })));
  }

  it('lots, flora, crops, walls and kerbside items', () => {
    for (const { where, d } of allDistricts()) {
      for (const op of d.side) {
        if (op.op === 'lots') for (const [id] of op.styles) expect(reg.LOT_STYLES[id], `${where}: lot style ${id}`).toBeDefined();
        if (op.op === 'flora') for (const [id] of op.kinds) expect(reg.FLORA[id], `${where}: flora ${id}`).toBeDefined();
        if (op.op === 'crops') expect(reg.CROPS[op.kind], `${where}: crop ${op.kind}`).toBeDefined();
        if (op.op === 'wall') expect(reg.WALL_KINDS, `${where}: wall ${op.kind}`).toContain(op.kind);
        if (op.op === 'kerbside') for (const [id] of op.items) expect(reg.KERBSIDE_ITEMS, `${where}: kerbside ${id}`).toContain(id);
      }
    }
  });

  it('texture sets and road styles paint', () => {
    for (const { where, d } of allDistricts()) {
      expect(() => reg.facade(0, d.facade), `${where}: facade ${d.facade}`).not.toThrow();
      expect(() => reg.shop(0, d.shops), `${where}: shops ${d.shops}`).not.toThrow();
      if (d.road) expect(() => reg.road(d.road!), where).not.toThrow();
    }
    for (const { name, lib } of libs) for (const [id, r] of Object.entries(lib.roads)) expect(() => reg.road(r.texture), `${name}/${id}`).not.toThrow();
  });

  it('pieces and skylines named by a state exist', async () => {
    for (const id of shippedStatePacks()) {
      if (!hasStatePack(id)) continue;
      const pack = await loadStatePack(id);
      if (!pack.world) continue;
      for (const p of pack.world.pieces) expect(reg.PIECES[p.piece], `${id}: piece ${p.piece}`).toBeDefined();
      if (pack.world.skyline) expect(reg.SKYLINES[pack.world.skyline], `${id}: skyline`).toBeDefined();
    }
  });

  it('dress sets use only garments the character builder implements', () => {
    const studio = {
      tops: new Set(outfits.options.tops.map((o) => o.id)),
      bottoms: new Set(outfits.options.bottoms.map((o) => o.id)),
      footwear: new Set(outfits.options.footwear.map((o) => o.id)),
      headwear: new Set(outfits.options.headwear.map((o) => o.id)),
    };
    for (const { name, lib } of libs) {
      for (const [id, set] of Object.entries(lib.dress)) {
        for (const g of [set.men, set.women]) {
          for (const t of g.tops) expect(studio.tops.has(t) || reg.NPC_GARMENTS.tops.includes(t), `${name}/${id}: top ${t}`).toBe(true);
          for (const t of g.bottoms) expect(studio.bottoms.has(t), `${name}/${id}: bottom ${t}`).toBe(true);
          for (const t of g.footwear) expect(studio.footwear.has(t), `${name}/${id}: footwear ${t}`).toBe(true);
          for (const t of g.headwear) expect(studio.headwear.has(t) || reg.NPC_GARMENTS.headwear.includes(t), `${name}/${id}: headwear ${t}`).toBe(true);
        }
      }
    }
  });

  it('has a stage backdrop for every kind of landmark', () => {
    for (const t of venueTypeSchema.options) expect(reg.VENUE_BACKDROP_KINDS, t).toContain(t);
  });
});
