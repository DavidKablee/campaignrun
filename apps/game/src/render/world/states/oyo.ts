import { shade, texBox } from '../../geo';
import { facadeKey } from '../ctx';
import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, flyoverDeck, piece, sideOf } from './common';

/**
 * Oyo's set pieces (docs/research/states/oyo.md), original stylised models: tarp-roofed
 * market lanes with cloth lines, a flyover on a hill with approach ramps, a garden with a
 * lake and play frames, a tall slab tower on a podium, and a reservoir embankment with an
 * intake tower. Rust, limewash, cocoa brown and indigo; no smoke, no animals, no flood,
 * no hall, no palace, no uniform.
 */
const RUST = '#9a4b2e';
const CREAM = '#e9dfc6';
const COCOA = '#6f4a2e';
const INDIGO = '#2e3c69';
const CONCRETE = '#b3b0a6';

export function registerOyoPieces() {
  registerPieces({
    /**
     * Dugbe market: rows of low stalls under patched tarps on poles, indigo-and-white cloth
     * lines, sacks and baskets, handcarts at the kerb, a gate board.
     */
    'oyo.dugbe-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const tarps = [INDIGO, '#cdbb95', CREAM, '#7a2f3e', '#8db1a8'];
      for (let row = 0; row < 3; row++) {
        const x = s * (14 + row * 6.5);
        for (let i = 0; i < 6; i++) {
          const zi = z - 15 + i * 6 + (row % 2) * 2;
          c.vc.box(3.4, 0.7, 1.6, '#6b4a2b', { x, y: 0.35, z: zi });
          for (let h = 0; h < 5; h++) c.vc.sphere(0.32, ['#c2b070', '#8a4a3a', '#d6c59a', '#6f4a2e', '#4f7a3a'][(h + i) % 5]!, { x: x - 1.3 + h * 0.65, y: 0.85, z: zi + (h % 2 ? 0.2 : -0.2), sy: 0.8 }, 6);
          for (const dx of [-1.7, 1.7]) for (const dz of [-0.9, 0.9]) c.vc.cyl(0.05, 0.05, 2.6, '#5a3d24', { x: x + dx, y: 1.3, z: zi + dz }, 4);
          c.vc.box(3.9, 0.07, 2.4, tarps[(i + row) % tarps.length]!, { x, y: 2.65, z: zi, rz: s * 0.09 });
        }
      }
      for (let i = 0; i < 4; i++) {
        const lz = z - 12 + i * 8;
        for (const dz of [-1.4, 1.4]) c.vc.cyl(0.04, 0.04, 2.4, '#5a4330', { x: s * 12.4, y: 1.2, z: lz + dz }, 4);
        c.vc.box(0.05, 0.05, 2.9, '#5a4330', { x: s * 12.4, y: 2.3, z: lz });
        for (let k = 0; k < 4; k++) c.vc.box(0.04, 1.3, 0.6, k % 2 ? '#f1eee4' : INDIGO, { x: s * 12.4, y: 1.55, z: lz - 1.05 + k * 0.7 });
      }
      for (let i = 0; i < 5; i++) c.vc.sphere(0.4, '#d6c59a', { x: s * 12.8 + i * 0.3, y: 0.35, z: z + 16, sy: 1.1 }, 6);
      c.vc.box(0.25, 5, 0.25, '#555', { x: s * 12, y: 2.5, z: z - 18 });
      board(c, 'dugbe', 'DUGBE MARKET', COCOA, '#fff1cf', 8, 2.6, s * 11.4, 6.2, z - 14, -s * 0.5);
    }),

    /**
     * Mokola flyover: a concrete deck on twin piers beside the road at the top of a rise, long
     * sloped approach ramps at each end with retaining walls, lamp posts, and a rank of parked okada.
     */
    'oyo.mokola-flyover': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const fx = s * 30;
      flyoverDeck(c, fx, z, 28, 8.4, CONCRETE, '#8f8b82');
      for (const e of [-1, 1]) {
        c.vc.box(11, 1.0, 20, '#a9a59a', { x: fx, y: 4.2, z: z + e * 24, rx: e * 0.43 });
        for (const dx of [-1, 1]) c.vc.box(0.6, 3.6, 20, '#b0aa9a', { x: fx + dx * 5.6, y: 2.0, z: z + e * 24, rx: e * 0.43 });
      }
      for (const dz of [-1, 1]) c.vc.box(11, 1.2, 4, '#c4beae', { x: fx, y: 0.6, z: z + dz * 38 });
      c.vc.box(0.25, 5, 0.25, '#555', { x: s * 14, y: 2.5, z: z - 8 });
      board(c, 'mokola', 'MOKOLA FLYOVER', '#4a4a4c', '#f4f1ea', 8, 2.4, s * 13.4, 6.2, z - 8, -s * 0.5);
      for (let i = 0; i < 6; i++) {
        const bz = z + 8 + i * 1.1;
        c.vc.box(0.4, 0.45, 1.8, ['#6f7f8c', '#8a4a3a', '#2a2a2c', '#e4dcc6'][i % 4]!, { x: s * 12.6, y: 0.62, z: bz });
        c.vc.box(0.36, 0.14, 0.8, '#1a1a1a', { x: s * 12.6, y: 0.92, z: bz - 0.2 });
        for (const dz of [-0.75, 0.75]) c.vc.cyl(0.3, 0.3, 0.12, '#1a1a1a', { x: s * 12.6, y: 0.3, z: bz + dz, rz: Math.PI / 2 }, 8);
      }
      FLORA['forest-giant']!(c, s * 20, z + 17);
    }),

    /**
     * Agodi Gardens: a gate with the name above it, a calm lake with a wooden pavilion on posts, a
     * play frame with swings, picnic shelters, lawns and tall iroko-type shade trees. No animals.
     */
    'oyo.agodi-gardens': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(24, 0.08, 36, '#5e8a3e', { x: s * 28, y: 0.05, z });
      for (const dz of [-3.6, 3.6]) c.vc.box(1.4, 6.4, 1.4, CREAM, { x: s * 14, y: 3.2, z: z - 13 + dz });
      c.vc.box(1.8, 1.4, 9.2, '#4f7a3a', { x: s * 14, y: 6.6, z: z - 13 });
      board(c, 'agodi', 'AGODI GARDENS', '#4f7a3a', '#f4f1ea', 7.2, 2.0, s * 13.2, 6.8, z - 13, -s * 1.57);
      c.vc.cyl(8.5, 8.5, 0.12, '#6fa0b0', { x: s * 30, y: 0.12, z: z + 5 }, 16);
      c.vc.cyl(8.9, 8.9, 0.08, '#cfc7b5', { x: s * 30, y: 0.09, z: z + 5 }, 16);
      for (const dx of [-1.4, 1.4]) for (const dz of [-1.4, 1.4]) c.vc.cyl(0.1, 0.1, 2.6, '#5a4330', { x: s * 24 + dx, y: 1.3, z: z + 5 + dz }, 4);
      c.vc.box(3.6, 0.18, 3.6, '#8a7358', { x: s * 24, y: 2.7, z: z + 5 });
      c.vc.prism(4.4, 1.2, 4.4, RUST, { x: s * 24, y: 2.8, z: z + 5 });
      c.vc.box(5, 0.16, 1.2, '#8a7358', { x: s * 27.5, y: 0.55, z: z + 5 });
      for (const dz of [-2.6, 2.6]) c.vc.cyl(0.08, 0.08, 3.4, '#9a9a94', { x: s * 22, y: 1.7, z: z - 8 + dz }, 4);
      c.vc.box(0.1, 0.1, 5.4, '#9a9a94', { x: s * 22, y: 3.4, z: z - 8 });
      for (const dz of [-1, 1]) c.vc.box(0.1, 1.4, 0.4, '#2e3c69', { x: s * 22, y: 2.4, z: z - 8 + dz });
      for (let i = 0; i < 2; i++) {
        const px = s * (17 + i * 5.5);
        c.vc.box(3.6, 0.2, 3.6, '#cdbb95', { x: px, y: 2.8, z: z + 15 });
        for (const dx of [-1.5, 1.5]) for (const dz of [-1.5, 1.5]) c.vc.cyl(0.08, 0.08, 2.8, '#5a3d24', { x: px + dx, y: 1.4, z: z + 15 + dz }, 4);
      }
      for (let i = 0; i < 4; i++) FLORA['forest-giant']!(c, s * (16 + i * 8), z - 4 + (i % 2) * 14 - 8);
      FLORA.mango!(c, s * 40, z + 14);
    }),

    /**
     * Cocoa House: a tall slab tower rising from a low podium of shops, a repeating bay of
     * window strips up its faces, a plain crown and a mast. The podium is a mall; there is no
     * dome or sign other than the name.
     */
    'oyo.cocoa-house': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const tx = s * 26;
      const h = 56;
      c.tb.add(facadeKey('plaza', 1), texBox(12, h, 9, 3.5, 3.2), { x: tx, y: h / 2 + 4, z });
      c.vc.box(12.6, 1.2, 9.6, '#bcb6a6', { x: tx, y: h + 4.6, z });
      c.vc.box(8, 3, 6, '#cfc7b5', { x: tx, y: h + 6.7, z });
      c.vc.cyl(0.12, 0.16, 12, '#8a8a86', { x: tx, y: h + 14.2, z }, 5);
      c.vc.box(22, 4, 14, CREAM, { x: tx, y: 2, z });
      c.vc.box(22.4, 0.5, 14.4, shade(CREAM, -0.14), { x: tx, y: 4.2, z });
      for (let i = 0; i < 5; i++) c.vc.box(0.14, 2.4, 2.2, '#2a1f17', { x: tx - s * 11.1, y: 1.4, z: z - 5.2 + i * 2.6 });
      for (let i = 0; i < 5; i++) c.vc.box(0.14, 2.4, 2.2, '#2f3a44', { x: tx - s * 6.1, y: 14 + i * 9, z, ry: Math.PI / 2 });
      board(c, 'cocoa-house', 'COCOA HOUSE', COCOA, '#fff1cf', 8.4, 2.4, s * 13.4, 6.0, z - 8, -s * 0.5);
      c.vc.box(0.25, 4.8, 0.25, '#555', { x: s * 14, y: 2.4, z: z - 8 });
      for (let i = 0; i < 4; i++) {
        const uz = z + 10 + i * 3.2;
        c.vc.cyl(0.05, 0.05, 2.4, '#5a3d24', { x: s * 12.6, y: 1.2, z: uz }, 4);
        c.vc.cone(1.4, 0.5, [INDIGO, '#cdbb95', '#7a2f3e', '#8db1a8'][i]!, { x: s * 12.6, y: 2.5, z: uz }, 8);
      }
      FLORA.oilpalm!(c, s * 40, z + 12);
      FLORA.mango!(c, s * 40, z - 12);
    }),

    /**
     * Asejire reservoir: a long earth embankment with a road along its crest and a low rail, a
     * round intake tower with a walkway, teak rows on the far slope and calm water from the
     * district's `waterEdge`.
     */
    'oyo.asejire-reservoir': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(8, 2.4, 40, '#8a7a56', { x: s * 17, y: 1.2, z });
      c.vc.box(6, 0.2, 40, '#56595c', { x: s * 17, y: 2.5, z });
      c.vc.box(0.14, 0.9, 40, '#e8e4d4', { x: s * 14.3, y: 2.95, z });
      for (let i = 0; i < 10; i++) c.vc.box(0.14, 0.9, 0.14, '#e8e4d4', { x: s * 14.3, y: 2.95, z: c.zStart + 2 + i * 4 });
      c.vc.box(1.6, 4.4, 1.6, '#cfc7b5', { x: s * 24, y: 2.2, z });
      c.vc.cyl(2.2, 2.2, 7, '#bcb6a6', { x: s * 30, y: 3.5, z }, 12);
      c.vc.cyl(2.6, 2.6, 0.5, '#8a8a86', { x: s * 30, y: 7.2, z }, 12);
      c.vc.cone(1.8, 1.4, '#8f9699', { x: s * 30, y: 8.2, z }, 12);
      c.vc.box(8, 0.2, 1.4, '#a9a59a', { x: s * 26, y: 4.4, z });
      for (let i = 0; i < 3; i++) FLORA.teak!(c, s * 13 + (i % 2) * s * 3, z - 14 + i * 14);
      FLORA.oilpalm!(c, s * 18, z - 16);
      FLORA.cashew!(c, s * 20, z + 17);
      board(c, 'asejire', 'ASEJIRE RESERVOIR', '#4f7a3a', '#f4f1ea', 8.6, 2.4, s * 12.6, 6.0, z + 12, -s * 0.6);
      c.vc.box(0.25, 4.8, 0.25, '#555', { x: s * 13.2, y: 2.4, z: z + 12 });
    }),
  });
}
