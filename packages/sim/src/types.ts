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
  zoneKind?: 'pickup' | 'venue' | 'grand' | 'finish' | 'gate';
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
  | 'gate';

export interface SimEvent {
  type: SimEventType;
  payload?: number;
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
