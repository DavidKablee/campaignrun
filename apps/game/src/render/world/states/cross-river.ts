import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, piece, sideOf, stadiumBlock } from './common';

/**
 * Cross River's set pieces (docs/research/states/cross-river.md), original stylised models: a
 * central market of lock-up rows, plantain and fish tables on wet ground, a plain concrete quay
 * on the Calabar River with a harbour crane and mangroves (no resort, museum or boat scene), an
 * empty carnival avenue with a covered grandstand and muted pennant lines (no crowd, band, float,
 * biker or vehicle in a crowd), a plain trade hall with a pond and a township stadium. Rainforest
 * green, plum and tin grey; no mask, society emblem, flag or person anywhere.
 */
const CREAM = '#ece4d0';
const PLUM = '#7a2e4a';
const DEEP = '#2a2f3a';
const BLOCK = '#bdb7a6';
const ZINC = '#98948a';
const MUDWATER = '#7c8a70';

export function registerCrossRiverPieces() {
  registerPieces({
    /**
     * A central market: two long zinc ranges of lock-up stalls on wet ground with bunches of
     * plantain, tables of silver fish on ice boxes, baskets of cocoyam and tomatoes, parasol
     * stalls and a raffia and oil-palm edge. Goods only: no figure, no fire, no flood.
     */
    'cross-river.market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(40, 0.05, 44, '#5a5a52', { x: s * 30, y: 0.02, z });
      for (let row = 0; row < 2; row++) {
        const x = s * (17 + row * 11.5);
        for (const dz of [-1, 1]) for (const dx of [-3.2, 3.2]) c.vc.cyl(0.08, 0.08, 3.1, '#5a3d24', { x: x + dx, y: 1.55, z: z + dz * 17 }, 4);
        c.vc.prism(7.8, 1.3, 36, row ? '#8f8b82' : ZINC, { x, y: 3.6, z });
        c.vc.box(6.8, 0.4, 35, '#7a5a3a', { x, y: 0.2, z });
        for (let i = 0; i < 9; i++) {
          const zi = z - 15 + i * 3.8;
          const kind = (i + row) % 3;
          if (kind === 0) for (let k = 0; k < 3; k++) c.vc.cyl(0.14, 0.14, 1.0, '#a8b04a', { x: x - 1.0 + k * 0.5, y: 0.9, z: zi, rz: (k - 1) * 0.5 }, 5);
          else if (kind === 1) {
            c.vc.box(2.6, 0.5, 1.2, '#cdd2d4', { x, y: 0.55, z: zi });
            for (let k = 0; k < 5; k++) c.vc.box(0.5, 0.06, 0.15, '#a8b4b8', { x: x - 1.0 + k * 0.5, y: 0.84, z: zi });
          } else for (let k = 0; k < 3; k++) c.vc.cyl(0.42, 0.34, 0.5, k % 2 ? '#b0823a' : '#a04a3a', { x: x - 1.2 + k * 1.1, y: 0.65, z: zi }, 8);
        }
      }
      for (const [k, pz] of [[0, -20], [1, 20]] as const) {
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: s * 14.2, y: 1.15, z: z + pz }, 4);
        c.vc.cone(1.5, 0.5, ['#c98f3a', '#3f6f84'][k]!, { x: s * 14.2, y: 2.4, z: z + pz }, 8);
      }
      FLORA.raffia!(c, s * 40, z - 16);
      FLORA.oilpalm!(c, s * 38, z + 16);
      board(c, 'cross-river-market', 'CENTRAL MARKET', PLUM, '#fff1cf', 6.6, 2.0, s * 11.4, 5.6, z - 22, -s * 1.5);
    }),

    /**
     * A river quay: a plain concrete quay wall along murky green-brown water, bollards, a low
     * jetty, a harbour crane on rails (grey lattice jib over a cabin), stacked pallets, and a
     * mangrove fringe. Empty water: no boat, resort, museum, plaque or crowd.
     */
    'cross-river.river-quay': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(54, 0.12, 58, MUDWATER, { x: s * 50, y: 0.05, z });
      c.vc.box(14, 0.9, 56, '#b5b0a2', { x: s * 21, y: 0.45, z });
      c.vc.box(0.5, 0.5, 56, '#8a857a', { x: s * 28.2, y: 1.0, z });
      for (let i = 0; i < 8; i++) c.vc.cyl(0.2, 0.26, 0.5, '#3a3a38', { x: s * 27.4, y: 1.15, z: z - 24 + i * 7 }, 6);
      c.vc.box(3.0, 0.3, 16, '#8a6a42', { x: s * 34, y: 0.5, z: z + 14 });
      for (let i = 0; i < 4; i++) for (const e of [-1, 1]) c.vc.cyl(0.1, 0.1, 1.0, '#5a3d24', { x: s * (34 + e * 1.2), y: 0.2, z: z + 8 + i * 4 }, 4);
      for (const e of [-1, 1]) {
        c.vc.box(0.4, 9, 0.4, '#d4a43a', { x: s * (20 + e * 1.8), y: 4.5, z: z - 8 });
        c.vc.box(0.4, 9, 0.4, '#d4a43a', { x: s * (20 + e * 1.8), y: 4.5, z: z - 4 });
      }
      c.vc.box(5.2, 0.4, 5.2, '#d4a43a', { x: s * 20, y: 9.2, z: z - 6 });
      c.vc.box(2.2, 2.0, 2.4, '#e8e2d0', { x: s * 20, y: 10.2, z: z - 6 });
      c.vc.box(0.4, 0.4, 24, '#6a6e72', { x: s * 26, y: 11.4, z: z - 6, rx: 0.5 });
      c.vc.box(0.3, 9, 0.3, '#6a6e72', { x: s * 22.6, y: 6.0, z: z - 6.4, rx: 0.6 });
      for (let i = 0; i < 3; i++) c.vc.box(1.6, 0.9, 1.6, '#8a6a42', { x: s * 14.4, y: 1.35, z: z + 16 + i * 2 });
      for (let i = 0; i < 4; i++) c.vc.sphere(1.8, i % 2 ? '#3a5a34' : '#2f5a3a', { x: s * (40 + (i % 2) * 6), y: 0.9, z: z - 24 + i * 10, sy: 0.7 }, 5);
      FLORA.mangrove!(c, s * 44, z - 12);
      FLORA.mangrove!(c, s * 48, z + 22);
      FLORA.raffia!(c, s * 13.6, z + 24);
      board(c, 'cross-river-quay', 'RIVER QUAY', DEEP, '#f2eed8', 5.4, 1.8, s * 11.4, 4.8, z - 26, -s * 1.5);
    }),

    /**
     * A carnival avenue: an empty covered grandstand of stepped benches with a tilted roof, rows of
     * poles carrying pennant lines in muted green, cream and plum, lamp posts and flower beds. No
     * crowd, band, float, costume, biker or vehicle.
     */
    'cross-river.carnival-road': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let step = 0; step < 5; step++) c.vc.box(2.4, 0.8 + step * 0.8, 34, step % 2 ? '#c5c0b2' : BLOCK, { x: s * (19 + step * 2.2), y: (0.8 + step * 0.8) / 2, z });
      c.vc.box(4.8, 0.25, 35, '#a8adb0', { x: s * 26, y: 6.4, z, rz: -s * 0.12 });
      for (const dz of [-16, -5, 5, 16]) c.vc.cyl(0.14, 0.16, 6.0, '#8a8f99', { x: s * 17.6, y: 3.0, z: z + dz }, 5);
      for (let i = 0; i < 6; i++) {
        c.vc.cyl(0.07, 0.07, 6, '#7a6a52', { x: s * 12.6, y: 3, z: z - 25 + i * 10 }, 4);
        if (i < 5) for (let k = 0; k < 8; k++) c.vc.cone(0.3, 0.6, ['#4f7a52', '#ece4d0', PLUM, '#c9a56a'][k % 4]!, { x: s * 12.6, y: 5.5 - Math.sin((k / 7) * Math.PI) * 0.4, z: z - 25 + i * 10 + 0.6 + k * 1.1, rx: Math.PI }, 4);
      }
      for (let i = 0; i < 4; i++) {
        c.vc.cyl(0.09, 0.09, 5.2, '#6a6a68', { x: s * 14.4, y: 2.6, z: z - 20 + i * 13 }, 4);
        c.vc.box(1.4, 0.2, 0.4, '#e4e0c8', { x: s * 14.8, y: 5.2, z: z - 20 + i * 13 });
      }
      for (let i = 0; i < 3; i++) {
        c.vc.box(5, 0.35, 2.4, '#5f7a46', { x: s * 15.6, y: 0.17, z: z - 14 + i * 14 });
        for (let k = 0; k < 4; k++) c.vc.sphere(0.35, [PLUM, '#e8c24a', '#ece4d0', '#c05a3a'][k]!, { x: s * 15.6, y: 0.5, z: z - 14.8 + i * 14 + k * 0.5, sy: 0.7 }, 5);
      }
      FLORA.oilpalm!(c, s * 44, z - 20);
      FLORA.raffia!(c, s * 46, z + 20);
      board(c, 'cross-river-carnival', 'CARNIVAL ROAD', PLUM, '#fff1cf', 6.4, 2.0, s * 11.4, 5.4, z - 26, -s * 1.5);
    }),

    /**
     * A trade hall: a long plain exhibition hall with a low barrel-like roof and a glazed entrance,
     * a gate with two square piers, a still rectangular pond, plain flag masts without banners and
     * a car park with painted bays. Empty and generic: no brand, name, banner or crowd.
     */
    'cross-river.trade-hall': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(40, 0.05, 54, '#4a4c4e', { x: s * 32, y: 0.03, z });
      c.vc.box(14, 7.0, 34, CREAM, { x: s * 40, y: 3.5, z: z - 4 });
      c.vc.prism(15.4, 2.6, 34.8, '#b8b4a6', { x: s * 40, y: 8.3, z: z - 4 });
      c.vc.box(0.3, 4.6, 9, '#7fa4b4', { x: s * 32.6, y: 2.6, z: z - 4 });
      for (const dz of [-6, 6]) c.vc.box(1.6, 5.4, 1.6, '#c9c4b4', { x: s * 32.4, y: 2.7, z: z - 4 + dz });
      c.vc.box(34, 0.08, 8, '#6f9aa8', { x: s * 24, y: 0.07, z: z + 18 });
      c.vc.box(34.6, 0.1, 8.6, '#a8a498', { x: s * 24, y: 0.04, z: z + 18 });
      for (let i = 0; i < 3; i++) {
        c.vc.cyl(0.08, 0.08, 7, '#8a8f99', { x: s * (14 + i * 3.2), y: 3.5, z: z - 24 }, 4);
        c.vc.box(0.05, 0.9, 1.4, '#e8e4d8', { x: s * (14 + i * 3.2), y: 6.4, z: z - 23.3 });
      }
      for (const dz of [-1, 1]) c.vc.box(1.4, 3.6, 1.4, '#c9c4b4', { x: s * 14, y: 1.8, z: z - 18 + dz * 3.6 });
      for (let i = 0; i < 8; i++) c.vc.box(0.12, 0.02, 4.2, '#e8e8e0', { x: s * (18 + i * 2.6), y: 0.07, z: z + 4 });
      FLORA.oilpalm!(c, s * 15, z + 24);
      FLORA.raffia!(c, s * 15, z + 8);
      board(c, 'cross-river-hall', 'TRADE HALL', DEEP, '#f2eed8', 5.0, 1.8, s * 11.4, 4.8, z - 28, -s * 1.5);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'cross-river.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'cross-river-stadium', name: 'TOWNSHIP STADIUM', bg: DEEP, fg: '#f4f1ea', stand: BLOCK, roof: '#a8adb0', gate: CREAM });
      FLORA.oilpalm!(c, s * 14.5, c.zMid - 22);
      FLORA.raffia!(c, s * 14.5, c.zMid + 24);
    }),
  });
}
