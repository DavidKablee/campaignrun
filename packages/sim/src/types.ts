

export interface RngState {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface Entity {
  id: number;
  kind: string;
  lane: 0 | 1 | 2;
  z: number;
  halfWidthMm: number;
  halfLenMm: number;
  heightMm: number;
  active: boolean;
  isPickup?: boolean;
  value?: number;
}

export interface SimEvent {
  type: 'hit' | 'pickup' | 'dropoff' | 'dent' | 'breakdown';
  payload?: number;
}

export interface SimState {
  tick: number;              // 60 per second
  rng: RngState;             // sfc32 [a,b,c,d] uint32
  laneX: number;             // 0..2000 (1000 = centre lane, 1/1000 lane units)
  targetLane: 0 | 1 | 2;     // 0=Left, 1=Center, 2=Right
  z: number;                 // distance travelled, mm
  speed: number;             // mm per tick
  hopT: number;              // ticks remaining in hop, 0 = grounded
  dents: number;             // 0..3
  invulnTicks: number;       // Ticks remaining of invulnerability
  momentum: number;          // 1000..1500 (= x1.0..x1.5)
  carried: number;           // current supporters
  capacity: number;          // max supporters
  skillCrowd: number;        
  displayCrowd: number;      
  entities: Entity[];        // spawned deterministically
  events: SimEvent[];        // per-tick outputs for renderer/audio
  nextEntityZ: number;       // mm marker for next spawn
  entityIdSeq: number;       // counter
}

export const Btn = {
  Left: 1,
  Right: 2,
  Up: 4,
  Gas: 8,
  Brake: 16,
  Horn: 32,
  Perk: 64,
} as const;
