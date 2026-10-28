import type * as THREE from 'three';
import type { ResolvedWorld } from '@cr/content';
import { GeoBuilder, mulberry, shade } from '../geo';

/**
 * Scenery behind a rally stage, chosen by the kind of landmark the segment
 * carries. Everything sits at |x| >= 11 so the stage, its crowd and the road
 * edge stay exactly where a player has learned to look for them.
 */
const cache = new Map<string, THREE.BufferGeometry | null>();

type Tone = { wall: string; accent: string; cloth: string[] };

function toneFor(world: ResolvedWorld): Tone {
  switch (world.road.texture) {
    case 'sahel-dust':
      return { wall: '#c98f58', accent: '#8a5a33', cloth: ['#d9482b', '#e0a82b', '#1f5f8b', '#f4f1ea', '#2f7a46'] };
    case 'laterite-wash':
      return { wall: '#e7d9b6', accent: '#7a2f3e', cloth: ['#3c4b7a', '#7a2f3e', '#cc9a2c', '#2a6f73', '#e7d9b6'] };
    case 'katsina-rose':
      return { wall: '#efe0cc', accent: '#a0564a', cloth: ['#7a4a5a', '#e3d8c0', '#c9967f', '#5b6b73', '#bdb8aa'] };
    case 'bauchi-sand':
      return { wall: '#e6d6b8', accent: '#8e6b3e', cloth: ['#2f4560', '#f4f1ea', '#c9ab7a', '#8a5a2b', '#bdb8aa'] };
    case 'sokoto-pale':
      return { wall: '#ead9bd', accent: '#7a4a2b', cloth: ['#2f4560', '#f4f1ea', '#c08a52', '#9a3f2e', '#bdb8aa'] };
    case 'ibom-clean':
      return { wall: '#ebe4d2', accent: '#b89c5a', cloth: ['#2f6e6a', '#e8dcc0', '#b89c5a', '#2e5a48', '#6e7f8a'] };
    case 'benue-sand':
      return { wall: '#ece2c8', accent: '#2f6f8f', cloth: ['#2f6f8f', '#f4f1ea', '#1a1a1a', '#b8a46c', '#bdb8aa'] };
    case 'abia-wet':
      return { wall: '#ece4cd', accent: '#9a6a3c', cloth: ['#3f6b5a', '#e8dcc0', '#9a6a3c', '#3a3f46', '#bdb8aa'] };
    case 'calabar-wet':
      return { wall: '#ece4d0', accent: '#7a2e4a', cloth: ['#3f6f84', '#ece4d0', '#7a2e4a', '#4f7a52', '#bdb8aa'] };
    case 'jigawa-sand':
      return { wall: '#ecdfc4', accent: '#8c5a2b', cloth: ['#2f3a66', '#f4f1ea', '#c9b080', '#8c5a2b', '#bdb8aa'] };
    case 'adamawa-dust':
      return { wall: '#eadcc0', accent: '#5e8a46', cloth: ['#2f4560', '#f4f1ea', '#b9a06c', '#8a5a2b', '#bdb8aa'] };
    case 'osun-green':
      return { wall: '#eae2cc', accent: '#2b3a6b', cloth: ['#2b3a6b', '#e8e2d0', '#5e7a3a', '#c9a56a', '#bdb8aa'] };
    case 'ondo-green':
      return { wall: '#eae0c8', accent: '#6b4226', cloth: ['#3f6b3a', '#e8dcc0', '#6b4226', '#3f6f84', '#bdb8aa'] };
    case 'edo-red':
      return { wall: '#ede0c6', accent: '#8a4b32', cloth: ['#5a7a4a', '#e8dcc0', '#8a4b32', '#3d6a9a', '#bdb8aa'] };
    case 'imo-red':
      return { wall: '#ede3cc', accent: '#2e6e73', cloth: ['#2e6e73', '#e7d9b6', '#9c5a3a', '#3c4b7a', '#bdb8aa'] };
    case 'ogun-slab':
      return { wall: '#e6e2d4', accent: '#2b3045', cloth: ['#2e3c69', '#cdbb95', '#7a2f3e', '#e4dcc6', '#6f7f8c'] };
    case 'redbrown-avenue':
      return { wall: '#eadfc6', accent: '#a5573a', cloth: ['#4f6d85', '#cda66b', '#a5573a', '#eadfc6', '#2d3c73'] };
    case 'sahel-sand':
      return { wall: '#e6dcc4', accent: '#8b5a2b', cloth: ['#2f4560', '#f4f1ea', '#d3bf98', '#b58e62', '#bdb8aa'] };
    case 'hill-asphalt':
      return { wall: '#e9dfc6', accent: '#6f4a2e', cloth: ['#2e3c69', '#cdbb95', '#7a2f3e', '#8db1a8', '#a77052'] };
    case 'kwara-red':
      return { wall: '#c99a62', accent: '#a9573a', cloth: ['#2f3a66', '#7a2f3e', '#b79a6a', '#ede5d0', '#6e7442'] };
    case 'asaba-red':
      return { wall: '#e6dbc0', accent: '#4d6f86', cloth: ['#7a2f3e', '#3c4b7a', '#b8892e', '#b97a84', '#2e5e5a'] };
    default:
      return { wall: '#cfc7b5', accent: '#8a8a86', cloth: ['#e85d04', '#f5c518', '#2ec4b6', '#c23fa0'] };
  }
}

type Dresser = (b: GeoBuilder, t: Tone, seed: number) => void;

const DRESSERS: Record<string, Dresser> = {
  market(b, t, seed) {
    const r = mulberry(seed * 13 + 1);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const x = side * (12 + i * 2.6);
        const z = -4 + i * 3.4;
        for (const dx of [-1, 1]) for (const dz of [-1, 1]) b.cyl(0.05, 0.05, 2.4, '#5d4037', { x: x + dx, y: 1.2, z: z + dz }, 5);
        for (let s = 0; s < 6; s++) b.box(0.42, 0.06, 2.4, s % 2 ? '#f4f1ea' : r.pick(t.cloth), { x: x - 1 + s * 0.4 + 0.2, y: 2.55, z, rz: side * 0.08 });
        b.box(2.0, 0.7, 1.4, '#6b4a2b', { x, y: 0.35, z });
        for (let g = 0; g < 6; g++) b.sphere(0.16, r.pick(t.cloth), { x: x - 0.75 + g * 0.3, y: 0.85, z: z + r.range(-0.4, 0.4) }, 5);
      }
    }
  },
  stadium(b, t) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) b.box(2.2, 0.9 + i * 0.9, 16, shade(t.wall, -0.04 * i), { x: side * (12.5 + i * 2.2), y: (0.9 + i * 0.9) / 2, z: 0 });
      b.cyl(0.14, 0.18, 13, '#8a8f99', { x: side * 12, y: 6.5, z: -6.5 }, 6);
      b.box(2.2, 0.8, 0.4, '#f4efd0', { x: side * 12, y: 13, z: -6.5 });
    }
  },
  bridge(b, t) {
    for (const side of [-1, 1]) {
      for (let i = -3; i <= 3; i++) {
        b.box(0.18, 5.4, 0.18, t.accent, { x: side * 11, y: 2.7, z: i * 2.2 });
        if (i < 3) b.box(0.12, 3.1, 0.12, t.accent, { x: side * 11, y: 2.7, z: i * 2.2 + 1.1, rx: (i % 2 ? 1 : -1) * 0.62 });
      }
      b.box(0.3, 0.3, 15, t.accent, { x: side * 11, y: 5.5 });
      b.box(0.3, 0.3, 15, t.accent, { x: side * 11, y: 0.15 });
    }
  },
  waterfront(b, t, seed) {
    const r = mulberry(seed * 7 + 3);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) b.cyl(0.22, 0.26, 0.7, '#2b2b2e', { x: side * 11.5, y: 0.35, z: -4.5 + i * 3 }, 6);
      b.box(2.0, 0.5, 6, r.pick(t.cloth), { x: side * 15, y: 0.3, z: r.range(-3, 3) });
      b.cone(1.0, 2.0, '#e8e4d4', { x: side * 15, y: 0.3, z: -3.5, rx: -Math.PI / 2 }, 4);
    }
    b.box(0.35, 9, 0.35, '#c8281e', { x: 14, y: 4.5, z: 4 });
    b.box(0.3, 0.3, 6, '#c8281e', { x: 14, y: 9, z: 1.5 });
  },
  square(b, t, seed) {
    const r = mulberry(seed * 5 + 9);
    for (const side of [-1, 1]) {
      b.box(5, 0.4, 5, shade(t.wall, 0.08), { x: side * 14, y: 0.2 });
      b.box(1.2, 1.2, 1.2, t.wall, { x: side * 14, y: 1.0 });
      b.cyl(0.07, 0.07, 8, '#cfcac0', { x: side * 14, y: 4.8 }, 5);
      b.box(1.6, 0.9, 0.04, r.pick(t.cloth), { x: side * 14 + 0.9, y: 8.3 });
    }
  },
  park(b, _t, seed) {
    const r = mulberry(seed * 11 + 5);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const x = side * (12 + i * 2.4);
        const z = -4 + i * 4;
        b.cyl(0.25, 0.35, 3, '#6b4a2b', { x, y: 1.5, z }, 6);
        for (let k = 0; k < 3; k++) b.sphere(r.range(1.4, 2), '#2f7a3a', { x: x + r.range(-0.8, 0.8), y: 3.8 + k * 0.6, z: z + r.range(-0.8, 0.8), sy: 0.8 }, 6);
      }
    }
  },
  landmark(b, t) {
    for (const side of [-1, 1]) {
      b.box(1.6, 8, 1.6, t.wall, { x: side * 12.5, y: 4 });
      b.box(2.0, 0.8, 2.0, t.accent, { x: side * 12.5, y: 8.3 });
    }
    b.box(26, 1.1, 1.6, t.wall, { y: 8.6, z: -8 });
    b.box(25, 0.4, 1.9, t.accent, { y: 9.3, z: -8 });
  },
};

/** The backdrop geometry for a landmark kind, or null when that kind has none. */
export function venueBackdrop(type: string, world: ResolvedWorld, seed: number): THREE.BufferGeometry | null {
  const dress = DRESSERS[type];
  if (!dress) return null;
  const key = `${type}:${world.stateId}:${seed % 3}`;
  if (cache.has(key)) return cache.get(key)!;
  const b = new GeoBuilder();
  b.segScale = 0.6;
  dress(b, toneFor(world), seed % 3);
  const geo = b.build();
  cache.set(key, geo);
  return geo;
}

export const VENUE_BACKDROP_KINDS = Object.keys(DRESSERS);
