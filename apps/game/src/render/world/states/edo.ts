import { FLORA } from '../flora';
import { flyoverDeck, board, piece, sideOf, stadiumBlock } from './common';
import { registerPieces } from '../pieces';

/**
 * Edo's set pieces (docs/research/states/edo.md), original stylised models: a lock-up produce
 * market, a row of brass-casting workshops (furnaces, moulds and ingots, no heads or figures), a
 * road cut through a tree-lined earth bank, a big round junction with a flyover going up behind
 * hoardings and a township stadium. Red earth, cream render and rubber-tree green; no palace,
 * shrine, statue, regalia, bronze portrait or flag anywhere.
 */
const CREAM = '#ede0c6';
const TERRA = '#c98f6a';
const EARTH = '#8a4b32';
const DEEP = '#4a3328';
const BLOCK = '#bdb7a6';
const ZINC = '#98948a';

export function registerEdoPieces() {
  registerPieces({
    /**
     * A produce market: two long zinc-roofed lock-up ranges with open fronts, stacked garri bags,
     * plantain bunches and yam sacks, wooden stalls with parasols at the kerb and a few handcarts.
     */
    'edo.produce-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let row = 0; row < 2; row++) {
        const x = s * (17 + row * 12);
        for (const dz of [-1, 1]) for (const dx of [-3.4, 3.4]) c.vc.cyl(0.08, 0.08, 3.2, '#5a3d24', { x: x + dx, y: 1.6, z: z + dz * 17 }, 4);
        c.vc.prism(8.2, 1.3, 36, row ? '#8f8b82' : ZINC, { x, y: 3.7, z });
        c.vc.box(7.2, 0.4, 35, '#7a5a3a', { x, y: 0.2, z });
        c.vc.box(7.4, 2.4, 0.3, CREAM, { x, y: 1.4, z: z - 18 });
        for (let i = 0; i < 10; i++) {
          const zi = z - 16 + i * 3.5;
          const kind = (i + row) % 3;
          if (kind === 0) for (let k = 0; k < 4; k++) c.vc.box(0.75, 0.42, 1.0, k % 2 ? '#d8c9a0' : '#c9b58a', { x: x - 1.8 + (k % 2) * 0.85, y: 0.62 + (k >> 1) * 0.42, z: zi });
          else if (kind === 1) for (let k = 0; k < 3; k++) c.vc.cone(0.4, 1.0, k % 2 ? '#a8b84a' : '#8fa83a', { x: x - 1.3 + k * 1.0, y: 0.75, z: zi }, 6);
          else for (let k = 0; k < 4; k++) c.vc.sphere(0.42, k % 2 ? '#b8744a' : '#a8643c', { x: x - 1.4 + k * 0.9, y: 0.6, z: zi, sy: 0.8 }, 5);
        }
      }
      for (let i = 0; i < 2; i++) {
        c.vc.box(1.0, 0.14, 2.0, '#7a5a3a', { x: s * 12.6, y: 0.6, z: z - 8 + i * 16 });
        for (const dx of [-0.55, 0.55]) c.vc.cyl(0.38, 0.38, 0.1, '#1a1a1a', { x: s * 12.6 + dx, y: 0.38, z: z - 8 + i * 16, rz: Math.PI / 2 }, 8);
      }
      for (const [k, pz] of [[0, -14], [1, 12]] as const) {
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: s * 14.4, y: 1.15, z: z + pz }, 4);
        c.vc.cone(1.5, 0.5, ['#c98f3a', '#5a7a4a'][k]!, { x: s * 14.4, y: 2.4, z: z + pz }, 8);
      }
      FLORA.oilpalm!(c, s * 38, z - 16);
      FLORA.rubber!(c, s * 38, z + 18);
      board(c, 'edo-market', 'PRODUCE MARKET', DEEP, '#fff1cf', 7.6, 2.0, s * 11.4, 5.6, z - 21, -s * 1.5);
    }),

    /**
     * A brass casters' row: five low workshops side by side, each with a clay furnace chimney, a
     * stack of moulds, an anvil block and an ingot pile at the door, shaded by one long awning.
     * Tools and metal only: no figure, head, plaque or regalia of any kind.
     */
    'edo.brass-row': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(8, 0.12, 50, '#a8785a', { x: s * 19, y: 0.06, z });
      for (let i = 0; i < 5; i++) {
        const wz = z - 20 + i * 10;
        c.vc.box(6.4, 3.0, 8, [CREAM, TERRA, '#dcc9a6', CREAM, '#d6b08a'][i]!, { x: s * 22, y: 1.5, z: wz });
        c.vc.prism(7.0, 1.0, 8.8, i % 2 ? '#8f8b82' : ZINC, { x: s * 22, y: 3.3, z: wz });
        c.vc.cyl(0.5, 0.7, 4.4, '#7a4a38', { x: s * 24.4, y: 4.2, z: wz + 2.5 }, 6);
        c.vc.box(0.1, 1.8, 3.2, '#2a1a12', { x: s * 18.7, y: 1.1, z: wz });
        for (let k = 0; k < 3; k++) c.vc.cyl(0.32, 0.26, 0.55, '#a8643c', { x: s * 17.2, y: 0.4 + (k >> 1) * 0.5, z: wz - 1.8 + k * 0.9 + (k >> 1) * 0.3 }, 7);
        c.vc.box(0.7, 0.55, 0.7, '#4a4a4c', { x: s * 16.5, y: 0.3, z: wz + 2.6 });
        for (let k = 0; k < 4; k++) c.vc.box(0.5, 0.2, 0.28, '#c8a64a', { x: s * 16.3, y: 0.12 + (k >> 1) * 0.2, z: wz + 1.4 + (k % 2) * 0.55 });
      }
      c.vc.box(2.6, 0.14, 50, '#6a6258', { x: s * 15.6, y: 2.6, z });
      for (let i = 0; i < 6; i++) c.vc.cyl(0.07, 0.07, 2.6, '#5a3d24', { x: s * 14.4, y: 1.3, z: z - 24 + i * 9.6 }, 4);
      FLORA.oilpalm!(c, s * 34, z - 20);
      FLORA.rubber!(c, s * 34, z + 20);
      FLORA.mango!(c, s * 38, z);
      board(c, 'brass-row', "BRASS CASTERS' ROW", DEEP, '#f2d9a0', 7.6, 1.9, s * 11.4, 5.0, z - 25, -s * 1.5);
    }),

    /**
     * A moat gate: a long earth rampart across the road's side, cut by a sunken lane. Two steep
     * red-earth banks crowned with trees and bush, a dry ditch with green water at its foot, a
     * plain culvert-bridge over the ditch and a signpost. Only the earthwork: no gate carvings.
     */
    'edo.moat-gate': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (const e of [-1, 1]) {
        const bz = z + e * 12;
        c.vc.cap(1, Math.PI / 2, '#8a4b32', { x: s * 36, y: -1, z: bz, sx: 22, sy: 6.5, sz: 7.5 }, 8);
        c.vc.cap(1, Math.PI / 2, '#7a6a3a', { x: s * 36, y: 4.2, z: bz, sx: 18, sy: 1.4, sz: 6 }, 8);
        for (let k = 0; k < 4; k++) FLORA['forest-giant']?.(c, s * (24 + k * 6.5), bz + (k % 2 ? 2.4 : -2.4) * e);
      }
      c.vc.box(34, 0.1, 6, '#9a5a3a', { x: s * 34, y: 0.06, z });
      c.vc.box(5, 0.08, 56, '#5a7a4a', { x: s * 18, y: 0.02, z });
      c.vc.box(8, 0.7, 5.6, '#b5ada0', { x: s * 18, y: 0.35, z });
      for (const e of [-1, 1]) c.vc.box(8, 0.8, 0.3, '#9a968b', { x: s * 18, y: 0.95, z: z + e * 2.8 });
      c.vc.cyl(0.07, 0.07, 2.6, '#5a3d24', { x: s * 12.6, y: 1.3, z: z - 4 }, 4);
      for (let i = 0; i < 3; i++) c.vc.sphere(0.9, ['#6a8a4a', '#5a7a3a', '#7a9a52'][i]!, { x: s * (14 + i * 3), y: 0.6, z: z + 6.5, sy: 0.7 }, 5);
      FLORA.rubber!(c, s * 14, z - 10);
      FLORA.oilpalm!(c, s * 13.5, z + 12);
      board(c, 'moat-gate', 'MOAT GATE', DEEP, '#f2e6c8', 6.0, 1.8, s * 11.4, 4.6, z - 15, -s * 1.5);
    }),

    /**
     * The ring junction: a large round island with planted palms and a plain pillar, lamp posts,
     * and beside it a flyover going up (a short deck on piers) behind blue hoardings and a crane.
     * Generic: no king, square name, statue or flag.
     */
    'edo.ring-junction': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 28;
      c.vc.cyl(11, 11, 0.3, '#4f5558', { x: cx, y: 0.1, z }, 24);
      c.vc.cyl(9.8, 9.8, 0.6, '#cfc9b8', { x: cx, y: 0.3, z }, 24);
      c.vc.cyl(8.8, 8.8, 0.7, '#7fa05a', { x: cx, y: 0.35, z }, 24);
      c.vc.cyl(1.4, 1.8, 5.4, CREAM, { x: cx, y: 3.0, z }, 8);
      c.vc.cyl(1.9, 1.9, 0.4, EARTH, { x: cx, y: 5.9, z }, 8);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        FLORA.oilpalm!(c, cx + Math.cos(a) * 6.2, z + Math.sin(a) * 6.2);
      }
      for (let i = 0; i < 4; i++) {
        c.vc.cyl(0.07, 0.09, 5.6, '#7a7a76', { x: s * 12.4, y: 2.8, z: z - 18 + i * 12 }, 5);
        c.vc.box(1.0, 0.1, 0.6, '#2f3a44', { x: s * 12.4, y: 5.7, z: z - 18 + i * 12 });
      }
      flyoverDeck(c, s * 50, z + 4, 28, 5.2, '#b9b4a8', '#9a968b');
      for (let i = 0; i < 5; i++) c.vc.box(5.6, 2.2, 0.2, i % 2 ? '#3d6a9a' : '#e8e4d8', { x: s * 50 - 5.8 + i * 0, y: 1.1, z: z - 14 + i * 5.6, ry: Math.PI / 2 });
      c.vc.cyl(0.3, 0.4, 16, '#c8a62a', { x: s * 50 + 8, y: 8, z: z - 12 }, 5);
      c.vc.box(0.5, 0.5, 11, '#c8a62a', { x: s * 50 + 8, y: 16, z: z - 7.5 });
      c.vc.box(9, 9, 9, CREAM, { x: s * 20, y: 4.5, z: z - 24 });
      c.vc.box(9, 6, 9, TERRA, { x: s * 20, y: 3, z: z + 24 });
      board(c, 'ring-junction', 'RING ROAD', DEEP, '#f2e6c8', 6.4, 1.8, cx - s * 3.4, 5.4, z - 12, s * 0.9);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'edo.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'edo-stadium', name: 'TOWNSHIP STADIUM', bg: DEEP, fg: '#f4f1ea', stand: BLOCK, roof: '#a8adb0', gate: CREAM });
      FLORA.oilpalm!(c, s * 14.5, c.zMid - 22);
      FLORA.rubber!(c, s * 14.5, c.zMid + 24);
    }),
  });
}
