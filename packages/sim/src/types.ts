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
  | 'perk';

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
  /** Counts integrity spawns so snatcher / vote-buyer / sleepy-voter stay equal. */
  integritySpawnSeq: number;
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
}

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
