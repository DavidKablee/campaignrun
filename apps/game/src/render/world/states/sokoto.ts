import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, piece, sideOf, stadiumBlock } from './common';

/**
 * Sokoto's set pieces (docs/research/states/sokoto.md), original stylised models: a grain and
 * onion market of two facing rows of low tin-roofed counters, a leather row of hides on drying
 * racks beside dye tubs, a long beam bridge over a wide low river with a shadoof and onion
 * plots, a squat plaster gate arch on a round island and a township stadium. Pale sand, plaster,
 * tan and red leather, river-silt green; no palace, mosque, minaret, dome, uniform, tannery pit
 * or flag anywhere.
 */
const PLASTER = '#ead9bd';
const SAND = '#d2b98c';
const BROWN = '#7a4a2b';
const TAN = '#c08a52';
const RED = '#9a3f2e';
const SLATE = '#4f5a60';
const SILT = '#8e9a6a';

export function registerSokotoPieces() {
  registerPieces({
    /**
     * A grain and onion market: two facing rows of low counters under sloped tin roofs, heaps of
     * millet and sorghum, net bags of onions and garlic, stacked basins, a sack stack and a
     * hand cart, with a plain pole-and-sheet shade between the rows.
     */
    'sokoto.grain-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const heaps = ['#d6bd7a', '#c9a76a', '#a8884a', '#b8864a'];
      const bags = ['#8a4a5a', '#c9a45a', '#a85a3a', '#d8c9a0'];
      for (let row = 0; row < 2; row++) {
        const x = s * (15.5 + row * 8.5);
        for (let i = 0; i < 5; i++) {
          const zi = z - 16 + i * 8;
          for (const dz of [-3, 3]) c.vc.cyl(0.05, 0.05, 2.4, '#5a3d24', { x: x - s * 1.2, y: 1.2, z: zi + dz }, 4);
          c.vc.box(3.4, 0.1, 7.6, row ? '#8f8b82' : '#a39d92', { x, y: 2.5, z: zi, rz: s * 0.1 });
          c.vc.box(2.6, 0.7, 7.2, '#7a5a3a', { x: x + s * 0.4, y: 0.35, z: zi });
          for (let k = 0; k < 4; k++) c.vc.cone(0.62, 0.55, heaps[(k + i + row) % 4]!, { x: x + s * 0.4, y: 0.95, z: zi - 2.7 + k * 1.8 }, 6);
          if (i % 2 === 0) for (let k = 0; k < 3; k++) c.vc.sphere(0.34, bags[(k + i) % 4]!, { x: x - s * 0.4 + k * 0.3, y: 0.5 + k * 0.1, z: zi + 3.9, sy: 0.9 }, 5);
        }
      }
      for (let i = 0; i < 3; i++) c.vc.cyl(0.04, 0.04, 2.6, '#5a3d24', { x: s * 12.6, y: 1.3, z: z - 12 + i * 12 }, 4);
      c.vc.box(0.06, 1.0, 26, '#e8e2d0', { x: s * 12.6, y: 2.5, z, rz: s * 0.2 });
      for (let i = 0; i < 4; i++) c.vc.cyl(0.36, 0.28, 0.2, i % 2 ? '#c9a45a' : '#a8b4b0', { x: s * 13.4, y: 0.2 + (i % 2) * 0.2, z: z + 14 + (i >> 1) * 0.8 }, 8);
      c.vc.box(1.0, 0.14, 2.0, '#7a5a3a', { x: s * 13.2, y: 0.6, z: z - 20 });
      for (const dx of [-0.55, 0.55]) c.vc.cyl(0.38, 0.38, 0.1, '#1a1a1a', { x: s * 13.2 + dx, y: 0.38, z: z - 20, rz: Math.PI / 2 }, 8);
      FLORA.neem!(c, s * 34, z - 18);
      FLORA.datepalm!(c, s * 36, z + 18);
      board(c, 'sokoto-market', 'GRAIN MARKET', BROWN, '#fff1cf', 7.4, 2.0, s * 11.4, 5.8, z - 21, -s * 1.5);
    }),

    /**
     * A leather row: pole racks hung with flat red and tan hides, round dye tubs, low stalls under
     * matting with stacked bags and poufs, a pale wall behind. Finished goods only: no tannery pit,
     * no vat of liquid, nobody working.
     */
    'sokoto.leather-row': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(3, 5, 36, PLASTER, { x: s * 30, y: 2.5, z });
      c.vc.box(3.4, 0.5, 36.4, SAND, { x: s * 30, y: 5.2, z });
      for (let r = 0; r < 2; r++) {
        const x = s * (15.5 + r * 6);
        for (const dz of [-15, -5, 5, 15]) c.vc.cyl(0.07, 0.07, 3.0, '#5a3d24', { x, y: 1.5, z: z + dz }, 4);
        c.vc.box(0.12, 0.12, 31, '#5a3d24', { x, y: 3.0, z });
        for (let i = 0; i < 9; i++) c.vc.box(0.06, 1.6 + (i % 3) * 0.2, 1.2, i % 3 === 0 ? RED : i % 3 === 1 ? TAN : BROWN, { x, y: 2.1, z: z - 14 + i * 3.5, rz: (i % 2 ? 0.05 : -0.05) });
      }
      for (let i = 0; i < 4; i++) {
        const tz = z - 12 + i * 8;
        c.vc.cyl(0.9, 0.8, 0.9, i % 2 ? '#8a4a3a' : '#6a4a32', { x: s * 24, y: 0.45, z: tz }, 10);
        c.vc.cyl(0.74, 0.74, 0.06, i % 2 ? RED : '#b87a4a', { x: s * 24, y: 0.9, z: tz }, 10);
      }
      for (let i = 0; i < 3; i++) {
        const sz = z - 8 + i * 8;
        for (const dz of [-2, 2]) c.vc.cyl(0.05, 0.05, 2.4, '#5a3d24', { x: s * 27, y: 1.2, z: sz + dz }, 4);
        c.vc.box(2.4, 0.08, 4.4, '#c9b58a', { x: s * 27, y: 2.5, z: sz, rz: s * 0.08 });
        c.vc.box(1.8, 0.5, 3.6, '#7a5a3a', { x: s * 27.4, y: 0.25, z: sz });
        for (let k = 0; k < 3; k++) c.vc.cyl(0.34, 0.34, 0.34, k % 2 ? TAN : RED, { x: s * 27.4, y: 0.7, z: sz - 1.2 + k * 1.2 }, 8);
      }
      FLORA.datepalm!(c, s * 40, z - 20);
      FLORA.neem!(c, s * 13.2, z + 20);
      board(c, 'leather-row', 'LEATHER ROW', BROWN, '#fff1cf', 6.4, 1.9, s * 11.4, 5.0, z - 20, -s * 1.5);
    }),

    /**
     * The river bridge: a long low beam deck with plain rails on square piers along the road side,
     * a wide shallow river of pale water with sandbars, onion plots on the near bank and a shadoof
     * (pole, counterweight and bucket) at the edge. No boat, no person on the deck.
     */
    'sokoto.river-bridge': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(46, 0.12, 54, '#8fa8a6', { x: s * 52, y: 0.06, z });
      for (const [bx, bz, bw] of [[44, -10, 14], [58, 14, 12], [70, -4, 10]] as const) c.vc.box(bw, 0.2, bw * 0.8, '#d8c9a0', { x: s * bx, y: 0.14, z: z + bz });
      c.vc.box(9, 0.9, 50, '#cfc9b8', { x: s * 24, y: 4.4, z });
      for (const e of [-1, 1]) c.vc.box(0.3, 0.9, 50, '#9a958a', { x: s * 24 + e * 4.4, y: 5.25, z });
      for (let i = 0; i < 5; i++) {
        const pz = z - 20 + i * 10;
        for (const dx of [-2.6, 2.6]) c.vc.box(1.4, 4.4, 1.4, '#b5ae9e', { x: s * 24 + dx, y: 2.2, z: pz });
        c.vc.box(7.4, 0.7, 1.8, '#a39d92', { x: s * 24, y: 3.9, z: pz });
      }
      for (let row = 0; row < 3; row++) c.vc.box(5, 0.14, 38, row % 2 ? '#8c9a5b' : SILT, { x: s * (14.5 + row * 4.4), y: 0.1, z: z + 2 });
      for (let i = 0; i < 6; i++) c.vc.sphere(0.3, '#8a4a5a', { x: s * 15 + (i % 2) * 0.9, y: 0.3, z: z - 12 + i * 4.4, sy: 0.7 }, 5);
      c.vc.cyl(0.08, 0.1, 4.0, '#5a3d24', { x: s * 33, y: 2.0, z: z + 14 }, 4);
      c.vc.box(0.08, 0.08, 4.6, '#5a3d24', { x: s * 33, y: 4.0, z: z + 14, rx: 0.2 });
      c.vc.sphere(0.5, '#6a6258', { x: s * 33, y: 4.5, z: z + 16.2, sy: 0.8 }, 5);
      c.vc.cyl(0.24, 0.2, 0.4, '#8a8f99', { x: s * 33, y: 3.4, z: z + 11.8 }, 6);
      FLORA.datepalm!(c, s * 12.4, z - 22);
      FLORA.reedbed!(c, s * 40, z + 22);
      board(c, 'sokoto-bridge', 'RIVER BRIDGE', SLATE, '#f4f1ea', 6.2, 1.8, s * 11.4, 4.8, z - 24, -s * 1.5);
    }),

    /**
     * A city gate on a round island: a squat plaster arch with a band of relief lozenges and a
     * stepped crest standing in a ring of planted beds, two short stubs of wall either side and
     * plain lamp posts. A symbolic gate only: no door leaf, no guard, no flag, no palace behind.
     */
    'sokoto.city-gate': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 26;
      c.vc.cyl(10, 10, 0.3, '#4f5558', { x: cx, y: 0.1, z }, 20);
      c.vc.cyl(8.6, 8.6, 0.6, '#cfc9b8', { x: cx, y: 0.3, z }, 20);
      c.vc.cyl(7.6, 7.6, 0.7, '#a8a86a', { x: cx, y: 0.35, z }, 20);
      for (const dz of [-3.6, 3.6]) {
        c.vc.box(3.0, 6.4, 2.4, PLASTER, { x: cx, y: 3.4, z: z + dz });
        c.vc.box(2.4, 0.6, 2.0, SAND, { x: cx, y: 6.9, z: z + dz });
        for (const k of [-0.7, 0.7]) c.vc.cone(0.4, 1.2, SAND, { x: cx, y: 7.8, z: z + dz + k }, 5);
      }
      c.vc.box(3.0, 2.4, 9.6, PLASTER, { x: cx, y: 7.4, z });
      c.vc.box(2.4, 0.8, 9.2, SAND, { x: cx, y: 8.9, z });
      for (let k = 0; k < 5; k++) c.vc.box(1.1, 0.8, 1.1, SAND, { x: cx, y: 9.7, z: z - 3.6 + k * 1.8 });
      for (let k = 0; k < 7; k++) c.vc.box(0.14, 0.34, 0.34, '#b98a6e', { x: cx - s * 1.55, y: 7.6, z: z - 3.6 + k * 1.2 });
      c.vc.cyl(2.2, 2.2, 3.2, PLASTER, { x: cx, y: 5.2, z, rz: Math.PI / 2 }, 14);
      c.vc.cyl(1.8, 1.8, 3.4, '#2a1a10', { x: cx, y: 5.0, z, rz: Math.PI / 2 }, 14);
      c.vc.box(3.2, 3.6, 3.6, '#2a1a10', { x: cx, y: 1.8, z });
      for (const dz of [-9, 9]) {
        c.vc.box(2.4, 3.4, 5, PLASTER, { x: cx, y: 1.7, z: z + dz });
        c.vc.box(2.8, 0.4, 5.4, SAND, { x: cx, y: 3.6, z: z + dz });
      }
      for (let i = 0; i < 4; i++) {
        const a = Math.PI * 0.55 + i * 0.55;
        c.vc.cyl(0.07, 0.09, 5.4, '#7a7a76', { x: cx - s * Math.cos(a) * 9.4, y: 2.7, z: z + Math.sin(a) * 9.4 }, 5);
        c.vc.box(1.0, 0.1, 0.6, '#2f3a44', { x: cx - s * Math.cos(a) * 9.4, y: 5.5, z: z + Math.sin(a) * 9.4 });
      }
      FLORA.datepalm!(c, s * 13, z - 14);
      FLORA.neem!(c, s * 13.4, z + 16);
      board(c, 'sokoto-gate', 'CITY GATE', BROWN, '#fff1cf', 5.6, 1.7, cx - s * 3.2, 11.0, z, -s * 1.57);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'sokoto.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'sokoto-stadium', name: 'TOWNSHIP STADIUM', bg: BROWN, fg: '#fff1cf', stand: '#d3bd92', roof: '#a8adb0', gate: PLASTER });
      FLORA.neem!(c, s * 14.5, c.zMid - 22);
      FLORA.datepalm!(c, s * 14.5, c.zMid + 25);
    }),
  });
}
