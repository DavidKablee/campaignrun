import * as THREE from 'three';
import { shade } from '../../geo';
import { unlitMat } from '../../materials';
import { signTexture } from '../../textures';
import type { Ctx } from '../ctx';
import { FLORA } from '../flora';
import { registerPieces, type PieceDef } from '../pieces';

/**
 * Kaduna's set pieces, drawn from the dossier (docs/research/states/kaduna.md), not
 * copied from any building: a produce market of tarp-shaded heaps, a town stadium beside a
 * roundabout with a ball on a cup, a level crossing and a steel through-truss rail bridge
 * over the river, a riverside park with an iron footbridge and a water slide, and a
 * waterfall over granite ledges. Cream, ochre, slate blue and granite grey; no flags, no
 * single-colour caps, nothing that reads as a party.
 */
const CREAM = '#eadfc6';
const OCHRE = '#cda66b';
const SLATE = '#4f6d85';
const CLAY = '#a5573a';
const STEEL = '#5e6a72';

const piece = (at: PieceDef['at'], build: PieceDef['build']): PieceDef => ({ at, build });
const PLANE = new THREE.PlaneGeometry(1, 1);
const sideOf = (side: -1 | 0 | 1): 1 | -1 => (side === -1 ? -1 : 1);

function board(c: Ctx, id: string, text: string, bg: string, fg: string, w: number, h: number, x: number, y: number, z: number, ry: number) {
  const sign = new THREE.Mesh(PLANE, unlitMat(`kd:${id}`, signTexture(text, bg, fg, 512, 160)));
  sign.scale.set(w, h, 1);
  sign.position.set(x, y, z);
  sign.rotation.y = ry;
  c.signs.push(sign);
}

export function registerKadunaPieces() {
  registerPieces({
    /**
     * Bakin Dogo: lanes of low produce counters under tarps held on poles, with heaps of
     * onion, pepper, tomato and mango in front, handcarts, sacks, and a gate board.
     */
    'kaduna.bakin-dogo': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const tarps = [SLATE, OCHRE, CREAM, '#9a8a6a', '#6b5a3a'];
      const heaps = ['#8a4a62', '#9c2f2a', '#b23a2a', '#b8863a', '#c9b58a', '#6a8a3a'];
      for (let row = 0; row < 3; row++) {
        const x = s * (14 + row * 6.5);
        for (let i = 0; i < 6; i++) {
          const zi = z - 15 + i * 6 + (row % 2) * 2;
          c.vc.box(3.4, 0.7, 1.6, '#6b4a2b', { x, y: 0.35, z: zi });
          for (let h = 0; h < 5; h++) c.vc.sphere(0.34 + (h % 2) * 0.06, heaps[(i + h + row) % heaps.length]!, { x: x - 1.3 + h * 0.65, y: 0.85, z: zi + (h % 2 ? 0.2 : -0.2), sy: 0.8 }, 6);
          for (const dx of [-1.7, 1.7]) for (const dz of [-0.9, 0.9]) c.vc.cyl(0.05, 0.05, 2.6, '#5a3d24', { x: x + dx, y: 1.3, z: zi + dz }, 4);
          c.vc.box(3.9, 0.07, 2.4, tarps[(i + row) % tarps.length]!, { x, y: 2.65, z: zi, rz: s * 0.09 });
        }
      }
      for (let i = 0; i < 3; i++) {
        const hz = z - 12 + i * 11;
        c.vc.box(1.5, 0.15, 0.9, '#7a5a3a', { x: s * 11.4, y: 0.6, z: hz });
        for (let k = 0; k < 3; k++) c.vc.sphere(0.34, k % 2 ? '#8a4a62' : '#b23a2a', { x: s * 11.4 + (k - 1) * 0.4, y: 0.95, z: hz }, 6);
        for (const dz of [-0.4, 0.4]) c.vc.cyl(0.3, 0.3, 0.08, '#1a1a1a', { x: s * 11.4, y: 0.3, z: hz + dz, rz: Math.PI / 2 }, 8);
      }
      for (let i = 0; i < 5; i++) c.vc.sphere(0.4, '#d6c59a', { x: s * 12.6 + i * 0.3, y: 0.35, z: z + 16, sy: 1.1 }, 6);
      c.vc.box(0.25, 5, 0.25, '#555', { x: s * 12, y: 2.5, z: z - 18 });
      board(c, 'bakin-dogo', 'BAKIN DOGO MARKET', '#6b5a3a', '#fff1cf', 9, 2.8, s * 11.4, 6.2, z - 14, -s * 0.5);
    }),

    /**
     * Kaduna Township Stadium: a low stepped stand on the road side, a floodlight mast at each
     * end, fruit sellers' umbrellas, and a roundabout monument of a ball on a cup-shaped pedestal.
     */
    'kaduna.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const sx = s * 24;
      for (let step = 0; step < 5; step++) c.vc.box(3.0, 0.9 + step * 0.9, 30, step % 2 ? '#cfc7b5' : '#b9b2a2', { x: sx + s * step * 2.6, y: (0.9 + step * 0.9) / 2, z });
      c.vc.box(5, 0.25, 31, '#98a2a5', { x: sx + s * 3.8, y: 6.6, z, rz: -s * 0.1 });
      for (const dz of [-13, -4.5, 4.5, 13]) c.vc.cyl(0.16, 0.18, 6.2, '#8a8f99', { x: sx + s * 1.4, y: 3.1, z: z + dz }, 5);
      for (const dz of [-17, 17]) {
        c.vc.cyl(0.16, 0.22, 17, '#8a8f99', { x: sx - 2, y: 8.5, z: z + dz }, 6);
        c.vc.box(3.2, 0.9, 0.5, '#f4efd0', { x: sx - 2, y: 17, z: z + dz });
      }
      c.vc.box(3.6, 3.2, 7, CREAM, { x: s * 20.5, y: 1.6, z: z + 12 });
      c.vc.box(3.9, 0.4, 7.3, CLAY, { x: s * 20.5, y: 3.4, z: z + 12 });
      board(c, 'kaduna-stadium', 'KADUNA TOWNSHIP STADIUM', SLATE, '#f4f1ea', 9, 2.4, s * 18.4, 6.4, z + 8, -s * 0.9);
      c.vc.box(0.2, 3.4, 0.2, '#555', { x: s * 18.4, y: 4.8, z: z + 8 });
      // roundabout monument: a ball on a cup
      const mx = s * 14.5;
      const mz = z - 14;
      c.vc.cyl(4.2, 4.2, 0.4, '#cfc9b8', { x: mx, y: 0.2, z: mz }, 14);
      c.vc.cyl(3.6, 3.6, 0.5, '#8a9a5a', { x: mx, y: 0.4, z: mz }, 14);
      c.vc.cyl(0.6, 0.6, 2.2, '#cfc9b8', { x: mx, y: 1.5, z: mz }, 8);
      c.vc.cyl(1.4, 0.5, 1.0, '#cfc9b8', { x: mx, y: 3.1, z: mz }, 10);
      c.vc.sphere(1.0, '#f4f1ea', { x: mx, y: 4.3, z: mz }, 10);
      for (let i = 0; i < 4; i++) {
        const uz = z + 2 + i * 3.6;
        c.vc.cyl(0.04, 0.04, 2.4, '#5a3d24', { x: s * 12.2, y: 1.2, z: uz }, 4);
        c.vc.cone(1.4, 0.5, [OCHRE, SLATE, CREAM, '#9a8a6a'][i]!, { x: s * 12.2, y: 2.5, z: uz }, 8);
        c.vc.box(1.3, 0.6, 0.9, '#7a5a3a', { x: s * 12.2, y: 0.3, z: uz });
      }
    }),

    /**
     * The level crossing at the rail line: two rails and sleepers across the road, a boom at
     * each side with a warning bar, a cross-buck sign and a signal lamp.
     */
    'kaduna.level-crossing': piece('entry', (c, side) => {
      const z = c.zMid;
      for (let i = 0; i < 14; i++) c.vc.box(0.35, 0.06, 3.6, '#4a3a2c', { x: -9 + i * 1.4, y: 0.04, z });
      for (const dz of [-0.75, 0.75]) c.vc.box(19, 0.1, 0.12, '#8a8a86', { x: 0, y: 0.09, z: z + dz });
      for (const sx of [-1, 1]) {
        const bx = sx * 9.2;
        c.vc.cyl(0.14, 0.16, 1.5, '#e8e4d4', { x: bx, y: 0.75, z: z - 2.4 }, 6);
        c.vc.box(0.12, 0.16, 7.8, '#e8e4d4', { x: bx, y: 1.5, z: z - 2.4 + 3.4 });
        for (let k = 0; k < 4; k++) c.vc.box(0.14, 0.18, 0.9, k % 2 ? '#e8e4d4' : '#2a2a28', { x: bx, y: 1.5, z: z - 2.4 + 0.8 + k * 1.8 });
        c.vc.box(0.12, 2.6, 0.12, '#444', { x: sx * 10.4, y: 1.3, z: z + 2.6 });
        c.vc.box(0.12, 0.7, 1.5, '#f4f1ea', { x: sx * 10.4, y: 2.9, z: z + 2.6, rx: 0.8 });
        c.vc.box(0.12, 0.7, 1.5, '#f4f1ea', { x: sx * 10.4, y: 2.9, z: z + 2.6, rx: -0.8 });
      }
      void side;
    }),
    /** A rail line in a cutting needs the far side of its chunk clear. */
    'kaduna.crossing-clear': piece('entry', () => {}),

    /**
     * River Kaduna rail bridge: a steel through-truss (top and bottom chords, verticals, diagonals)
     * on two round piers, with a short line of freight wagons waiting on it.
     */
    'kaduna.rail-bridge': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const bx = s * 28;
      const len = 38;
      c.vc.box(5, 0.8, len, '#3a3f44', { x: bx, y: 6.2, z });
      for (const e of [-1, 1]) {
        c.vc.box(0.35, 0.35, len, STEEL, { x: bx + e * 2.5, y: 6.7, z });
        c.vc.box(0.35, 0.35, len, STEEL, { x: bx + e * 2.5, y: 11.2, z });
        const n = 8;
        for (let i = 0; i <= n; i++) {
          const zi = z - len / 2 + (i / n) * len;
          c.vc.box(0.28, 4.6, 0.28, STEEL, { x: bx + e * 2.5, y: 8.95, z: zi });
          if (i < n) c.vc.box(0.2, 5.0, 0.2, shade(STEEL, 0.05), { x: bx + e * 2.5, y: 8.95, z: zi + len / n / 2, rx: (i % 2 ? 1 : -1) * 0.82 });
        }
      }
      for (let i = 0; i <= 8; i++) c.vc.box(5.4, 0.3, 0.3, STEEL, { x: bx, y: 11.2, z: z - len / 2 + (i / 8) * len });
      for (const dz of [-12, 12]) c.vc.cyl(1.5, 1.8, 6.4, '#a8a498', { x: bx, y: 3.2, z: z + dz }, 10);
      for (const dx of [-0.75, 0.75]) c.vc.box(0.12, 0.14, len, '#8a8a86', { x: bx + dx, y: 6.7, z });
      const wag = ['#6b5a4a', '#4a5560', '#7a4a3a'];
      for (let i = 0; i < 3; i++) c.vc.box(2.4, 1.8, 8, wag[i]!, { x: bx, y: 7.8, z: z - 12 + i * 9 });
    }),

    /**
     * Splash Park: a riverside gate with the name over it, a pale iron footbridge on an arch,
     * a tall water-slide tower with a sloping flume, picnic shelters and big shade trees.
     */
    'kaduna.splash-park': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (const dz of [-3.4, 3.4]) c.vc.box(1.4, 6.4, 1.4, CREAM, { x: s * 14, y: 3.2, z: z - 13 + dz });
      c.vc.box(1.8, 1.4, 8.8, SLATE, { x: s * 14, y: 6.6, z: z - 13 });
      board(c, 'splash', 'SPLASH PARK', SLATE, '#f4f1ea', 7, 2.0, s * 13.2, 6.8, z - 13, -s * 1.57);
      // iron footbridge
      const fx = s * 23;
      c.vc.box(2, 0.25, 16, '#c9c5b8', { x: fx, y: 3.4, z: z + 2 });
      for (const e of [-1, 1]) {
        c.vc.box(0.12, 0.9, 16, '#e8e4d4', { x: fx + e * 1.0, y: 4.0, z: z + 2 });
        for (let i = 0; i < 8; i++) c.vc.box(0.1, 0.9, 0.1, '#e8e4d4', { x: fx + e * 1.0, y: 3.95, z: z - 5 + i * 2.2 });
      }
      for (const dz of [-6, 10]) c.vc.box(1.2, 3.4, 1.2, '#8a8a86', { x: fx, y: 1.7, z: z + dz });
      // water slide
      const tx = s * 31;
      c.vc.box(3, 8.4, 3, '#d8cdb0', { x: tx, y: 4.2, z: z - 6 });
      c.vc.box(3.4, 0.4, 3.4, SLATE, { x: tx, y: 8.6, z: z - 6 });
      c.vc.box(1.4, 0.4, 14, '#cfc7b5', { x: tx, y: 4.6, z: z + 2, rx: -0.5 });
      c.vc.box(5, 0.1, 5, '#6fa0b0', { x: tx, y: 0.1, z: z + 8.5 });
      for (let i = 0; i < 2; i++) {
        const px = s * (17 + i * 5);
        c.vc.box(3.6, 0.2, 3.6, OCHRE, { x: px, y: 2.8, z: z + 12 });
        for (const dx of [-1.5, 1.5]) for (const dz of [-1.5, 1.5]) c.vc.cyl(0.08, 0.08, 2.8, '#5a3d24', { x: px + dx, y: 1.4, z: z + 12 + dz }, 4);
      }
      FLORA.neem!(c, s * 16, z + 17);
      FLORA.mango!(c, s * 38, z + 14);
      FLORA.neem!(c, s * 38, z - 14);
    }),

    /**
     * Matsirga Falls: stacked granite ledges with a tall white fall of water, a pool at the
     * foot with mist, boulders and green trees on the slopes.
     */
    'kaduna.matsirga-falls': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const fx = s * 30;
      c.vc.box(14, 8, 26, '#85827c', { x: fx + s * 6, y: 4, z });
      c.vc.box(12, 7, 20, '#928f88', { x: fx + s * 6, y: 11.5, z: z + 1 });
      c.vc.box(8, 5, 12, '#7b7872', { x: fx + s * 7, y: 17, z: z + 2 });
      c.vc.box(1.8, 15, 3.2, '#e8f0f2', { x: fx - s * 0.6, y: 9, z: z - 2 });
      c.vc.box(1.3, 6, 2.4, '#f4f8f8', { x: fx - s * 0.8, y: 3, z: z - 2 });
      c.vc.cyl(7, 7, 0.14, '#6fa0b0', { x: fx - s * 5, y: 0.08, z: z - 2 }, 14);
      for (let i = 0; i < 4; i++) c.vc.sphere(1.6 + (i % 2) * 0.7, '#f1f5f5', { x: fx - s * (1.5 + i * 1.2), y: 1.2 + i * 0.5, z: z - 2 + (i % 2 ? 1 : -1) }, 6);
      for (let i = 0; i < 5; i++) FLORA.boulder!(c, s * (17 + i * 2.5), z - 16 + i * 8);
      FLORA.mango!(c, s * 17, z + 14);
      FLORA.neem!(c, s * 40, z - 17);
      FLORA.neem!(c, s * 42, z + 15);
    }),
  });
}
