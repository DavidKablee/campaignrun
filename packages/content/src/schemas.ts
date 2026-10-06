import { z } from 'zod';

const int = z.number().int();
const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'invalid ISO date');

/** All tunables for the deterministic sim. Integers only (see docs/ARCHITECTURE.md). */
export const simConfigSchema = z.object({
  tickHz: int.positive(),
  laneSpacingMm: int.positive(),
  laneChangeMmPerTick: int.positive(),
  hopTicks: int.positive(),
  hopHeightMm: int.positive(),
  /** Speeds are micrometres per tick (1 m/s at 60 Hz = 16,667). */
  baseSpeedUm: int.positive(),
  maxSpeedUm: int.positive(),
  brakeSpeedUm: int.nonnegative(),
  accelUm: int.positive(),
  brakeDecelUm: int.positive(),
  coastUm: int.positive(),
  runTicks: int.positive(),
  player: z.object({ halfWidthMm: int.positive(), halfLenMm: int.positive(), heightMm: int.positive() }),
  spawn: z.object({
    aheadMm: int.positive(),
    firstMm: int.positive(),
    gapMinMm: int.positive(),
    gapMaxMm: int.positive(),
    despawnBehindMm: int.positive(),
    doubleChancePermille: int.min(0).max(1000),
    supporterChancePermille: int.min(0).max(1000),
    looseSupporterChancePermille: int.min(0).max(1000),
  }),
  obstacles: z
    .array(
      z.object({
        kind: z.string().min(1),
        weight: int.positive(),
        halfWidthMm: int.positive(),
        halfLenMm: int.positive(),
        heightMm: int.positive(),
      }),
    )
    .min(1),
  hit: z.object({
    speedPermille: int.min(0).max(1000),
    invulnTicks: int.nonnegative(),
    maxDents: int.positive(),
    dropCarriedPermille: int.min(0).max(1000),
  }),
  momentum: z.object({
    min: int.positive(),
    max: int.positive(),
    gainPerTick: int.nonnegative(),
    decayPerTick: int.nonnegative(),
    fastThresholdPermille: int.positive(),
  }),
  zones: z.object({
    brakeToActSpeedUm: int.positive(),
    loadTicks: int.positive(),
    unloadTicks: int.positive(),
    halfLenMm: int.positive(),
    halfWidthMm: int.positive(),
  }),
  bonuses: z.object({
    fullHousePermille: int.positive(),
    onBeatPermille: int.positive(),
    onBeatTaps: int.positive(),
    onBeatWindowTicks: int.positive(),
  }),
  course: z.object({
    borderGateMm: int.positive(),
    segmentLengthMm: int.positive(),
    segmentCount: int.positive(),
    pickupOffsetMm: int.positive(),
    venueOffsetMm: int.positive(),
    grandRallyMm: int.positive(),
    finishPadMm: int.positive(),
    hazardGapMinMm: int.positive(),
    hazardGapMaxMm: int.positive(),
  }),
  tiers: z.object({
    crowdPerCapacity: int.positive(),
    footholdPermille: int.min(1).max(1000),
    majorityPermille: int.min(1).max(1000),
    landslidePermille: int.min(1).max(1000),
  }),
  groupSizeMinPermille: int.min(0).max(2000),
  groupSizeSpanPermille: int.min(0).max(2000),
  defaultCapacity: int.positive(),
});
export type SimConfig = z.infer<typeof simConfigSchema>;

export const contenderSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  status: z.enum(['active', 'hidden', 'retired']),
  name: z.string().min(1),
  archetype: z.string().min(1),
  /** In-run only (spec amendment A4): perks never alter economy or progression. */
  perk: z.object({
    id: z.string(),
    description: z.string(),
    cooldownSec: int.positive(),
    durationSec: int.positive(),
  }),
  tradeoff: z.object({ stat: z.string(), permille: int.positive(), description: z.string() }),
  palette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(3),
  barks: z.array(z.string()).min(3),
  catchphrase: z.string().min(1),
});
export type Contender = z.infer<typeof contenderSchema>;

export const rideSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: int.nonnegative(),
  capacity: int.positive(),
  size: z.enum(['S', 'M', 'L']),
  trait: z.string(),
  followingGate: int.nonnegative(),
  priceNgn: int.nonnegative(),
  rideClass: z.enum(['light', 'mid', 'heavy']),
  /** C04 ships Trek and Okada. Later rides stay in the pack but are not selectable. */
  playable: z.boolean(),
});
export type Ride = z.infer<typeof rideSchema>;

/** Palaces/thrones are scenery only, never a venue (spec amendment A8). */
export const venueTypeSchema = z.enum(['market', 'stadium', 'square', 'park', 'bridge', 'landmark', 'waterfront']);

export const stateSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  zone: z.enum(['SW', 'SE', 'SS', 'NW', 'NE', 'NC', 'FCT']),
  biomeKit: z.enum([
    'lagoon-metro',
    'sahel-savanna',
    'harmattan-dune',
    'rainforest',
    'creek-delta',
    'hills-plateau',
    'farmland-river',
    'capital-city',
  ]),
  palette: z.object({ sky: z.string(), fog: z.string(), ground: z.string(), accent: z.string() }),
  landmarks: z
    .array(z.object({ name: z.string(), venueType: venueTypeSchema, verified: z.boolean() }))
    .length(5),
  scenery: z.array(z.string()).default([]),
  hazards: z.array(z.string()),
  signatureRide: z.string(),
  welcomeLines: z.array(z.string()).min(1),
  audioStem: z.string(),
});
export type StateDef = z.infer<typeof stateSchema>;

export const stationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  zone: z.enum(['SW', 'SE', 'SS', 'NW', 'NE', 'NC', 'FCT']),
  blurb: z.string().min(1),
});
export type Station = z.infer<typeof stationSchema>;

export const stateIndexSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  zone: z.enum(['SW', 'SE', 'SS', 'NW', 'NE', 'NC', 'FCT']),
  audioStem: z.string().min(1),
});
export type StateIndex = z.infer<typeof stateIndexSchema>;

export const calendarSchema = z.object({
  timezone: z.literal('Africa/Lagos'),
  closeAt: isoDate,
  finaleAt: isoDate,
  finalWeekFrom: isoDate,
  electionDate: isoDate,
  unlocks: z.array(z.object({ at: isoDate, states: z.array(z.string()).min(1), note: z.string().optional() })),
});
export type Calendar = z.infer<typeof calendarSchema>;

export const integrityEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  civicFact: z.string(),
  verified: z.boolean(),
});

export const copySchema = z.object({
  disclosure: z.string().min(20),
  playButton: z.string(),
  closing: z.string(),
  backSoon: z.string(),
});
export type Copy = z.infer<typeof copySchema>;

// ---------------------------------------------------------------------------
// Character looks + outfit options (cosmetic only; never affects the sim)
// ---------------------------------------------------------------------------
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const optionSchema = z.object({ id: z.string().min(1), name: z.string().min(1) });

export const characterLookSchema = z.object({
  gender: z.enum(['m', 'f']),
  skin: hex,
  hair: z.enum(['bald', 'short', 'natural', 'afro', 'braids']),
  hairColor: hex,
  facialHair: z.enum(['none', 'moustache', 'goatee', 'beard']),
  face: z.object({
    width: z.number().min(0.8).max(1.2),
    jaw: z.number().min(0.8).max(1.2),
    nose: z.number().min(0.8).max(1.3),
    lips: z.number().min(0.8).max(1.3),
    brow: z.number().min(0.7).max(1.3),
    eye: z.number().min(0.8).max(1.3),
  }),
  height: z.number().min(0.85).max(1.1),
  build: z.number().min(0.85).max(1.25),
  prop: z.enum(['none', 'fan', 'wrench', 'pouch', 'lantern', 'speaker', 'baton']),
  accessory: z.enum(['none', 'goggles', 'bowtie']),
});

export const outfitChoiceSchema = z.object({
  top: z.string(),
  topColor: hex,
  bottom: z.string(),
  bottomColor: hex,
  footwear: z.string(),
  footColor: hex,
  headwear: z.string(),
  headColor: hex,
});

export const outfitsSchema = z.object({
  options: z.object({
    tops: z.array(optionSchema).min(1),
    bottoms: z.array(optionSchema).min(1),
    footwear: z.array(optionSchema).min(1),
    headwear: z.array(optionSchema).min(1),
    colors: z.array(hex).min(6),
  }),
  characters: z.record(z.string(), z.object({ look: characterLookSchema, outfit: outfitChoiceSchema })),
});

export type CharacterLook = z.infer<typeof characterLookSchema>;
export type OutfitChoice = z.infer<typeof outfitChoiceSchema>;
