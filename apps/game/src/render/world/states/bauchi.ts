import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, piece, sideOf, stadiumBlock } from './common';

/**
 * Bauchi's set pieces (docs/research/states/bauchi.md), original stylised models: a grain and
 * produce market of open tin-roofed sheds, a pale-sandstone reserve gate on a laterite track, a
 * warm spring under a low stepped cliff, one rebuilt old-city gateway hemmed in by houses and
 * shops under a bare rock hill, and a township stadium. Sand, plaster, sandstone and pale water;
 * no animal, herder, uniform, barrier arm, palace, dome, minaret or flag anywhere.
 */
const PLASTER = '#e6d6b8';
const SAND = '#c9ab7a';
const STONE = '#b98c5a';
const DARK = '#6b4a2e';
const ROCK = '#9a8f80';
const WATER = '#8fc2c0';

export function registerBauchiPieces() {
  registerPieces({
    /**
     * A grain and produce market: two long open sheds under low tin gables with heaps of grain
     * and groundnut sacks, stacks of calabashes, hand carts, striped canvas parasols and a baobab
     * at the back.
     */
    'bauchi.produce-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const heaps = ['#d6bd7a', '#c9a76a', '#8a7a4a', '#b8864a'];
      for (let row = 0; row < 2; row++) {
        const x = s * (17 + row * 12);
        for (const dz of [-1, 1]) for (const dx of [-2.6, 2.6]) c.vc.cyl(0.06, 0.06, 2.8, '#5a3d24', { x: x + dx, y: 1.4, z: z + dz * 15 }, 4);
        c.vc.prism(6.4, 1.1, 32, row ? '#8f8b82' : '#a39d92', { x, y: 3.3, z });
        c.vc.box(5.6, 0.45, 31, '#7a5a3a', { x, y: 0.22, z });
        for (let i = 0; i < 9; i++) {
          const zi = z - 14 + i * 3.5;
          c.vc.cone(0.75, 0.7, heaps[(i + row) % 4]!, { x: x - 1.2 + (i % 2) * 2.2, y: 0.8, z: zi }, 6);
          if (i % 3 === 0) for (let k = 0; k < 4; k++) c.vc.box(0.5, 0.35, 0.8, k % 2 ? '#c9b58a' : '#b79a6c', { x: x + 1.9, y: 0.64 + (k >> 1) * 0.35, z: zi + (k % 2) * 0.85 });
        }
      }
      for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) c.vc.sphere(0.34, '#b88a4a', { x: s * 13.4 + (k % 2) * 0.5, y: 0.34 + (k >> 1) * 0.5, z: z - 14 + i * 9 + k * 0.4, sy: 0.9 }, 5);
      for (let i = 0; i < 2; i++) {
        c.vc.box(1.0, 0.14, 2.0, '#7a5a3a', { x: s * 12.6, y: 0.6, z: z - 9 + i * 14 });
        for (const dx of [-0.55, 0.55]) c.vc.cyl(0.38, 0.38, 0.1, '#1a1a1a', { x: s * 12.6 + dx, y: 0.38, z: z - 9 + i * 14, rz: Math.PI / 2 }, 8);
        for (let k = 0; k < 3; k++) c.vc.box(0.5, 0.4, 0.5, '#b79a6c', { x: s * 12.6, y: 0.9 + k * 0.2, z: z - 9.5 + i * 14 + k * 0.4 });
      }
      for (let i = 0; i < 4; i++) {
        const pz = z - 12 + i * 8;
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: s * 14.6, y: 1.15, z: pz }, 4);
        c.vc.cone(1.5, 0.5, ['#c98f3a', '#f4f1ea', '#8a5a2b', '#2d3c73'][i]!, { x: s * 14.6, y: 2.4, z: pz }, 8);
      }
      FLORA.baobab!(c, s * 40, z + 18);
      FLORA.neem!(c, s * 12.6, z + 22);
      board(c, 'bauchi-market', 'GRAIN & PRODUCE MARKET', DARK, '#fff1cf', 9.4, 2.3, s * 11.4, 6.2, z - 19, -s * 1.5);
    }),

    /**
     * The reserve gate: two stout piers of stacked pale sandstone blocks with a plain lintel slab
     * and the board, a laterite track beyond, a low stone wall either side, a round rest shelter
     * and baobab and acacia shade. An open way: no barrier arm, no kiosk figure, no animals.
     */
    'bauchi.reserve-gate': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const gx = s * 15;
      for (const dz of [-5.5, 5.5]) {
        for (let k = 0; k < 5; k++) c.vc.box(2.4 - k * 0.1, 1.3, 2.4 - k * 0.1, k % 2 ? STONE : SAND, { x: gx, y: 0.65 + k * 1.3, z: z + dz });
      }
      c.vc.box(2.4, 1.1, 14, STONE, { x: gx, y: 7.0, z });
      c.vc.box(2.7, 0.3, 14.4, ROCK, { x: gx, y: 7.7, z });
      board(c, 'reserve-gate', 'YANKARI RESERVE GATE', '#56665a', '#f4f1ea', 8.2, 1.9, gx - s * 1.4, 7.0, z, -s * 1.57);
      c.vc.box(16, 0.08, 6, '#c07a4a', { x: s * 24, y: 0.04, z });
      c.vc.box(16, 0.08, 44, '#b36c3d', { x: s * 32, y: 0.04, z: z + 14 });
      for (const dz of [-12, 12]) for (let k = 0; k < 6; k++) c.vc.box(3.2, 0.9, 0.7, k % 2 ? SAND : STONE, { x: gx, y: 0.45 + (k >> 1) * 0.0, z: z + dz + (dz > 0 ? 1 : -1) * k * 1.4 });
      for (let i = 0; i < 4; i++) FLORA.acacia!(c, s * (22 + (i % 2) * 8), z - 14 + i * 9);
      FLORA.baobab!(c, s * 38, z - 18);
      FLORA.baobab!(c, s * 44, z + 20);
      c.vc.cyl(2.0, 2.0, 0.2, '#8e8a84', { x: s * 22, y: 0.1, z: z - 16 }, 8);
      c.vc.cone(2.8, 1.6, '#a88a4a', { x: s * 22, y: 2.8, z: z - 16 }, 8);
      for (const a of [0, 2.1, 4.2]) c.vc.cyl(0.06, 0.06, 2.0, '#5a3d24', { x: s * 22 + Math.cos(a) * 1.6, y: 1.1, z: z - 16 + Math.sin(a) * 1.6 }, 4);
    }),

    /**
     * The warm spring: a clear pale-teal pool inside a ring of sandstone blocks under a low stepped
     * cliff, a plank boardwalk and steps down to it, a few tall palms and two open rest shelters.
     * Nobody is bathing and nothing lives in the water.
     */
    'bauchi.warm-spring': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(22, 0.12, 20, WATER, { x: s * 34, y: 0.08, z: z + 2 });
      c.vc.box(22.8, 0.2, 20.8, '#d3c29c', { x: s * 34, y: 0.05, z: z + 2 });
      for (let i = 0; i < 5; i++) c.vc.box(8, 2.2 + i * 1.5, 38 - i * 5, i % 2 ? STONE : SAND, { x: s * (46 + i * 5), y: (2.2 + i * 1.5) / 2, z: z + 2 });
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI;
        c.vc.sphere(0.8, i % 2 ? ROCK : SAND, { x: s * 34 - Math.cos(a) * 11.4, y: 0.35, z: z + 2 - Math.sin(a) * 10.4, sy: 0.6 }, 5);
      }
      c.vc.box(2.0, 0.16, 26, '#7a5a3a', { x: s * 18, y: 0.55, z: z + 2 });
      for (let k = 0; k < 6; k++) c.vc.box(1.8, 0.3, 1.0, '#8e8a84', { x: s * (21 + k * 1.6), y: 0.3 - k * 0.04, z: z + 14 });
      for (const [px, pz] of [[26, -10], [28, 14], [40, -12], [40, 16]] as const) FLORA.datepalm!(c, s * px, z + pz);
      for (const dz of [-8, 12]) {
        c.vc.cyl(2.0, 2.0, 0.2, '#8e8a84', { x: s * 22, y: 0.1, z: z + dz }, 8);
        c.vc.cone(2.8, 1.6, '#a88a4a', { x: s * 22, y: 2.8, z: z + dz }, 8);
        for (const a of [0, 2.1, 4.2]) c.vc.cyl(0.06, 0.06, 2.0, '#5a3d24', { x: s * 22 + Math.cos(a) * 1.6, y: 1.1, z: z + dz + Math.sin(a) * 1.6 }, 4);
      }
      FLORA.scrub!(c, s * 14, z - 6);
      board(c, 'warm-spring', 'WIKKI WARM SPRING', '#56665a', '#f4f1ea', 7.4, 1.9, s * 11.4, 4.8, z - 20, -s * 1.5);
    }),

    /**
     * One rebuilt city gateway: a wide arched passage in pale plaster with a band of relief
     * lozenges and a stepped parapet, short stubs of the old wall either side, and houses and
     * flat-roof shops crowding right up to both stubs. A bare rock hill stands behind, with a
     * water tank on a low stand on its crown. Nothing on the arch; no door leaf, flag or guard.
     */
    'bauchi.old-gate': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const gx = s * 16;
      for (const dz of [-8, 8]) {
        c.vc.box(3.6, 5.4, 9, PLASTER, { x: gx, y: 2.7, z: z + dz });
        c.vc.box(2.8, 1.6, 8.6, SAND, { x: gx, y: 6.2, z: z + dz });
        for (let k = 0; k < 4; k++) c.vc.box(1.4, 0.7, 1.4, SAND, { x: gx, y: 7.3, z: z + dz - 3 + k * 2 });
      }
      c.vc.box(3.6, 3.2, 7.6, PLASTER, { x: gx, y: 6.9, z });
      c.vc.box(2.8, 1.2, 7.4, SAND, { x: gx, y: 8.9, z });
      for (let k = 0; k < 5; k++) c.vc.box(1.2, 0.8, 1.2, SAND, { x: gx, y: 9.9, z: z - 3 + k * 1.5 });
      c.vc.cyl(2.6, 2.6, 3.8, PLASTER, { x: gx, y: 3.8, z, rz: Math.PI / 2 }, 14);
      c.vc.cyl(2.1, 2.1, 4.0, '#2a1a10', { x: gx, y: 3.7, z, rz: Math.PI / 2 }, 14);
      c.vc.box(3.8, 2.4, 4.2, '#2a1a10', { x: gx, y: 1.2, z });
      for (let k = 0; k < 6; k++) c.vc.box(0.14, 0.34, 0.34, '#b98a6e', { x: gx - s * 1.85, y: 8.0, z: z - 3 + k * 1.2 });
      for (let i = 0; i < 5; i++) {
        const zi = z - 18 + i * 9 + (i > 2 ? 4 : 0);
        c.vc.box(5, 3.2 + (i % 2) * 2.4, 5.4, [PLASTER, SAND, '#d9c3a0'][i % 3]!, { x: s * (21 + (i % 2) * 5), y: (3.2 + (i % 2) * 2.4) / 2, z: zi });
        c.vc.box(5.4, 0.3, 5.8, '#8f8b82', { x: s * (21 + (i % 2) * 5), y: 3.3 + (i % 2) * 2.4, z: zi, rz: s * 0.06 });
        c.vc.box(0.12, 1.8, 2.0, '#2a1f17', { x: s * (18.4 + (i % 2) * 5), y: 1.1, z: zi });
      }
      c.vc.cap(1, Math.PI / 2, ROCK, { x: s * 58, y: -1, z: z + 4, sx: 24, sy: 16, sz: 14 }, 12);
      for (let i = 0; i < 5; i++) c.vc.sphere(1.0 + (i % 3) * 0.5, i % 2 ? '#8d8a84' : '#a39f96', { x: s * (42 + (i % 3) * 3.6), y: 0.9, z: z - 4 + i * 3.2, sy: 0.8 }, 6);
      c.vc.cyl(1.3, 1.3, 1.6, '#b9bec0', { x: s * 58, y: 15.4, z: z + 4 }, 8);
      for (const dx of [-0.8, 0.8]) c.vc.cyl(0.08, 0.08, 1.2, '#6a6258', { x: s * 58 + dx, y: 14.2, z: z + 4 }, 4);
      FLORA.neem!(c, s * 13, z - 22);
      FLORA.baobab!(c, s * 34, z + 22);
      board(c, 'old-gate', 'OLD CITY GATE', DARK, '#fff1cf', 6.4, 1.8, gx - s * 2.2, 11.2, z, -s * 1.57);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'bauchi.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'bauchi-stadium', name: 'TOWNSHIP STADIUM', bg: DARK, fg: '#fff1cf', stand: '#cdb88f', roof: '#a8adb0', gate: PLASTER });
      FLORA.neem!(c, s * 14.5, c.zMid - 22);
      FLORA.baobab!(c, s * 14.5, c.zMid + 25);
      FLORA.boulder!(c, s * 15, c.zMid + 10);
    }),
  });
}
