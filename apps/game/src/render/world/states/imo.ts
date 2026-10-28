import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, piece, sideOf, stadiumBlock } from './common';

/**
 * Imo's set pieces (docs/research/states/imo.md), original stylised models: a wholesale produce
 * market of bagged garri, tomato baskets and onion sacks under a long zinc shed, a lake jetty with
 * canoes and a loaded pontoon on pale water, a strip of pale hotel blocks with lit boards, a
 * roundabout with an abstract stacked-disc sculpture and a township stadium. Red earth, cream
 * render and lake teal; no deity, shrine, statue, figure, flag, cross or brand anywhere.
 */
const CREAM = '#ede3cc';
const ROSE = '#d8b9a2';
const EARTH = '#8a5a3a';
const TEAL = '#2e6e73';
const DEEP = '#3d4a3a';
const BLOCK = '#bdb7a6';

export function registerImoPieces() {
  registerPieces({
    /**
     * A wholesale produce market: a long open zinc shed with rows of garri bags, round tomato
     * baskets and onion sacks, stacks of crates, a hand cart and two parasol stalls at the kerb.
     */
    'imo.produce-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let row = 0; row < 2; row++) {
        const x = s * (17 + row * 11);
        for (const dz of [-1, 1]) for (const dx of [-3, 3]) c.vc.cyl(0.07, 0.07, 3.0, '#5a3d24', { x: x + dx, y: 1.5, z: z + dz * 17 }, 4);
        c.vc.prism(7.6, 1.2, 36, row ? '#8f8b82' : '#9a968b', { x, y: 3.5, z });
        c.vc.box(6.6, 0.4, 35, '#7a5a3a', { x, y: 0.2, z });
        for (let i = 0; i < 10; i++) {
          const zi = z - 16 + i * 3.5;
          const kind = (i + row) % 3;
          if (kind === 0) for (let k = 0; k < 4; k++) c.vc.box(0.7, 0.4, 1.0, k % 2 ? '#d8c9a0' : '#c9b58a', { x: x - 1.6 + (k % 2) * 0.8, y: 0.6 + (k >> 1) * 0.4, z: zi });
          else if (kind === 1) for (let k = 0; k < 3; k++) c.vc.cyl(0.45, 0.36, 0.5, '#b8472f', { x: x - 1.2 + k * 1.0, y: 0.65, z: zi, sy: 1 }, 8);
          else for (let k = 0; k < 4; k++) c.vc.sphere(0.4, k % 2 ? '#a8485a' : '#c9a45a', { x: x - 1.3 + k * 0.85, y: 0.6, z: zi, sy: 0.85 }, 5);
        }
      }
      for (let i = 0; i < 2; i++) {
        c.vc.box(1.0, 0.14, 2.0, '#7a5a3a', { x: s * 12.6, y: 0.6, z: z - 8 + i * 16 });
        for (const dx of [-0.55, 0.55]) c.vc.cyl(0.38, 0.38, 0.1, '#1a1a1a', { x: s * 12.6 + dx, y: 0.38, z: z - 8 + i * 16, rz: Math.PI / 2 }, 8);
      }
      for (const [k, pz] of [[0, -14], [1, 12]] as const) {
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: s * 14.4, y: 1.15, z: z + pz }, 4);
        c.vc.cone(1.5, 0.5, ['#c98f3a', '#2a6f73'][k]!, { x: s * 14.4, y: 2.4, z: z + pz }, 8);
      }
      FLORA.oilpalm!(c, s * 36, z - 16);
      FLORA.mango!(c, s * 36, z + 18);
      board(c, 'imo-market', 'PRODUCE MARKET', DEEP, '#fff1cf', 7.6, 2.0, s * 11.4, 5.6, z - 21, -s * 1.5);
    }),

    /**
     * A lake jetty: a wide still pale lake, a plank jetty on posts, two dugout canoes at its foot
     * and a flat pontoon loaded with crates, a farmland bank with oil palms and a low zinc shed.
     * A plain working landing: no shrine, figure, banner or name.
     */
    'imo.lake-jetty': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(44, 0.12, 56, '#86aaa8', { x: s * 46, y: 0.05, z });
      c.vc.box(44.6, 0.05, 56.6, '#b5a98a', { x: s * 46, y: 0.02, z });
      c.vc.box(8, 1.0, 54, '#7a8a52', { x: s * 17, y: 0.45, z, rz: s * 0.14 });
      c.vc.box(2.0, 0.16, 20, '#7a5a3a', { x: s * 33, y: 0.55, z });
      for (let i = 0; i < 6; i++) for (const dz of [-0.8, 0.8]) c.vc.cyl(0.1, 0.1, 1.2, '#5a3d24', { x: s * (25 + i * 3.4), y: 0.3, z: z + dz * 0 + dz }, 4);
      c.vc.box(16, 0.16, 2.0, '#7a5a3a', { x: s * 34, y: 0.55, z, ry: Math.PI / 2 });
      for (let i = 0; i < 2; i++) {
        c.vc.box(1.0, 0.5, 6, i ? '#c98f3a' : '#3b6a8a', { x: s * 30, y: 0.35, z: z - 12 + i * 22, ry: 0.15 });
        c.vc.cone(0.5, 1.2, i ? '#c98f3a' : '#3b6a8a', { x: s * 30, y: 0.35, z: z - 8.6 + i * 22, rx: Math.PI / 2 }, 4);
      }
      c.vc.box(5, 0.5, 9, '#6a6258', { x: s * 42, y: 0.3, z: z + 10 });
      for (let k = 0; k < 6; k++) c.vc.box(0.9, 0.7, 0.9, k % 2 ? '#c9b58a' : '#b79a6c', { x: s * 42 + (k % 3 - 1) * 1.2, y: 0.85 + (k >> 2) * 0.7, z: z + 7 + (k >> 1) * 1.2 });
      c.vc.box(5, 3, 8, CREAM, { x: s * 24, y: 1.5, z: z + 20 });
      c.vc.prism(5.6, 1.1, 8.6, '#8f8b82', { x: s * 24, y: 3.0, z: z + 20 });
      FLORA.oilpalm!(c, s * 14, z - 8);
      FLORA.oilpalm!(c, s * 15, z + 6);
      FLORA.raffia!(c, s * 14, z + 24);
      FLORA.oilpalm!(c, s * 16, z - 22);
      board(c, 'lake-jetty', 'LAKE JETTY', TEAL, '#f4f1ea', 6, 1.8, s * 11.4, 4.6, z - 22, -s * 1.5);
    }),

    /**
     * A hotel row: three pale hotel blocks of different heights set back behind a forecourt, each
     * with a glazed band, a lit plain board and a canopy, a planted verge, a few parked shapes and
     * oil palms. Generic boards only.
     */
    'imo.hotel-row': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const hs = [8, 12, 6];
      for (let i = 0; i < 3; i++) {
        const hz = z - 14 + i * 14;
        const h = hs[i]!;
        c.vc.box(9, h, 11, [CREAM, ROSE, '#d6d0bd'][i]!, { x: s * 22, y: h / 2, z: hz });
        c.vc.box(9.3, 0.4, 11.3, '#8f8a7e', { x: s * 22, y: h + 0.2, z: hz });
        c.vc.box(0.1, h * 0.55, 8.6, '#7fa0a6', { x: s * 17.45, y: h * 0.58, z: hz });
        c.vc.box(3.2, 0.3, 6, '#c4bfae', { x: s * 16.4, y: 3.2, z: hz });
        for (const dz of [-2.4, 2.4]) c.vc.cyl(0.1, 0.1, 3.2, '#8a8f99', { x: s * 15.0, y: 1.6, z: hz + dz }, 4);
        c.vc.box(0.12, 1.0, 4.4, ['#f0e2a0', '#a8d6d4', '#f4f1ea'][i]!, { x: s * 17.3, y: h + 1.2, z: hz });
        c.vc.box(8, 0.06, 8, '#9a968b', { x: s * 14.4, y: 0.04, z: hz });
        c.vc.box(1.8, 1.2, 3.6, ['#c9b58a', '#6f7f8c', '#e4dcc6'][i]!, { x: s * 13.2, y: 0.7, z: hz + 3.4 });
      }
      for (let i = 0; i < 4; i++) FLORA.oilpalm!(c, s * 12.8, z - 20 + i * 13);
      board(c, 'hotel-row', 'HOTEL ROW', TEAL, '#f4f1ea', 6.2, 1.8, s * 11.4, 5.2, z - 22, -s * 1.5);
    }),

    /**
     * The central roundabout: a round raised island with a stack of seven discs narrowing to a
     * small ball (an abstract sculpture), a ring of flower beds, lamp posts, a plaza block and a
     * pale kerbed apron. No statue, figure, flag or cross.
     */
    'imo.roundabout': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 27;
      c.vc.cyl(10.5, 10.5, 0.3, '#4f5558', { x: cx, y: 0.1, z }, 22);
      c.vc.cyl(9.2, 9.2, 0.6, '#cfc9b8', { x: cx, y: 0.3, z }, 22);
      c.vc.cyl(8.2, 8.2, 0.7, '#8caa62', { x: cx, y: 0.35, z }, 22);
      for (let k = 0; k < 7; k++) c.vc.cyl(2.8 - k * 0.32, 2.8 - k * 0.32, 0.5, k % 2 ? CREAM : EARTH, { x: cx, y: 1.0 + k * 0.62, z }, 14);
      c.vc.sphere(0.8, TEAL, { x: cx, y: 5.9, z }, 8);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        c.vc.cyl(0.9, 0.9, 0.5, ['#d98a3a', '#d8c24a', '#c9506a', '#e8e4d0'][i % 4]!, { x: cx + Math.cos(a) * 6.2, y: 0.95, z: z + Math.sin(a) * 6.2 }, 7);
      }
      for (let i = 0; i < 4; i++) {
        c.vc.cyl(0.07, 0.09, 5.6, '#7a7a76', { x: s * 12.4, y: 2.8, z: z - 18 + i * 12 }, 5);
        c.vc.box(1.0, 0.1, 0.6, '#2f3a44', { x: s * 12.4, y: 5.7, z: z - 18 + i * 12 });
      }
      c.vc.box(9, 11, 9, CREAM, { x: s * 20, y: 5.5, z: z - 22 });
      c.vc.box(9, 7, 9, ROSE, { x: s * 20, y: 3.5, z: z + 22 });
      c.vc.box(9, 0.5, 9, BLOCK, { x: s * 46, y: 0.25, z: z - 24 });
      FLORA.oilpalm!(c, s * 14, z + 10);
      board(c, 'imo-roundabout', 'CENTRAL ROUNDABOUT', TEAL, '#f4f1ea', 7.6, 1.8, cx - s * 3.4, 5.6, z - 11, s * 0.9);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'imo.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'imo-stadium', name: 'TOWNSHIP STADIUM', bg: DEEP, fg: '#f4f1ea', stand: '#c4bfae', roof: '#a8adb0', gate: CREAM });
      FLORA.oilpalm!(c, s * 14.5, c.zMid - 22);
      FLORA.mango!(c, s * 14.5, c.zMid + 24);
    }),
  });
}
