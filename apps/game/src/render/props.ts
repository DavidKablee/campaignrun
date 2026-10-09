import * as THREE from 'three';
import { outfits } from '@cr/content';
import { bakeCharacter, randomPerson, type Pose } from './character';
import { GeoBuilder, mulberry, shade } from './geo';
import { flatMat, glowMat, unlitMat, vcMat } from './materials';
import { signTexture, zoneTexture } from './textures';

/** Everything here faces -z (forward). Tail / rear faces the camera at +z. */

const geoCache = new Map<string, THREE.BufferGeometry>();
function cached(key: string, make: () => THREE.BufferGeometry | null): THREE.BufferGeometry {
  let g = geoCache.get(key);
  if (!g) {
    g = make() ?? new THREE.BufferGeometry();
    geoCache.set(key, g);
  }
  return g;
}

const planeGeo = new THREE.PlaneGeometry(1, 1);

// ---------------------------------------------------------------- people
const PEOPLE_N = 24;
export function personGeo(seed: number, pose: Pose): THREE.BufferGeometry {
  const s = ((seed % PEOPLE_N) + PEOPLE_N) % PEOPLE_N;
  return cached(`person:${s}:${pose}`, () => {
    const p = randomPerson(s, outfits.options);
    return bakeCharacter(p.look, p.outfit, pose, s * 0.37, 'lo');
  });
}

// ---------------------------------------------------------------- helpers
function wheel(b: GeoBuilder, x: number, z: number, r: number, w = 0.25) {
  b.cyl(r, r, w, '#141416', { x, y: r, z, rz: Math.PI / 2 }, 12);
  b.cyl(r * 0.55, r * 0.55, w + 0.02, '#a9adb3', { x, y: r, z, rz: Math.PI / 2 }, 8);
  b.cyl(r * 0.2, r * 0.2, w + 0.04, '#55585e', { x, y: r, z, rz: Math.PI / 2 }, 6);
}

function group(geo: THREE.BufferGeometry, mat: THREE.Material = vcMat()): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, mat));
  return g;
}

function sign(text: string, bg: string, fg: string, w: number, h: number, sub?: string, pxW = 512, pxH = 128) {
  const tex = signTexture(text, bg, fg, pxW, pxH, sub);
  const m = new THREE.Mesh(planeGeo, unlitMat(`sign:${text}:${bg}:${sub ?? ''}`, tex));
  m.scale.set(w, h, 1);
  return m;
}

export const AMBER = () => glowMat('amber', '#ffb020');

function amberLamp(x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(cached('lamp', () => new THREE.SphereGeometry(0.1, 8, 6)), AMBER());
  m.position.set(x, y, z);
  return m;
}

// ---------------------------------------------------------------- vehicles
function danfoGeo() {
  return cached('danfo', () => {
    const b = new GeoBuilder();
    const Y = '#F2B80C';
    b.box(1.9, 0.95, 5.3, Y, { y: 0.85 });
    b.box(1.84, 0.85, 4.7, Y, { y: 1.75, z: 0.1 });
    b.box(1.92, 0.13, 5.32, '#111', { y: 0.95 });
    b.box(1.93, 0.05, 5.33, '#111', { y: 1.28 });
    for (let i = 0; i < 5; i++) {
      for (const s of [-1, 1]) b.box(0.03, 0.5, 0.7, '#25333c', { x: s * 0.925, y: 1.78, z: -1.7 + i * 0.85 });
    }
    b.box(1.6, 0.55, 0.03, '#25333c', { y: 1.78, z: -2.26 });
    b.box(1.5, 0.5, 0.03, '#25333c', { y: 1.8, z: 2.47 });
    b.box(1.98, 0.2, 0.22, '#1a1a1c', { y: 0.45, z: -2.68 });
    b.box(1.98, 0.2, 0.22, '#1a1a1c', { y: 0.45, z: 2.68 });
    for (const s of [-1, 1]) {
      b.box(0.28, 0.14, 0.04, '#fff6d0', { x: s * 0.65, y: 0.82, z: -2.66 });
      b.box(0.22, 0.34, 0.05, '#ff3b30', { x: s * 0.82, y: 1.0, z: 2.66 });
      b.box(0.14, 0.06, 0.2, '#111', { x: s * 0.98, y: 1.62, z: -2.0 }); // mirror
    }
    b.box(0.55, 0.16, 0.03, '#f4f4f0', { y: 0.62, z: 2.68 });
    // roof rack + luggage
    b.box(1.7, 0.05, 3.2, '#222', { y: 2.22, z: 0.3 });
    b.box(0.9, 0.5, 1.0, '#8b5a2b', { x: -0.4, y: 2.5, z: 0.8 });
    b.box(0.7, 0.4, 0.9, '#2a6f97', { x: 0.45, y: 2.45, z: -0.2 });
    b.box(0.5, 0.3, 0.6, '#b3261e', { x: 0.1, y: 2.4, z: 1.6 });
    for (const z of [-1.75, 1.75]) for (const s of [-1, 1]) wheel(b, s * 0.95, z, 0.38, 0.22);
    return b.build();
  });
}

function sedanGeo(seed: number) {
  const colors = ['#e9e9ea', '#b23a3a', '#3a5f9a', '#444a52', '#d8d2c0', '#2f7a5a'];
  const c = colors[seed % colors.length]!;
  return cached(`sedan:${seed % colors.length}`, () => {
    const b = new GeoBuilder();
    b.box(1.78, 0.56, 4.3, c, { y: 0.62 });
    b.box(1.55, 0.46, 2.3, c, { y: 1.12, z: 0.25 });
    b.box(1.58, 0.36, 2.05, '#25333c', { y: 1.14, z: 0.25 });
    b.box(1.5, 0.05, 1.7, shade(c, -0.05), { y: 1.38, z: 0.25 });
    b.box(1.82, 0.16, 0.2, '#1a1a1c', { y: 0.42, z: -2.15 });
    b.box(1.82, 0.16, 0.2, '#1a1a1c', { y: 0.42, z: 2.15 });
    for (const s of [-1, 1]) {
      b.box(0.3, 0.14, 0.04, '#ff3b30', { x: s * 0.68, y: 0.78, z: 2.16 });
      b.box(0.26, 0.12, 0.04, '#fff6d0', { x: s * 0.66, y: 0.74, z: -2.16 });
    }
    b.box(0.5, 0.13, 0.03, '#f4f4f0', { y: 0.55, z: 2.17 });
    for (const z of [-1.4, 1.4]) for (const s of [-1, 1]) wheel(b, s * 0.88, z, 0.32, 0.2);
    return b.build();
  });
}

function truckGeo(seed: number) {
  const cols = ['#b3452e', '#2a6f97', '#d8d2c0'];
  const c = cols[seed % cols.length]!;
  return cached(`truck:${seed % cols.length}`, () => {
    const b = new GeoBuilder();
    b.box(2.2, 0.3, 7.6, '#222', { y: 0.7, z: 0 });
    b.box(2.3, 1.7, 1.9, '#d9d9d4', { y: 1.8, z: -3.0 });
    b.box(2.0, 0.6, 0.03, '#25333c', { y: 2.15, z: -3.97 });
    b.box(2.45, 2.5, 5.7, c, { y: 2.15, z: 1.15 });
    for (let i = 0; i < 9; i++) b.box(2.5, 2.4, 0.05, shade(c, -0.1), { y: 2.15, z: -1.6 + i * 0.62 });
    b.box(0.9, 0.7, 0.04, '#f4f4f0', { y: 2.3, z: 4.02 });
    for (const s of [-1, 1]) b.box(0.22, 0.3, 0.05, '#ff3b30', { x: s * 0.95, y: 1.0, z: 4.0 });
    for (const z of [-3.0, 1.4, 2.6]) for (const s of [-1, 1]) wheel(b, s * 1.08, z, 0.5, 0.3);
    return b.build();
  });
}

// ---------------------------------------------------------------- blockades & hazards
function tyresGeo(seed: number) {
  return cached(`tyres:${seed % 3}`, () => {
    const b = new GeoBuilder();
    const rng = mulberry(seed % 3 + 1);
    const tyre = (x: number, y: number, z: number) => {
      b.torus(0.37, 0.15, rng.chance(0.5) ? '#1b1b1d' : '#28282c', { x, y, z, rx: Math.PI / 2 + rng.range(-0.1, 0.1), ry: rng.range(0, 3) }, Math.PI * 2, 12);
    };
    b.cyl(1.0, 1.0, 0.02, '#1a1612', { y: 0.015, sz: 0.8 }, 12);
    for (const [x, z] of [[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.35], [0.45, 0.35]] as const) tyre(x, 0.16, z);
    for (const [x, z] of [[-0.25, 0], [0.25, 0.05]] as const) tyre(x, 0.46, z);
    tyre(0, 0.76, 0.02);
    b.cyl(0.14, 0.14, 0.02, '#f5f5f0', { y: 0.92 }, 6);
    return b.build();
  });
}

function barricadeGeo() {
  return cached('barricade', () => {
    const b = new GeoBuilder();
    const w = 2.4;
    const n = 8;
    for (const [y, off] of [[0.88, 0], [0.54, 1]] as const) {
      for (let i = 0; i < n; i++) {
        b.box(w / n, 0.2, 0.05, (i + off) % 2 ? '#f2f2ee' : '#c8281e', { x: -w / 2 + (i + 0.5) * (w / n), y });
      }
    }
    for (const s of [-1, 1]) {
      b.box(0.07, 1.05, 0.07, '#e8e8e4', { x: s * 1.1, y: 0.52, z: -0.18, rx: -0.2 });
      b.box(0.07, 1.05, 0.07, '#e8e8e4', { x: s * 1.1, y: 0.52, z: 0.18, rx: 0.2 });
      b.box(0.3, 0.06, 0.55, '#3a3a3a', { x: s * 1.1, y: 0.03 });
    }
    return b.build();
  });
}

function jerseyGeo() {
  return cached('jersey', () => {
    const b = new GeoBuilder();
    const c = '#b9b6ad';
    for (const x of [-0.6, 0.6]) {
      b.box(1.12, 0.32, 0.62, c, { x, y: 0.16 });
      b.box(1.12, 0.3, 0.44, c, { x, y: 0.47 });
      b.box(1.12, 0.5, 0.26, shade(c, 0.03), { x, y: 0.85 });
      for (let i = 0; i < 4; i++) b.box(0.28, 0.12, 0.28, i % 2 ? '#f5c518' : '#161616', { x: x - 0.42 + i * 0.28, y: 1.04 });
      b.box(0.08, 0.1, 0.3, '#ff6a13', { x, y: 0.6, z: 0.12 });
    }
    return b.build();
  });
}

function conesGeo() {
  return cached('cones', () => {
    const b = new GeoBuilder();
    for (let i = 0; i < 4; i++) {
      const x = -0.9 + i * 0.6;
      b.box(0.34, 0.04, 0.34, '#1a1a1a', { x, y: 0.02 });
      b.cone(0.16, 0.6, '#ff6a13', { x, y: 0.34 }, 10);
      b.cyl(0.095, 0.115, 0.1, '#f4f4f0', { x, y: 0.3 }, 10);
      b.cyl(0.06, 0.075, 0.08, '#f4f4f0', { x, y: 0.48 }, 10);
    }
    return b.build();
  });
}

function potholeGeo() {
  return cached('pothole', () => {
    const b = new GeoBuilder();
    b.cyl(0.95, 1.0, 0.03, '#58595f', { y: 0.012, sz: 0.85 }, 14);
    b.cyl(0.78, 0.82, 0.04, '#14110e', { y: 0.03, sz: 0.85 }, 14);
    b.cyl(0.5, 0.5, 0.045, '#4f6f84', { x: 0.12, y: 0.035, z: 0.05, sz: 0.7 }, 12);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      b.sphere(0.08, '#6b6e75', { x: Math.cos(a) * 0.92, y: 0.05, z: Math.sin(a) * 0.78, sy: 0.6 }, 5);
    }
    // the local warning: a leafy branch planted in the hole
    b.cyl(0.018, 0.022, 0.9, '#6b4a2b', { x: -0.6, y: 0.4, z: 0.1, rz: 0.1 }, 5);
    for (let i = 0; i < 6; i++) b.cone(0.13, 0.32, i % 2 ? '#2e8b3a' : '#3fa24a', { x: -0.6 + (i - 3) * 0.04, y: 0.55 + i * 0.1, z: 0.1, rz: (i - 3) * 0.35 }, 5);
    return b.build();
  });
}

function roadworksGeo() {
  return cached('roadworks', () => {
    const b = new GeoBuilder();
    b.box(2.3, 0.03, 2.6, '#2b2118', { y: 0.02 });
    b.cone(1.05, 1.8, '#c2a36b', { x: -0.45, y: 0.9, z: -0.3 }, 7);
    b.cone(0.8, 1.2, '#b8995d', { x: 0.6, y: 0.6, z: 0.3 }, 7);
    for (const [x, z] of [[-1.15, 1.3], [1.15, 1.3], [-1.15, -1.3], [1.15, -1.3]] as const) {
      b.cyl(0.035, 0.035, 1.15, '#e8e8e4', { x, y: 0.57, z }, 5);
    }
    // orange safety net on the road-facing side + sides
    b.box(2.3, 0.7, 0.03, '#ff7a1a', { y: 0.78, z: 1.3 });
    b.box(0.03, 0.7, 2.6, '#ff7a1a', { x: -1.15, y: 0.78 });
    b.box(0.03, 0.7, 2.6, '#ff7a1a', { x: 1.15, y: 0.78 });
    // red/white tape
    for (let i = 0; i < 6; i++) b.box(0.4, 0.06, 0.04, i % 2 ? '#f2f2ee' : '#c8281e', { x: -1.0 + i * 0.4, y: 1.12, z: 1.3 });
    for (let i = 0; i < 3; i++) {
      const x = -0.9 + i * 0.9;
      b.cone(0.13, 0.5, '#ff6a13', { x, y: 0.28, z: 1.75 }, 8);
      b.box(0.3, 0.03, 0.3, '#1a1a1a', { x, y: 0.015, z: 1.75 });
    }
    b.cyl(0.04, 0.04, 1.9, '#555', { x: 1.15, y: 0.95, z: 1.3 }, 5);
    return b.build();
  });
}

// ---------------------------------------------------------------- public: obstacles
export function buildObstacle(kind: string, seed: number): THREE.Group {
  switch (kind) {
    case 'pothole':
      return group(potholeGeo());
    case 'cones':
      return group(conesGeo());
    case 'tyres':
      return group(tyresGeo(seed));
    case 'barricade': {
      const g = group(barricadeGeo());
      g.add(amberLamp(-1.1, 1.18, 0), amberLamp(1.1, 1.18, 0));
      g.add(warnSign(0, 6));
      return g;
    }
    case 'jersey':
      return group(jerseyGeo());
    case 'roadworks': {
      const g = group(roadworksGeo());
      g.add(amberLamp(1.15, 1.95, 1.3));
      const s = sign('ROAD WORKS', '#f5c518', '#161616', 2.4, 0.8, undefined, 512, 160);
      s.position.set(-3.4, 1.7, 5.0);
      g.add(s);
      const post = new THREE.Mesh(cached('post', () => new THREE.CylinderGeometry(0.04, 0.04, 1.5, 5)), flatMat('post', '#444'));
      post.position.set(-3.4, 0.75, 5.0);
      g.add(post);
      return g;
    }
    case 'danfo':
      return group(danfoGeo());
    case 'trailer':
      return group(truckGeo(seed));
    case 'snatcher':
    case 'vote-buyer':
    case 'sleepy-voter':
      return group(integrityGeo(kind, seed));
    default:
      return group(sedanGeo(seed));
  }
}

/** Generic integrity threats — neutral greys/amber, never party colours. */
function integrityGeo(kind: string, seed: number): THREE.BufferGeometry {
  return cached(`int:${kind}:${seed % 4}`, () => {
    const b = new GeoBuilder();
    const skin = seed % 2 ? '#5c3a24' : '#3b2417';
    const suit = kind === 'vote-buyer' ? '#3a4a5a' : kind === 'snatcher' ? '#2a2a2a' : '#4a5560';
    // shadow disc
    b.cyl(0.55, 0.55, 0.02, '#161616', { y: 0.01 }, 12);
    // legs + torso + head
    b.cyl(0.09, 0.1, 0.55, suit, { x: -0.12, y: 0.35 }, 6);
    b.cyl(0.09, 0.1, 0.55, suit, { x: 0.12, y: 0.35 }, 6);
    b.box(0.55, 0.7, 0.28, suit, { y: 1.0 });
    b.sphere(0.22, skin, { y: 1.55 }, 10);
    if (kind === 'snatcher') {
      b.box(0.45, 0.35, 0.35, '#8b5a2b', { x: 0.35, y: 1.05, z: 0.15 });
      b.box(0.5, 0.08, 0.08, '#f5c518', { x: 0.35, y: 1.25, z: 0.15 });
    } else if (kind === 'vote-buyer') {
      b.box(0.28, 0.18, 0.05, '#1fa45b', { x: 0.3, y: 1.05, z: 0.2 });
      b.box(0.22, 0.04, 0.04, '#f7f1e3', { x: 0.3, y: 1.05, z: 0.24 });
    } else {
      // sleepy-voter: slumped, no prop
      b.box(0.5, 0.2, 0.35, suit, { y: 0.75, rx: 0.4 });
    }
    // warning ring (civic threat, not a party mark)
    b.cyl(0.7, 0.7, 0.04, '#e85d04', { y: 0.04 }, 16);
    return b.build()!;
  });
}

function warnSign(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const b = cached('warn', () => {
    const bb = new GeoBuilder();
    bb.cyl(0.03, 0.03, 0.8, '#444', { y: 0.4 }, 5);
    bb.prism(0.75, 0.65, 0.04, '#c8281e', { y: 0.85, rx: 0 });
    bb.prism(0.5, 0.42, 0.05, '#f7f1e3', { y: 0.93 });
    bb.box(0.06, 0.2, 0.06, '#161616', { y: 1.05, z: 0.03 });
    return bb.build();
  });
  g.add(new THREE.Mesh(b, vcMat()));
  g.position.set(x - 2.6, 0, z);
  return g;
}

// ---------------------------------------------------------------- public: supporters on the road
export function buildSupporterGroup(count: number, seed: number): THREE.Group {
  const g = new THREE.Group();
  const n = Math.max(1, Math.min(4, count));
  const key = `sup:${n}:${seed % 8}`;
  const geo = cached(key, () => {
    const b = new GeoBuilder();
    b.cyl(0.9, 0.9, 0.02, '#f5c518', { y: 0.015 }, 24);
    b.cyl(0.78, 0.78, 0.03, '#161616', { y: 0.02 }, 24);
    b.cyl(0.7, 0.7, 0.035, '#f5c518', { y: 0.025 }, 24);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28 + seed;
      const r = n === 1 ? 0 : 0.35;
      b.addBuilt(personGeo(seed * 3 + i, i % 2 ? 'cheer' : 'wave'), { x: Math.cos(a) * r, z: Math.sin(a) * r, ry: Math.PI + Math.sin(a) * 0.4 });
    }
    return b.build();
  });
  g.add(new THREE.Mesh(geo, vcMat()));
  return g;
}

// ---------------------------------------------------------------- public: zones
function crowdInto(b: GeoBuilder, n: number, seed: number, side: number, xMin: number, xMax: number, halfZ: number, pose: Pose) {
  const r = mulberry(seed * 31 + 7);
  for (let i = 0; i < n; i++) {
    const x = side * r.range(xMin, xMax);
    const z = r.range(-halfZ, halfZ);
    b.addBuilt(personGeo(seed * 5 + i * 3 + (side > 0 ? 1 : 0), pose), { x, z, ry: side > 0 ? -Math.PI / 2 + r.range(-0.4, 0.4) : Math.PI / 2 + r.range(-0.4, 0.4) });
  }
}

function buntingInto(b: GeoBuilder, z: number, y: number, width: number) {
  const cols = ['#e85d04', '#f5c518', '#2ec4b6', '#c23fa0', '#1fa45b', '#2a6f97'];
  b.box(width, 0.03, 0.03, '#2a2a2a', { y: y + 0.05, z });
  const n = Math.floor(width / 0.5);
  for (let i = 0; i < n; i++) {
    const x = -width / 2 + 0.25 + i * (width / n);
    const sag = Math.sin((i / n) * Math.PI) * -0.0;
    b.cone(0.22, 0.4, cols[i % cols.length]!, { x, y: y - 0.12 + sag, z, rz: Math.PI }, 3);
  }
}

export function buildPickupZone(count: number, seed: number): THREE.Group {
  const g = new THREE.Group();
  const n = Math.max(1, Math.min(8, count));
  const geo = cached(`pickup:${n}:${seed % 4}`, () => {
    const b = new GeoBuilder();
    // shelter (right sidewalk)
    const sx = 6.6;
    for (const dx of [-1.6, 1.6]) for (const dz of [-0.9, 0.9]) b.box(0.08, 2.4, 0.08, '#d9d9d4', { x: sx + dx, y: 1.2, z: dz });
    b.box(3.6, 0.1, 2.2, '#2a6f97', { x: sx, y: 2.45, rx: 0.06 });
    for (let i = 0; i < 9; i++) b.box(0.06, 0.07, 2.2, '#235d80', { x: sx - 1.6 + i * 0.4, y: 2.52, rx: 0.06 });
    b.box(3.0, 0.08, 0.5, '#6b4a2b', { x: sx, y: 0.5, z: -0.6 });
    b.box(3.0, 0.5, 0.06, '#6b4a2b', { x: sx, y: 0.8, z: -0.85 });
    b.cyl(0.05, 0.05, 3.2, '#444', { x: 5.3, y: 1.6, z: 1.6 }, 6);
    crowdInto(b, Math.ceil(n / 2), seed, 1, 5.4, 8.6, 3.2, 'wave');
    crowdInto(b, Math.floor(n / 2), seed + 9, -1, 5.4, 8.6, 3.2, 'cheer');
    // yellow chevrons on the road edges
    return b.build();
  });
  g.add(new THREE.Mesh(geo, vcMat()));
  const box = new THREE.Mesh(planeGeo, glowMat('zonepick', '#ffffff', { transparent: true, opacity: 0.95 }));
  (box.material as THREE.MeshBasicMaterial).map = zoneTexture('pickup');
  (box.material as THREE.MeshBasicMaterial).needsUpdate = true;
  box.rotation.x = -Math.PI / 2;
  box.scale.set(8.4, 8, 1);
  box.position.y = 0.03;
  g.add(box);
  const s = sign('BUS STOP', '#f5c518', '#161616', 1.9, 0.7, 'LOAD HERE', 512, 192);
  s.position.set(5.3, 3.3, 1.6);
  s.rotation.y = -0.5;
  g.add(s);
  return g;
}

export function buildVenue(grand: boolean, seed: number): THREE.Group {
  const g = new THREE.Group();
  const geo = cached(`venue:${grand ? 'g' : 'v'}:${seed % 3}`, () => {
    const b = new GeoBuilder();
    // stage on the right
    const sx = 7.4;
    b.box(4.6, 0.9, 4.2, '#6b4a2b', { x: sx, y: 0.45 });
    b.box(4.7, 0.06, 4.3, '#c23fa0', { x: sx, y: 0.92 });
    b.box(4.6, 3.4, 0.18, '#1b2a4a', { x: sx, y: 2.6, z: -2.0 });
    for (const s of [-1, 1]) {
      b.box(0.9, 1.7, 0.8, '#1a1a1c', { x: sx + s * 2.0, y: 1.8, z: 0.4 });
      b.cyl(0.28, 0.28, 0.06, '#8a8f99', { x: sx + s * 2.0, y: 1.7, z: 0.82, rx: Math.PI / 2 }, 10);
      b.cyl(0.18, 0.18, 0.06, '#8a8f99', { x: sx + s * 2.0, y: 2.3, z: 0.82, rx: Math.PI / 2 }, 10);
    }
    // podium + mic
    b.box(0.8, 1.0, 0.5, '#e0902b', { x: sx, y: 1.45, z: -0.2 });
    b.cyl(0.015, 0.015, 0.35, '#222', { x: sx, y: 2.1, z: -0.2 }, 4);
    // crowd both sides
    crowdInto(b, grand ? 9 : 6, seed, -1, 5.4, 8.8, 3.4, 'cheer');
    crowdInto(b, grand ? 7 : 3, seed + 4, 1, 5.4, 6.0, 3.4, 'cheer');
    // arch over the road
    for (const s of [-1, 1]) b.box(0.3, 5.2, 0.3, '#e0902b', { x: s * 5.3, y: 2.6, z: 3.6 });
    b.box(10.9, 0.5, 0.3, '#e0902b', { y: 5.3, z: 3.6 });
    buntingInto(b, -2.5, 4.9, 11);
    buntingInto(b, 0.5, 4.7, 11);
    if (grand) buntingInto(b, -4.5, 5.2, 11);
    // balloon clusters
    const bal = ['#e85d04', '#f5c518', '#2ec4b6', '#c23fa0'];
    for (let i = 0; i < 14; i++) b.sphere(0.2, bal[i % 4]!, { x: -5.2 + (i % 7) * 0.22, y: 5.8 + Math.floor(i / 7) * 0.3, z: 3.6, sy: 1.15 }, 6);
    return b.build();
  });
  g.add(new THREE.Mesh(geo, vcMat()));
  const carpet = new THREE.Mesh(planeGeo, glowMat('zonevenue', '#ffffff', { transparent: true, opacity: 0.95 }));
  (carpet.material as THREE.MeshBasicMaterial).map = zoneTexture('venue');
  (carpet.material as THREE.MeshBasicMaterial).needsUpdate = true;
  carpet.rotation.x = -Math.PI / 2;
  carpet.scale.set(8.4, 8, 1);
  carpet.position.y = 0.03;
  g.add(carpet);
  const banner = sign(grand ? 'GRAND RALLY' : 'RALLY POINT', '#1b2a4a', '#f5c518', 9.4, 1.5, grand ? 'Lagos is listening' : 'Brake to unload your crowd', 1024, 256);
  banner.position.set(0, 5.3, 3.76);
  g.add(banner);
  const back = sign('LAGOS', '#c23fa0', '#fff', 4.0, 1.4, undefined, 512, 192);
  back.position.set(7.4, 3.0, -1.9);
  g.add(back);
  return g;
}

export function buildGate(label: string, sub: string): THREE.Group {
  const g = new THREE.Group();
  const geo = cached('gantry', () => {
    const b = new GeoBuilder();
    for (const s of [-1, 1]) {
      b.box(0.5, 6.4, 0.5, '#d9d9d4', { x: s * 5.6, y: 3.2 });
      b.box(0.8, 0.3, 0.8, '#7a7a76', { x: s * 5.6, y: 0.15 });
    }
    b.box(11.8, 0.4, 0.5, '#d9d9d4', { y: 6.5 });
    buntingInto(b, 0, 6.2, 11);
    return b.build();
  });
  g.add(new THREE.Mesh(geo, vcMat()));
  const s = sign(label, '#0f5f3a', '#ffffff', 10.4, 2.4, sub, 1024, 256);
  s.position.set(0, 4.8, 0.3);
  g.add(s);
  return g;
}

export function buildFinish(): THREE.Group {
  const g = new THREE.Group();
  const geo = cached('finish', () => {
    const b = new GeoBuilder();
    for (const s of [-1, 1]) b.box(0.5, 6.4, 0.5, '#1b2a4a', { x: s * 5.6, y: 3.2 });
    b.box(11.8, 0.5, 0.5, '#1b2a4a', { y: 6.5 });
    for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) b.box(0.7, 0.03, 0.7, (i + j) % 2 ? '#f7f1e3' : '#161616', { x: -4.2 + i * 0.77, y: 0.04, z: -0.4 + j * 0.7 });
    buntingInto(b, 0, 6.2, 11);
    return b.build();
  });
  g.add(new THREE.Mesh(geo, vcMat()));
  const s = sign('FINISH', '#f5c518', '#161616', 10.4, 2.4, 'Ẹ ṣeun, Lagos', 1024, 256);
  s.position.set(0, 4.8, 0.3);
  g.add(s);
  return g;
}

// ---------------------------------------------------------------- player's ride
export function buildOkada(): THREE.Group {
  const geo = cached('okada', () => {
    const b = new GeoBuilder();
    for (const z of [-0.72, 0.72]) wheel(b, 0, z, 0.32, 0.12);
    b.box(0.12, 0.12, 1.2, '#1a1a1c', { y: 0.55 });
    b.box(0.3, 0.26, 0.5, '#c8281e', { y: 0.78, z: -0.2 });
    b.box(0.26, 0.1, 0.62, '#1a1a1c', { y: 0.74, z: 0.34 });
    b.cyl(0.03, 0.03, 0.9, '#9aa3ab', { y: 0.78, z: -0.7, rx: -0.3 }, 6);
    b.box(0.7, 0.04, 0.04, '#222', { y: 1.1, z: -0.62 });
    b.sphere(0.1, '#fff6d0', { y: 0.95, z: -0.82, sz: 0.7 }, 8);
    b.box(0.3, 0.05, 0.4, '#1a1a1c', { y: 0.66, z: 0.72 });
    b.box(0.22, 0.14, 0.04, '#ff3b30', { y: 0.82, z: 0.98 });
    b.cyl(0.05, 0.05, 0.25, '#9aa3ab', { x: 0.14, y: 0.35, z: 0.55, rz: Math.PI / 2 }, 6);
    return b.build();
  });
  return group(geo);
}

/** Keke Napep: enclosed canopy tricycle (C26 ride roster). */
export function buildKeke(): THREE.Group {
  const geo = cached('keke', () => {
    const b = new GeoBuilder();
    const Y = '#F2C230';
    wheel(b, 0, -0.85, 0.28, 0.12);
    for (const s of [-1, 1]) wheel(b, s * 0.52, 0.55, 0.3, 0.14);
    b.box(0.38, 0.5, 0.55, Y, { y: 0.55, z: -0.55 });
    b.cyl(0.04, 0.04, 0.5, '#1a1a1c', { y: 0.78, z: -0.85, rx: -0.2 }, 6);
    b.box(1.0, 0.08, 1.3, '#2a2a2c', { y: 0.42, z: 0.35 });
    b.box(0.96, 0.4, 0.2, Y, { y: 0.66, z: 0.95 });
    for (const [x, z] of [
      [-0.48, -0.15],
      [0.48, -0.15],
      [-0.48, 0.9],
      [0.48, 0.9],
    ] as const) {
      b.cyl(0.025, 0.025, 1.0, '#1a1a1c', { x, y: 1.1, z }, 6);
    }
    b.box(1.05, 0.04, 1.5, Y, { y: 1.62, z: 0.35 });
    b.box(1.05, 0.3, 0.04, shade(Y, -0.1), { y: 1.45, z: 1.08 });
    b.box(0.4, 0.1, 0.02, '#111', { y: 0.6, z: 1.09 });
    return b.build();
  });
  return group(geo);
}

/** Sienna / Hilux people-carrier (C26 ride roster). */
export function buildHilux(): THREE.Group {
  const geo = cached('hilux', () => {
    const b = new GeoBuilder();
    const C = '#8C9AA8';
    for (const z of [-0.95, 0.95]) for (const s of [-1, 1]) wheel(b, s * 0.72, z, 0.34, 0.2);
    b.box(1.62, 0.6, 2.4, C, { y: 0.62 });
    b.box(1.5, 0.55, 1.5, C, { y: 1.18, z: -0.3 });
    b.box(1.52, 0.42, 1.44, '#25333c', { y: 1.2, z: -0.3 });
    b.box(1.6, 0.14, 0.2, '#1a1a1c', { y: 0.44, z: -2.12 });
    b.box(1.6, 0.14, 0.2, '#1a1a1c', { y: 0.44, z: 2.12 });
    for (const s of [-1, 1]) {
      b.box(0.26, 0.12, 0.04, '#fff6d0', { x: s * 0.6, y: 0.78, z: -2.14 });
      b.box(0.2, 0.3, 0.04, '#ff3b30', { x: s * 0.74, y: 0.95, z: 2.14 });
    }
    return b.build();
  });
  return group(geo);
}

/** The player's own Danfo ride — same model as the oncoming-traffic obstacle (C26). */
export function buildDanfo(): THREE.Group {
  return group(danfoGeo());
}

function coasterGeo() {
  return cached('coaster', () => {
    const b = new GeoBuilder();
    const W = '#EDEFF2';
    const Bl = '#1F6FB2';
    b.box(2.3, 1.1, 7.6, W, { y: 0.95 });
    b.box(2.24, 0.95, 6.9, W, { y: 2.05, z: 0.1 });
    b.box(2.32, 0.5, 7.62, Bl, { y: 1.15 });
    b.box(2.33, 0.05, 7.63, '#111', { y: 1.58 });
    for (let i = 0; i < 7; i++) {
      for (const s of [-1, 1]) b.box(0.03, 0.55, 0.85, '#25333c', { x: s * 1.13, y: 2.1, z: -2.4 + i * 0.95 });
    }
    b.box(2.3, 0.22, 0.22, '#1a1a1c', { y: 0.5, z: -3.78 });
    b.box(2.3, 0.22, 0.22, '#1a1a1c', { y: 0.5, z: 3.78 });
    for (const s of [-1, 1]) {
      b.box(0.3, 0.16, 0.04, '#fff6d0', { x: s * 0.75, y: 0.9, z: -3.76 });
      b.box(0.24, 0.4, 0.05, '#ff3b30', { x: s * 0.95, y: 1.15, z: 3.76 });
    }
    for (const z of [-2.4, 0, 2.4]) for (const s of [-1, 1]) wheel(b, s * 1.14, z, 0.44, 0.26);
    return b.build();
  });
}
/** Coaster bus (C26 ride roster). */
export function buildCoaster(): THREE.Group {
  return group(coasterGeo());
}

/** Grand Convoy: a gold/purple flashy coaster variant (cosmetic prestige ride, C26). */
export function buildGrandConvoy(): THREE.Group {
  const geo = cached('grand-convoy', () => {
    const b = new GeoBuilder();
    const G = '#D4A017';
    const P = '#5B2A86';
    b.box(2.3, 1.1, 7.6, P, { y: 0.95 });
    b.box(2.24, 0.95, 6.9, P, { y: 2.05, z: 0.1 });
    b.box(2.32, 0.5, 7.62, G, { y: 1.15 });
    b.box(2.33, 0.05, 7.63, G, { y: 1.58 });
    for (let i = 0; i < 7; i++) {
      for (const s of [-1, 1]) b.box(0.03, 0.55, 0.85, '#25333c', { x: s * 1.13, y: 2.1, z: -2.4 + i * 0.95 });
    }
    for (const s of [-1, 1]) {
      b.box(0.3, 0.16, 0.04, '#fff6d0', { x: s * 0.75, y: 0.9, z: -3.76 });
      b.box(0.24, 0.4, 0.05, '#ff3b30', { x: s * 0.95, y: 1.15, z: 3.76 });
      b.cyl(0.015, 0.015, 0.7, '#111', { x: s * 1.1, y: 2.75, z: -3.2 });
      b.box(0.3, 0.2, 0.01, G, { x: s * 1.1 + s * 0.16, y: 2.95, z: -3.2 });
    }
    for (const z of [-2.4, 0, 2.4]) for (const s of [-1, 1]) wheel(b, s * 1.14, z, 0.44, 0.26);
    return b.build();
  });
  return group(geo);
}

/** Soft blob shadow under people / vehicles. */
export function blobShadow(w = 1.0, l = 1.0): THREE.Mesh {
  const m = new THREE.Mesh(
    cached('blobgeo', () => new THREE.CircleGeometry(0.5, 16)),
    glowMat('blob', '#000000', { transparent: true, opacity: 0.3 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.scale.set(w, l, 1);
  m.position.y = 0.04;
  return m;
}

