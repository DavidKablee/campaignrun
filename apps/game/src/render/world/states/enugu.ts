import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, piece, sideOf, stadiumBlock } from './common';

/**
 * Enugu's set pieces (docs/research/states/enugu.md), original stylised models: a hillside
 * market on stepped terraces, a long glazed sky bridge between bus terminals, a township
 * stadium, a tree-lined lake with lakeside huts and the rock-cut hairpin road under pines.
 * Whitewash, block grey, rust and green-grey zinc, coal charcoal; no cathedral, spire, cross,
 * dome, masquerade, memorial, mine mouth or flag anywhere.
 */
const CHARCOAL = '#34383b';
const WHITE = '#efe8d6';
const BLOCK = '#b2ac9c';
const OCHRE = '#c9a877';
const ZINC = '#7c8a84';
const RUST = '#8e5a3a';
const SLATE = '#4f6d85';
const SAND = '#cdb98f';

export function registerEnuguPieces() {
  registerPieces({
    /**
     * A hillside market: three blocks stacked up a wedge slope with tilted zinc roof slabs, a
     * cluster of parasols and basins on the flat below, a concrete stair and a board.
     */
    'enugu.market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let i = 0; i < 3; i++) {
        const h = 4 + i * 3.4;
        c.vc.box(8, h, 26, [WHITE, OCHRE, BLOCK][i]!, { x: s * (22 + i * 8), y: h / 2, z });
        c.vc.box(8.6, 0.2, 27, i % 2 ? RUST : ZINC, { x: s * (22 + i * 8), y: h + 0.2, z, rz: -s * 0.08 });
        for (let k = 0; k < 4; k++) c.vc.box(0.1, 1.6, 2.4, '#23262a', { x: s * (22 + i * 8 - 4.05), y: 1.1 + (i ? 1.2 : 0), z: z - 9 + k * 6 });
      }
      for (let k = 0; k < 8; k++) c.vc.box(1.4, 0.3, 1.2, BLOCK, { x: s * (14 + k * 1.0), y: 0.2 + k * 0.5, z: z + 15 });
      for (let i = 0; i < 6; i++) {
        const px = s * (13 + (i % 3) * 3.2);
        const pz = z - 9 + Math.floor(i / 3) * 7;
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: px, y: 1.15, z: pz }, 4);
        c.vc.cone(1.5, 0.5, [OCHRE, SLATE, WHITE, ZINC, RUST, CHARCOAL][i]!, { x: px, y: 2.4, z: pz }, 8);
        c.vc.box(1.3, 0.6, 0.9, '#7a5a3a', { x: px, y: 0.3, z: pz });
      }
      FLORA.mango!(c, s * 12, z + 18);
      FLORA.oilpalm!(c, s * 44, z - 17);
      board(c, 'hillside-market', 'HILLSIDE MARKET', CHARCOAL, '#f0e6d2', 8, 2.3, s * 11.2, 5.4, z - 14, -s * 1.5);
    }),

    /**
     * The sky bridge: a long glazed box on slim piers running along the road, a short span
     * crossing over the lanes at the head, two terminal slabs with sloped roofs and bus bays.
     */
    'enugu.skybridge': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const len = 36;
      c.vc.box(4.4, 3.4, len, '#9db2b0', { x: s * 17, y: 8.4, z });
      c.vc.box(4.6, 0.4, len + 0.4, CHARCOAL, { x: s * 17, y: 10.3, z });
      c.vc.box(4.6, 0.3, len + 0.4, BLOCK, { x: s * 17, y: 6.5, z });
      for (let i = 0; i < 5; i++) {
        const pz = z - len / 2 + (i / 4) * len;
        c.vc.box(1.0, 6.4, 1.2, BLOCK, { x: s * 17, y: 3.2, z: pz });
        for (let k = 0; k < 5; k++) c.vc.box(0.05, 2.6, 0.12, CHARCOAL, { x: s * 14.7, y: 8.4, z: pz - 3 + k * 1.5 });
      }
      c.vc.box(36, 3.0, 4.4, '#9db2b0', { x: 0, y: 9, z: z - len / 2 - 3 });
      c.vc.box(36, 0.3, 4.6, CHARCOAL, { x: 0, y: 10.6, z: z - len / 2 - 3 });
      for (const e of [-1, 1]) c.vc.box(1.2, 7.5, 1.4, BLOCK, { x: e * 14, y: 3.7, z: z - len / 2 - 3 });
      for (let t = 0; t < 2; t++) {
        const tz = z - 12 + t * 26;
        c.vc.box(9, 5, 11, WHITE, { x: s * 30, y: 2.5, z: tz });
        c.vc.prism(10, 1.6, 12, SLATE, { x: s * 30, y: 5, z: tz });
        for (let k = 0; k < 4; k++) c.vc.box(0.1, 1.6, 1.8, '#2f3a44', { x: s * 25.4, y: 1.8, z: tz - 3.6 + k * 2.4 });
        c.vc.box(6, 0.2, 9, '#6a6258', { x: s * 22, y: 0.1, z: tz });
      }
      c.vc.box(0.2, 2.0, 0.2, '#555', { x: s * 12.4, y: 1.0, z: z - 20 });
      for (let i = 0; i < 3; i++) {
        c.vc.box(1.9, 1.5, 4.8, '#c2a03e', { x: s * 21, y: 1.1, z: z - 6 + i * 6 });
        c.vc.box(1.94, 0.25, 4.84, CHARCOAL, { x: s * 21, y: 0.9, z: z - 6 + i * 6 });
      }
      board(c, 'central-station', 'CENTRAL STATION', SLATE, '#f4f1ea', 7.4, 2.0, s * 12, 5.2, z - 24, -s * 1.2);
      FLORA.mango!(c, s * 40, z + 24);
    }),

    /** Township stadium: a terraced bowl, tilted stand roof, floodlight masts, gate and kiosks. */
    'enugu.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'enugu-stadium', name: 'TOWNSHIP STADIUM', bg: CHARCOAL, fg: '#f0e6d2', stand: BLOCK, roof: ZINC, gate: WHITE });
      FLORA.mango!(c, s * 14.5, c.zMid - 22);
      FLORA.oilpalm!(c, s * 14.5, c.zMid + 24);
    }),

    /**
     * Nike Lake: a wide still lake on the bank side with a tree-lined slope, three open lakeside
     * huts, a long low hotel block, a jetty and a boat.
     */
    'enugu.lake': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(40, 0.12, 52, '#7d9aa0', { x: s * 42, y: 0.05, z });
      c.vc.box(40.6, 0.05, 52.6, '#a8a58a', { x: s * 42, y: 0.02, z });
      c.vc.box(8, 1.2, 50, '#7a8a52', { x: s * 17, y: 0.5, z, rz: s * 0.14 });
      for (let i = 0; i < 3; i++) {
        const hz = z - 12 + i * 12;
        c.vc.cyl(1.7, 1.7, 2.4, WHITE, { x: s * 22, y: 1.3, z: hz }, 8);
        c.vc.cone(2.6, 2.0, '#8a6a3a', { x: s * 22, y: 3.5, z: hz }, 8);
      }
      c.vc.box(8, 3.6, 22, WHITE, { x: s * 33, y: 1.8, z: z - 18 });
      c.vc.prism(9, 1.6, 23, RUST, { x: s * 33, y: 3.6, z: z - 18 });
      c.vc.box(1.4, 0.15, 12, '#7a5a3a', { x: s * 30, y: 0.3, z: z + 14 });
      c.vc.box(1.4, 0.5, 3.6, '#c9bfa4', { x: s * 38, y: 0.35, z: z + 16, ry: 0.4 });
      FLORA.mango!(c, s * 14, z - 6);
      FLORA.raffia!(c, s * 15, z + 8);
      FLORA.mango!(c, s * 15, z + 20);
      FLORA.pine!(c, s * 18, z + 22);
      board(c, 'nike-lake', 'NIKE LAKE', SLATE, '#f4f1ea', 6.4, 1.9, s * 11.4, 4.8, z - 22, -s * 1.5);
    }),

    /**
     * The hairpin lookout: three angled road slabs zigzagging up a pale rock-cut face, chevron
     * boards on the outer bends, a low post rail, tall pines and a lookout slab with a rail.
     */
    'enugu.lookout': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(16, 14, 40, SAND, { x: s * 32, y: 7, z, rz: s * 0.22 });
      c.vc.box(16.2, 0.4, 40.2, '#8e8a7c', { x: s * 24.4, y: 12, z });
      for (let i = 0; i < 3; i++) c.vc.box(8, 0.3, 14, '#4a4f52', { x: s * (22 + (i % 2) * 6), y: 1.4 + i * 2.6, z: z - 14 + i * 14, ry: (i % 2 ? 0.6 : -0.6) });
      for (let i = 0; i < 7; i++) {
        const rz = z - 18 + i * 6;
        c.vc.cyl(0.08, 0.08, 1.0, '#8a8f99', { x: s * 14.5, y: 0.5, z: rz }, 4);
        c.vc.box(0.06, 0.1, 6, '#c9c5bb', { x: s * 14.5, y: 0.9, z: rz + 3 });
      }
      for (let i = 0; i < 4; i++) {
        c.vc.cyl(0.04, 0.04, 1.2, '#6a6258', { x: s * 13.6, y: 0.6, z: z + 4 + i * 1.5 }, 4);
        c.vc.box(0.05, 0.7, 0.9, i % 2 ? CHARCOAL : '#e8e6da', { x: s * 13.6, y: 1.3, z: z + 4 + i * 1.5 });
      }
      c.vc.box(6, 0.4, 8, BLOCK, { x: s * 18, y: 5.2, z: z + 20 });
      c.vc.box(0.1, 1.0, 8, '#8a8f99', { x: s * 15.2, y: 5.9, z: z + 20 });
      for (const [px, pz] of [[24, -20], [28, 4], [36, -10], [20, 14]] as const) FLORA.pine!(c, s * px, z + pz);
      board(c, 'udi-lookout', 'UDI HILLS LOOKOUT', CHARCOAL, '#f0e6d2', 8, 2.1, s * 11.6, 5.0, z - 22, -s * 1.5);
    }),
  });
}
