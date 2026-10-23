export interface RngState {
  a: number;
  b: number;
  c: number;
  d: number;
}

export type EntityKind =
  | 'supporter'
  | 'loose-supporter'
  | 'pothole'
  | 'cones'
  | 'car'
  | 'trailer'
  | 'pickup-zone'
  | 'venue'
  | 'grand-rally'
  | 'finish'
  | 'gate';

export interface Entity {
  id: number;
  kind: EntityKind | string;
  lane: 0 | 1 | 2;
  z: number;
  halfWidthMm: number;
  halfLenMm: number;
  heightMm: number;
  active: boolean;
  isPickup?: boolean;
  isZone?: boolean;
  isIntegrityHazard?: boolean;
  zoneKind?: 'pickup' | 'venue' | 'grand' | 'finish' | 'gate';
  /** C26 ride size-class rules. See SimConfig obstacles[].sizeTag for the full rule. */
  sizeTag?: 'narrow' | 'flood' | 'light';
  /** C28: an NPC convoy of another Contender. Touch = small bump, never a dent/integrity hit. */
  isRivalConvoy?: boolean;
  value?: number;
  /** Group size reserved for pickup zones (integer). */
  groupSize?: number;
  consumed?: boolean;
}

export type SimEventType =
  | 'hit'
  | 'pickup'
  | 'dropoff'
  | 'dent'
  | 'breakdown'
  | 'finish'
  | 'fullHouse'
  | 'onBeat'
  | 'zoneEnter'
  | 'zoneProgress'
  | 'gate'
  | 'integrityFail'
  | 'integritySuccess'
  | 'horn'
  | 'perk'
  | 'rivalBump'
  | 'rivalOutpace'
  | 'pvcActive';

export interface SimEvent {
  type: SimEventType;
  payload?: number | string;
}

export type RunPhase = 'running' | 'finished' | 'breakdown';

export interface SimState {
  tick: number;
  rng: RngState;
  laneX: number;
  targetLane: 0 | 1 | 2;
  z: number;
  speed: number;
  hopT: number;
  dents: number;
  invulnTicks: number;
  momentum: number;
  carried: number;
  capacity: number;
  skillCrowd: number;
  displayCrowd: number;
  integrity: number;
  /** Counts integrity spawns so all 8 Integrity event kinds stay equal (C06 + C28). */
  integritySpawnSeq: number;
  /** C28: round-robins rival-convoy spawns so exposure is identical across seeds. */
  rivalSpawnSeq: number;
  /** C28 PVC pickup: ticks remaining on the ×1.1 Crowd buff, 0 = inactive. */
  pvcBuffTicks: number;
  /** C30: Rally Saturday ×2 Crowd window (6-9pm WAT), decided once at initState from a real clock — never read live inside sim. 1000 = ×1.0. */
  rallySaturdayMultiplierPermille: number;
  delivered: number;
  entities: Entity[];
  events: SimEvent[];
  nextHazardZ: number;
  entityIdSeq: number;
  prevInput: number;
  /** Zone interaction */
  activeZoneId: number;
  zoneProgress: number;
  zoneNeeded: number;
  beatTaps: number;
  beatWindowTicks: number;
  phase: RunPhase;
  finishZ: number;
  courseBuilt: boolean;
  
  // Contender / Perk state
  activeContenderId: string;
  perkActiveTicks: number;
  perkCooldownTicks: number;
  hornCooldownTicks: number;
  /** Venues (incl. grand) already unloaded — powers firstVenueMultiplier tradeoff. */
  venuesUnloaded: number;
  /** C08 local upgrade effects. Integer-only and captured at run start. */
  upgrades: { magnetRadiusMm: number; shieldTicks: number; hornCooldownTicks: number; loadSpeedPermille: number; rewardPermille: number };

  // C26 ride traits, captured at run start from the selected ride/state (sim stays decoupled from @cr/content).
  rideSize: 'S' | 'M' | 'L';
  ridePloughsLight: boolean;
  rideFreeHit: boolean;
  freeHitUsed: boolean;
  rideMagnetBonusMm: number;
  /** 1000 = no bonus, 1100 = +10% (state's signatureRide === current ride). */
  signatureRideBonusPermille: number;

  /**
   * C44 handling. Each field is permille of the matching `SimConfig` number, so
   * the config keeps one set of base values and a ride only says how it differs
   * from them. All 1000 means "drives exactly as the config says", which is how
   * every ride behaved before C44.
   */
  rideHandling: RideHandling;
  /**
   * C44: permille of `config.hit.dropCarriedPermille` — the share of the
   * carried crowd a dent scatters. Integrity hazards keep their own per-kind
   * percentages; this is the plain knock only.
   */
  rideHitDropPermille: number;
  /** C44: permille of `config.spawn.rivalChancePermille`. Read at course build. */
  rideRivalDrawPermille: number;

  /**
   * C45: what this state's road does to the run. Captured at run start from
   * the state pack's hazards, already composed and clamped by @cr/content — the
   * sim never sees a hazard name, only its arithmetic.
   */
  road: RoadProfile;
}

/** C45. Mirrors `RoadProfile` in @cr/content; see the note on `RideHandling` above. */
export interface RoadProfile {
  topSpeedPermille: number;
  accelPermille: number;
  brakeDecelPermille: number;
  laneChangePermille: number;
  /** Distance between spawns. Below 1000 is a busier road. */
  gapPermille: number;
  doubleChancePermille: number;
  /** Per `config.obstacles[].kind`; an absent kind is unchanged (1000). */
  obstacleWeightPermille: Record<string, number>;
}

/** A road with no hazards: the config's own numbers, which is every run before C45. */
export const NEUTRAL_ROAD: RoadProfile = {
  topSpeedPermille: 1000,
  accelPermille: 1000,
  brakeDecelPermille: 1000,
  laneChangePermille: 1000,
  gapPermille: 1000,
  doubleChancePermille: 1000,
  obstacleWeightPermille: {},
};

/** C44. Mirrors `rideHandlingSchema` in @cr/content, declared here so the sim stays decoupled from the content package's types. */
export interface RideHandling {
  laneChangePermille: number;
  accelPermille: number;
  topSpeedPermille: number;
  brakeDecelPermille: number;
  hopPermille: number;
}

/** The neutral ride: the config's own numbers, unmodified. */
export const NEUTRAL_HANDLING: RideHandling = {
  laneChangePermille: 1000,
  accelPermille: 1000,
  topSpeedPermille: 1000,
  brakeDecelPermille: 1000,
  hopPermille: 1000,
};

export const Btn = {
  Left: 1,
  Right: 2,
  Up: 4,
  Gas: 8,
  Brake: 16,
  Horn: 32,
  Perk: 64,
  Tap: 128,
} as const;
