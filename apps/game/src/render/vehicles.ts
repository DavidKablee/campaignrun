import * as THREE from 'three';
import { GeoBuilder, shade } from './geo';
import { haloMat, vcMat } from './materials';
import { AMBER, blobShadow, personGeo } from './props';

/**
 * Road vehicles: danfo, keke, okada, car, lorry. Models face -z (forward) with
 * the tail at +z; an oncoming vehicle is the same model with its root turned
 * round. The body is one merged mesh (riders and passengers baked in); each
 * axle is a separate small mesh so the wheels can really turn. Under Data Saver
 * the axles are baked into the body, which makes a vehicle a single draw.
 */

export type VehicleKind = 'okada' | 'keke' | 'car' | 'danfo' | 'trailer';

export const VEHICLE_KINDS: readonly VehicleKind[] = ['okada', 'keke', 'car', 'danfo', 'trailer'];

export function isVehicleKind(kind: string): kind is VehicleKind {
  return (VEHICLE_KINDS as readonly string[]).includes(kind);
}

export interface VehicleOpts {
  oncoming: boolean;
  /** Night or a NEPA outage: bigger lamp halos, so traffic is easier to read in the dark. */
  night: boolean;
  dataSaver: boolean;
}

export interface VehicleMotion {
  dt: number;
  t: number;
  /** Ground speed along the road, m/s (always >= 0). */
  speedMps: number;
  /** Sideways speed in world x, m/s (+ = toward +x). */
  vxMps: number;
  /** Which world side the indicator blinks on: -1 left, +1 right, 0 off. */
  indicator: -1 | 0 | 1;
  reduceMotion: boolean;
}

export interface VehicleRig {
  readonly kind: VehicleKind;
  readonly root: THREE.Group;
  readonly oncoming: boolean;
  readonly body: THREE.Group;
  readonly axles: { mesh: THREE.Mesh; r: number }[];
  /** Full-detail body (axles are separate meshes); null under Data Saver, where there is only one body. */
  readonly detail: THREE.Mesh | null;
  /** The same vehicle as one merged mesh, drawn once it is too far away for the wheels to matter. */
  readonly distant: THREE.Mesh | null;
  near: boolean;
  readonly indicators: [THREE.Group, THREE.Group];
  yaw: number;
  lean: number;
  phase: number;
}

// ---------------------------------------------------------------- caches
const geoCache = new Map<string, THREE.BufferGeometry>();
function cached(key: string, make: () => THREE.BufferGeometry | null): THREE.BufferGeometry {
  let g = geoCache.get(key);
  if (!g) {
    g = make() ?? new THREE.BufferGeometry();
    geoCache.set(key, g);
  }
  return g;
}

const GLASS = '#2c3f4c';
const GLASS_HI = '#4a6678';
const TRIM = '#1a1a1c';
const PLATE = '#f4f4f0';
const HEAD = '#fff3c4';
const TAIL = '#ff3b30';
const RIM = '#6f7378';
const SPOKE = '#c9ccd1';

// ---------------------------------------------------------------- lamps
interface Lamp {
  x: number;
  y: number;
  z: number;
  r: number;
}
interface LampSet {
  front: Lamp[];
  rear: Lamp[];
}

const mirrorX = (x: number, y: number, z: number, r: number): Lamp[] => [
  { x: -x, y, z, r },
  { x, y, z, r },
];

const LAMPS: Record<VehicleKind, LampSet> = {
  okada: { front: [{ x: 0, y: 0.95, z: -0.84, r: 0.1 }], rear: [{ x: 0, y: 0.82, z: 1.02, r: 0.07 }] },
  keke: { front: [{ x: 0, y: 0.78, z: -1.05, r: 0.11 }], rear: mirrorX(0.5, 0.72, 1.3, 0.08) },
  car: { front: mirrorX(0.66, 0.78, -2.2, 0.11), rear: mirrorX(0.68, 0.8, 2.2, 0.11) },
  danfo: { front: mirrorX(0.68, 0.82, -2.7, 0.12), rear: mirrorX(0.82, 1.0, 2.7, 0.13) },
  trailer: { front: mirrorX(0.9, 0.95, -3.98, 0.14), rear: mirrorX(0.95, 1.0, 4.0, 0.14) },
};

function bakeLamps(b: GeoBuilder, kind: VehicleKind) {
  for (const l of LAMPS[kind].front) b.sphere(l.r, HEAD, { x: l.x, y: l.y, z: l.z, sz: 0.6 }, 8);
  for (const l of LAMPS[kind].rear) b.box(l.r * 2, l.r * 1.6, 0.05, TAIL, { x: l.x, y: l.y, z: l.z });
}

function haloGeo(kind: VehicleKind, oncoming: boolean, big: boolean) {
  return cached(`halo:${kind}:${oncoming ? 'h' : 't'}:${big ? 1 : 0}`, () => {
    const b = new GeoBuilder();
    const k = big ? 2.4 : 1;
    for (const l of oncoming ? LAMPS[kind].front : LAMPS[kind].rear) {
      b.plane(l.r * 5 * k, l.r * 5 * k, '#ffffff', { x: l.x, y: l.y, z: l.z + (oncoming ? -0.14 : 0.14) });
    }
    return b.build();
  });
}

// ---------------------------------------------------------------- wheels
interface AxleSpec {
  z: number;
  r: number;
  w: number;
  xs: number[];
}

const AXLES: Record<VehicleKind, AxleSpec[]> = {
  okada: [
    { z: -0.72, r: 0.31, w: 0.12, xs: [0] },
    { z: 0.72, r: 0.31, w: 0.13, xs: [0] },
  ],
  keke: [
    { z: -1.0, r: 0.27, w: 0.12, xs: [0] },
    { z: 0.72, r: 0.3, w: 0.14, xs: [-0.58, 0.58] },
  ],
  car: [
    { z: -1.4, r: 0.32, w: 0.2, xs: [-0.88, 0.88] },
    { z: 1.4, r: 0.32, w: 0.2, xs: [-0.88, 0.88] },
  ],
  danfo: [
    { z: -1.75, r: 0.4, w: 0.22, xs: [-0.95, 0.95] },
    { z: 1.75, r: 0.4, w: 0.22, xs: [-0.95, 0.95] },
  ],
  trailer: [
    { z: -3.0, r: 0.5, w: 0.3, xs: [-1.08, 1.08] },
    { z: 1.4, r: 0.5, w: 0.26, xs: [-1.38, -1.08, 1.08, 1.38] },
    { z: 2.6, r: 0.5, w: 0.26, xs: [-1.38, -1.08, 1.08, 1.38] },
  ],
};

/** Tyre + rim + spokes about the origin, axis along x. The spokes are what make the spin readable. */
function axleGeo(kind: VehicleKind, i: number) {
  const a = AXLES[kind][i]!;
  return cached(`axle:${kind}:${i}`, () => {
    const b = new GeoBuilder();
    for (const x of a.xs) {
      b.cyl(a.r, a.r, a.w, '#141416', { x, rz: Math.PI / 2 }, 14);
      b.cyl(a.r * 0.62, a.r * 0.62, a.w + 0.02, RIM, { x, rz: Math.PI / 2 }, 10);
      for (let k = 0; k < 3; k++) b.box(a.w + 0.04, a.r * 1.15, a.r * 0.16, SPOKE, { x, rx: (k * Math.PI) / 3 });
      b.cyl(a.r * 0.18, a.r * 0.18, a.w + 0.05, '#3a3d42', { x, rz: Math.PI / 2 }, 6);
    }
    return b.build();
  });
}

// ---------------------------------------------------------------- bodies
const PALETTE_CAR = ['#e9e9ea', '#b23a3a', '#3a5f9a', '#444a52', '#d8d2c0', '#2f7a5a'];
const OKADA_TANK = ['#c8281e', '#1f6fb2', '#2f7a5a', '#e0a010'];
const KEKE_LIVERY = [
  { top: '#F2C230', low: '#1c1c1e' }, // Lagos
  { top: '#2f9e5b', low: '#f4f4f0' }, // Abuja
  { top: '#1f6fb2', low: '#f4f4f0' },
];
const LORRY_PAINT = ['#b3452e', '#2a6f97', '#d8d2c0'];

/** Variants per kind: the seed is reduced to this, so geometry is cached and shared. */
const VARIANTS: Record<VehicleKind, number> = { okada: 8, keke: 6, car: 12, danfo: 4, trailer: 6 };

function addRider(b: GeoBuilder, seed: number, x: number, y: number, z: number, pose: 'sit' | 'stand', ry = Math.PI) {
  b.addBuilt(personGeo(seed, pose), { x, y, z, ry });
}

function okadaBody(b: GeoBuilder, v: number) {
  const tank = OKADA_TANK[v % OKADA_TANK.length]!;
  b.box(0.1, 0.1, 1.2, TRIM, { y: 0.55, rx: -0.05 }); // frame spine
  b.box(0.1, 0.34, 0.1, TRIM, { y: 0.5, z: 0.12, rx: 0.15 });
  b.box(0.3, 0.26, 0.5, tank, { y: 0.8, z: -0.2 }); // tank
  b.box(0.2, 0.06, 0.4, shade(tank, 0.12), { y: 0.95, z: -0.2 });
  b.box(0.28, 0.1, 0.7, '#222226', { y: 0.74, z: 0.4 }); // seat
  b.box(0.3, 0.05, 0.4, '#2c2c30', { y: 0.7, z: 0.9 }); // rack
  b.box(0.04, 0.2, 0.04, '#2c2c30', { x: 0.1, y: 0.62, z: 0.95 });
  b.cyl(0.03, 0.03, 0.78, '#9aa3ab', { x: 0.07, y: 0.72, z: -0.74, rx: -0.3 }, 6); // fork
  b.cyl(0.03, 0.03, 0.78, '#9aa3ab', { x: -0.07, y: 0.72, z: -0.74, rx: -0.3 }, 6);
  b.box(0.7, 0.04, 0.05, '#222', { y: 1.12, z: -0.64 }); // bars
  b.sphere(0.04, '#222', { x: 0.36, y: 1.12, z: -0.64 }, 6);
  b.sphere(0.04, '#222', { x: -0.36, y: 1.12, z: -0.64 }, 6);
  b.box(0.12, 0.04, 0.4, tank, { y: 0.6, z: -0.72 }); // front mudguard
  b.box(0.12, 0.04, 0.4, tank, { y: 0.62, z: 0.78 });
  b.cyl(0.05, 0.04, 0.9, '#9aa3ab', { x: 0.17, y: 0.34, z: 0.55, rx: Math.PI / 2 }, 6); // exhaust
  b.box(0.22, 0.2, 0.2, '#555a60', { y: 0.38, z: 0.1 }); // engine block
  bakeLamps(b, 'okada');
  addRider(b, v + 1, 0, 0.3, 0.12, 'sit');
  if (v % 2 === 1) addRider(b, v + 11, 0, 0.32, 0.78, 'sit');
}

function kekeBody(b: GeoBuilder, v: number) {
  const liv = KEKE_LIVERY[v % KEKE_LIVERY.length]!;
  b.box(1.2, 0.08, 1.7, '#2a2a2c', { y: 0.38, z: 0.4 }); // floor
  b.box(0.72, 0.5, 0.62, liv.top, { y: 0.64, z: -0.72 }); // cowl
  b.box(0.74, 0.14, 0.64, liv.low, { y: 0.4, z: -0.72 });
  b.cyl(0.03, 0.03, 0.55, TRIM, { y: 0.78, z: -1.0, rx: -0.2 }, 6); // fork
  b.box(0.6, 0.04, 0.05, TRIM, { y: 1.0, z: -0.95 }); // bars
  b.box(0.12, 0.04, 0.5, liv.top, { y: 0.56, z: -1.0 }); // mudguard
  for (const s of [-1, 1]) {
    b.box(0.05, 0.34, 1.6, liv.low, { x: s * 0.62, y: 0.58, z: 0.5 }); // low side panel
    b.box(0.05, 0.1, 1.6, liv.top, { x: s * 0.62, y: 0.8, z: 0.5 });
  }
  b.box(1.24, 0.7, 0.06, liv.top, { y: 0.74, z: 1.3 }); // rear panel
  b.box(0.9, 0.26, 0.07, GLASS, { y: 1.2, z: 1.3 });
  b.box(1.0, 0.14, 0.45, '#6b3b1f', { y: 0.6, z: 0.95 }); // bench
  b.box(1.0, 0.34, 0.08, '#6b3b1f', { y: 0.82, z: 1.2 });
  for (const [x, z] of [
    [-0.62, -0.32],
    [0.62, -0.32],
    [-0.62, 1.24],
    [0.62, 1.24],
  ] as const) {
    b.cyl(0.03, 0.03, 1.05, TRIM, { x, y: 1.2, z }, 6);
  }
  b.box(1.4, 0.08, 2.0, liv.top, { y: 1.74, z: 0.5 }); // roof
  b.box(1.36, 0.06, 0.5, liv.top, { y: 1.7, z: -0.78, rx: 0.2 }); // visor
  b.box(1.42, 0.05, 2.02, liv.low, { y: 1.69, z: 0.5 });
  b.box(0.72, 0.5, 0.04, GLASS_HI, { y: 1.26, z: -0.4, rx: -0.18 }); // windscreen
  b.box(0.4, 0.1, 0.03, PLATE, { y: 0.52, z: 1.34 });
  bakeLamps(b, 'keke');
  addRider(b, v + 2, 0, 0.22, 0.05, 'sit');
  if (v % 3 !== 0) addRider(b, v + 5, v % 2 ? -0.26 : 0.26, 0.2, 0.98, 'sit');
}

function carBody(b: GeoBuilder, v: number) {
  const c = PALETTE_CAR[v % PALETTE_CAR.length]!;
  const hatch = v >= 6;
  b.box(1.76, 0.5, 4.3, c, { y: 0.62 }); // lower body
  b.box(1.8, 0.1, 4.34, shade(c, -0.14), { y: 0.42 }); // sill
  b.box(1.72, 0.12, 1.3, shade(c, 0.04), { y: 0.93, z: -1.45, rx: 0.07 }); // bonnet
  const cabZ = hatch ? 0.45 : 0.25;
  const cabL = hatch ? 2.7 : 2.2;
  b.box(1.5, 0.44, cabL, c, { y: 1.15, z: cabZ });
  b.box(1.53, 0.3, cabL - 0.3, GLASS, { y: 1.17, z: cabZ }); // side glass band
  b.box(1.46, 0.46, 0.05, GLASS_HI, { y: 1.14, z: cabZ - cabL / 2 - 0.1, rx: 0.6 }); // windscreen
  b.box(1.46, 0.42, 0.05, GLASS, { y: 1.14, z: cabZ + cabL / 2 + (hatch ? 0.02 : 0.1), rx: hatch ? 0.18 : -0.55 });
  b.box(1.46, 0.06, cabL - 0.5, shade(c, -0.06), { y: 1.4, z: cabZ });
  for (const s of [-1, 1]) {
    b.box(0.05, 0.32, 0.06, c, { x: s * 0.76, y: 1.17, z: cabZ - 0.45 }); // pillars
    b.box(0.05, 0.32, 0.06, c, { x: s * 0.76, y: 1.17, z: cabZ + 0.35 });
    b.box(0.1, 0.07, 0.14, TRIM, { x: s * 0.94, y: 1.0, z: cabZ - cabL / 2 - 0.1 }); // mirrors
    b.box(0.04, 0.1, 1.9, shade(c, -0.1), { x: s * 0.9, y: 0.62, z: 0 }); // door line
    b.box(0.06, 0.34, 0.9, TRIM, { x: s * 0.89, y: 0.5, z: -1.4 }); // wheel arches
    b.box(0.06, 0.34, 0.9, TRIM, { x: s * 0.89, y: 0.5, z: 1.4 });
  }
  if (!hatch) b.box(1.7, 0.1, 0.9, shade(c, 0.03), { y: 0.93, z: 1.55 }); // boot lid
  b.box(1.84, 0.16, 0.22, TRIM, { y: 0.42, z: -2.2 });
  b.box(1.84, 0.16, 0.22, TRIM, { y: 0.42, z: 2.2 });
  b.box(0.5, 0.13, 0.03, PLATE, { y: 0.55, z: 2.22 });
  b.box(0.5, 0.13, 0.03, PLATE, { y: 0.55, z: -2.23 });
  b.box(0.5, 0.16, 0.03, TRIM, { y: 0.8, z: -2.2 }); // grille
  bakeLamps(b, 'car');
  if (v % 4 === 1) b.box(0.4, 0.1, 0.8, '#f5c518', { y: 1.5, z: cabZ }); // taxi sign
}

function danfoBody(b: GeoBuilder, v: number) {
  const Y = '#F2B80C';
  b.box(1.94, 0.9, 5.3, Y, { y: 0.85 }); // lower body
  b.box(1.9, 0.82, 4.9, Y, { y: 1.74, z: 0.15 }); // upper cabin
  b.box(1.82, 0.08, 4.8, shade(Y, -0.08), { y: 2.18, z: 0.15 }); // roof cap
  b.box(1.98, 0.17, 5.34, TRIM, { y: 1.14 }); // the two black stripes
  b.box(1.98, 0.06, 5.34, TRIM, { y: 1.34 });
  b.box(1.98, 0.14, 5.34, '#2b2b2b', { y: 0.44 }); // sill
  for (let i = 0; i < 5; i++) {
    for (const s of [-1, 1]) b.box(0.03, 0.52, 0.72, GLASS, { x: s * 0.95, y: 1.76, z: -1.7 + i * 0.86 });
  }
  b.box(1.66, 0.58, 0.04, GLASS_HI, { y: 1.78, z: -2.32, rx: 0.12 }); // windscreen
  b.box(1.5, 0.5, 0.03, GLASS, { y: 1.8, z: 2.6 });
  b.box(1.04, 0.2, 0.06, PLATE, { y: 2.06, z: -2.4 }); // destination board
  b.box(0.84, 0.07, 0.07, '#c8281e', { y: 2.06, z: -2.42 });
  b.box(2.0, 0.2, 0.24, TRIM, { y: 0.45, z: -2.72 }); // bumpers
  b.box(2.0, 0.2, 0.24, TRIM, { y: 0.45, z: 2.72 });
  b.box(0.7, 0.18, 0.03, TRIM, { y: 0.8, z: -2.67 }); // grille
  b.box(0.55, 0.16, 0.03, PLATE, { y: 0.62, z: 2.7 });
  for (const s of [-1, 1]) {
    b.box(0.14, 0.06, 0.2, TRIM, { x: s * 1.0, y: 1.6, z: -2.1 }); // mirrors
    b.box(0.08, 0.3, 0.08, TRIM, { x: s * 0.97, y: 1.45, z: -2.1 });
    b.box(0.06, 0.5, 1.0, TRIM, { x: s * 0.97, y: 0.62, z: -1.75 }); // arches
    b.box(0.06, 0.5, 1.0, TRIM, { x: s * 0.97, y: 0.62, z: 1.75 });
  }
  // roof rack + luggage, different per variant
  b.box(1.7, 0.05, 3.3, '#222', { y: 2.27, z: 0.3 });
  const loads = [
    ['#8b5a2b', '#2a6f97', '#b3261e'],
    ['#d8c9a0', '#8b5a2b', '#3d8b5a'],
    ['#2a6f97', '#d8c9a0', '#e0a010'],
    ['#b3261e', '#8b5a2b', '#444a52'],
  ][v % 4]!;
  b.box(0.9, 0.5, 1.0, loads[0]!, { x: -0.4, y: 2.55, z: 0.8 });
  b.box(0.7, 0.4, 0.9, loads[1]!, { x: 0.45, y: 2.5, z: -0.2 });
  b.box(0.5, 0.3, 0.6, loads[2]!, { x: 0.1, y: 2.45, z: 1.7 });
  b.box(1.74, 0.03, 0.03, '#222', { y: 2.4, z: 0.3 }); // strap
  bakeLamps(b, 'danfo');
  if (v % 2 === 0) {
    b.box(0.34, 0.06, 0.5, TRIM, { x: 1.02, y: 0.32, z: 0.4 }); // step
    addRider(b, v + 3, 1.0, 0.36, 0.45, 'stand'); // conductor hanging off the door
  }
}

function lorryBody(b: GeoBuilder, v: number) {
  const c = LORRY_PAINT[v % LORRY_PAINT.length]!;
  const kind = Math.floor(v / LORRY_PAINT.length) % 2; // 0 container, 1 sacks
  b.box(2.2, 0.3, 7.7, '#222', { y: 0.72 }); // chassis
  b.box(2.3, 1.6, 1.9, '#d9d9d4', { y: 1.75, z: -3.0 }); // cab
  b.box(2.2, 0.5, 1.2, '#d9d9d4', { y: 0.95, z: -3.45 }); // bonnet block
  b.box(2.0, 0.62, 0.04, GLASS_HI, { y: 2.2, z: -3.96, rx: 0.1 }); // windscreen
  b.box(2.1, 0.5, 0.05, TRIM, { y: 1.0, z: -4.06 }); // grille
  for (let i = 0; i < 4; i++) b.box(1.8, 0.03, 0.03, '#9aa3ab', { y: 0.86 + i * 0.1, z: -4.1 });
  b.box(2.4, 0.22, 0.28, TRIM, { y: 0.5, z: -4.1 }); // bumper
  b.box(0.45, 0.14, 0.03, PLATE, { y: 0.6, z: -4.26 });
  for (const s of [-1, 1]) {
    b.cyl(0.07, 0.07, 1.9, '#555a60', { x: s * 1.18, y: 2.6, z: -2.35 }, 6); // exhaust stacks
    b.box(0.22, 0.4, 0.06, TRIM, { x: s * 1.35, y: 2.15, z: -3.75 }); // mirrors
    b.box(0.5, 0.2, 1.4, '#cfcfca', { x: s * 1.2, y: 0.85, z: -3.0 });
    b.box(0.5, 0.28, 0.9, TRIM, { x: s * 1.1, y: 0.7, z: -3.0 }); // wheel arch
  }
  if (kind === 0) {
    b.box(2.45, 2.5, 5.7, c, { y: 2.2, z: 1.2 });
    for (let i = 0; i < 9; i++) b.box(2.5, 2.4, 0.05, shade(c, -0.1), { y: 2.2, z: -1.6 + i * 0.62 });
    b.box(1.3, 0.55, 0.04, PLATE, { y: 2.4, z: 4.07 });
    b.box(1.0, 0.1, 0.05, '#c8281e', { y: 2.4, z: 4.1 });
  } else {
    b.box(2.4, 0.2, 5.7, '#6b4a2b', { y: 0.95, z: 1.2 }); // flatbed
    const sack = ['#d8c9a0', '#cdbb8a', '#e2d8b8'];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 6; i++) {
        for (const s of [-1, 1]) {
          b.box(0.95, 0.42, 0.7, sack[(row + i) % 3]!, { x: s * 0.55, y: 1.25 + row * 0.42, z: -1.2 + i * 0.84 });
        }
      }
    }
    b.box(2.46, 0.04, 0.04, '#222', { y: 2.4, z: 0.4 });
    b.box(0.6, 0.35, 0.04, c, { x: 0, y: 1.6, z: 4.07 });
  }
  b.box(2.4, 0.16, 0.2, TRIM, { y: 0.6, z: 4.1 });
  b.box(0.9, 0.2, 0.04, PLATE, { y: 0.7, z: 4.22 });
  bakeLamps(b, 'trailer');
}

const BODIES: Record<VehicleKind, (b: GeoBuilder, v: number) => void> = {
  okada: okadaBody,
  keke: kekeBody,
  car: carBody,
  danfo: danfoBody,
  trailer: lorryBody,
};

function bodyGeo(kind: VehicleKind, v: number, dataSaver: boolean) {
  return cached(`body:${kind}:${v}:${dataSaver ? 'ds' : 'hi'}`, () => {
    const b = new GeoBuilder();
    if (dataSaver) b.segScale = 0.7;
    BODIES[kind](b, v);
    if (dataSaver) {
      AXLES[kind].forEach((a, i) => b.addBuilt(axleGeo(kind, i), { y: a.r, z: a.z }));
    }
    return b.build();
  });
}

// ---------------------------------------------------------------- indicators
const INDICATORS: Record<VehicleKind, { x: number; y: number; zf: number; zr: number }> = {
  okada: { x: 0.3, y: 1.04, zf: -0.64, zr: 1.0 },
  keke: { x: 0.66, y: 0.9, zf: -0.5, zr: 1.3 },
  car: { x: 0.8, y: 0.8, zf: -2.2, zr: 2.2 },
  danfo: { x: 0.9, y: 0.95, zf: -2.7, zr: 2.7 },
  trailer: { x: 1.1, y: 1.1, zf: -4.0, zr: 4.0 },
};

const SHADOW_SIZE: Record<VehicleKind, [number, number]> = {
  okada: [0.9, 2.3],
  keke: [1.8, 3.2],
  car: [2.3, 5.0],
  danfo: [2.5, 6.0],
  trailer: [3.0, 9.0],
};

// ---------------------------------------------------------------- public
export function buildVehicle(kind: VehicleKind, seed: number, opts: VehicleOpts): VehicleRig {
  const v = ((seed % VARIANTS[kind]) + VARIANTS[kind]) % VARIANTS[kind];
  const root = new THREE.Group();
  root.rotation.y = opts.oncoming ? Math.PI : 0;
  const shadow = blobShadow(...SHADOW_SIZE[kind]);
  root.add(shadow);
  const body = new THREE.Group();
  root.add(body);
  const detail = new THREE.Mesh(bodyGeo(kind, v, opts.dataSaver), vcMat());
  body.add(detail);

  const axles: VehicleRig['axles'] = [];
  let distant: THREE.Mesh | null = null;
  if (!opts.dataSaver) {
    distant = new THREE.Mesh(bodyGeo(kind, v, true), vcMat());
    distant.visible = false;
    body.add(distant);
    AXLES[kind].forEach((a, i) => {
      const mesh = new THREE.Mesh(axleGeo(kind, i), vcMat());
      mesh.position.set(0, a.r, a.z);
      body.add(mesh);
      axles.push({ mesh, r: a.r });
    });
    const head = opts.oncoming;
    const halo = new THREE.Mesh(
      haloGeo(kind, head, opts.night),
      haloMat(`${head ? 'head' : 'tail'}:${opts.night ? 'n' : 'd'}`, head ? (opts.night ? '#ffe6a0' : '#7a6c46') : opts.night ? '#ff3a24' : '#7a1a10'),
    );
    halo.frustumCulled = false;
    body.add(halo);
  }

  const ind = INDICATORS[kind];
  const lampGeo = cached('veh-ind', () => new THREE.SphereGeometry(0.075, 8, 6));
  const indicators: [THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group()];
  indicators.forEach((g, i) => {
    const side = i === 0 ? -1 : 1;
    for (const z of [ind.zf, ind.zr]) {
      const m = new THREE.Mesh(lampGeo, AMBER());
      m.position.set(side * ind.x, ind.y, z);
      g.add(m);
    }
    g.visible = false;
    body.add(g);
  });

  return {
    kind,
    root,
    oncoming: opts.oncoming,
    body,
    axles,
    detail: opts.dataSaver ? null : detail,
    distant,
    near: true,
    indicators,
    yaw: 0,
    lean: 0,
    phase: (seed * 0.737) % 6.28,
  };
}

const MAX_YAW = 0.38;

/** Swap between the detailed body and its merged twin: far away the wheels are a few pixels, so one draw will do. */
export function setVehicleNear(rig: VehicleRig, near: boolean) {
  if (!rig.detail || !rig.distant || rig.near === near) return;
  rig.near = near;
  rig.detail.visible = near;
  rig.distant.visible = !near;
  for (const a of rig.axles) a.mesh.visible = near;
}

/** Per-frame life: wheels turn at ground speed, the body sways, weavers lean into the move and blink. */
export function animateVehicle(rig: VehicleRig, m: VehicleMotion) {
  if (rig.near) for (const a of rig.axles) a.mesh.rotation.x -= (m.speedMps * m.dt) / a.r;

  const turning = m.speedMps > 0.5 ? Math.atan2(m.vxMps, m.speedMps) : 0;
  const yawT = Math.max(-MAX_YAW, Math.min(MAX_YAW, turning));
  const bike = rig.kind === 'okada' || rig.kind === 'keke';
  const leanT = (bike ? 1 : 0.35) * Math.max(-0.5, Math.min(0.5, yawT * 1.3));
  const k = Math.min(1, m.dt * 8);
  rig.yaw += (yawT - rig.yaw) * k;
  rig.lean += (leanT - rig.lean) * k;
  // The root is turned round for oncoming traffic, so local yaw and roll flip with it.
  const s = rig.oncoming ? 1 : -1;
  rig.body.rotation.y = s * rig.yaw;
  let sway = 0;
  let bob = 0;
  if (!m.reduceMotion) {
    sway = Math.sin(m.t * 2.3 + rig.phase) * (bike ? 0.012 : 0.006);
    bob = Math.abs(Math.sin(m.t * 11 + rig.phase)) * (bike ? 0.012 : 0.008);
  }
  rig.body.rotation.z = s * rig.lean + sway;
  rig.body.position.y = bob;

  const local = m.indicator === 0 ? 0 : rig.oncoming ? -m.indicator : m.indicator;
  rig.indicators[0].visible = local === -1;
  rig.indicators[1].visible = local === 1;
}

/** Build every variant once up front so the first okada does not cost a frame. */
export function prewarmVehicles(dataSaver: boolean) {
  for (const kind of VEHICLE_KINDS) {
    for (let v = 0; v < VARIANTS[kind]; v++) {
      bodyGeo(kind, v, dataSaver);
    }
    if (!dataSaver) AXLES[kind].forEach((_, i) => axleGeo(kind, i));
  }
}
