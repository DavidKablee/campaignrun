import { z } from 'zod';
import defaultsJson from '../data/world-defaults.json';

/**
 * What a state looks like, as data.
 *
 * JSON never describes geometry. It names *which* registered builder runs and
 * with what numbers and colours; the builders live in the renderer
 * (`apps/game/src/render/world`). The structural vocabulary (an op's name) is a
 * closed enum here so a typo fails the content lint; the registry ids a builder
 * is looked up by (a lot style, a flora kind, a set piece) are plain ids that
 * `apps/game/test/worldRegistry.test.ts` checks against the renderer.
 *
 * A state with no `world` block gets the Lagos world exactly as it was before
 * this existed, so adding a state's look is purely additive.
 */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const regId = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const weighted = z.array(z.tuple([regId, z.number().positive()])).min(1);
const range = z.tuple([z.number(), z.number()]);
/** Build this op on one side of the road only (-1 left, 1 right); omitted means both. */
const onlySide = z.union([z.literal(-1), z.literal(1)]).optional();

/** Things placed along each side of the road, in order. */
export const sideOpSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('furniture') }),
  z.object({ op: z.literal('people') }),
  // The original Lagos builders, kept verbatim so Lagos does not move.
  z.object({ op: z.literal('lagos.buildings'), minF: z.number().int(), maxF: z.number().int(), shops: z.number() }),
  z.object({ op: z.literal('lagos.towers'), near: z.boolean() }),
  z.object({ op: z.literal('lagos.stalls'), density: z.number() }),
  z.object({ op: z.literal('lagos.trees'), n: z.number().int() }),
  z.object({ op: z.literal('lagos.palms'), n: z.number().int() }),
  z.object({ op: z.literal('lagos.parkBits') }),
  // Regional builders.
  z.object({
    op: z.literal('lots'),
    styles: weighted,
    floors: range,
    /** Distance of the building front from the road centre line, metres. */
    setback: z.number().default(9.8),
    /** How tightly the plots pack: 0 is shoulder to shoulder. */
    spacing: z.number().default(0.5),
    palette: z.array(hex).default([]),
    side: onlySide,
  }),
  z.object({
    op: z.literal('flora'),
    kinds: weighted,
    n: z.number().int(),
    x: range,
    side: onlySide,
  }),
  z.object({ op: z.literal('crops'), kind: regId, x: range, side: onlySide }),
  z.object({ op: z.literal('wall'), kind: regId, x: range, side: onlySide }),
  z.object({ op: z.literal('bazaar'), density: z.number(), palette: z.array(hex).default([]), side: onlySide }),
  z.object({ op: z.literal('kerbside'), items: weighted, n: z.number().int(), side: onlySide }),
  /** A creek, river or lagoon edge: a mud bank, then open water from `x[0]` to `x[1]` metres out, with canoes. */
  z.object({ op: z.literal('waterEdge'), x: range, boats: z.number().int().default(2), color: hex.default('#6f8479'), side: onlySide }),
]);
export type SideOp = z.infer<typeof sideOpSchema>;

/** Things placed once per chunk. */
export const chunkOpSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('bridge') }),
  z.object({ op: z.literal('pylons') }),
  z.object({ op: z.literal('boats') }),
  z.object({ op: z.literal('footbridge'), every: z.number().int().positive(), offset: z.number().int().min(0) }),
]);
export type ChunkOp = z.infer<typeof chunkOpSchema>;

export const districtSchema = z.object({
  /** Gantry text when the district has no landmark of its own (segments 5+ and the finish). */
  label: z.string().min(1),
  /** Ground plane colour; null takes the state palette's ground. */
  ground: hex.nullable(),
  water: z.object({ y: z.number(), color: hex }).nullable(),
  /** Texture set for tiled building walls / shop fronts. */
  facade: regId,
  shops: regId,
  kerb: z.enum(['yellow-black', 'none']),
  median: z.boolean(),
  /** Road style override for this district. */
  road: regId.optional(),
  pre: z.array(chunkOpSchema).default([]),
  side: z.array(sideOpSchema),
  post: z.array(chunkOpSchema).default([]),
});
export type District = z.infer<typeof districtSchema>;

export const roadStyleSchema = z.object({
  /** Which road painter to use. */
  texture: regId,
  /** Colour of the dirt strip beside the kerb; null draws none (Lagos). */
  shoulder: hex.nullable(),
});
export type RoadStyle = z.infer<typeof roadStyleSchema>;

const garmentsSchema = z.object({
  tops: z.array(regId).min(1),
  bottoms: z.array(regId).min(1),
  headwear: z.array(regId).min(1),
  footwear: z.array(regId).min(1),
});

/**
 * How everyday people on the roadside are dressed. Garment ids are the ones the
 * character builder implements; repeating an id weights it. Villains and the
 * Contenders never use a dress set: they look the same in every state.
 */
export const dressSetSchema = z.object({
  men: garmentsSchema,
  women: garmentsSchema,
  /** Share of people drawn female, in permille. */
  femalePermille: z.number().int().min(0).max(1000),
  colors: z.array(hex).min(4),
  /** How many distinct baked people to make (bounds the bake cost). */
  count: z.number().int().min(4).max(24),
});
export type DressSet = z.infer<typeof dressSetSchema>;
export type ResolvedDress = DressSet & { id: string };

/** A shared per-biome file: what several states of one look can reuse. */
export const worldLibrarySchema = z.object({
  districts: z.record(regId, districtSchema),
  roads: z.record(regId, roadStyleSchema).default({}),
  dress: z.record(regId, dressSetSchema).default({}),
});
export type WorldLibrary = z.infer<typeof worldLibrarySchema>;

const stop = z.object({ district: regId, label: z.string().min(1) });

/** The `world` block of a state pack. */
export const worldRefSchema = z.object({
  /** `data/world/<library>.json`, loaded lazily with the state. */
  library: regId,
  start: stop,
  /** One district per course segment: segment i carries landmark i (i < 5). */
  route: z.array(regId).length(8),
  finish: stop,
  road: regId,
  dress: regId.optional(),
  /** Roof billboards. Replaces the zone list, which is Lagos-flavoured. */
  billboards: z.array(z.string().min(2).max(28)).optional(),
  skyline: regId.optional(),
  ambient: z.enum(['none', 'dust']).default('none'),
  /** Landmark set pieces, placed near that landmark's venue. */
  pieces: z
    .array(z.object({ landmark: z.number().int().min(0).max(4), piece: regId, side: z.union([z.literal(-1), z.literal(0), z.literal(1)]) }))
    .default([]),
});
export type WorldRef = z.infer<typeof worldRefSchema>;

const defaults = worldLibrarySchema
  .extend({
    route: z.array(regId).length(8),
    start: stop,
    finish: stop,
  })
  .parse(defaultsJson);

export interface ResolvedWorld {
  /** null for the stock Lagos world. */
  stateId: string | null;
  /** XOR-ed into the chunk RNG seed; 0 reproduces Lagos exactly. */
  salt: number;
  districts: Record<string, District>;
  route: string[];
  start: { district: string; label: string };
  finish: { district: string; label: string };
  road: RoadStyle;
  roads: Record<string, RoadStyle>;
  dress: ResolvedDress | null;
  billboards: string[] | null;
  skyline: string | null;
  ambient: 'none' | 'dust';
  pieces: WorldRef['pieces'];
}

/** FNV-1a, 32 bit. A state id becomes the number that decorrelates its chunk RNG from Lagos'. */
export function fnv1a32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export const LAGOS_WORLD: ResolvedWorld = {
  stateId: null,
  salt: 0,
  districts: defaults.districts,
  route: defaults.route,
  start: defaults.start,
  finish: defaults.finish,
  road: defaults.roads['lagos']!,
  roads: defaults.roads,
  dress: null,
  billboards: null,
  skyline: null,
  ambient: 'none',
  pieces: [],
};

/**
 * Pure: the world a state is drawn with. Lagos, an unconfigured state, or a
 * state whose library has not loaded yet all get the stock Lagos world, so the
 * renderer never has to ask whether a state has a look.
 */
export function resolveWorld(
  state: { id: string; world?: WorldRef | undefined } | null | undefined,
  library?: WorldLibrary | null,
): ResolvedWorld {
  const ref = state?.world;
  if (!state || !ref || !library) return LAGOS_WORLD;
  const districts = { ...defaults.districts, ...library.districts };
  const roads = { ...defaults.roads, ...library.roads };
  return {
    stateId: state.id,
    salt: fnv1a32(state.id) || 1,
    districts,
    route: ref.route,
    start: ref.start,
    finish: ref.finish,
    road: roads[ref.road] ?? defaults.roads['lagos']!,
    roads,
    dress: ref.dress && library.dress[ref.dress] ? { id: ref.dress, ...library.dress[ref.dress]! } : null,
    billboards: ref.billboards ?? null,
    skyline: ref.skyline ?? null,
    ambient: ref.ambient,
    pieces: ref.pieces,
  };
}

/** Every district id a state's route, start and finish name, for the content test. */
export function referencedDistricts(ref: WorldRef): string[] {
  return [...new Set([ref.start.district, ref.finish.district, ...ref.route])];
}
