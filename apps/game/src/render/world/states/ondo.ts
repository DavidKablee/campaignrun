import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, piece, sideOf, stadiumBlock } from './common';

/**
 * Ondo's set pieces (docs/research/states/ondo.md), original stylised models: a cocoa market of
 * sacks, drying mats and pod baskets, two bare granite domes with a plain concrete stair up one
 * flank (no building, shrine, palace or named step), a lagoon landing with stilt sheds, canoes
 * and a plain ferry on murky water, a concrete river bridge in forest and a township stadium.
 * Rainforest green, cocoa brown and grey rock; no deity, shrine, crown, regalia or flag anywhere.
 */
const CREAM = '#eae0c8';
const SAGE = '#b9c4a6';
const COCOA = '#6b4226';
const DEEP = '#2f4a2c';
const ROCK = '#8e8f89';
const BLOCK = '#bdb7a6';
const ZINC = '#98948a';

export function registerOndoPieces() {
  registerPieces({
    /**
     * A cocoa market: two long zinc ranges stacked with brown sacks, rows of drying mats with
     * rust-brown beans spread on them, baskets of yellow pods, a hanging scale frame and parasol
     * stalls at the kerb. Produce only: no figure, no sign of the price crash or a protest.
     */
    'ondo.cocoa-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let row = 0; row < 2; row++) {
        const x = s * (18 + row * 12);
        for (const dz of [-1, 1]) for (const dx of [-3.4, 3.4]) c.vc.cyl(0.08, 0.08, 3.1, '#5a3d24', { x: x + dx, y: 1.55, z: z + dz * 17 }, 4);
        c.vc.prism(8.0, 1.3, 36, row ? '#8f8b82' : ZINC, { x, y: 3.6, z });
        c.vc.box(7.0, 0.4, 35, '#7a5a3a', { x, y: 0.2, z });
        for (let i = 0; i < 9; i++) {
          const zi = z - 15 + i * 3.7;
          if ((i + row) % 2 === 0) for (let k = 0; k < 5; k++) c.vc.box(0.85, 0.5, 1.1, k % 2 ? '#a07a4a' : '#8a6a3e', { x: x - 2 + (k % 3) * 0.95, y: 0.65 + (k >= 3 ? 0.5 : 0), z: zi });
          else for (let k = 0; k < 3; k++) c.vc.cyl(0.42, 0.34, 0.55, '#b8863a', { x: x - 1.3 + k * 1.1, y: 0.68, z: zi }, 8);
        }
      }
      for (let i = 0; i < 3; i++) {
        c.vc.box(3.6, 0.06, 6.4, '#9a7a4e', { x: s * 12.2 + 0, y: 0.05, z: z - 12 + i * 12 });
        for (let k = 0; k < 5; k++) c.vc.box(3.2, 0.1, 0.5, '#4a2f1e', { x: s * 12.2, y: 0.12, z: z - 14.4 + i * 12 + k * 1.1 });
      }
      for (const dz of [-1.4, 1.4]) c.vc.cyl(0.05, 0.05, 2.6, '#5a3d24', { x: s * 14.6, y: 1.3, z: z + 18 + dz }, 4);
      c.vc.box(0.05, 0.05, 2.8, '#5a3d24', { x: s * 14.6, y: 2.6, z: z + 18 });
      c.vc.box(0.5, 0.3, 0.5, '#8a8f99', { x: s * 14.6, y: 1.8, z: z + 18 });
      for (const [k, pz] of [[0, -20], [1, 20]] as const) {
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: s * 14.2, y: 1.15, z: z + pz }, 4);
        c.vc.cone(1.5, 0.5, ['#c98f3a', '#3f6b3a'][k]!, { x: s * 14.2, y: 2.4, z: z + pz }, 8);
      }
      FLORA.cocoa!(c, s * 38, z - 16);
      FLORA.kola!(c, s * 38, z + 14);
      board(c, 'ondo-market', 'COCOA MARKET', COCOA, '#f4e6c8', 7.4, 2.0, s * 11.4, 5.6, z - 22, -s * 1.5);
    }),

    /**
     * Hill steps: two bare grey granite domes of different heights, a plain concrete stair with
     * rails climbing the near flank of the lower one with two rest platforms, boulders, scrub and
     * trees at their feet. Nothing on top and nothing beside the steps: no building, shrine,
     * palace, belfry or burial ground, and no named rock.
     */
    'ondo.hill-steps': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const R = 17;
      const H = 21;
      const cx = s * 54;
      c.vc.cap(1, Math.PI / 2, ROCK, { x: cx, y: 0, z: z - 6, sx: R, sy: H, sz: R }, 12);
      c.vc.cap(1, Math.PI / 2, '#9a9b94', { x: s * 80, y: 0, z: z + 16, sx: 14, sy: 28, sz: 14 }, 12);
      for (const [bx, bz, br] of [[s * 40, z - 16, 1.6], [s * 38, z + 4, 2.0], [s * 66, z - 20, 1.8], [s * 62, z + 22, 2.2]] as const) c.vc.sphere(br, '#85867f', { x: bx, y: br * 0.45, z: bz, sy: 0.7 }, 6);
      const steps = 16;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const x = 37 + t * 11.5;
        const r = Math.abs(54 - x);
        const y = H * Math.sqrt(Math.max(0, 1 - (r / R) ** 2));
        c.vc.box(1.1, 0.3, 2.6, '#c2beb2', { x: s * x, y: y + 0.15, z: z - 6 });
        if (i % 3 === 0) for (const e of [-1, 1]) c.vc.cyl(0.05, 0.05, 1.0, '#6a6a68', { x: s * x, y: y + 0.65, z: z - 6 + e * 1.3 }, 4);
        if (i === 5 || i === 10) c.vc.box(3.2, 0.3, 4.2, '#b5b0a2', { x: s * x, y: y + 0.12, z: z - 6 });
      }
      for (let i = 0; i < 5; i++) c.vc.sphere(1.6, i % 2 ? '#5f7a4a' : '#6f8a52', { x: s * (40 + i * 2.4), y: 1.0 + i * 0.1, z: z - 14 + (i % 3) * 8, sy: 0.6 }, 5);
      FLORA['forest-giant']?.(c, s * 30, z - 18);
      FLORA['forest-giant']?.(c, s * 30, z + 14);
      FLORA.kola!(c, s * 14, z + 20);
      board(c, 'hill-steps', 'HILL STEPS', DEEP, '#f2eed8', 6.0, 1.8, s * 11.4, 4.6, z - 24, -s * 1.5);
    }),

    /**
     * A lagoon landing: murky green-brown water, a mangrove edge, a plank walkway on posts, two
     * stilt sheds with zinc roofs, dugout canoes, a plain white-roofed ferry boat and a few fish
     * tables under parasols. A working landing: no flood, wreck, spill or eroded-house scene.
     */
    'ondo.lagoon-landing': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(46, 0.12, 56, '#7f9a8c', { x: s * 46, y: 0.05, z });
      c.vc.box(46.6, 0.05, 56.6, '#a89a74', { x: s * 46, y: 0.02, z });
      c.vc.box(9, 0.9, 54, '#8a9a56', { x: s * 17, y: 0.4, z, rz: s * 0.12 });
      c.vc.box(2.2, 0.16, 24, '#7a5a3a', { x: s * 30, y: 0.6, z });
      for (let i = 0; i < 8; i++) for (const dz of [-0.9, 0.9]) c.vc.cyl(0.1, 0.1, 1.2, '#5a3d24', { x: s * (23 + i * 3.2), y: 0.3, z: z + dz * 0 + dz * 11 }, 4);
      for (const [pz, k] of [[-12, 0], [8, 1]] as const) {
        const x = s * (38 + k * 4);
        for (const [dx, dz] of [[-2, -2.4], [2, -2.4], [-2, 2.4], [2, 2.4]] as const) c.vc.cyl(0.14, 0.14, 2.0, '#5a3d24', { x: x + dx, y: 0.7, z: z + pz + dz }, 4);
        c.vc.box(5, 0.2, 6.4, '#8a6a42', { x, y: 1.7, z: z + pz });
        c.vc.box(4.6, 2.2, 6, k ? CREAM : SAGE, { x, y: 2.9, z: z + pz });
        c.vc.prism(5.6, 1.1, 7, '#8f8b82', { x, y: 4.6, z: z + pz });
        c.vc.box(2.0, 0.14, 12, '#7a5a3a', { x: s * 33 + k * 1.5, y: 1.6, z: z + pz + 0, ry: Math.PI / 2 });
      }
      for (let i = 0; i < 3; i++) {
        c.vc.box(1.0, 0.5, 6, ['#c98f3a', '#3b6a8a', '#7a5a3a'][i]!, { x: s * (28 + i * 2.4), y: 0.35, z: z + 16 + i * 2, ry: 0.2 });
        c.vc.cone(0.5, 1.2, ['#c98f3a', '#3b6a8a', '#7a5a3a'][i]!, { x: s * (28 + i * 2.4), y: 0.35, z: z + 12.6 + i * 2, rx: Math.PI / 2 }, 4);
      }
      c.vc.box(4.2, 0.9, 13, '#f2eee0', { x: s * 48, y: 0.55, z: z - 6 });
      c.vc.box(4.2, 0.25, 13, '#3b6a8a', { x: s * 48, y: 0.95, z: z - 6 });
      c.vc.box(3.8, 0.1, 9, '#e0d8c0', { x: s * 48, y: 2.1, z: z - 6 });
      for (const dz of [-3.6, 3.6]) for (const dx of [-1.6, 1.6]) c.vc.cyl(0.06, 0.06, 1.1, '#8a8f99', { x: s * 48 + dx, y: 1.5, z: z - 6 + dz }, 4);
      for (let i = 0; i < 3; i++) {
        c.vc.box(1.8, 0.12, 0.9, '#a58a5a', { x: s * 21, y: 0.8, z: z + 6 + i * 3 });
        for (let k = 0; k < 4; k++) c.vc.box(0.35, 0.08, 0.12, '#c8ced0', { x: s * 21 - 0.6 + k * 0.4, y: 0.88, z: z + 6 + i * 3 });
        c.vc.cyl(0.04, 0.04, 1.8, '#5a3d24', { x: s * 20.4, y: 1.5, z: z + 6 + i * 3 }, 4);
        c.vc.cone(1.1, 0.4, ['#c98f3a', '#3f6b3a', '#e8dcc0'][i]!, { x: s * 20.4, y: 2.0, z: z + 6 + i * 3 }, 8);
      }
      FLORA.mangrove!(c, s * 24, z - 22);
      FLORA.mangrove!(c, s * 26, z + 24);
      FLORA.raffia!(c, s * 13.5, z + 26);
      FLORA.oilpalm!(c, s * 13.8, z - 24);
      board(c, 'lagoon-landing', 'LAGOON LANDING', DEEP, '#f2eed8', 6.6, 1.8, s * 11.4, 4.8, z - 26, -s * 1.5);
    }),

    /**
     * A river crossing: a long low concrete beam bridge with plain rails on square piers along
     * the road side, a wide brown river with sandy banks, cocoa and kola trees on both banks and
     * a dugout canoe under the span. Plain and generic: no named bridge, plaque or dam.
     */
    'ondo.river-crossing': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(44, 0.12, 56, '#8a7a52', { x: s * 52, y: 0.06, z });
      for (const [bx, bz, bw] of [[40, 22, 10], [64, -18, 12]] as const) c.vc.box(bw, 0.2, bw * 0.7, '#cbb98a', { x: s * bx, y: 0.14, z: z + bz });
      c.vc.box(9, 0.9, 50, '#c9c5b8', { x: s * 24, y: 4.4, z });
      for (const e of [-1, 1]) c.vc.box(0.3, 0.9, 50, '#9a958a', { x: s * 24 + e * 4.4, y: 5.25, z });
      for (let i = 0; i < 5; i++) {
        const pz = z - 20 + i * 10;
        for (const dx of [-2.6, 2.6]) c.vc.box(1.4, 4.4, 1.4, '#b5ae9e', { x: s * 24 + dx, y: 2.2, z: pz });
        c.vc.box(7.4, 0.7, 1.8, '#a39d92', { x: s * 24, y: 3.9, z: pz });
      }
      c.vc.box(1.0, 0.45, 5, '#7a5a3a', { x: s * 32, y: 0.3, z: z + 2, ry: 0.15 });
      for (const [fx, fz] of [[14, -20], [14, 20], [16, 0], [34, -28]] as const) FLORA['forest-giant']?.(c, s * fx, z + fz);
      FLORA.cocoa!(c, s * 13.2, z - 12);
      FLORA.kola!(c, s * 13.4, z + 10);
      board(c, 'river-crossing', 'RIVER CROSSING', DEEP, '#f2eed8', 6.6, 1.8, s * 11.4, 4.8, z - 24, -s * 1.5);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'ondo.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'ondo-stadium', name: 'TOWNSHIP STADIUM', bg: DEEP, fg: '#f4f1ea', stand: BLOCK, roof: '#a8adb0', gate: CREAM });
      FLORA.cocoa!(c, s * 14.5, c.zMid - 22);
      FLORA.oilpalm!(c, s * 14.5, c.zMid + 24);
    }),
  });
}
