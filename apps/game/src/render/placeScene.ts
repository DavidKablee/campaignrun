import * as THREE from 'three';
import { GeoBuilder, mulberry } from './geo';
import { vcMat } from './materials';

/**
 * The static scenery of a Mobilise place (C82): one merged mesh per place, built from primitives.
 * It does not reuse the road-side builders in `world.ts`, which assume a straight road with a
 * 12 m clear verge; a plaza wants objects all round the edge and a clear middle to walk in.
 *
 * Scale: the people are about 1.2 units tall, so a stall is roughly 1.4 high and a tree 3.
 */

export interface PlaceLook {
  sky: string;
  ground: string;
  accent: string;
}

/** Colours by the state's zone, so Kano's market is dusty and a Rivers lakeside is green. */
const ZONES: Record<string, PlaceLook> = {
  SW: { sky: '#9fd3f0', ground: '#7a9a4a', accent: '#f5c518' },
  SS: { sky: '#a6d9ea', ground: '#5f9648', accent: '#2a9d8f' },
  SE: { sky: '#a8d6ee', ground: '#6f9a45', accent: '#e85d04' },
  NW: { sky: '#e6d2a8', ground: '#c9a766', accent: '#1f5f8b' },
  NE: { sky: '#ead4a0', ground: '#c8a560', accent: '#b3261e' },
  NC: { sky: '#bfdcec', ground: '#a89c58', accent: '#7b5ea7' },
};

export function lookForZone(zone: string): PlaceLook {
  return ZONES[zone] ?? ZONES.SW!;
}

function tree(b: GeoBuilder, x: number, z: number, s = 1) {
  b.cyl(0.12 * s, 0.18 * s, 1.4 * s, '#6b4a2b', { x, y: 0.7 * s, z }, 6);
  b.sphere(1.0 * s, '#2f7d3a', { x, y: 2.1 * s, z }, 7);
  b.sphere(0.7 * s, '#3b9145', { x: x + 0.5 * s, y: 2.5 * s, z: z - 0.2 * s }, 7);
}

function palm(b: GeoBuilder, x: number, z: number) {
  b.cyl(0.1, 0.16, 3.0, '#8a6a3b', { x, y: 1.5, z, rz: 0.08 }, 6);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    b.box(1.3, 0.05, 0.28, '#2f8a3c', { x: x + Math.cos(a) * 0.6, y: 3.0, z: z + Math.sin(a) * 0.6, ry: -a, rz: -0.25 });
  }
}

function stall(b: GeoBuilder, x: number, z: number, ry: number, accent: string, rand: () => number) {
  const stripe = rand() > 0.5 ? '#f3e3c3' : '#e85d04';
  b.box(1.8, 0.7, 0.9, '#7a5230', { x, y: 0.35, z, ry });
  b.box(1.9, 0.12, 1.1, accent, { x, y: 1.55, z, ry, rx: 0.1 });
  b.box(1.9, 0.06, 0.4, stripe, { x, y: 1.6, z: z + 0.2, ry });
  for (const dx of [-0.85, 0.85]) b.cyl(0.04, 0.04, 1.5, '#4a3320', { x: x + Math.cos(ry) * dx, y: 0.75, z: z - Math.sin(ry) * dx }, 5);
  b.box(0.5, 0.25, 0.4, rand() > 0.5 ? '#e0902b' : '#1fa45b', { x: x - 0.4, y: 0.82, z });
  b.box(0.4, 0.2, 0.35, '#b3261e', { x: x + 0.4, y: 0.8, z });
}

function bench(b: GeoBuilder, x: number, z: number, ry: number) {
  b.box(1.4, 0.1, 0.4, '#8a5a2b', { x, y: 0.45, z, ry });
  b.box(1.4, 0.4, 0.08, '#8a5a2b', { x, y: 0.75, z: z - 0.18, ry });
  b.box(0.08, 0.45, 0.4, '#3a3a3a', { x: x - 0.6, y: 0.22, z, ry });
  b.box(0.08, 0.45, 0.4, '#3a3a3a', { x: x + 0.6, y: 0.22, z, ry });
}

function flag(b: GeoBuilder, x: number, z: number, color: string) {
  b.cyl(0.04, 0.04, 2.6, '#cfcfcf', { x, y: 1.3, z }, 5);
  b.box(0.8, 0.5, 0.03, color, { x: x + 0.4, y: 2.3, z });
}

function podium(b: GeoBuilder, accent: string) {
  b.box(3.6, 0.5, 2.2, '#2b3a55', { y: 0.25, z: -3 });
  b.box(3.6, 0.06, 2.2, accent, { y: 0.53, z: -3 });
  b.box(0.8, 0.8, 0.5, '#1b2a4a', { y: 0.9, z: -3.2 });
}

export function buildPlaceScenery(kind: string, look: PlaceLook, seed: number, halfX: number, halfZ: number): THREE.Group {
  const r = mulberry(seed);
  const rand = () => r.next();
  const b = new GeoBuilder();
  b.segScale = 0.7;
  const group = new THREE.Group();

  // Ground: a big disc plus a lighter walkable square so the bounds read.
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 32), new THREE.MeshBasicMaterial({ color: look.ground }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  group.add(ground);
  b.box(halfX * 2 + 2, 0.04, halfZ * 2 + 2, '#d8c79a', { y: 0.0 });

  // Perimeter trees and a far ring so the edge feels like a place, not a board.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.2;
    const rx = halfX + 4 + rand() * 6;
    const rz = halfZ + 4 + rand() * 6;
    if (kind === 'lake' && i % 2 === 0) palm(b, Math.cos(a) * rx, Math.sin(a) * rz);
    else tree(b, Math.cos(a) * rx, Math.sin(a) * rz, 0.8 + rand() * 0.6);
  }
  for (let i = 0; i < 9; i++) {
    const x = -halfX - 6 + (i / 8) * (halfX * 2 + 12);
    const h = 3 + rand() * 4;
    b.box(3 + rand() * 2, h, 2.5, rand() > 0.5 ? '#d9cbb0' : '#c4b08a', { x, y: h / 2, z: -halfZ - 12 - rand() * 3 });
  }

  switch (kind) {
    case 'market': {
      for (let i = 0; i < 5; i++) stall(b, -halfX + 2.5 + i * 3, -halfZ + 1.2, 0, look.accent, rand);
      for (let i = 0; i < 4; i++) stall(b, -halfX + 2 + i * 3.4, halfZ - 1.2, Math.PI, look.accent, rand);
      stall(b, -halfX + 1.2, 0, Math.PI / 2, look.accent, rand);
      stall(b, halfX - 1.2, 1, -Math.PI / 2, look.accent, rand);
      for (let i = 0; i < 6; i++) b.box(0.5, 0.4, 0.5, '#8a5a2b', { x: -6 + rand() * 12, y: 0.2, z: -2 + rand() * 4, ry: rand() });
      break;
    }
    case 'park': {
      b.cyl(1.6, 1.8, 0.3, '#9aa3ad', { y: 0.15 }, 20);
      b.cyl(1.2, 1.2, 0.34, '#4ba3d9', { y: 0.16 }, 20);
      b.cyl(0.15, 0.2, 1.1, '#9aa3ad', { y: 0.7 }, 8);
      for (let i = 0; i < 6; i++) bench(b, Math.cos((i / 6) * Math.PI * 2) * 5, Math.sin((i / 6) * Math.PI * 2) * 4, -(i / 6) * Math.PI * 2 + Math.PI / 2);
      for (let i = 0; i < 5; i++) tree(b, -halfX + 2 + i * 6, halfZ - 2, 1.1);
      break;
    }
    case 'lake': {
      const water = new THREE.Mesh(new THREE.CircleGeometry(halfX * 0.9, 28), new THREE.MeshBasicMaterial({ color: '#3f8fc9' }));
      water.rotation.x = -Math.PI / 2;
      water.position.set(0, 0.02, -halfZ - 4);
      water.scale.set(1.2, 1, 0.5);
      group.add(water);
      b.box(1.2, 0.12, 7, '#8a5a2b', { x: 4, y: 0.18, z: -halfZ + 0.5 });
      b.box(2.6, 0.35, 0.8, '#e85d04', { x: -6, y: 0.2, z: -halfZ - 1.5, ry: 0.2 });
      b.box(0.1, 1.6, 0.1, '#4a3320', { x: -6, y: 1.0, z: -halfZ - 1.5 });
      for (let i = 0; i < 4; i++) bench(b, -halfX + 4 + i * 4, halfZ - 1.5, Math.PI);
      break;
    }
    case 'stadium': {
      for (let i = 0; i < 4; i++) {
        b.box(halfX * 2 + 4, 0.8, 1.2, '#b9b4a6', { y: 0.4 + i * 0.8, z: -halfZ - 2 - i * 1.2 });
        b.box(halfX * 2 + 4, 0.8, 1.2, '#b9b4a6', { y: 0.4 + i * 0.8, z: halfZ + 2 + i * 1.2 });
      }
      for (let i = 0; i < 18; i++) b.box(0.4, 0.9, 0.3, ['#e85d04', '#1f5f8b', '#f5c518', '#1fa45b'][i % 4]!, { x: -halfX + 1 + i * 1.7, y: 1.3 + (i % 3) * 0.8, z: -halfZ - 2.6 - (i % 3) * 1.2 });
      podium(b, look.accent);
      for (let i = 0; i < 6; i++) flag(b, -halfX + 1 + i * 5.6, halfZ - 0.5, ['#1fa45b', '#f3e3c3', '#1fa45b', '#f5c518', '#1f5f8b', '#e85d04'][i]!);
      b.torus(halfZ - 1, 0.06, '#f3e3c3', { y: 0.05, rx: Math.PI / 2, sx: halfX / halfZ }, Math.PI * 2, 28);
      break;
    }
  }

  const merged = b.build();
  if (merged) group.add(new THREE.Mesh(merged, vcMat()));
  return group;
}

export function disposeScenery(g: THREE.Group) {
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      const m = o.material as THREE.Material;
      if (m instanceof THREE.MeshBasicMaterial) m.dispose();
    }
  });
}
