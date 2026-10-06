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
  hit: z.object({ speedPermille: int.min(0).max(1000), invulnTicks: int.nonnegative(), maxDents: int.positive() }),
  momentum: z.object({
    min: int.positive(),
    max: int.positive(),
    gainPerTick: int.nonnegative(),
    decayPerTick: int.nonnegative(),
    fastThresholdPermille: int.positive(),
  }),
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
