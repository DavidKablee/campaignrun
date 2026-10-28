import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, flyoverDeck, piece, sideOf, stadiumBlock } from './common';

/**
 * Akwa Ibom's set pieces (docs/research/states/akwa-ibom.md), original stylised models: a crowded
 * market of parasol stalls under a flyover, a roundabout plaza with a fountain basin and an open
 * arena of steps, a white-sand beach with fishing canoes under a mangrove line, a roadside row of
 * raffia cane furniture and mats, and a township stadium. Clean pale blocks, raffia straw, deep
 * green and white sand; no oil rig, flare, tanker, flag, statue, church or uniform anywhere.
 */
const CREAM = '#ebe4d2';
const BLOCK = '#bdb7a6';
const STRAW = '#b89c5a';
const TEAL = '#2f6e6a';
const DEEP = '#2e5a48';
const SAND = '#eadfc4';

export function registerAkwaIbomPieces() {
  registerPieces({
    /**
     * A crowded market: rows of parasol stalls with basins and bagged goods, roadside stalls set
     * right up to the kerb, hand carts, a plain flyover deck on piers behind and a board.
     */
    'akwa-ibom.itam-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const umb = ['#c98f3a', '#f4f1ea', '#2a6f73', '#a8553b', '#6a7fa0', '#8a9a5a'];
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 5; i++) {
          const px = s * (13.4 + row * 4.2);
          const pz = z - 16 + i * 8 + (row % 2) * 2;
          c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: px, y: 1.15, z: pz }, 4);
          c.vc.cone(1.6, 0.5, umb[(i + row * 2) % 6]!, { x: px, y: 2.4, z: pz }, 8);
          c.vc.box(1.8, 0.7, 1.2, '#7a5a3a', { x: px, y: 0.35, z: pz });
          for (let k = 0; k < 3; k++) c.vc.cyl(0.26, 0.22, 0.26, k % 2 ? '#c9a45a' : '#a8b4b0', { x: px - 0.5 + k * 0.5, y: 0.85, z: pz }, 7);
        }
      }
      for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) c.vc.box(0.5, 0.35, 0.8, k % 2 ? '#c9b58a' : '#b79a6c', { x: s * 12.4, y: 0.2 + (k >> 1) * 0.35, z: z - 18 + i * 12 + (k % 2) * 0.9 });
      for (let i = 0; i < 2; i++) {
        c.vc.box(1.0, 0.14, 2.0, '#7a5a3a', { x: s * 12.2, y: 0.6, z: z - 10 + i * 16 });
        for (const dx of [-0.55, 0.55]) c.vc.cyl(0.38, 0.38, 0.1, '#1a1a1a', { x: s * 12.2 + dx, y: 0.38, z: z - 10 + i * 16, rz: Math.PI / 2 }, 8);
      }
      flyoverDeck(c, s * 44, z, 44, 7.2, '#cfc9b8', '#8f8a7e');
      c.vc.box(10, 8, 9, CREAM, { x: s * 27, y: 4, z: z - 20 });
      c.vc.box(10, 6, 9, BLOCK, { x: s * 27, y: 3, z: z + 20 });
      FLORA.oilpalm!(c, s * 34, z + 2);
      board(c, 'itam-market', 'ITAM MARKET', DEEP, '#f4f1ea', 7, 2.0, s * 11.4, 5.4, z - 20, -s * 1.5);
    }),

    /**
     * The plaza roundabout: a round raised island with a fountain basin and three plain jets, a
     * ring of planted beds, an open half-circle of steps for events, lamp posts and pale blocks
     * around it. No statue, flag or figure.
     */
    'akwa-ibom.ibom-plaza': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 27;
      c.vc.cyl(10.5, 10.5, 0.3, '#4f5558', { x: cx, y: 0.1, z }, 22);
      c.vc.cyl(9.2, 9.2, 0.6, '#cfc9b8', { x: cx, y: 0.3, z }, 22);
      c.vc.cyl(8.2, 8.2, 0.7, '#7fa05a', { x: cx, y: 0.35, z }, 22);
      c.vc.cyl(3.6, 3.6, 0.9, '#cfc9b8', { x: cx, y: 0.8, z }, 16);
      c.vc.cyl(3.1, 3.1, 0.7, '#8fc2c0', { x: cx, y: 1.0, z }, 16);
      for (const a of [0, 2.09, 4.19]) {
        c.vc.cyl(0.12, 0.16, 2.8, '#d8ecec', { x: cx + Math.cos(a) * 1.4, y: 2.2, z: z + Math.sin(a) * 1.4 }, 5);
        c.vc.cone(0.4, 0.8, '#e8f4f4', { x: cx + Math.cos(a) * 1.4, y: 3.7, z: z + Math.sin(a) * 1.4 }, 5);
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        c.vc.cyl(0.9, 0.9, 0.5, ['#d98a3a', '#d8c24a', '#c9506a', '#e8e4d0'][i % 4]!, { x: cx + Math.cos(a) * 6.2, y: 0.95, z: z + Math.sin(a) * 6.2 }, 7);
      }
      for (let k = 0; k < 4; k++) c.vc.box(3.0, 0.4, 24 - k * 3.2, k % 2 ? BLOCK : '#cfc9b8', { x: s * (47 + k * 2.2), y: 0.2 + k * 0.4, z });
      for (let i = 0; i < 4; i++) {
        c.vc.cyl(0.07, 0.09, 5.6, '#7a7a76', { x: s * 12.4, y: 2.8, z: z - 18 + i * 12 }, 5);
        c.vc.box(1.0, 0.1, 0.6, '#2f3a44', { x: s * 12.4, y: 5.7, z: z - 18 + i * 12 });
      }
      c.vc.box(9, 11, 9, CREAM, { x: s * 20, y: 5.5, z: z - 22 });
      c.vc.box(3.2, 11, 3.2, '#9db2b0', { x: s * 15.6, y: 5.5, z: z - 26.4 });
      c.vc.box(9, 8, 9, BLOCK, { x: s * 20, y: 4, z: z + 22 });
      FLORA.oilpalm!(c, s * 14, z + 12);
      board(c, 'ibom-plaza', 'IBOM PLAZA', TEAL, '#f4f1ea', 6.2, 1.8, cx - s * 3.4, 5.6, z - 11, s * 0.9);
    }),

    /**
     * The beach: a wide strip of white sand with low surf lines, a mangrove edge behind, three
     * long fishing canoes drawn up on the sand, a net-drying rack, two thatch shelters and palms.
     * Fishing craft only: no rig, no flare, no tanker, no sheen on the water.
     */
    'akwa-ibom.ibeno-beach': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(30, 0.1, 54, SAND, { x: s * 28, y: 0.05, z });
      c.vc.box(26, 0.12, 54, '#9ec7cc', { x: s * 56, y: 0.07, z });
      for (let i = 0; i < 4; i++) c.vc.box(0.5, 0.14, 50, '#f4f8f6', { x: s * (44 + i * 4), y: 0.12, z });
      for (let i = 0; i < 3; i++) {
        const cz = z - 14 + i * 14;
        c.vc.box(1.0, 0.5, 6.4, ['#c98f3a', '#3b6a8a', '#d9d4c2'][i]!, { x: s * 34, y: 0.35, z: cz, ry: 0.06 });
        c.vc.cone(0.5, 1.2, ['#c98f3a', '#3b6a8a', '#d9d4c2'][i]!, { x: s * 34, y: 0.35, z: cz + 3.7, rx: Math.PI / 2 }, 4);
      }
      for (const dz of [-4, 4]) c.vc.cyl(0.06, 0.06, 2.8, '#5a3d24', { x: s * 26, y: 1.4, z: z + dz }, 4);
      c.vc.box(0.06, 0.06, 8, '#5a3d24', { x: s * 26, y: 2.7, z });
      c.vc.box(0.05, 1.3, 7.6, '#8a9a8a', { x: s * 26, y: 2.0, z });
      for (const dz of [-14, 14]) {
        c.vc.cone(2.8, 1.6, '#a88a4a', { x: s * 19, y: 2.8, z: z + dz }, 8);
        for (const a of [0, 2.1, 4.2]) c.vc.cyl(0.06, 0.06, 2.0, '#5a3d24', { x: s * 19 + Math.cos(a) * 1.6, y: 1.1, z: z + dz + Math.sin(a) * 1.6 }, 4);
      }
      for (let i = 0; i < 5; i++) FLORA.mangrove!(c, s * (14 + (i % 2) * 2), z - 20 + i * 10);
      FLORA.raffia!(c, s * 16, z - 4);
      FLORA.oilpalm!(c, s * 22, z + 20);
      board(c, 'ibeno-beach', 'IBENO BEACH', TEAL, '#f4f1ea', 6.4, 1.9, s * 11.4, 4.8, z - 22, -s * 1.5);
    }),

    /**
     * The raffia craft row: a long open shed beside the road with a front line of cane chairs and
     * a settee, rolled mats and stacked baskets, bundles of raffia hung on a rack, and a stand of
     * raffia palms behind. Finished goods only.
     */
    'akwa-ibom.raffia-row': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(8, 0.3, 38, '#8f8a7e', { x: s * 19, y: 3.4, z, rz: s * 0.05 });
      for (let i = 0; i < 8; i++) for (const dx of [-3.6, 3.6]) c.vc.cyl(0.07, 0.07, 3.2, '#5a3d24', { x: s * 19 + dx, y: 1.6, z: z - 17 + i * 4.8 }, 4);
      c.vc.box(0.3, 3.2, 38, CREAM, { x: s * 22.8, y: 1.6, z });
      for (let i = 0; i < 6; i++) {
        const pz = z - 15 + i * 6;
        c.vc.box(1.2, 0.18, 1.2, STRAW, { x: s * 16.6, y: 0.5, z: pz });
        c.vc.box(1.2, 0.9, 0.16, STRAW, { x: s * 17.2, y: 0.95, z: pz });
        for (const dz of [-0.5, 0.5]) c.vc.box(0.12, 0.5, 0.12, '#7a5a3a', { x: s * 16.2, y: 0.25, z: pz + dz });
        c.vc.cyl(0.4, 0.4, 1.2, '#c9b074', { x: s * 14.4, y: 0.6, z: pz + 0.4 }, 8);
        c.vc.cone(0.5, 0.5, '#a8884a', { x: s * 14.4, y: 1.4, z: pz + 0.4, rx: Math.PI }, 8);
      }
      c.vc.box(2.6, 0.4, 5, STRAW, { x: s * 18, y: 0.5, z: z + 17 });
      c.vc.box(2.6, 1.0, 0.3, STRAW, { x: s * 19.2, y: 1.0, z: z + 17 });
      for (let i = 0; i < 4; i++) c.vc.cyl(0.35, 0.35, 2.4, '#c9b074', { x: s * 20.6, y: 0.4, z: z - 16 + i * 1.0, rx: Math.PI / 2 }, 7);
      c.vc.box(0.1, 0.1, 10, '#5a3d24', { x: s * 21.6, y: 2.6, z: z - 6 });
      for (let i = 0; i < 8; i++) c.vc.box(0.08, 1.2, 0.5, '#d8c88a', { x: s * 21.6, y: 1.9, z: z - 10 + i * 1.2 });
      for (let i = 0; i < 5; i++) FLORA.raffia!(c, s * (34 + (i % 2) * 5), z - 18 + i * 9);
      board(c, 'raffia-row', 'RAFFIA CRAFT ROW', DEEP, '#fff1cf', 8, 2.0, s * 11.4, 5.4, z - 22, -s * 1.5);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'akwa-ibom.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'akwa-ibom-stadium', name: 'TOWNSHIP STADIUM', bg: DEEP, fg: '#f4f1ea', stand: '#c4bfae', roof: '#a8adb0', gate: CREAM });
      FLORA.oilpalm!(c, s * 14.5, c.zMid - 22);
      FLORA.raffia!(c, s * 14.5, c.zMid + 24);
    }),
  });
}
