import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, flyoverDeck, piece, sideOf } from './common';

/**
 * Borno's set pieces (docs/research/states/borno.md), original stylised models of a generic
 * Kanuri-sahel town with role-named venues: a cap-and-cloth market of awning rows, a flyover
 * with a keke rank beneath, a plain clay city gate beside the road, a terraced stadium and a
 * dry-season riverbank of sand, reeds and a canoe. Cream, sand, clay and indigo; nothing
 * religious, military or sheltered under a flag, and no smoke, tents, flood or checkpoint.
 */
const CREAM = '#e6dcc4';
const SAND = '#d3bf98';
const CLAY = '#b58e62';
const INDIGO = '#2f4560';
const BROWN = '#6b4a2b';
const CONCRETE = '#bdb8aa';

export function registerBornoPieces() {
  registerPieces({
    /**
     * The cap and cloth market: rows of low stalls under striped awnings, racks of folded
     * caps, bolts of plain cloth on lines, a clay gateway, mat screens and a neem for shade.
     */
    'borno.cap-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const stripes = [INDIGO, CREAM, CLAY, SAND];
      for (let row = 0; row < 3; row++) {
        const x = s * (14 + row * 6.5);
        for (let i = 0; i < 5; i++) {
          const zi = z - 16 + i * 8 + (row % 2) * 2;
          c.vc.box(3.2, 0.9, 1.6, BROWN, { x, y: 0.45, z: zi });
          for (const dz of [-1.4, 1.4]) for (const dx of [-1.5, 1.5]) c.vc.cyl(0.05, 0.05, 2.4, '#5a3d24', { x: x + dx, y: 1.2, z: zi + dz }, 4);
          c.vc.box(3.8, 0.08, 3.4, stripes[(i + row) % 4]!, { x, y: 2.5, z: zi, rz: s * 0.08 });
          c.vc.box(3.8, 0.08, 1.7, stripes[(i + row + 1) % 4]!, { x, y: 2.52, z: zi + 0.85, rz: s * 0.08 });
          for (let k = 0; k < 6; k++) c.vc.cyl(0.15, 0.13, 0.15, (k + i) % 3 === 0 ? INDIGO : k % 2 ? '#f4f1ea' : CREAM, { x: x - 1.25 + k * 0.5, y: 1.0 + (k % 2) * 0.13, z: zi }, 6);
        }
      }
      for (let i = 0; i < 4; i++) {
        const lz = z - 12 + i * 8;
        c.vc.box(0.05, 0.05, 6, '#5a3d24', { x: s * 36, y: 2.6, z: lz });
        for (let k = 0; k < 4; k++) c.vc.box(0.7, 1.4, 0.05, [CREAM, INDIGO, '#f4f1ea', SAND][(k + i) % 4]!, { x: s * 36, y: 1.8, z: lz - 2 + k * 1.3 });
        c.vc.cyl(0.06, 0.06, 2.8, '#5a3d24', { x: s * 36, y: 1.4, z: lz - 3 }, 4);
        c.vc.cyl(0.06, 0.06, 2.8, '#5a3d24', { x: s * 36, y: 1.4, z: lz + 3 }, 4);
      }
      c.vc.box(0.5, 4.2, 5, CREAM, { x: s * 11, y: 2.1, z: z - 22 });
      c.vc.box(0.5, 4.2, 5, CREAM, { x: s * 11, y: 2.1, z: z - 12 });
      c.vc.box(0.7, 1.0, 15, SAND, { x: s * 11, y: 4.6, z: z - 17 });
      board(c, 'cap-market', 'CAP & CLOTH MARKET', INDIGO, '#f4f1ea', 9, 2.6, s * 10.4, 6.4, z - 17, -s * 1.57);
      FLORA.neem!(c, s * 24, z + 20);
      FLORA.acacia!(c, s * 44, z - 18);
    }),

    /**
     * Flyover Road: a long pale concrete flyover across the road ahead on pier pairs with a
     * plain rail, a rank of keke beneath and neem along the verge. No traffic signs of any kind.
     */
    'borno.flyover': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      flyoverDeck(c, s * 17, z, 44, 7.6, CONCRETE, '#8f8b82');
      c.vc.box(11, 0.3, 44, '#6f6a62', { x: s * 17, y: 8.25, z });
      c.vc.box(11, 0.5, 8, SAND, { x: s * 17, y: 0.25, z: z - 24, rx: 0.12 });
      c.vc.box(11, 0.5, 8, SAND, { x: s * 17, y: 0.25, z: z + 24, rx: -0.12 });
      for (let i = 0; i < 2; i++) {
        c.vc.box(1.3, 0.7, 2.2, '#d9a22b', { x: s * 12, y: 0.75, z: z - 6 + i * 3.2 });
        c.vc.box(1.4, 0.12, 2.4, '#1c1c1c', { x: s * 12, y: 1.85, z: z - 6 + i * 3.2 });
      }
      c.vc.box(14, 0.15, 5, '#2f3a44', { x: s * 28, y: 0.1, z: z + 10 });
      FLORA.neem!(c, s * 24, z - 8);
      FLORA.neem!(c, s * 24, z + 14);
      FLORA.acacia!(c, s * 40, z + 2);
      board(c, 'flyover', 'FLYOVER ROAD', INDIGO, '#f4f1ea', 7.4, 2.0, s * 11.6, 5.2, z - 20, -s * 1.57);
    }),

    /**
     * The city gate: a plain freestanding clay portal beside the road, two thick square towers
     * under one rounded lintel with a flat parapet and a round opening, a short stub of old
     * wall each side. A monument only: no barrier, no post, no one standing in it.
     */
    'borno.city-gate': piece('venue', (c, side) => {
      const s = sideOf(side);
      const gx = s * 15;
      const z = c.zMid;
      for (const dz of [-5, 5]) {
        c.vc.box(5, 9, 3.4, SAND, { x: gx, y: 4.5, z: z + dz });
        c.vc.box(5.4, 0.6, 3.8, CLAY, { x: gx, y: 9.3, z: z + dz });
        for (const px of [-2.2, 0, 2.2]) c.vc.box(0.7, 0.7, 0.7, CLAY, { x: gx + px, y: 10.0, z: z + dz });
      }
      c.vc.box(5, 3.2, 6.6, SAND, { x: gx, y: 8.4, z });
      c.vc.cyl(3.6, 3.6, 5.0, SAND, { x: gx, y: 5.6, z, rz: Math.PI / 2 }, 14);
      c.vc.cyl(2.8, 2.8, 5.4, '#2a1a10', { x: gx, y: 5.6, z, rz: Math.PI / 2 }, 14);
      c.vc.box(5.4, 0.7, 6.6, CLAY, { x: gx, y: 10.2, z });
      for (const dz of [-14, 14]) {
        c.vc.box(3, 4.2, 14, SAND, { x: gx, y: 2.1, z: z + dz });
        c.vc.box(3.4, 0.5, 14, CLAY, { x: gx, y: 4.4, z: z + dz });
      }
      board(c, 'city-gate', 'CITY GATE', INDIGO, '#f4f1ea', 6.4, 1.8, gx - s * 2.8, 8.2, z, -s * 1.57);
      FLORA.neem!(c, s * 28, z + 22);
      FLORA.neem!(c, s * 28, z - 22);
    }),

    /**
     * The main stadium: a long terrace of pale concrete steps with a curved canopy over the
     * centre, a gate block with the name, four floodlight masts, a keke rank and neem shade.
     */
    'borno.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const sx = s * 24;
      for (let step = 0; step < 6; step++) c.vc.box(2.8, 0.8 + step * 0.8, 34, step % 2 ? '#d1cabb' : CONCRETE, { x: sx + s * step * 2.5, y: (0.8 + step * 0.8) / 2, z });
      c.vc.cap(1, Math.PI / 2, '#f4f1ea', { x: sx + s * 6, y: 5.6, z, sx: 4, sy: 1.8, sz: 14 }, 10);
      for (const dz of [-14, -5, 5, 14]) c.vc.cyl(0.16, 0.18, 5.8, '#8a8f99', { x: sx + s * 1.2, y: 2.9, z: z + dz }, 5);
      for (const dz of [-19, 19]) {
        for (const dx of [-2, 17]) {
          c.vc.cyl(0.16, 0.22, 17, '#8a8f99', { x: sx + s * dx, y: 8.5, z: z + dz }, 6);
          c.vc.box(3.2, 0.9, 0.5, '#f4efd0', { x: sx + s * dx, y: 17, z: z + dz });
        }
      }
      c.vc.box(3.6, 3.4, 8, CREAM, { x: s * 19.5, y: 1.7, z: z + 13 });
      c.vc.box(3.9, 0.4, 8.3, INDIGO, { x: s * 19.5, y: 3.6, z: z + 13 });
      board(c, 'main-stadium', 'MAIN STADIUM', INDIGO, '#f4f1ea', 7.6, 2.0, s * 17.4, 6.0, z + 9, -s * 0.9);
      c.vc.box(0.2, 3.2, 0.2, '#555', { x: s * 17.4, y: 4.6, z: z + 9 });
      for (const dz of [-1.5, 1.5]) {
        c.vc.box(1.3, 0.7, 2.2, '#d9a22b', { x: s * 12, y: 0.75, z: z - 16 + dz });
        c.vc.box(1.4, 0.12, 2.4, '#1c1c1c', { x: s * 12, y: 1.85, z: z - 16 + dz });
      }
      FLORA.neem!(c, s * 14.5, z + 22);
      FLORA.acacia!(c, s * 14.5, z - 24);
    }),

    /**
     * Ngadda riverbank in the dry season: a wide pale sand bed with a shallow channel of slow
     * water, reed beds, a wooden canoe pulled up, neem on the bank and a low bridge far off.
     */
    'borno.riverbank': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(34, 0.12, 48, '#cbb68f', { x: s * 34, y: 0.04, z });
      c.vc.box(9, 0.1, 48, '#7f9ba3', { x: s * 42, y: 0.1, z });
      c.vc.box(9.6, 0.06, 48, '#a8a58a', { x: s * 42, y: 0.08, z });
      FLORA.reedbed!(c, s * 22, z - 14);
      FLORA.reedbed!(c, s * 24, z + 4);
      FLORA.reedbed!(c, s * 22, z + 18);
      FLORA.reedbed!(c, s * 50, z - 6);
      c.vc.box(1.0, 0.5, 5.2, BROWN, { x: s * 33, y: 0.4, z: z + 8 });
      c.vc.box(0.2, 0.7, 4.8, '#5a3d24', { x: s * 33.6, y: 0.65, z: z + 8 });
      c.vc.box(0.2, 0.7, 4.8, '#5a3d24', { x: s * 32.4, y: 0.65, z: z + 8 });
      c.vc.cone(0.5, 1.0, BROWN, { x: s * 33, y: 0.5, z: z + 5.2, rx: -Math.PI / 2 }, 4);
      c.vc.box(0.08, 3.4, 0.08, '#5a3d24', { x: s * 33, y: 1.8, z: z + 7 });
      c.vc.box(12, 0.5, 2.4, '#8f8b82', { x: s * 42, y: 1.6, z: z + 30 });
      for (const dx of [-4, 4]) c.vc.box(0.9, 1.6, 1.4, '#a6a196', { x: s * 42 + dx, y: 0.8, z: z + 30 });
      FLORA.neem!(c, s * 14, z - 4);
      FLORA.neem!(c, s * 16, z + 16);
      FLORA.acacia!(c, s * 58, z - 20);
      board(c, 'ngadda', 'NGADDA RIVERBANK', INDIGO, '#f4f1ea', 7.4, 2.0, s * 11.6, 5.0, z - 18, -s * 1.57);
    }),
  });
}
