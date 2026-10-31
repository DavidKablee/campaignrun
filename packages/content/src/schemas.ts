import { z } from 'zod';
import { worldRefSchema } from './world';

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
    integrityChancePermille: int.min(0).max(1000),
    /** C28: PVC pickup and rival-convoy spawn chances, same roll pipeline as the rest. */
    pvcChancePermille: int.min(0).max(1000),
    rivalChancePermille: int.min(0).max(1000),
  }),
  obstacles: z
    .array(
      z.object({
        kind: z.string().min(1),
        weight: int.positive(),
        halfWidthMm: int.positive(),
        halfLenMm: int.positive(),
        heightMm: int.positive(),
        /** C26 ride size-class rules: 'narrow' blocks M/L (S passes), 'flood'
         *  blocks L only (S/M pass), 'light' is ploughed by rides with
         *  ploughsLight (Danfo+) without a dent. Undefined = normal obstacle,
         *  blocks every ride size the same way it always has. */
        sizeTag: z.enum(['narrow', 'flood', 'light']).optional(),
      }),
    )
    .min(1),
  /**
   * Traffic that moves. A kind listed here is spawned as a vehicle with a
   * velocity of its own (mm per sim tick, 60 Hz: 100 mm/tick is 6 m/s) instead
   * of a prop in the road, and takes its size from the `obstacles` row of the
   * same kind. Movers sleep until the player is `wakeMm` behind them, so they
   * start moving already in view and the course stays a pure function of the
   * seed and the player's own inputs.
   */
  traffic: z.object({
    /** Share of hazard slots rolled as moving traffic, on top of the obstacle table's own vehicles. */
    chancePermille: int.min(0).max(1000),
    wakeMm: int.positive(),
    /** Oncoming traffic is never placed closer than this to the stop it follows, so a convoy leaving a pickup is not met head-on. */
    oncomingMinOffsetMm: int.nonnegative(),
    /** Same-direction traffic is only placed this near the window start, so it cannot crawl into the unload zone. */
    slowMaxOffsetMm: int.positive(),
    /** A vehicle passed this close sideways (and not hit) is a close call. */
    closeCallMm: int.positive(),
    /** Rival convoys in the first part of a window travel at this speed (mm/tick, same direction as the player). */
    rivalVzMin: int.nonnegative(),
    rivalVzMax: int.nonnegative(),
    kinds: z
      .array(
        z.object({
          kind: z.string().min(1),
          weight: int.positive(),
          /** [min, max] mm/tick, negative = toward the player. Absent = this kind never drives the wrong way. */
          oncoming: z.tuple([z.number().int(), z.number().int()]).optional(),
          /** [min, max] mm/tick, positive = away from the player, slower than it. Absent = never crawls ahead. */
          slow: z.tuple([z.number().int(), z.number().int()]).optional(),
          /** Chance this vehicle swerves into a neighbouring lane as the player closes in. */
          weaverChancePermille: int.min(0).max(1000).optional(),
        }),
      )
      .min(1),
    weave: z.object({
      /** Distance to the player at which a weaver starts its warning. */
      triggerMm: int.positive(),
      /** Ticks of indicator and horn before it moves. */
      warnTicks: int.positive(),
      mmPerTick: int.positive(),
    }),
    walker: z.object({
      triggerMm: int.positive(),
      mmPerTick: int.positive(),
    }),
  }),
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
    /** C28 PVC pickup: temporary Crowd multiplier. */
    pvcMultiplierPermille: int.positive(),
    pvcDurationTicks: int.positive(),
    /** C28 rival convoys: flat skillCrowd bonus for an unhit pass, gentle speed knock on a bump. */
    rivalOutpaceCrowd: int.nonnegative(),
    /** C41: was inlined in App.tsx; the plausibility bound needs it too. */
    signatureRideBonusPermille: int.positive(),
    rivalBumpSpeedPermille: int.min(0).max(1000),
    /** C30: Rally Saturday (spec: "x2 Crowd, 6-9pm WAT"). The caller decides the window is active from a real clock; sim only applies the number. */
    rallySaturdayMultiplierPermille: int.positive(),
  }),
  /**
   * Unscheduled trouble, placed by segment number rather than by the hazard
   * roll, so it adds the same moments to every seed without moving the rest of
   * the course. An agbero collecting a toll stands in a lane every Nth segment
   * (a hit costs load and speed, never a dent; a clean pass is worth a little
   * Turnout), and a stubborn passenger makes every Nth venue slower to unload.
   */
  chaos: z.object({
    agberoEverySegments: int.positive(),
    tollDropPermille: int.min(0).max(1000),
    tollSpeedPermille: int.min(0).max(1000),
    tollDodgeCrowd: int.nonnegative(),
    stubbornEverySegments: int.positive(),
    stubbornExtraPermille: int.nonnegative(),
  }),
  course: z.object({
    borderGateMm: int.positive(),
    segmentLengthMm: int.positive(),
    segmentCount: int.positive(),
    /** A quick rally runs this many segments of the same road: a ~90 s run for a first go or a short break. */
    quickSegmentCount: int.positive(),
    pickupOffsetMm: int.positive(),
    venueOffsetMm: int.positive(),
    grandRallyMm: int.positive(),
    finishPadMm: int.positive(),
    hazardGapMinMm: int.positive(),
    hazardGapMaxMm: int.positive(),
    /**
     * C45: the tightest a state's road may pack its spawns, as permille of the
     * gaps above. The road clamps in road.json must not go below it, and a
     * content test holds them to that — the plausibility bound counts how many
     * entities can fit on a course, and that count is only safe if there is a
     * floor on the spacing.
     */
    roadGapFloorPermille: int.min(100).max(1000),
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

/**
 * C44: per-ride handling. Each field multiplies the matching `simConfig`
 * number, so the sim keeps one set of base values and a ride only says how it
 * differs from them. Integers (permille) because the sim is integer-only —
 * see docs/ARCHITECTURE.md.
 */
export const rideHandlingSchema = z.object({
  /** Lane-change rate. A bus should not slide across three lanes like a bike. */
  laneChangePermille: int.min(200).max(2000).default(1000),
  /** Acceleration off the brake. */
  accelPermille: int.min(200).max(2000).default(1000),
  /** Top speed. */
  topSpeedPermille: int.min(500).max(1500).default(1000),
  /** Braking rate, so a heavy ride has to brake earlier for a load zone. */
  brakeDecelPermille: int.min(200).max(2000).default(1000),
  /** Hop airtime — a shorter window means tighter timing over a hazard. */
  hopPermille: int.min(400).max(2000).default(1000),
});
export type RideHandling = z.infer<typeof rideHandlingSchema>;

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
  /** C26: give the flavour-text traits real mechanics. All default false/0 so Trek/Okada (and any pack missing these) behave exactly as before. */
  ploughsLight: z.boolean().default(false),
  freeHitPerRun: z.boolean().default(false),
  magnetBonusMm: int.nonnegative().default(0),
  /**
   * C44. `trait` is the upside; this is what it costs you. Every ride had an
   * upside and no downside, which is why the ladder was only ever "the last
   * ride plus more seats" — there was never a reason to drive a keke once the
   * danfo unlocked.
   */
  tradeoff: z.string().default(''),
  /**
   * C44 handling, permille of the matching `simConfig` number: 1000 is "drives
   * exactly like the config says", 700 is 70% of it. Bounded well away from 0
   * because these are divisors of feel, not of maths — a ride at 50 permille
   * lane change would be unsteerable rather than heavy. Defaults of 1000 mean
   * a pack that omits the block drives exactly as it did before C44.
   */
  /** `.parse({})` resolves the per-field defaults, so an omitted block is a neutral ride rather than a type error. */
  handling: rideHandlingSchema.default(rideHandlingSchema.parse({})),
  /**
   * Share of the carried crowd a knock scatters, permille of
   * `simConfig.hit.dropCarriedPermille`. Above 1000 sheds more than the base
   * (an okada has nothing holding anyone on), below it sheds less.
   */
  hitDropPermille: int.min(100).max(3000).default(1000),
  /**
   * How much rival-convoy traffic this ride attracts, permille of
   * `simConfig.spawn.rivalChancePermille`. A Grand Convoy is the one thing on
   * the road worth coming out for, and that is its cost.
   */
  rivalDrawPermille: int.min(100).max(4000).default(1000),
});
export type Ride = z.infer<typeof rideSchema>;

/** Palaces/thrones are scenery only, never a venue (spec amendment A8). */
export const venueTypeSchema = z.enum(['market', 'stadium', 'square', 'park', 'bridge', 'landmark', 'waterfront']);

/**
 * Closed vocabulary (C34). Hazards are flavour data today — nothing in the sim or
 * the renderer reads them yet — but they are the shortlist of road events the game
 * is meant to grow, and 38 packs free-typing their own strings would hand whoever
 * implements them 40 one-off synonyms to triage. Adding a hazard is deliberate:
 * add it here first.
 */
export const hazardSchema = z.enum([
  // traffic
  'go-slow',
  'keke-swerve',
  'okada-swarm',
  'cart-weave',
  'cattle-crossing',
  'roundabout-maze',
  'market-spill',
  'crowd-surge',
  // water
  'flash-flood',
  'flood-sheet',
  'creek-crossing',
  'rain-slick',
  'river-fog',
  // dry air
  'dust-plume',
  'dust-storm',
  'heat-shimmer',
  'low-visibility',
  // terrain
  'hilly-road',
  'rocky-ridge',
  'switchback',
]);
export type Hazard = z.infer<typeof hazardSchema>;

/**
 * C45: what a hazard does to the road. Every number is permille of a value the
 * sim already has, so a hazard never introduces a new rule — it leans on the
 * ones C26 and C44 built. `obstacleWeights` multiplies the spawn weight of one
 * obstacle kind from `simConfig.obstacles` (so a flood state really is full of
 * flood patches, which C26 already blocks size L), and `road` multiplies the
 * player's own handling for the whole run.
 *
 * Note that `go-slow` sits in 37 of the 38 packs: it is the common denominator
 * of a Nigerian road, so its numbers are deliberately mild. What makes one
 * state's road different from another's is the other two hazards.
 */
export const hazardRoadSchema = z.object({
  topSpeedPermille: int.min(500).max(1500).default(1000),
  accelPermille: int.min(500).max(1500).default(1000),
  brakeDecelPermille: int.min(500).max(1500).default(1000),
  laneChangePermille: int.min(500).max(1500).default(1000),
  /** Distance between spawns. Below 1000 is a busier road, not a slower one. */
  gapPermille: int.min(500).max(1500).default(1000),
  /** Chance a spawn is doubled into a second lane — the cost of seeing late. */
  doubleChancePermille: int.min(500).max(2000).default(1000),
});
export type HazardRoad = z.infer<typeof hazardRoadSchema>;

export const hazardEffectSchema = z.object({
  id: hazardSchema,
  label: z.string().min(1),
  family: z.enum(['traffic', 'water', 'air', 'terrain']),
  /** One short line for the briefing. A content test holds it to the mechanics. */
  note: z.string().min(1),
  /**
   * Keyed by `simConfig.obstacles[].kind`. Left as a loose record because the
   * kinds live in sim.json, not in an enum here; a content test checks every
   * key names an obstacle that actually exists.
   */
  obstacleWeights: z.record(z.string(), int.min(200).max(4000)).default({}),
  road: hazardRoadSchema.default(hazardRoadSchema.parse({})),
});
export type HazardEffect = z.infer<typeof hazardEffectSchema>;

const permilleBound = z.object({ min: int.positive(), max: int.positive() });

/**
 * C45 road tuning. A state stacks up to three hazards and their permilles
 * multiply, so the bounds here are what stops a three-hazard road from
 * compounding into a run where the gas pedal does nothing. `advice` is the
 * thresholds (and copy) the briefing uses to say out loud which ride this road
 * suits — read from the composed profile, so the advice cannot drift from the
 * mechanics the way a hand-written line would.
 */
export const roadTuningSchema = z.object({
  clamp: z.object({
    topSpeedPermille: permilleBound,
    accelPermille: permilleBound,
    brakeDecelPermille: permilleBound,
    laneChangePermille: permilleBound,
    gapPermille: permilleBound,
    doubleChancePermille: permilleBound,
    obstacleWeightPermille: permilleBound,
  }),
  advice: z.object({
    floodPermille: int.positive(),
    narrowPermille: int.positive(),
    lightPermille: int.positive(),
    tightLanePermille: int.positive(),
    /** The keke: every ride's handling permille is measured against this. */
    baselinePermille: int.positive(),
    /** Above this, a road doubles its spawns often enough to be worth warning about. */
    doublePermille: int.positive(),
    /** Above this, the road is rough enough that hop airtime is the answer. */
    roughPermille: int.positive(),
    /** At or below this, braking distance is long enough to be worth warning about. */
    slickPermille: int.positive(),
    /** At or below this gap, the road is busy enough that taking a knock is likely. */
    busyPermille: int.positive(),
    /** The briefing has room for a few lines, not every true one. */
    maxNotes: int.positive(),
    copy: z.object({
      floodBad: z.string().min(1),
      floodGood: z.string().min(1),
      narrowGood: z.string().min(1),
      narrowBad: z.string().min(1),
      lightGood: z.string().min(1),
      lightBad: z.string().min(1),
      tightBad: z.string().min(1),
      doubleGood: z.string().min(1),
      doubleBad: z.string().min(1),
      roughGood: z.string().min(1),
      roughBad: z.string().min(1),
      slickGood: z.string().min(1),
      slickBad: z.string().min(1),
      knockGood: z.string().min(1),
      knockBad: z.string().min(1),
      even: z.string().min(1),
    }),
  }),
});
export type RoadTuning = z.infer<typeof roadTuningSchema>;

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
  hazards: z.array(hazardSchema).min(1),
  signatureRide: z.string(),
  welcomeLines: z.array(z.string()).min(1),
  /**
   * Shown on the finish gantry. Optional: a farewell is only worth printing in a
   * language the state actually speaks, and for the states whose languages are not
   * represented here the sign falls back to a neutral line rather than guessing.
   */
  farewellLine: z.string().min(1).optional(),
  audioStem: z.string(),
  /** What the state looks like (C50). Absent: the stock Lagos world. */
  world: worldRefSchema.optional(),
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

/** Minimal launch-shell metadata; the full state stays in a lazy pack. */
export const launchStateSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  audioStem: z.string().min(1),
  welcomeLine: z.string().min(1),
  landmarks: z.array(z.string().min(1)).length(5),
});
export type LaunchState = z.infer<typeof launchStateSchema>;

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
  /** C40: the roster says out loud that the six are balanced (guardrail 5) and
      what the lock costs, instead of leaving both to a one-line hint. */
  rosterFair: z.string().min(20),
  rosterLock: z.string().min(20),
  studioLooks: z.string().min(20),
});
export type Copy = z.infer<typeof copySchema>;

/**
 * C41: the abuse limits the API enforces. They live in content for the same
 * reason the privacy floor does — the client quotes them to the player ("try
 * again in 15 minutes", "your link lasts an hour") and a second copy of the
 * number is a promise that drifts from what the server actually does. Each one
 * has a `CR_*` env override for a local demo; see `api/src/limits.ts`.
 */
export const limitsSchema = z.object({
  auth: z.object({
    signupPerDayPerIp: z.number().int().positive(),
    loginPerMinutePerIp: z.number().int().positive(),
    loginFailuresBeforeLockout: z.number().int().positive(),
    lockoutMinutes: z.number().int().positive(),
    forgotPerHourPerIp: z.number().int().positive(),
    verifyTokenHours: z.number().int().positive(),
    resetTokenMinutes: z.number().int().positive(),
    minPasswordLength: z.number().int().min(8),
    // C42: name-only accounts. A name-only account costs one POST, so it gets
    // its own ceiling rather than borrowing the signup one.
    guestPerDayPerIp: z.number().int().positive(),
    devicePerMinutePerIp: z.number().int().positive(),
    /** Runs a name-only player must have banked before being asked for an email. */
    emailPromptAfterRuns: z.number().int().positive(),
    /**
     * Escalating snooze, in hours: each "not now" waits the next entry, and the
     * last one repeats forever. A ladder rather than one interval, because the
     * prompt is the only route to a second device and so cannot be dismissed
     * permanently — but asking at the same rate forever is nagging.
     */
    emailPromptSnoozeHours: z.array(z.number().int().positive()).min(1),
  }),
  scores: z.object({
    perMinutePerUser: z.number().int().positive(),
  }),
  board: z.object({
    maxRows: z.number().int().positive(),
  }),
  /** C78: anonymous usage counters. */
  events: z.object({
    perMinutePerIp: z.number().int().positive(),
    maxPerRequest: z.number().int().positive(),
  }),
  /** C78: "Is this your state?" corrections. */
  feedback: z.object({
    perDayPerIp: z.number().int().positive(),
    noteMaxChars: z.number().int().positive(),
  }),
  /** C78: the weekly "busiest roads" tally. Hidden until the whole game has this many rallies in the window. */
  tally: z.object({
    windowDays: z.number().int().positive(),
    minTotalRallies: z.number().int().positive(),
    topStates: z.number().int().positive(),
  }),
  /** C82: Mobilise. Per-user ceilings so a script cannot flood a room or farm the daily cap. */
  places: z.object({
    joinPerMinutePerIp: z.number().int().positive(),
    movePerMinutePerUser: z.number().int().positive(),
    actPerMinutePerUser: z.number().int().positive(),
    sayPerMinutePerUser: z.number().int().positive(),
    reportPerDayPerUser: z.number().int().positive(),
  }),
});
export type Limits = z.infer<typeof limitsSchema>;

/**
 * C78: the closed list of anonymous usage events. A counter has a name and, for run events, a state
 * id: no identifier, no cookie, no score. Closed so a typo cannot start a new counter and so the
 * server can refuse anything not on the list.
 */
export const analyticsSchema = z.object({
  events: z.array(z.string().regex(/^[a-z_]{3,24}$/)).min(1),
  /** Events one page load may send before it goes quiet. */
  maxPerSession: z.number().int().positive(),
  /** Events queued before a send. */
  flushAt: z.number().int().positive(),
});
export type Analytics = z.infer<typeof analyticsSchema>;

/**
 * The standing live events (C81). All three run from the clock and the player's own device, with no
 * server: a Weekly Tour state that pays once a week and a Final Week that pays once a day. They
 * change only the coins a finished run pays, never the sim. (Rally Saturday's double Crowd is the
 * sim's own `rallySaturdayMultiplierPermille`, announced by `liveEvents.ts`.)
 */
export const liveEventsSchema = z.object({
  /** Coins for the first finished rally of the week in the featured state. */
  tourBonus: z.number().int().positive(),
  /** Coins for the first finished rally of each day in the Final Week, in the finale state. */
  finalWeekDailyBonus: z.number().int().positive(),
  /** The state the Final Week features. */
  finalWeekStateId: z.string().min(1),
});
export type LiveEventsConfig = z.infer<typeof liveEventsSchema>;

/**
 * C82: Mobilise, the shared campaign places. A place is one of four kinds in a state; players in it
 * walk about, do a few campaign actions and talk in preset phrases only (no free text, so nothing a
 * player types can be relayed). Actions pay coins and a small, daily-capped Supporters head start
 * and add to the state's activity on the Board. None of it reaches the sim or a Contender's power.
 */
export const placeKindSchema = z.object({
  id: z.string().regex(/^[a-z]{3,12}$/),
  label: z.string().min(1),
  blurb: z.string().min(10),
});

export const placeActionSchema = z.object({
  id: z.string().regex(/^[a-z]{3,12}$/),
  label: z.string().min(1),
  /** One word for the action dock, where the full label would wrap. */
  short: z.string().min(1).max(10),
  pose: z.enum(['stand', 'wave', 'cheer']),
  poseSeconds: z.number().positive().max(10),
  cooldownSeconds: z.number().positive(),
  coins: z.number().int().min(0),
  supporters: z.number().int().min(0),
  /** Points added to the state's activity on the Board. */
  activity: z.number().int().min(0),
  /** True when the action only counts with someone else within `companyRadiusMetres`. */
  needsCompany: z.boolean(),
  /**
   * For an action that needs company: the share of the reward (percent) paid when only Locals are
   * nearby, so a solo player is not locked out. 0 refuses without a real player close by. A reduced
   * action adds nothing to a state's Board activity.
   */
  soloPercent: z.number().int().min(0).max(100).default(0),
});

/**
 * C91: a Campaign Job, a small goal a player can finish in a visit. Progress is counted on the server
 * from accepted actions, never reported by the client. `type` says what counts: an action (`action`
 * names which; `withCompany` only counts it with a real player close by), a phrase or emoji said, a
 * visit to the national square, or a friendship made. A job that needs another player is `social`, and
 * a day never offers more than one, so a solo player can always finish all of them.
 */
export const placeJobSchema = z.object({
  id: z.string().regex(/^[a-z]{3,16}$/),
  label: z.string().min(3).max(40),
  type: z.enum(['action', 'say', 'square', 'friend']),
  action: z.string().regex(/^[a-z]{3,12}$/).optional(),
  withCompany: z.boolean().optional(),
  target: z.number().int().min(1).max(20),
  coins: z.number().int().min(0),
  supporters: z.number().int().min(0),
  social: z.boolean(),
});

export const placeTitleSchema = z.object({
  id: z.string().regex(/^[a-z]{3,16}$/),
  /** Chosen from this fixed list only: nobody types a title. */
  label: z.string().min(3).max(20),
});

export const placePhraseSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9]{2,15}$/),
  /** The topic pack the phrase belongs to; must be one of `topics`. */
  tag: z.string().regex(/^[a-z]{3,12}$/),
  en: z.string().min(3).max(60),
  pcm: z.string().min(3).max(60),
});

export const placeTopicSchema = z.object({
  id: z.string().regex(/^[a-z]{3,12}$/),
  label: z.string().min(2).max(16),
});

/**
 * C92: a poll any player in a room can start from a fixed list. The room votes once each, sees counts
 * (never who voted for what) and it closes by itself. Question and options are preset text, so nothing
 * typed can reach another player.
 */
export const placePollSchema = z.object({
  id: z.string().regex(/^[a-z]{3,16}$/),
  topic: z.string().regex(/^[a-z]{3,12}$/),
  en: z.string().min(3).max(60),
  pcm: z.string().min(3).max(60),
  options: z
    .array(z.object({ id: z.string().regex(/^[a-z]{3,12}$/), en: z.string().min(2).max(24), pcm: z.string().min(2).max(24) }))
    .min(2)
    .max(3),
});

/** C90: the one national place, outside any state: `naija:square`. */
export const placeSquareSchema = z.object({
  id: z.string().regex(/^[a-z]{3,12}$/),
  stateId: z.string().regex(/^[a-z]{3,12}$/),
  label: z.string().min(1),
  blurb: z.string().min(10),
  /** Which of `kinds` the scenery borrows. */
  scenery: z.string().regex(/^[a-z]{3,12}$/),
});

export const placesSchema = z.object({
  kinds: z.array(placeKindSchema).min(1),
  square: placeSquareSchema,
  friends: z.object({ max: z.number().int().positive() }),
  jobs: z.object({
    perDay: z.number().int().min(1).max(6),
    /** Paid once when every job of the day is done. */
    allDone: z.object({ coins: z.number().int().min(0), supporters: z.number().int().min(0) }),
    pool: z.array(placeJobSchema).min(4),
  }),
  streak: z.object({
    /** Consecutive Lagos days with at least one job done. Each milestone earns a title and a bonus once. */
    milestones: z
      .array(z.object({ days: z.number().int().min(2), title: z.string(), coins: z.number().int().min(0), supporters: z.number().int().min(0) }))
      .min(1),
  }),
  titles: z.array(placeTitleSchema).min(1),
  rooms: z.object({
    /** Most rooms the room browser lists. */
    listMax: z.number().int().positive(),
    /** A room this full is "busy": the nudge for a lone player points at it. */
    busyAt: z.number().int().positive(),
    /** How long a player who dropped keeps their spot to walk back into. */
    rejoinSeconds: z.number().int().nonnegative(),
  }),
  roomCapacity: z.number().int().min(2),
  /** Supporters (Following) a player needs before Mobilise opens. */
  followingGate: z.number().int().min(0),
  presenceTtlSeconds: z.number().int().positive(),
  walkSpeedMetresPerSecond: z.number().positive(),
  bounds: z.object({ halfX: z.number().positive(), halfZ: z.number().positive() }),
  companyRadiusMetres: z.number().positive(),
  /** Ambient "Local" characters (never players) so a quiet room is not empty; fewer as it fills. */
  locals: z.object({ max: z.number().int().min(0), min: z.number().int().min(0) }),
  actions: z.array(placeActionSchema).min(1),
  topics: z.array(placeTopicSchema).min(2),
  phrases: z.array(placePhraseSchema).min(1),
  polls: z.object({
    /** How long a poll stays open. */
    seconds: z.number().int().min(10).max(300),
    /** How long before the same player may start another. */
    cooldownSeconds: z.number().int().min(0),
    items: z.array(placePollSchema).min(1),
  }),
  emoji: z.array(z.string().min(1).max(8)).min(1),
  daily: z.object({
    coins: z.number().int().positive(),
    supporters: z.number().int().positive(),
    actions: z.number().int().positive(),
  }),
  report: z.object({ reasons: z.array(z.string().regex(/^[a-z-]{3,24}$/)).min(1) }),
  /**
   * C93: typed chat. Ships dark (`CR_CHAT_ENABLED`). Who may type, the message rules, the safety loop and
   * how long a message is kept for reports. `reasons` are what a refused sender is told; `locks` why the
   * box is not there. Every number here is a policy the owner and a lawyer may change, not code.
   */
  chat: z.object({
    minAccountHours: z.number().int().min(0),
    minJobsDone: z.number().int().min(0),
    maxChars: z.number().int().min(10).max(200),
    gapSeconds: z.number().int().min(1),
    reportsToHide: z.number().int().min(2),
    hideHours: z.number().int().min(1),
    retentionHours: z.number().int().min(1).max(72),
    strikesToCoolDown: z.number().int().min(2),
    strikeWindowMinutes: z.number().int().min(1),
    coolDownMinutes: z.number().int().min(1),
    reasons: z.record(z.string(), z.object({ en: z.string().min(3).max(80), pcm: z.string().min(3).max(80) })),
    locks: z.record(z.string(), z.object({ en: z.string().min(3).max(80), pcm: z.string().min(3).max(80) })),
  }),
});
export type PlacesConfig = z.infer<typeof placesSchema>;
export type PlaceAction = z.infer<typeof placeActionSchema>;
export type PlaceJob = z.infer<typeof placeJobSchema>;
export type PlacePhrase = z.infer<typeof placePhraseSchema>;
export type PlacePoll = z.infer<typeof placePollSchema>;

export const legalSchema = z.object({
  version: z.string().min(1),
  privacyTitle: z.string().min(1),
  privacyBody: z.string().min(20),
  termsTitle: z.string().min(1),
  termsBody: z.string().min(20),
  contenderConsentTitle: z.string().min(1),
  contenderConsentBody: z.string().min(20),
  contenderConsentAccept: z.string().min(1),
  guestSaveTitle: z.string().min(1),
  guestSaveBody: z.string().min(20),
});
export type LegalCopy = z.infer<typeof legalSchema>;

const upgradeId = z.enum(['magnet', 'shield', 'horn', 'loading', 'value']);
/**
 * C48: what one level of an upgrade actually does, in a form both the run and
 * the shop can read. Before this the step lived here *and* as a literal in the
 * client's `runModifiers()` *and* (for the payout) a third time in the store,
 * so the shop could not state an effect without a fourth copy that would rot
 * the first time any of them moved.
 */
export const upgradeEffectSchema = z.object({
  /** How `step` moves the number, and so how a level reads in the shop. */
  kind: z.enum(['mm-up', 'ticks-up', 'ticks-down', 'permille-up']),
  /** The run modifier this upgrade moves. One upgrade, one stat. */
  stat: z.enum(['magnetRadiusMm', 'shieldTicks', 'hornCooldownTicks', 'loadSpeedPermille', 'rewardPermille']),
  /** Shown in the shop beside the current and next value. */
  label: z.string().min(1),
  /** Level 0: zero for an additive upgrade, the un-upgraded cooldown for a subtractive one. */
  base: int.nonnegative(),
  /** 'ticks-down' only: the value never falls below this however many levels are bought. */
  floor: int.nonnegative().default(0),
});
export type UpgradeEffect = z.infer<typeof upgradeEffectSchema>;

export const metaConfigSchema = z
  .object({
    /** Levels an upgrade can reach. Was a literal in the Yard component. */
    maxLevel: int.positive(),
    starts: z.array(z.object({ id: z.enum(['funded', 'grassroots']), name: z.string(), description: z.string(), coins: int.nonnegative(), following: int.nonnegative() })).length(2),
    upgrades: z
      .array(
        z.object({
          id: upgradeId,
          name: z.string(),
          description: z.string(),
          costs: z.array(int.positive()).length(5),
          step: int.positive(),
          effect: upgradeEffectSchema,
        }),
      )
      .length(5),
    rewards: z.object({
      baseRun: int.nonnegative(),
      perDelivered: int.nonnegative(),
      /** Following gained per supporter delivered — the only source there is. */
      followingPerDelivered: int.nonnegative(),
      donation: int.nonnegative(),
      dailyMission: int.nonnegative(),
      weeklyMission: int.nonnegative(),
      /** Rally streak: each finished rally in a row lifts the next payout by this much, up to the step cap. */
      streakBonusPermillePerStep: int.nonnegative(),
      streakBonusMaxSteps: int.nonnegative(),
    }),
    missions: z.object({ daily: z.array(z.object({ id: z.enum(['run', 'deliver', 'crowd']), label: z.string(), target: int.positive() })).length(3), weekly: z.object({ id: z.string(), label: z.string(), target: int.positive() }) }),
  })
  .refine((m) => m.upgrades.every((u) => u.costs.length === m.maxLevel), {
    message: 'every upgrade needs one cost per level up to maxLevel',
  })
  .refine((m) => m.upgrades.every((u) => u.effect.kind !== 'ticks-down' || u.effect.base > u.effect.floor), {
    message: 'a ticks-down upgrade must start above its floor',
  });
export type MetaConfig = z.infer<typeof metaConfigSchema>;
export type UpgradeId = z.infer<typeof upgradeId>;

/** Soft travel limits (client-enforced until C11/C12 server caps). */
export const travelCapsSchema = z.object({
  maxRunsPerDay: int.positive(),
  maxStatesPerDay: int.positive(),
  maxRunsPerStatePerDay: int.positive(),
});
export type TravelCaps = z.infer<typeof travelCapsSchema>;

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

// ---------------------------------------------------------------------------
// Parties + the campaign map (C35)
// ---------------------------------------------------------------------------

/**
 * An invented faction, one per Contender. Guardrail 3 bans real party names,
 * logos, symbols and slogans outright, so a Party carries none of those: it has
 * a role-joke name, a map colour, and a `platform` line that describes the
 * archetype's trade rather than a political position. There is deliberately no
 * slogan, chant or emblem field for content to fill in later.
 */
export const partySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  /** Short label printed on a map tile, where the full name will not fit. */
  tag: z.string().min(1).max(10),
  contenderId: z.string().regex(/^[a-z0-9-]+$/),
  color: hex,
  /** Text colour that stays readable on `color`. */
  ink: hex,
  platform: z.string().min(1),
});
export type Party = z.infer<typeof partySchema>;

/**
 * Hex-cartogram layout. The landmass is invented — regions are laid out so the
 * six zones stay neighbours, never traced from a real map. `col` is allowed a
 * half step because rows of a pointy-top hex grid interlock.
 */
export const mapSchema = z.object({
  hexSize: int.positive(),
  gap: int.nonnegative(),
  standings: z.object({
    /** Lowest generated rival Crowd for a region. */
    rivalCrowdMin: int.nonnegative(),
    /** Width of the generated band; a rival lands in [min, min + span). */
    rivalCrowdSpan: int.positive(),
    /** Top two within this many Crowd reads as too close to call. */
    contestedWithin: int.nonnegative(),
    /**
     * Distinct players a region needs before its live party split may be
     * published (guardrail 2). The API enforces it and the About page quotes
     * it, so it lives here rather than in either of them.
     */
    minPlayersPerRegion: int.positive(),
  }),
  regions: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        col: z.number().refine((n) => Number.isInteger(n * 2), 'col must be a whole or half step'),
        row: int.nonnegative(),
      }),
    )
    .min(1),
});
export type CampaignMapLayout = z.infer<typeof mapSchema>;

/**
 * C46: how a thumb is read. The run is driven by gestures on the glass, not by
 * a row of pads, so every threshold a gesture is judged against lives here
 * rather than inline in the client. Milliseconds and CSS pixels — wall-clock
 * player-side numbers, never the sim's integer ticks.
 */
export const controlsSchema = z.object({
  /**
   * The gas pedal is gone from the screen, so the convoy drives itself and the
   * player's only speed input is the brake. Turning this off puts the player
   * back on manual gas (keyboard ArrowUp) and is how a desktop-only build
   * would ship.
   */
  autoGas: z.boolean(),
  /** How far a finger must travel for the move to count as a flick. */
  swipeMinPx: int.positive(),
  /** And how fast — a slow drag re-anchors silently instead of firing. */
  swipeMaxMs: int.positive(),
  /** A finger that stays inside this circle is still a tap, not a flick. */
  tapMaxMovePx: int.positive(),
  /** Longer than this and a press is a hold (the horn), not a tap. */
  tapMaxMs: int.positive(),
  /** A still finger blows the horn once it has sat this long. */
  holdHornMs: int.positive(),
  /**
   * A flick down and straight off the glass still has to brake for something,
   * so the brake stays on this long after the finger leaves. Loading at a zone
   * wants a real hold; this is for dodging.
   */
  brakeGraceMs: int.positive(),
  /** How long the gesture reminder sits on screen at the start of a run. */
  hintMs: int.positive(),
  /** Buzz lengths, all subject to the player's haptics setting. */
  haptics: z.object({
    laneMs: int.nonnegative(),
    hopMs: int.nonnegative(),
    brakeMs: int.nonnegative(),
    beatMs: int.nonnegative(),
    hornMs: int.nonnegative(),
  }),
});
export type ControlTuning = z.infer<typeof controlsSchema>;

/** C78: what a player can say is wrong with their state's world. Closed so the report groups cleanly. */
export const feedbackTopicsSchema = z.object({
  topics: z.array(z.object({ id: z.string().regex(/^[a-z]{3,16}$/), label: z.string().min(3).max(60) })).min(1),
});
