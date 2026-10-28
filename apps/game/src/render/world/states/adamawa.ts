import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, flyoverDeck, piece, sideOf, stadiumBlock } from './common';

/**
 * Adamawa's set pieces (docs/research/states/adamawa.md), original stylised models: a market of
 * grain and onion sacks and cloth stalls under baobab and neem shade, a granite hill with
 * stone-walled terraces and a few round clay huts, a junction flyover over a crossing road, a
 * lakeside earth dam with a spillway and a township stadium. Savanna ochre, granite grey and
 * field green; no palace, shrine, wall circuit, herd, flag or person anywhere.
 */
const OCHRE = '#d8b878';
const DEEP = '#3a3224';
const BLOCK = '#bdb7a6';
const ZINC = '#98948a';
const STONE = '#8e8f89';
const WATER = '#6f9aa8';

export function registerAdamawaPieces() {
  registerPieces({
    /**
     * A market: two open zinc ranges with heaped grain sacks, mesh sacks of onions, folded cloth
     * and basins on low tables, a red hydrant post, two parasol stalls and baobab and neem shade.
     * Goods only: no figure, no herd, no sign of the fires or floods that have hit the old markets.
     */
    'adamawa.market': piece('venue', (c, side) => {
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
          if (kind === 0) for (let k = 0; k < 4; k++) c.vc.box(0.9, 0.55, 1.2, k % 2 ? '#e8dcc0' : '#d8c8a0', { x: x - 1.4 + (k % 2) * 1.2, y: 0.7 + (k >> 1) * 0.55, z: zi });
          else if (kind === 1) for (let k = 0; k < 3; k++) c.vc.sphere(0.5, ['#a8423a', '#9a3a5a', '#b04a3a'][k]!, { x: x - 1.2 + k * 1.1, y: 0.75, z: zi, sy: 0.8 }, 6);
          else for (let k = 0; k < 3; k++) c.vc.box(0.9, 0.25, 0.7, ['#e8e2d0', '#2f4560', '#c9a56a'][k]!, { x: x - 1.1 + k * 1.1, y: 0.65 + k * 0.1, z: zi });
        }
      }
      c.vc.cyl(0.25, 0.25, 1.0, '#b83a2a', { x: s * 12.4, y: 0.5, z: z + 6 }, 6);
      c.vc.sphere(0.3, '#b83a2a', { x: s * 12.4, y: 1.05, z: z + 6 }, 6);
      for (const [k, pz] of [[0, -20], [1, 20]] as const) {
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: s * 14.2, y: 1.15, z: z + pz }, 4);
        c.vc.cone(1.5, 0.5, ['#c98f3a', '#3f6f84'][k]!, { x: s * 14.2, y: 2.4, z: z + pz }, 8);
      }
      FLORA.baobab!(c, s * 40, z - 14);
      FLORA.neem!(c, s * 38, z + 16);
      board(c, 'adamawa-market', 'MARKET', DEEP, '#fff1cf', 5.2, 2.0, s * 11.4, 5.6, z - 22, -s * 1.5);
    }),

    /**
     * Mandara terraces: a rounded granite hill whose flank is cut into six stone-walled terraces,
     * each a grey wall with a strip of green or ochre field on top, a path zigzagging between
     * them, a few round clay huts with conical thatch at the foot and a hedge of scrub. No palace,
     * gate stones, wall circuit, shrine or burial ground.
     */
    'adamawa.terraces': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.cap(1, Math.PI / 2, '#8a8b84', { x: s * 62, y: 0, z: z - 4, sx: 24, sy: 26, sz: 22 }, 12);
      for (let i = 0; i < 6; i++) {
        const w = 40 - i * 4.6;
        const x = s * (36 + i * 3.4);
        c.vc.box(3.2, 1.0, w, STONE, { x, y: 0.5 + i * 1.7, z: z - 4 });
        c.vc.box(3.0, 0.15, w - 0.6, i % 2 ? '#b8a46c' : '#8a9a50', { x, y: 1.05 + i * 1.7, z: z - 4 });
      }
      for (let i = 0; i < 5; i++) c.vc.box(0.7, 0.12, 2.4, '#c4bfae', { x: s * (37.5 + i * 3.4), y: 1.1 + i * 1.7, z: z - 4 + (i % 2 ? 6 : -6), ry: 0.4 });
      for (const [hx, hz] of [[24, -14], [26, 2], [22, 14]] as const) {
        c.vc.cyl(1.4, 1.5, 2.1, '#b08a64', { x: s * hx, y: 1.05, z: z + hz }, 8);
        c.vc.cone(2.1, 1.6, '#c9b878', { x: s * hx, y: 2.9, z: z + hz }, 8);
      }
      c.vc.box(8, 0.5, 0.5, STONE, { x: s * 24, y: 0.25, z: z - 6 });
      for (let i = 0; i < 4; i++) c.vc.sphere(1.3, '#85867f', { x: s * (28 + i * 3), y: 0.5, z: z + 20 + (i % 2) * 2, sy: 0.7 }, 6);
      FLORA.acacia!(c, s * 14, z - 20);
      FLORA.neem!(c, s * 14.5, z + 22);
      FLORA.scrub!(c, s * 18, z + 8);
      board(c, 'adamawa-terraces', 'MANDARA TERRACES', DEEP, '#f2eed8', 7.4, 1.8, s * 11.4, 4.8, z - 26, -s * 1.5);
    }),

    /**
     * A junction flyover: a concrete deck on piers along the road side, a crossing road running
     * away beneath it with white markings, lamp posts and a signal on the near corner. Generic: no
     * brand, name, plaque or person.
     */
    'adamawa.junction-flyover': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      flyoverDeck(c, s * 26, z, 32, 6.0, '#cdc9bc', '#a29d92');
      c.vc.box(50, 0.08, 9, '#4a4c4e', { x: s * 36, y: 0.05, z: z + 4 });
      for (let i = 0; i < 6; i++) c.vc.box(2.2, 0.04, 0.3, '#e8e8e0', { x: s * (16 + i * 6), y: 0.1, z: z + 4 });
      for (let i = 0; i < 4; i++) {
        c.vc.cyl(0.08, 0.08, 5, '#6a6a68', { x: s * 12.4, y: 2.5, z: z - 22 + i * 10 }, 4);
        c.vc.box(1.4, 0.2, 0.4, '#e4e0c8', { x: s * 12.8, y: 5.0, z: z - 22 + i * 10 });
      }
      c.vc.cyl(0.1, 0.1, 3.4, '#5a5e62', { x: s * 12.4, y: 1.7, z: z + 10 }, 5);
      c.vc.box(0.4, 1.1, 0.3, '#2a2c30', { x: s * 12.4, y: 3.6, z: z + 10 });
      c.vc.box(0.18, 0.18, 0.08, '#d9442a', { x: s * 12.4, y: 3.9, z: z + 10.15 });
      FLORA.neem!(c, s * 44, z - 18);
      FLORA.baobab!(c, s * 48, z + 22);
      FLORA.acacia!(c, s * 15, z + 22);
      board(c, 'adamawa-flyover', 'JUNCTION', DEEP, '#f2eed8', 4.6, 1.6, s * 11.4, 4.6, z - 26, -s * 1.5);
    }),

    /**
     * A lakeside dam: a grassy earth embankment along the road side with a gravel crest, a short
     * concrete spillway with steps at one end, calm blue-grey water on the far side, reed beds
     * and one dugout canoe. Still water, no release, flood or evacuation.
     */
    'adamawa.lakeside-dam': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(40, 0.12, 58, WATER, { x: s * 56, y: 0.05, z });
      c.vc.prism(20, 5.4, 52, '#7f8f56', { x: s * 26, y: 2.7, z });
      c.vc.box(3.0, 0.2, 52, '#b8b0a0', { x: s * 26, y: 5.5, z });
      for (let i = 0; i < 6; i++) c.vc.cyl(0.1, 0.1, 1.0, '#6a6a68', { x: s * 24.2, y: 6.0, z: z - 22 + i * 8.8 }, 4);
      for (let i = 0; i < 5; i++) c.vc.box(5.5 - i * 0.4, 0.4, 3.0, '#c8c4b8', { x: s * (30 - i * 2.2), y: 1.2 + (4 - i) * 0.1, z: z + 19, rz: 0 });
      c.vc.box(7, 3.4, 3, '#b6b2a6', { x: s * 18, y: 1.7, z: z + 19 });
      c.vc.box(1.0, 0.45, 5, '#7a5a3a', { x: s * 52, y: 0.3, z: z - 6, ry: 0.2 });
      FLORA.reedbed!(c, s * 44, z - 18);
      FLORA.reedbed!(c, s * 46, z + 8);
      FLORA.acacia!(c, s * 13.4, z - 22);
      FLORA.neem!(c, s * 14, z + 24);
      board(c, 'adamawa-dam', 'LAKESIDE DAM', DEEP, '#f2eed8', 6.2, 1.8, s * 11.4, 4.8, z - 26, -s * 1.5);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'adamawa.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'adamawa-stadium', name: 'TOWNSHIP STADIUM', bg: DEEP, fg: '#f4f1ea', stand: BLOCK, roof: '#a8adb0', gate: OCHRE });
      FLORA.neem!(c, s * 14.5, c.zMid - 22);
      FLORA.baobab!(c, s * 15, c.zMid + 24);
    }),
  });
}
