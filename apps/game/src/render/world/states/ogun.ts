import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, flyoverDeck, piece, sideOf, stadiumBlock } from './common';

/**
 * Ogun's set pieces (docs/research/states/ogun.md), original stylised models: an indigo adire
 * market with cloths on poles, a low river crossed by an old truss and a new beam bridge, a
 * generic interchange park with a plain tapering shaft, a flyover with a long footbridge and a
 * township stadium. Pale concrete, grey granite, zinc and rust, adire indigo; no shrine, hall,
 * palace, forge emblem, masquerade or flag anywhere, and no marker on any rock.
 */
const INDIGO = '#2b3045';
const MID_INDIGO = '#2e3c69';
const PALE_INDIGO = '#6f7fa8';
const CREAM = '#e4dcc6';
const CONCRETE = '#b8b6ae';
const GRANITE = '#a29b92';
const ZINC = '#9ea5a8';
const RUST = '#8e5038';
const RIVER = '#8a7658';

export function registerOgunPieces() {
  registerPieces({
    /**
     * The adire market: terraced shop blocks, long indigo cloths hung in rows on poles, dye
     * tubs with indigo liquid, bundles on benches, sewing machines under a shade, a grey dome
     * rising behind the roofs.
     */
    'ogun.adire-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let i = 0; i < 2; i++) {
        const h = 4 + i * 3;
        c.vc.box(9, h, 30, i ? '#c4a06a' : CREAM, { x: s * (31 + i * 9), y: h / 2, z });
        c.vc.box(9.4, 0.3, 30.4, i ? ZINC : RUST, { x: s * (31 + i * 9), y: h + 0.15, z });
      }
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 4; i++) {
          const zi = z - 15 + i * 9 + (row % 2) * 2;
          const x = s * (14.5 + row * 5);
          c.vc.cyl(0.05, 0.05, 3.6, '#5a3d24', { x, y: 1.8, z: zi - 1.8 }, 4);
          c.vc.cyl(0.05, 0.05, 3.6, '#5a3d24', { x, y: 1.8, z: zi + 1.8 }, 4);
          c.vc.box(0.05, 2.8, 3.4, [INDIGO, MID_INDIGO, PALE_INDIGO, CREAM][(i + row) % 4]!, { x, y: 2.1, z: zi });
        }
      }
      for (let i = 0; i < 4; i++) {
        c.vc.cyl(0.55, 0.5, 0.7, '#25282c', { x: s * 26, y: 0.35, z: z - 9 + i * 6 }, 8);
        c.vc.cyl(0.45, 0.45, 0.05, INDIGO, { x: s * 26, y: 0.72, z: z - 9 + i * 6 }, 8);
      }
      c.vc.box(3, 0.5, 1.4, '#7a5a3a', { x: s * 12.8, y: 0.5, z: z + 12 });
      for (let k = 0; k < 4; k++) c.vc.box(0.7, 0.4, 0.6, [CREAM, PALE_INDIGO, INDIGO, '#cdbb95'][k]!, { x: s * 12.8, y: 0.9, z: z + 11.3 + k * 0.5 });
      c.vc.cap(1, Math.PI / 2, GRANITE, { x: s * 58, y: -1, z: z + 4, sx: 20, sy: 13, sz: 11 }, 10);
      FLORA.kola!(c, s * 12.6, z - 21);
      board(c, 'adire-market', 'ADIRE MARKET', INDIGO, '#f0e6d2', 7.4, 2.0, s * 11.4, 6.2, z - 18, -s * 1.5);
    }),

    /**
     * The river and its two bridges: a low brown river between granite boulders, an old steel
     * truss bridge and a newer low beam bridge side by side across it, steps down to the
     * bank, a washing line of cloths. The river runs across the view beyond the road.
     */
    'ogun.river-bridges': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const rz = z + 14;
      c.vc.box(56, 0.1, 16, RIVER, { x: s * 44, y: 0.04, z: rz });
      c.vc.box(56, 0.7, 4, '#9a9082', { x: s * 44, y: 0.35, z: rz - 10 });
      c.vc.box(56, 0.7, 4, '#9a9082', { x: s * 44, y: 0.35, z: rz + 10 });
      for (let i = 0; i < 9; i++) c.vc.sphere(1.0 + (i % 3) * 0.6, i % 2 ? '#8d8a84' : GRANITE, { x: s * (20 + i * 6), y: 0.6, z: rz + (i % 2 ? 6.5 : -6.5), sy: 0.8 }, 6);
      c.vc.box(54, 0.7, 5.2, CONCRETE, { x: s * 44, y: 2.6, z: rz + 3.2 });
      for (let i = 0; i < 6; i++) c.vc.box(1.2, 2.4, 3.6, '#a8a498', { x: s * (22 + i * 9.6), y: 1.2, z: rz + 3.2 });
      for (const e of [-1, 1]) c.vc.box(54, 0.5, 0.2, '#8f8b82', { x: s * 44, y: 3.2, z: rz + 3.2 + e * 2.5 });
      const len = 54;
      c.vc.box(len, 0.6, 5, '#7c7a72', { x: s * 44, y: 2.3, z: rz - 4 });
      for (const e of [-1, 1]) {
        const zz = rz - 4 + e * 2.3;
        c.vc.box(len, 0.35, 0.35, '#6a6258', { x: s * 44, y: 2.5, z: zz });
        c.vc.box(len, 0.35, 0.35, '#6a6258', { x: s * 44, y: 6.6, z: zz });
        const n = 9;
        for (let i = 0; i < n; i++) {
          const x0 = s * (44 - len / 2 + (i / n) * len);
          const x1 = s * (44 - len / 2 + ((i + 1) / n) * len);
          c.vc.box(0.25, 4.1, 0.25, '#6a6258', { x: x0, y: 4.55, z: zz });
          c.vc.box(Math.hypot(x1 - x0, 4.1), 0.22, 0.22, '#7a6e60', { x: (x0 + x1) / 2, y: 4.55, z: zz, rz: (i % 2 ? 1 : -1) * Math.atan2(4.1, Math.abs(x1 - x0)) });
        }
      }
      for (let k = 0; k < 6; k++) c.vc.box(1.1, 0.25, 0.6, '#b8b6ae', { x: s * (17 + k * 0.9), y: 0.2 + k * 0.15, z: z + 6 });
      c.vc.box(0.05, 0.05, 12, '#5a3d24', { x: s * 14, y: 1.8, z: z - 6 });
      for (let k = 0; k < 4; k++) c.vc.box(0.05, 1.3, 1.2, [INDIGO, CREAM, PALE_INDIGO, MID_INDIGO][k]!, { x: s * 14, y: 1.2, z: z - 10 + k * 2.6 });
      FLORA.kola!(c, s * 14, z - 14);
      FLORA.neem!(c, s * 14, z + 24);
      board(c, 'ogun-river', 'OGUN RIVER', INDIGO, '#f0e6d2', 6.4, 1.8, s * 11.4, 4.8, z - 18, -s * 1.5);
    }),

    /**
     * A generic interchange park: a round raised island with a stepped plaza, a plain tapering
     * shaft of pale concrete on a square base (no arms, no disc, no emblem), a dry round basin,
     * lawn and trees, with pale silos far behind. No fountain water, no flag.
     */
    'ogun.interchange-park': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 27;
      c.vc.cyl(10, 10, 0.3, '#6a6e70', { x: cx, y: 0.1, z }, 20);
      c.vc.cyl(8.8, 8.8, 0.55, CONCRETE, { x: cx, y: 0.3, z }, 20);
      c.vc.cyl(7.6, 7.6, 0.8, '#718a4e', { x: cx, y: 0.4, z }, 20);
      c.vc.cyl(4.2, 4.2, 0.7, CONCRETE, { x: cx, y: 0.85, z }, 16);
      c.vc.cyl(3.0, 3.0, 0.4, '#a8a498', { x: cx, y: 1.1, z }, 16);
      c.vc.box(2.6, 1.0, 2.6, '#a8a498', { x: cx, y: 1.5, z });
      c.vc.cone(1.1, 14, '#d8d2c2', { x: cx, y: 8.5, z }, 4);
      c.vc.box(1.6, 0.5, 1.6, '#a8a498', { x: cx, y: 16.3, z });
      for (let i = 0; i < 5; i++) {
        const a = i * 1.2;
        FLORA.kola!(c, cx + Math.cos(a) * 7, z + Math.sin(a) * 7);
      }
      for (let i = 0; i < 3; i++) {
        c.vc.cyl(2.2, 2.2, 14, '#e4e6e4', { x: s * 56, y: 7, z: z - 8 + i * 8 }, 10);
        c.vc.cone(2.2, 1.4, '#c3c8ca', { x: s * 56, y: 14.7, z: z - 8 + i * 8 }, 10);
      }
      for (let i = 0; i < 3; i++) {
        c.vc.box(1.8, 1.4, 1.6, '#b98a3e', { x: s * 12.6, y: 1.1, z: z - 18 + i * 4.6 });
        c.vc.box(1.9, 1.2, 3.4, '#3a3d40', { x: s * 12.6, y: 1.5, z: z - 15.5 + i * 4.6 });
      }
      board(c, 'interchange-park', 'INTERCHANGE PARK', INDIGO, '#f0e6d2', 7.4, 1.9, cx - s * 3.6, 4.6, z - 10, s * 0.9);
    }),

    /**
     * The flyover and footbridge: a deck on box piers beside the road, a long covered footbridge
     * crossing over the lanes on piers with stair ramps at each end, a glass mid-rise block and a
     * mall canopy.
     */
    'ogun.flyover': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      flyoverDeck(c, s * 20, z, 44, 7.6, CONCRETE, '#8f8b82');
      c.vc.box(38, 0.5, 3.2, '#7c7a72', { x: 0, y: 7.2, z: z - 14 });
      c.vc.box(38, 1.8, 0.2, ZINC, { x: 0, y: 8.3, z: z - 12.5 });
      c.vc.box(38, 1.8, 0.2, ZINC, { x: 0, y: 8.3, z: z - 15.5 });
      c.vc.box(38.4, 0.25, 3.8, '#8f8b82', { x: 0, y: 9.3, z: z - 14 });
      for (const e of [-1, 1]) c.vc.box(1.4, 7.4, 1.6, '#a8a498', { x: e * 16.5, y: 3.7, z: z - 14 });
      c.vc.box(11, 0.4, 3, '#7c7a72', { x: s * 22, y: 3.8, z: z - 14, rz: s * 0.4 });
      c.vc.box(9, 12, 9, '#9db2c0', { x: s * 18, y: 6, z: z + 26 });
      c.vc.box(9.2, 0.4, 9.2, '#7c7a72', { x: s * 18, y: 12.2, z: z + 26 });
      c.vc.box(8, 0.3, 8, INDIGO, { x: s * 15, y: 3.6, z: z + 18, rz: s * 0.04 });
      for (const dz of [-3, 3]) c.vc.cyl(0.07, 0.07, 3.6, '#6a6258', { x: s * 12, y: 1.8, z: z + 18 + dz }, 4);
      for (let i = 0; i < 3; i++) {
        c.vc.box(1.9, 1.5, 4.8, '#6f7f8c', { x: s * 12.4, y: 1.1, z: z - 4 + i * 6 });
        c.vc.box(1.94, 0.25, 4.84, '#2a2a2c', { x: s * 12.4, y: 0.9, z: z - 4 + i * 6 });
      }
      FLORA.kola!(c, s * 40, z - 10);
      board(c, 'ogun-flyover', 'FLYOVER', INDIGO, '#f0e6d2', 5.6, 1.7, s * 11.4, 5.2, z - 22, -s * 1.5);
    }),

    /** Township stadium: a terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'ogun.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'ogun-stadium', name: 'TOWNSHIP STADIUM', bg: INDIGO, fg: '#f0e6d2', stand: '#b8b6ae', roof: ZINC, gate: CREAM });
      FLORA.kola!(c, s * 14.5, c.zMid - 22);
      FLORA.teak!(c, s * 14.5, c.zMid + 24);
    }),
  });
}
