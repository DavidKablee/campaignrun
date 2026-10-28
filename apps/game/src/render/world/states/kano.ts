import * as THREE from 'three';
import { shade } from '../../geo';
import { unlitMat } from '../../materials';
import { signTexture } from '../../textures';
import type { Ctx } from '../ctx';
import { registerPieces, type PieceDef } from '../pieces';

/**
 * Kano's set pieces. Each is a stylised model drawn from the dossier's description
 * (docs/research/states/kano.md), not a copy of any building: tubali-earth plaster,
 * zankwaye (the "bull horn" corner cones), indigo-dyed cloth, tin-shaded market
 * lanes, a red laterite hill. All stand at |x| >= 12 on one side so the lanes, the
 * rally stage and the crowd stay clear. No flags, no lettering beyond a generic
 * "trade fair" board, nothing that reads as a party colour.
 */
const EARTH = '#c9a06e';
const EARTH_DARK = '#a8693c';
const LATERITE = '#a4502f';
const INDIGO = '#2d3c73';
const TIN = '#98908a';
const DOOR = '#2a1a10';

const piece = (at: PieceDef['at'], build: PieceDef['build']): PieceDef => ({ at, build });
const PLANE = new THREE.PlaneGeometry(1, 1);
const sideOf = (side: -1 | 0 | 1): 1 | -1 => (side === -1 ? -1 : 1);

/** The four corner cones that crown an earthen block. */
function zankwaye(c: Ctx, cx: number, cz: number, w: number, d: number, top: number, col: string, h = 1.2) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.vc.cone(0.34, h, col, { x: cx + sx * (w / 2 - 0.2), y: top + h / 2, z: cz + sz * (d / 2 - 0.2) }, 5);
}

/** A run of crouched-over indigo pits is the whole point of Kofar Mata: round, dark, sunk, ringed by a low rim. */
const PIT_LIQUORS = ['#243a57', '#2d3c73', '#1f2f48', '#3b4f80', '#1a2740', '#2b4a6b', '#32456f'];

export function registerKanoPieces() {
  registerPieces({
    /**
     * Kurmi Market: an earthen gate block with four corner cones and a dark
     * pointed entrance, and behind it lanes of stalls roofed in corrugated tin,
     * with cloth and goods set out under the eaves.
     */
    'kano.market-gate': piece('venue', (c, side) => {
      const s = sideOf(side);
      const gx = s * 15;
      const z = c.zMid - 6;
      c.vc.box(7, 10, 9, EARTH, { x: gx, y: 5, z });
      c.vc.box(7.7, 0.55, 9.7, shade(EARTH, -0.12), { x: gx, y: 10.2, z });
      zankwaye(c, gx, z, 7.6, 9.6, 10.5, shade(EARTH, -0.06), 2.2);
      c.vc.box(0.2, 6.2, 3.6, DOOR, { x: gx - s * 3.55, y: 3.1, z });
      c.vc.cone(1.9, 2.4, DOOR, { x: gx - s * 3.55, y: 6.9, z, rz: s * Math.PI / 2 }, 4);
      c.vc.box(0.25, 0.9, 6, INDIGO, { x: gx - s * 3.6, y: 8.6, z });
      // stall lanes under tin
      const goods = ['#c98f3a', '#f4f1ea', INDIGO, '#8a5a2b', '#8ea4ae'];
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 5; i++) {
          const sx = s * (14.5 + row * 4.4);
          const sz = c.zStart + 3 + i * 7.4 + (row ? 2 : 0);
          for (const dx of [-1.4, 1.4]) for (const dz of [-1.2, 1.2]) c.vc.cyl(0.05, 0.05, 2.4, '#5d4037', { x: sx + dx, y: 1.2, z: sz + dz }, 4);
          c.vc.box(3.2, 0.08, 3.0, TIN, { x: sx, y: 2.6, z: sz, rz: s * 0.14 });
          c.vc.box(2.4, 0.7, 1.0, '#7a5a3a', { x: sx - s * 0.2, y: 0.35, z: sz - 0.9 });
          for (let g = 0; g < 4; g++) c.vc.sphere(0.2, goods[(i + g + row) % goods.length]!, { x: sx - 0.9 + g * 0.6, y: 0.85, z: sz - 0.9 }, 5);
          if (i % 2 === 0) c.vc.box(0.8, 1.5, 0.04, goods[(i + row) % goods.length]!, { x: sx + 0.4, y: 1.7, z: sz + 1.3 });
        }
      }
    }),

    /**
     * Kofar Mata dye pits: a low mud wall ring round a yard of dark circular
     * pits, cloth in shades of blue hung to dry on poles, a plank bench.
     */
    'kano.dye-pits': piece('venue', (c, side) => {
      const s = sideOf(side);
      const cx = s * 21.5;
      const z = c.zMid;
      const w = 17;
      const d = 26;
      c.vc.box(w, 0.1, d, '#a07044', { x: cx, y: 0.05, z });
      // ring wall with a corner cone at each corner and a gap facing the road
      c.vc.box(0.7, 2.6, d, EARTH, { x: cx + s * (w / 2), y: 1.3, z });
      c.vc.box(w, 2.6, 0.7, EARTH, { x: cx, y: 1.3, z: z - d / 2 });
      c.vc.box(w, 2.6, 0.7, EARTH, { x: cx, y: 1.3, z: z + d / 2 });
      for (const sz of [-1, 1]) {
        c.vc.box(0.7, 2.6, 7, EARTH, { x: cx - s * (w / 2), y: 1.3, z: z + sz * (d / 2 - 3.5) });
        c.vc.cone(0.5, 1.7, shade(EARTH, -0.06), { x: cx - s * (w / 2), y: 3.4, z: z + sz * (d / 2 - 0.4) }, 5);
        c.vc.cone(0.5, 1.7, shade(EARTH, -0.06), { x: cx + s * (w / 2), y: 3.4, z: z + sz * (d / 2 - 0.4) }, 5);
      }
      // seven pits
      const spots: [number, number][] = [[-4, -9], [2, -9], [-5, -3], [1, -2], [5, 1], [-3, 5], [3, 8]];
      spots.forEach(([dx, dz], i) => {
        c.vc.cyl(1.9, 2.05, 0.7, EARTH_DARK, { x: cx + dx, y: 0.35, z: z + dz }, 10);
        c.vc.cyl(1.5, 1.5, 0.74, PIT_LIQUORS[i % PIT_LIQUORS.length]!, { x: cx + dx, y: 0.37, z: z + dz }, 10);
      });
      // cloth on poles
      const cloth = ['#5b7fa8', '#3b4f80', '#8ea4ae', INDIGO, '#243a57'];
      for (let i = 0; i < 4; i++) {
        const pz = z - 9 + i * 5.4;
        const px = cx - s * (w / 2 - 1.2);
        for (const dz of [0, 3.2]) c.vc.cyl(0.09, 0.09, 6.2, '#5a3d24', { x: px, y: 3.1, z: pz + dz }, 4);
        c.vc.box(0.07, 0.09, 3.2, '#5a3d24', { x: px, y: 6.1, z: pz + 1.6 });
        c.vc.box(0.06, 4.2, 3.0, cloth[i % cloth.length]!, { x: px, y: 3.9, z: pz + 1.6 });
      }
    }),

    /**
     * One of the old city gates: two squat plastered towers with stepped parapets
     * and corner cones, a deep dark archway between them, wall running away on
     * both sides, indigo cloth hung from the lintel.
     */
    'kano.city-gate': piece('entry', (c, side) => {
      const s = sideOf(side);
      const x = s * 14.5;
      const z = c.zMid;
      for (const dz of [-5.5, 5.5]) {
        c.vc.box(5, 11, 4.8, EARTH, { x, y: 5.5, z: z + dz });
        c.vc.box(5.5, 0.5, 5.3, shade(EARTH, -0.12), { x, y: 11.2, z: z + dz });
        zankwaye(c, x, z + dz, 5.2, 5.0, 11.4, shade(EARTH, -0.05), 2);
      }
      c.vc.box(5, 3.2, 7, EARTH, { x, y: 9.4, z });
      c.vc.box(0.2, 7.4, 4.2, DOOR, { x: x - s * 2.5, y: 3.7, z });
      c.vc.cone(2.2, 2.6, DOOR, { x: x - s * 2.5, y: 8.4, z, rz: s * Math.PI / 2 }, 4);
      for (let i = 0; i < 5; i++) c.vc.box(0.05, 3.2, 0.7, i % 2 ? '#5b7fa8' : INDIGO, { x: x - s * 2.7, y: 7.2, z: z - 1.6 + i * 0.8 });
      for (const dz of [-15, 15]) {
        c.vc.box(2.6, 6, 14, EARTH, { x, y: 3, z: z + dz });
        c.vc.box(3.0, 0.4, 14, shade(EARTH, -0.12), { x, y: 6.2, z: z + dz });
      }
    }),

    /**
     * Dala Hill: a bare red laterite mound that stands over the old city, boulders
     * on its shoulder, a stair of pale steps up its flank, a water tank at the top
     * and two low trees at its foot.
     */
    'kano.dala-hill': piece('venue', (c, side) => {
      const s = sideOf(side);
      const rx = 19;
      const ry = 17;
      const cx = s * (10 + rx);
      const z = c.zMid;
      c.vc.cap(1, Math.PI / 2, LATERITE, { x: cx, y: -0.4, z, sx: rx, sy: ry, sz: 19 }, 12);
      c.vc.cap(1, Math.PI / 2, shade(LATERITE, 0.06), { x: cx - s * 7, y: -0.2, z: z + 6, sx: 9, sy: 8, sz: 8 }, 8);
      for (let i = 0; i < 7; i++) {
        const a = 0.22 + i * 0.17;
        c.vc.box(1.6, 0.18, 1.6, '#d9c9a0', { x: cx - s * rx * Math.cos(a) * 0.98, y: ry * Math.sin(a) - 0.2, z: z - 4 });
      }
      const boulder = ['#8a5a3c', '#7b4f35', '#9a6a4a'];
      for (let i = 0; i < 6; i++) {
        const a = 0.9 + (i % 3) * 0.15;
        c.vc.sphere(1.6 + (i % 3) * 0.5, boulder[i % 3]!, { x: cx - s * (rx * Math.cos(a) * 0.7 - i * 0.7), y: ry * Math.sin(a) * 0.9, z: z + (i - 3) * 3.4, sy: 0.75 }, 6);
      }
      c.vc.cyl(1.4, 1.4, 1.8, '#b6ae9f', { x: cx, y: ry - 0.4, z: z + 2 }, 8);
      for (const dz of [-14, 13]) {
        c.vc.cyl(0.22, 0.3, 3.4, '#5a3d24', { x: cx - s * (rx - 2.5), y: 1.7, z: z + dz }, 5);
        c.vc.sphere(2.0, '#6e7a46', { x: cx - s * (rx - 2.5), y: 4.1, z: z + dz, sy: 0.55 }, 6);
      }
    }),

    /** The flyover seen across the Nassarawa end: a concrete deck on piers beside the road, plain rails. */
    'kano.flyover': piece('entry', (c, side) => {
      const s = sideOf(side);
      const x = s * 17;
      for (let i = 0; i < 4; i++) c.vc.box(1.4, 7, 2.2, '#bdb8ad', { x, y: 3.5, z: c.zStart + 5 + i * 10 });
      c.vc.box(9, 0.9, 40, '#a9a59a', { x, y: 7.4, z: c.zMid });
      for (const dx of [-4.2, 4.2]) c.vc.box(0.3, 1.0, 40, '#8f8b82', { x: x + dx, y: 8.3, z: c.zMid });
      for (let i = 0; i < 5; i++) c.vc.cyl(0.08, 0.08, 4, '#555', { x: x - s * 4.2, y: 10.4, z: c.zStart + 4 + i * 8 }, 4);
    }),

    /**
     * The race course: a long white double rail beside the road, a tan oval track
     * and green-grey infield beyond it, a low covered stand, a starting-gate frame.
     */
    'kano.race-course': piece('venue', (c, side) => {
      const s = sideOf(side);
      const rail = 13.2;
      for (let i = 0; i < 11; i++) c.vc.cyl(0.07, 0.07, 1.5, '#f4f1ea', { x: s * rail, y: 0.75, z: c.zStart + 1 + i * 3.6 }, 4);
      for (const y of [0.55, 1.2]) c.vc.box(0.08, 0.1, 40, '#f4f1ea', { x: s * rail, y, z: c.zMid });
      const tx = s * 44;
      c.vc.cyl(32, 32, 0.06, '#c9a56e', { x: tx, y: 0.04, z: c.zMid }, 14);
      c.vc.cyl(24, 24, 0.1, '#9a9060', { x: tx, y: 0.06, z: c.zMid }, 14);
      // stand: raked seating, tin roof on posts
      const sx = s * 20;
      for (let step = 0; step < 4; step++) c.vc.box(3.4, 0.8, 22, step % 2 ? '#cfc7b5' : '#b9b2a2', { x: sx + s * step * 1.1, y: 0.4 + step * 0.8, z: c.zMid });
      c.vc.box(6.4, 0.14, 23, TIN, { x: sx + s * 1.8, y: 5.2, z: c.zMid, rz: -s * 0.1 });
      for (const dz of [-10, -3.5, 3.5, 10]) c.vc.cyl(0.14, 0.14, 4.8, '#8a7a5e', { x: sx - s * 0.4, y: 2.4, z: c.zMid + dz }, 5);
      // starting gate
      for (const dz of [-3.5, 3.5]) c.vc.box(0.3, 2.6, 0.3, '#f4f1ea', { x: s * 30, y: 1.3, z: c.zStart + 6 + dz + 4 });
      c.vc.box(0.3, 0.3, 7.3, '#f4f1ea', { x: s * 30, y: 2.7, z: c.zStart + 10 });
    }),

    /**
     * The trade-fair complex on Zoo Road: a wide low hall, an entrance arch on two
     * pillars with a canopy slab, a round sign drum, a row of bare flagpoles.
     */
    'kano.trade-fair': piece('venue', (c, side) => {
      const s = sideOf(side);
      const hx = s * 23;
      const z = c.zMid;
      c.vc.box(16, 8.4, 30, '#eee0c4', { x: hx, y: 4.2, z });
      c.vc.box(16.6, 0.4, 30.6, '#b6ae9f', { x: hx, y: 8.6, z });
      c.vc.box(16.4, 1.4, 30.4, INDIGO, { x: hx, y: 7.2, z });
      const ax = hx - s * 8.8;
      for (const dz of [-5, 5]) c.vc.box(1.4, 10, 1.4, '#d8c9a7', { x: ax, y: 5, z: z + dz });
      c.vc.box(4.4, 1.6, 12.4, '#d8c9a7', { x: ax, y: 10.4, z });
      c.vc.box(5.6, 0.3, 13, '#8ea4ae', { x: ax - s * 1.4, y: 9.3, z });
      c.vc.box(0.3, 6.2, 7.6, '#3a2a1c', { x: ax + s * 0.2, y: 3.1, z });
      c.vc.cyl(2.2, 2.2, 2.4, INDIGO, { x: hx, y: 10.6, z: z + 10 }, 10);
      for (let i = 0; i < 5; i++) c.vc.cyl(0.07, 0.09, 8, '#cfcfca', { x: s * 14, y: 4, z: c.zStart + 4 + i * 8 }, 5);
      const sign = new THREE.Mesh(PLANE, unlitMat('tf:TRADE FAIR', signTexture('TRADE FAIR', '#2d3c73', '#f4f1ea', 512, 160)));
      sign.scale.set(8, 2.5, 1);
      sign.position.set(ax - s * 3.2, 11.8, z);
      sign.rotation.y = -s * 0.7;
      c.signs.push(sign);
      c.vc.box(0.2, 3.4, 0.2, '#555', { x: ax - s * 3.2, y: 10.2, z });
    }),
  });
}
