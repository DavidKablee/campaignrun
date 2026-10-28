import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, piece, sideOf, stadiumBlock, steelTruss } from './common';

/**
 * Benue's set pieces (docs/research/states/benue.md), original stylised models: a market of yam
 * and cassava heaps under mango shade, a long steel through-truss river bridge over a wide brown
 * river, a yam market of racked tuber stacks, storage sheds and a loading lorry, a riverbank
 * landing of canoes and drying nets and a township stadium. Savanna green, river brown and
 * steel grey; no herd, herder, flood scene, deity, flag or person anywhere.
 */
const CREAM = '#ece2c8';
const OCHRE = '#d8b878';
const TEAL = '#2f6f8f';
const DEEP = '#33403a';
const BLOCK = '#bdb7a6';
const ZINC = '#98948a';
const RIVER = '#8a7a5a';

export function registerBenuePieces() {
  registerPieces({
    /**
     * A market: two open zinc ranges with pyramids of yam tubers, mounds of cassava and baskets of
     * oranges, sacks of soya, a couple of stalls with parasols and a large mango tree for shade.
     */
    'benue.market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let row = 0; row < 2; row++) {
        const x = s * (17 + row * 11.5);
        for (const dz of [-1, 1]) for (const dx of [-3.2, 3.2]) c.vc.cyl(0.08, 0.08, 3.1, '#5a3d24', { x: x + dx, y: 1.55, z: z + dz * 17 }, 4);
        c.vc.prism(7.8, 1.3, 36, row ? '#8f8b82' : ZINC, { x, y: 3.6, z });
        c.vc.box(6.8, 0.4, 35, '#7a5a3a', { x, y: 0.2, z });
        for (let i = 0; i < 9; i++) {
          const zi = z - 15 + i * 3.8;
          const kind = (i + row) % 3;
          if (kind === 0) for (let k = 0; k < 6; k++) c.vc.cyl(0.14, 0.14, 1.0, k % 2 ? '#b0824a' : '#9a6e3e', { x: x - 1.2 + (k % 3) * 0.5, y: 0.6 + (k >> 2) * 0.28, z: zi + (k % 2) * 0.3, rz: (k % 3 - 1) * 0.5 }, 5);
          else if (kind === 1) c.vc.cone(1.0, 1.0, '#c8a878', { x, y: 0.7, z: zi }, 8);
          else for (let k = 0; k < 3; k++) c.vc.cyl(0.42, 0.34, 0.5, k % 2 ? '#d98a2a' : '#c47a1e', { x: x - 1.2 + k * 1.1, y: 0.65, z: zi }, 8);
        }
      }
      for (let i = 0; i < 2; i++) {
        c.vc.box(1.0, 0.14, 2.0, '#7a5a3a', { x: s * 12.6, y: 0.6, z: z - 8 + i * 16 });
        for (let k = 0; k < 3; k++) c.vc.cyl(0.14, 0.14, 0.9, '#b0824a', { x: s * 12.6, y: 0.78, z: z - 8.5 + i * 16 + k * 0.5, rz: Math.PI / 2 }, 5);
      }
      for (const [k, pz] of [[0, -14], [1, 12]] as const) {
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: s * 14.2, y: 1.15, z: z + pz }, 4);
        c.vc.cone(1.5, 0.5, ['#c98f3a', TEAL][k]!, { x: s * 14.2, y: 2.4, z: z + pz }, 8);
      }
      FLORA.mango!(c, s * 38, z - 16);
      FLORA.mango!(c, s * 38, z + 14);
      FLORA.shea!(c, s * 46, z);
      board(c, 'benue-market', 'MARKET', DEEP, '#fff1cf', 5.6, 2.0, s * 11.4, 5.6, z - 21, -s * 1.5);
    }),

    /**
     * The old bridge: a long steel through-truss carrying road and rail on round piers over a
     * wide brown river, high sandy banks, canoes on the water and savanna trees on the near bank.
     * Plain generic grey steel; no plaque, train, person or flood.
     */
    'benue.old-bridge': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(40, 0.12, 60, RIVER, { x: s * 50, y: 0.05, z });
      for (const [bx, bz, bw] of [[46, -18, 12], [62, 8, 14], [34, 22, 9]] as const) c.vc.box(bw, 0.22, bw * 0.7, '#d4c08a', { x: s * bx, y: 0.14, z: z + bz });
      steelTruss(c, s * 26, z, 52, 5.0, '#7d858b', '#6a6d6e', 1.6);
      for (let i = 0; i < 2; i++) c.vc.box(0.12, 0.1, 50, '#4a4a48', { x: s * (24.4 + i * 3), y: 5.5, z });
      for (let i = 0; i < 3; i++) {
        c.vc.box(1.0, 0.45, 5, i % 2 ? '#c98f3a' : '#7a5a3a', { x: s * (40 + i * 4), y: 0.3, z: z - 6 + i * 9, ry: 0.15 });
        c.vc.cone(0.5, 1.1, i % 2 ? '#c98f3a' : '#7a5a3a', { x: s * (40 + i * 4), y: 0.3, z: z - 3.5 + i * 9, rx: Math.PI / 2 }, 4);
      }
      FLORA.mango!(c, s * 14, z - 20);
      FLORA.shea!(c, s * 15, z + 22);
      FLORA.acacia!(c, s * 13.4, z + 4);
      board(c, 'old-bridge', 'OLD BRIDGE', DEEP, '#f2eed8', 5.6, 1.8, s * 11.4, 4.8, z - 28, -s * 1.5);
    }),

    /**
     * A yam market: long racks stacked with heaped tuber piles, two low storage sheds, sacks, a
     * flat-bed lorry backed in with tubers on its bed, and a yam barn at the edge. Goods only.
     */
    'benue.yam-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let row = 0; row < 3; row++) {
        const x = s * (16 + row * 7);
        c.vc.box(3.6, 0.3, 36, '#7a5a3a', { x, y: 0.25, z });
        for (let i = 0; i < 12; i++) {
          const pz = z - 16.5 + i * 3;
          c.vc.cone(1.4, 1.1, i % 2 ? '#b0824a' : '#9a6e3e', { x, y: 0.9, z: pz }, 8);
          for (let k = 0; k < 3; k++) c.vc.cyl(0.13, 0.13, 0.9, '#a87a44', { x: x - 0.4 + k * 0.4, y: 1.5 + (k % 2) * 0.1, z: pz, rz: (k - 1) * 0.5 }, 5);
        }
      }
      for (const dz of [-18, 18]) {
        c.vc.box(7, 3.2, 8, CREAM, { x: s * 40, y: 1.6, z: z + dz });
        c.vc.prism(7.8, 1.2, 8.8, ZINC, { x: s * 40, y: 3.7, z: z + dz });
      }
      c.vc.box(2.8, 0.3, 8.4, '#4a4a4c', { x: s * 33, y: 0.7, z: z + 2 });
      c.vc.box(2.8, 1.4, 2.2, '#c98f3a', { x: s * 33, y: 1.5, z: z + 6.6 });
      for (let k = 0; k < 8; k++) c.vc.cyl(0.17, 0.17, 1.0, '#a87a44', { x: s * (32.2 + (k % 3) * 0.7), y: 1.2 + (k >> 2) * 0.35, z: z - 1 + (k % 4) * 1.1, rz: Math.PI / 2 }, 5);
      for (const [dz] of [[-6], [4]] as const) for (const dx of [-1.0, 1.0]) c.vc.cyl(0.4, 0.4, 0.3, '#1a1a1a', { x: s * 33 + dx * 1.4, y: 0.45, z: z + dz, rz: Math.PI / 2 }, 8);
      FLORA.yambarn!(c, s * 14, z - 24);
      FLORA.mango!(c, s * 14.4, z + 24);
      board(c, 'yam-market', 'YAM MARKET', DEEP, '#fff1cf', 6.0, 2.0, s * 11.4, 5.4, z - 22, -s * 1.5);
    }),

    /**
     * A riverbank landing: a high sandy bank over a wide brown river, canoes drawn up on the sand,
     * fishing nets hung to dry on poles, a plank stair down the bank, a mango tree and rice-straw
     * stack. Working gear only: no person, no flood, no sandbag wall.
     */
    'benue.riverbank': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(46, 0.12, 58, RIVER, { x: s * 50, y: 0.05, z });
      c.vc.box(14, 0.5, 58, '#d4c08a', { x: s * 22, y: 0.22, z, rz: s * 0.06 });
      c.vc.box(3.0, 0.16, 12, '#7a5a3a', { x: s * 30, y: 0.62, z: z + 4 });
      for (let i = 0; i < 4; i++) for (const dz of [-1.4, 1.4]) c.vc.cyl(0.1, 0.1, 0.9, '#5a3d24', { x: s * (29 + i * 0.1), y: 0.3, z: z - 1 + i * 3 + dz * 0 }, 4);
      for (let i = 0; i < 4; i++) {
        const col = ['#7a5a3a', '#c98f3a', '#3b6a8a', '#7a5a3a'][i]!;
        c.vc.box(1.0, 0.5, 6.4, col, { x: s * (24 + (i % 2) * 6), y: 0.45, z: z - 16 + i * 8, ry: 0.4 });
        c.vc.cone(0.5, 1.2, col, { x: s * (24 + (i % 2) * 6), y: 0.45, z: z - 16 + i * 8 - 3.5, rx: Math.PI / 2, ry: 0.4 }, 4);
      }
      for (let i = 0; i < 3; i++) {
        const nz = z - 10 + i * 9;
        for (const dz of [-2.2, 2.2]) c.vc.cyl(0.05, 0.05, 2.6, '#5a3d24', { x: s * 17, y: 1.5, z: nz + dz }, 4);
        c.vc.box(0.04, 1.8, 4.4, '#b8b4a0', { x: s * 17, y: 1.9, z: nz });
        c.vc.box(0.06, 0.06, 4.6, '#5a3d24', { x: s * 17, y: 2.8, z: nz });
      }
      c.vc.cone(1.6, 2.4, '#c9b878', { x: s * 13.6, y: 1.2, z: z + 20 }, 8);
      FLORA.mango!(c, s * 13.4, z - 22);
      FLORA.shea!(c, s * 14, z + 8);
      FLORA.reedbed!(c, s * 40, z + 24);
      board(c, 'riverbank', 'RIVERBANK LANDING', DEEP, '#f2eed8', 6.8, 1.8, s * 11.4, 4.8, z - 26, -s * 1.5);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'benue.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'benue-stadium', name: 'TOWNSHIP STADIUM', bg: DEEP, fg: '#f4f1ea', stand: BLOCK, roof: '#a8adb0', gate: OCHRE });
      FLORA.mango!(c, s * 14.5, c.zMid - 22);
      FLORA.shea!(c, s * 14.5, c.zMid + 24);
    }),
  });
}
