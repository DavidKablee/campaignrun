import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, piece, sideOf, stadiumBlock } from './common';

/**
 * Abia's set pieces (docs/research/states/abia.md), original stylised models: a shoe-cluster
 * market of low open sheds with racks, sewing tables and handcarts of boxes, a covered fabric
 * market with hanging rolls, a clear blue river landing on white sand, a wide concrete drain
 * channel with a plain footbridge and a township stadium. Wet grey-red earth, shed zinc and
 * river blue; no brand, market name, deity, statue, flag or flooded-street scene anywhere.
 */
const CREAM = '#ece4cd';
const GREEN = '#b8c8a4';
const TAN = '#9a6a3c';
const DEEP = '#3a3f46';
const BLOCK = '#bdb7a6';
const ZINC = '#98948a';

const SHOE = ['#8a5a3a', '#2f3a44', '#c9b58a', '#a8553b', '#e4dcc6', '#5a4a38'];

export function registerAbiaPieces() {
  registerPieces({
    /**
     * A shoe cluster: two ranges of low open sheds with saw-tooth zinc roofs, each bay with a
     * rack of coloured shoes, a sewing table and a stack of boxes; handcarts of boxes in the
     * lane between them and a few parasols at the kerb. Goods only: no brand, no figure.
     */
    'abia.shoe-cluster': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let row = 0; row < 2; row++) {
        const x = s * (18 + row * 11);
        c.vc.box(6.6, 0.3, 36, '#7a6a58', { x, y: 0.15, z });
        c.vc.box(6.4, 2.6, 0.3, row ? '#d8cfb4' : CREAM, { x, y: 1.5, z: z - 18.2 });
        for (let i = 0; i < 6; i++) {
          const bz = z - 15 + i * 6;
          c.vc.prism(6.8, 1.1, 5.8, i % 2 ? '#8f8b82' : ZINC, { x, y: 3.1, z: bz });
          for (const dz of [-2.8, 2.8]) c.vc.cyl(0.07, 0.07, 2.6, '#5a4a38', { x: x + 3, y: 1.3, z: bz + dz }, 4);
          c.vc.box(0.3, 1.5, 3.4, '#7a5a3a', { x: x - 2.6, y: 1.0, z: bz });
          for (let k = 0; k < 6; k++) c.vc.box(0.35, 0.18, 0.5, SHOE[(k + i + row) % SHOE.length]!, { x: x - 2.4, y: 0.5 + (k >> 1) * 0.42, z: bz - 1.2 + (k % 2) * 0.9 + (k >> 2) * 0.3 });
          c.vc.box(1.3, 0.08, 0.8, '#6a4a2a', { x: x, y: 0.8, z: bz + 1.2 });
          c.vc.cyl(0.18, 0.18, 0.1, '#3a3a3c', { x: x + 0.3, y: 0.95, z: bz + 1.2 }, 6);
          for (let k = 0; k < 3; k++) c.vc.box(0.7, 0.4, 0.5, '#cbb48a', { x: x + 1.6, y: 0.4 + k * 0.4, z: bz - 0.8 });
        }
      }
      for (let i = 0; i < 2; i++) {
        const cz = z - 6 + i * 14;
        c.vc.box(1.1, 0.14, 2.0, '#7a5a3a', { x: s * 13.2, y: 0.6, z: cz });
        for (let k = 0; k < 4; k++) c.vc.box(0.8, 0.5, 0.5, SHOE[(k + 2) % SHOE.length]!, { x: s * 13.2, y: 0.95 + (k >> 1) * 0.5, z: cz - 0.5 + (k % 2) * 0.9 });
        for (const dx of [-0.55, 0.55]) c.vc.cyl(0.38, 0.38, 0.1, '#1a1a1a', { x: s * 13.2 + dx, y: 0.38, z: cz, rz: Math.PI / 2 }, 8);
      }
      for (const [k, pz] of [[0, -16], [1, 16]] as const) {
        c.vc.cyl(0.04, 0.04, 2.3, '#5a4a38', { x: s * 12.4, y: 1.15, z: z + pz }, 4);
        c.vc.cone(1.5, 0.5, [TAN, '#3f6b5a'][k]!, { x: s * 12.4, y: 2.4, z: z + pz }, 8);
      }
      FLORA.oilpalm!(c, s * 40, z - 18);
      FLORA.mango!(c, s * 40, z + 16);
      board(c, 'abia-shoes', 'SHOE CLUSTER', DEEP, '#f4e6c8', 6.8, 1.9, s * 11.4, 5.2, z - 22, -s * 1.5);
    }),

    /**
     * A fabric market: one long two-storey gallery with an open arcade below and a balcony rail,
     * rolls of cloth standing and hanging in many colours, stacks of bales, a row of tailors'
     * tables under the arcade and a street-side awning. Cloth only: no pattern with words.
     */
    'abia.fabric-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const x = s * 21;
      c.vc.box(8, 7.2, 38, CREAM, { x: x + s * 1.5, y: 3.6, z });
      c.vc.box(8.4, 0.5, 38.4, '#8f8a7e', { x: x + s * 1.5, y: 7.4, z });
      c.vc.box(0.3, 2.9, 36, GREEN, { x: s * 17.1, y: 5.6, z });
      c.vc.box(0.3, 1.0, 36, '#6a6a68', { x: s * 17.0, y: 4.0, z });
      for (let i = 0; i < 9; i++) c.vc.box(0.5, 3.6, 0.5, '#bdb7a6', { x: s * 17.2, y: 1.8, z: z - 17 + i * 4.25 });
      c.vc.box(3.4, 0.12, 36, '#c4bfae', { x: s * 15.6, y: 3.6, z });
      const colors = ['#2f6e6a', '#e8dcc0', '#9a3f6a', '#c98f3a', '#3b4f8a', '#4a8a4a', '#d8d0b4', '#a8553b'];
      for (let i = 0; i < 16; i++) c.vc.cyl(0.3, 0.3, 1.5, colors[i % colors.length]!, { x: s * (14.6 + (i % 2) * 0.8), y: 0.75, z: z - 17 + i * 2.2 }, 7);
      for (let i = 0; i < 8; i++) c.vc.box(0.5, 2.0, 0.08, colors[(i + 3) % colors.length]!, { x: s * 15.0, y: 2.7, z: z - 15 + i * 4.2 });
      for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) c.vc.box(1.3, 0.6, 1.0, colors[(i + k * 2) % colors.length]!, { x: s * 14.4, y: 0.3 + k * 0.6, z: z - 14 + i * 9.5 });
      for (let i = 0; i < 4; i++) {
        c.vc.box(1.4, 0.08, 0.9, '#6a4a2a', { x: s * 13.0, y: 0.8, z: z - 12 + i * 8 });
        c.vc.cyl(0.18, 0.18, 0.1, '#3a3a3c', { x: s * 13.2, y: 0.95, z: z - 12 + i * 8 }, 6);
      }
      FLORA.oilpalm!(c, s * 40, z - 18);
      FLORA.mango!(c, s * 40, z + 18);
      board(c, 'abia-fabric', 'FABRIC MARKET', DEEP, '#f4e6c8', 7.0, 1.9, s * 11.4, 5.6, z - 22, -s * 1.5);
    }),

    /**
     * A blue river landing: clear light-blue water over a white sandy bed, white sand banks, a
     * short plank landing with two dugout canoes, a wooded hill rising beyond, oil palms and
     * raffia on the bank. A plain tourist landing: no shrine, figure or sign of rapids danger.
     */
    'abia.blue-river': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(44, 0.12, 56, '#5fb0c8', { x: s * 46, y: 0.05, z });
      c.vc.box(44.6, 0.05, 56.6, '#e8e4d0', { x: s * 46, y: 0.02, z });
      for (const [bx, bz, bw] of [[24, -14, 8], [28, 16, 10], [62, -8, 9]] as const) c.vc.box(bw, 0.2, bw * 0.7, '#ece6d2', { x: s * bx, y: 0.12, z: z + bz });
      c.vc.box(9, 0.9, 54, '#8aa05c', { x: s * 17, y: 0.4, z, rz: s * 0.12 });
      c.vc.box(2.2, 0.16, 16, '#7a5a3a', { x: s * 30, y: 0.5, z: z + 2 });
      for (let i = 0; i < 6; i++) for (const dz of [-1, 1]) c.vc.cyl(0.1, 0.1, 1.1, '#5a3d24', { x: s * 30 + dz * 0.9, y: 0.25, z: z - 5 + i * 3 }, 4);
      for (let i = 0; i < 2; i++) {
        c.vc.box(1.0, 0.5, 6, i ? '#c98f3a' : '#3b6a8a', { x: s * (33 + i * 3), y: 0.35, z: z - 10 + i * 20, ry: 0.15 });
        c.vc.cone(0.5, 1.2, i ? '#c98f3a' : '#3b6a8a', { x: s * (33 + i * 3), y: 0.35, z: z - 6.6 + i * 20, rx: Math.PI / 2 }, 4);
      }
      c.vc.cap(1, Math.PI / 2, '#5f7a46', { x: s * 74, y: 0, z: z - 4, sx: 26, sy: 20, sz: 22 }, 10);
      for (let i = 0; i < 6; i++) c.vc.sphere(2.2, i % 2 ? '#3f6b3a' : '#4a7a42', { x: s * (66 + (i % 3) * 8), y: 7 + (i >> 1) * 3.5, z: z - 12 + i * 4, sy: 0.8 }, 5);
      FLORA.oilpalm!(c, s * 14, z - 20);
      FLORA.raffia!(c, s * 14.5, z + 12);
      FLORA.oilpalm!(c, s * 15, z + 24);
      board(c, 'blue-river', 'BLUE RIVER LANDING', DEEP, '#e8f4f8', 7.4, 1.8, s * 11.4, 4.8, z - 25, -s * 1.5);
    }),

    /**
     * A drain channel: a wide concrete-lined channel running away from the road with shallow
     * grey water, concrete walls with rail posts, a plain footbridge on piers across it near the
     * road and low sheds either side. A drainage feature only: no flood, no stranded car or house.
     */
    'abia.flood-channel': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(46, 0.1, 13, '#7a8a86', { x: s * 38, y: 0.1, z });
      for (const e of [-1, 1]) {
        c.vc.box(46, 1.6, 0.8, '#b8b4a8', { x: s * 38, y: 0.8, z: z + e * 7.2 });
        for (let i = 0; i < 9; i++) c.vc.cyl(0.05, 0.05, 0.9, '#6a6a68', { x: s * (17 + i * 5), y: 2.0, z: z + e * 7.2 }, 4);
        c.vc.box(46, 0.08, 0.1, '#6a6a68', { x: s * 38, y: 2.4, z: z + e * 7.2 });
      }
      c.vc.box(5, 0.6, 16.4, '#c9c5b8', { x: s * 24, y: 2.6, z });
      for (const e of [-1, 1]) c.vc.box(0.25, 0.9, 16.4, '#9a958a', { x: s * 24 + e * 2.4, y: 3.35, z });
      for (const e of [-1, 1]) c.vc.box(3.2, 2.6, 1.2, '#b5ae9e', { x: s * 24, y: 1.3, z: z + e * 6.4 });
      for (let i = 0; i < 3; i++) for (const e of [-1, 1]) {
        c.vc.box(5.2, 2.6, 6, [CREAM, GREEN, '#d8cfb4'][i]!, { x: s * (30 + i * 8), y: 1.3, z: z + e * 14 });
        c.vc.prism(5.8, 1.0, 6.8, i % 2 ? ZINC : '#8f8b82', { x: s * (30 + i * 8), y: 3.1, z: z + e * 14 });
      }
      for (let i = 0; i < 5; i++) c.vc.sphere(0.5, '#7a8f6a', { x: s * (18 + i * 6), y: 0.4, z: z + (i % 2 ? 4.8 : -4.8), sy: 0.5 }, 4);
      FLORA.oilpalm!(c, s * 14, z - 22);
      FLORA.raffia!(c, s * 14, z + 22);
      board(c, 'flood-channel', 'DRAIN CHANNEL', DEEP, '#f2eed8', 6.4, 1.8, s * 11.4, 4.6, z - 24, -s * 1.5);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'abia.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'abia-stadium', name: 'TOWNSHIP STADIUM', bg: DEEP, fg: '#f4f1ea', stand: BLOCK, roof: '#a8adb0', gate: CREAM });
      FLORA.oilpalm!(c, s * 14.5, c.zMid - 22);
      FLORA.mango!(c, s * 14.5, c.zMid + 24);
    }),
  });
}
