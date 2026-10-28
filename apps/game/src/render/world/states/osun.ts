import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, flyoverDeck, piece, sideOf, stadiumBlock } from './common';

/**
 * Osun's set pieces (docs/research/states/osun.md), original stylised models: a dye market of
 * hung indigo cloth, clay dye pots and cloth stalls, a plain concrete bridge over a murky brown
 * river in forest, a rail line crossing beside the road with a barrier, a signal and a freight
 * train waiting, a ring-road interchange and a township stadium. Forest green, indigo and cream;
 * no grove, shrine, deity, priestess, festival, palace or flag anywhere.
 */
const CREAM = '#eae0c8';
const INDIGO = '#2b3a6b';
const DEEP = '#26304f';
const BLOCK = '#bdb7a6';
const ZINC = '#98948a';
const RIVER = '#7d6f55';

export function registerOsunPieces() {
  registerPieces({
    /**
     * A dye market: two long zinc ranges hung with indigo and white adire cloth on lines, rows of
     * round clay dye pots with a blue-black skin, folded cloth stalls and parasols. Cloth and pots
     * only: no figure, no ritual vessel and no shrine.
     */
    'osun.dye-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let row = 0; row < 2; row++) {
        const x = s * (18 + row * 12);
        for (const dz of [-1, 1]) for (const dx of [-3.4, 3.4]) c.vc.cyl(0.08, 0.08, 3.1, '#5a3d24', { x: x + dx, y: 1.55, z: z + dz * 17 }, 4);
        c.vc.prism(8.0, 1.3, 36, row ? '#8f8b82' : ZINC, { x, y: 3.6, z });
        c.vc.box(7.0, 0.4, 35, '#7a5a3a', { x, y: 0.2, z });
        for (let i = 0; i < 8; i++) {
          const zi = z - 14.5 + i * 4.1;
          const cloth = ['#2b3a6b', '#e8e2d0', '#33447a', '#d9d2bc'][(i + row) % 4]!;
          c.vc.box(5.6, 2.1, 0.06, cloth, { x, y: 2.1, z: zi });
          for (let k = 0; k < 4; k++) c.vc.box(0.5, 0.5, 0.08, cloth === '#2b3a6b' || cloth === '#33447a' ? '#e8e2d0' : '#2b3a6b', { x: x - 2 + k * 1.3, y: 1.6 + (k % 2) * 0.7, z: zi + 0.03 });
        }
        c.vc.box(7.4, 0.08, 0.08, '#5a3d24', { x, y: 3.1, z: z - 17 });
        c.vc.box(7.4, 0.08, 0.08, '#5a3d24', { x, y: 3.1, z: z + 17 });
      }
      for (let i = 0; i < 4; i++) {
        const pz = z - 18 + i * 12;
        for (let k = 0; k < 3; k++) {
          c.vc.cyl(0.7, 0.62, 0.8, '#8a5a3c', { x: s * (12.8 + k * 1.7), y: 0.4, z: pz }, 8);
          c.vc.cyl(0.56, 0.56, 0.06, '#1f2a54', { x: s * (12.8 + k * 1.7), y: 0.82, z: pz }, 8);
        }
      }
      for (let i = 0; i < 3; i++) {
        c.vc.box(1.0, 0.14, 2.0, '#7a5a3a', { x: s * 41, y: 0.6, z: z - 10 + i * 10 });
        for (let k = 0; k < 4; k++) c.vc.box(0.9, 0.18, 1.6, ['#2b3a6b', '#e8e2d0', '#5e7a3a', '#c9a56a'][k]!, { x: s * 41, y: 0.78 + k * 0.18, z: z - 10 + i * 10 });
      }
      for (const [k, pz] of [[0, -20], [1, 20]] as const) {
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: s * 14.2, y: 1.15, z: z + pz }, 4);
        c.vc.cone(1.5, 0.5, ['#2b3a6b', '#c98f3a'][k]!, { x: s * 14.2, y: 2.4, z: z + pz }, 8);
      }
      FLORA.mango!(c, s * 38, z - 18);
      FLORA.oilpalm!(c, s * 38, z + 16);
      board(c, 'osun-market', 'DYE MARKET', INDIGO, '#f4f1ea', 6.2, 2.0, s * 11.4, 5.6, z - 22, -s * 1.5);
    }),

    /**
     * A river bridge: a long concrete beam bridge with plain rails and lamp posts on square piers
     * along the road side, a wide murky brown river with sandy banks and forest on both banks.
     * Plain and generic: no grove, shrine, offering, festival or named bridge.
     */
    'osun.river-bridge': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(58, 0.12, 58, RIVER, { x: s * 43, y: 0.06, z });
      c.vc.box(58.6, 0.05, 58.6, '#8f8468', { x: s * 43, y: 0.02, z });
      for (const [bx, bz, bw] of [[44, 20, 10], [68, -18, 12]] as const) c.vc.box(bw, 0.2, bw * 0.7, '#c9b98a', { x: s * bx, y: 0.14, z: z + bz });
      c.vc.box(9, 0.9, 52, '#c9c5b8', { x: s * 24, y: 4.4, z });
      for (const e of [-1, 1]) c.vc.box(0.3, 0.9, 52, '#9a958a', { x: s * 24 + e * 4.4, y: 5.25, z });
      for (let i = 0; i < 5; i++) {
        const pz = z - 20 + i * 10;
        for (const dx of [-2.6, 2.6]) c.vc.box(1.4, 4.4, 1.4, '#b5ae9e', { x: s * 24 + dx, y: 2.2, z: pz });
        c.vc.box(7.4, 0.7, 1.8, '#a39d92', { x: s * 24, y: 3.9, z: pz });
      }
      for (let i = 0; i < 4; i++) {
        c.vc.cyl(0.07, 0.07, 3.4, '#6a6a68', { x: s * 19.8, y: 6.7, z: z - 21 + i * 14 }, 4);
        c.vc.box(0.9, 0.2, 0.3, '#e4e0c8', { x: s * 19.8, y: 8.4, z: z - 21 + i * 14 });
      }
      c.vc.box(1.0, 0.45, 5, '#7a5a3a', { x: s * 34, y: 0.3, z: z + 6, ry: 0.15 });
      for (const [fx, fz] of [[14, -22], [14, 22], [16, 0], [34, -28], [40, 28]] as const) FLORA['forest-giant']?.(c, s * fx, z + fz);
      FLORA.cashew!(c, s * 13.2, z - 12);
      FLORA.oilpalm!(c, s * 13.4, z + 10);
      board(c, 'osun-bridge', 'RIVER BRIDGE', DEEP, '#f2eed8', 6.0, 1.8, s * 11.4, 4.8, z - 26, -s * 1.5);
    }),

    /**
     * A rail crossing: a narrow-gauge line running away from the road across the verge with sleepers
     * and ballast, a striped barrier arm and a signal at the kerb, a small signal hut and a freight
     * train of box wagons and a tank wagon waiting. No station name, no person, no accident.
     */
    'osun.rail-crossing': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(62, 0.14, 7.0, '#8a8478', { x: s * 42, y: 0.07, z });
      for (let i = 0; i < 40; i++) c.vc.box(0.5, 0.1, 2.6, '#5a4a3a', { x: s * (11.4 + i * 1.5), y: 0.2, z });
      for (const dz of [-0.6, 0.6]) c.vc.box(62, 0.14, 0.14, '#6a6e72', { x: s * 42, y: 0.3, z: z + dz });
      c.vc.box(4.6, 0.1, 7.0, '#b8b4a6', { x: s * 9.6, y: 0.06, z });
      for (const dz of [-4.4, 4.4]) {
        c.vc.cyl(0.07, 0.07, 1.8, '#d9d9d2', { x: s * 8.4, y: 0.9, z: z + dz }, 4);
        c.vc.box(0.12, 0.12, 4.0, '#e8e8e0', { x: s * 8.4, y: 1.8, z: z + dz * 0.45 });
        for (let k = 0; k < 4; k++) c.vc.box(0.14, 0.14, 0.5, '#c23a2a', { x: s * 8.4, y: 1.8, z: z + dz * 0.1 + dz * 0.2 * k });
      }
      c.vc.cyl(0.1, 0.1, 4.6, '#5a5e62', { x: s * 12.4, y: 2.3, z: z - 6.2 }, 5);
      c.vc.box(0.5, 1.3, 0.3, '#2a2c30', { x: s * 12.4, y: 4.4, z: z - 6.2 });
      c.vc.box(0.2, 0.2, 0.08, '#d9442a', { x: s * 12.4, y: 4.8, z: z - 6.05 });
      c.vc.box(0.2, 0.2, 0.08, '#c8c8c0', { x: s * 12.4, y: 4.3, z: z - 6.05 });
      c.vc.box(3.0, 2.4, 3.0, CREAM, { x: s * 16, y: 1.2, z: z + 7.5 });
      c.vc.prism(3.6, 1.0, 3.6, ZINC, { x: s * 16, y: 2.9, z: z + 7.5 });
      const cars: [number, string, string][] = [[0, '#6a6e72', 'box'], [1, '#7a4a3a', 'box'], [2, '#3a3e44', 'tank'], [3, '#5a5e62', 'box']];
      for (const [i, col, kind] of cars) {
        const x = s * (24 + i * 9.4);
        c.vc.box(1.8, 0.3, 8.4, '#2a2c30', { x, y: 0.55, z });
        if (kind === 'box') c.vc.box(2.6, 2.6, 8.0, col, { x, y: 2.1, z });
        else c.vc.cyl(1.3, 1.3, 7.6, col, { x, y: 2.0, z, rx: Math.PI / 2 }, 10);
        for (const dx of [-0.9, 0.9]) for (const dz of [-2.8, 2.8]) c.vc.cyl(0.38, 0.38, 0.2, '#1a1a1a', { x: x + dx * 0.5, y: 0.4, z: z + dz, rz: Math.PI / 2 }, 6);
      }
      FLORA.mango!(c, s * 14, z - 22);
      FLORA.oilpalm!(c, s * 14.4, z + 22);
      FLORA.banana!(c, s * 16, z - 14);
      board(c, 'osun-rail', 'RAIL CROSSING', DEEP, '#f2eed8', 6.2, 1.8, s * 11.4, 4.8, z - 24, -s * 1.5);
    }),

    /**
     * A ring-road interchange: a flyover deck on piers along the road side with two ramps running
     * down to the carriageway, lamp posts, a planted island of oil palms and a plain green board.
     * Generic: no road name, person, date or plaque.
     */
    'osun.interchange': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      flyoverDeck(c, s * 30, z, 30, 6.4, '#c9c5b8', '#9a958a');
      for (const e of [-1, 1]) {
        const rz = z + e * 21.5;
        c.vc.box(11, 0.9, 13, '#c0bcb0', { x: s * 30, y: 3.1, z: rz, rx: e * 0.49 });
        for (const dx of [-5.4, 5.4]) c.vc.box(0.35, 0.9, 13, '#9a958a', { x: s * 30 + dx, y: 3.8, z: rz, rx: -e * 0.46 });
      }
      c.vc.box(18, 0.35, 14, '#5f7a46', { x: s * 17, y: 0.17, z: z - 14 });
      for (let i = 0; i < 4; i++) FLORA.oilpalm!(c, s * (14 + (i % 2) * 4), z - 18 + i * 3.5);
      for (let i = 0; i < 5; i++) {
        c.vc.cyl(0.09, 0.09, 5.2, '#6a6a68', { x: s * 12.2, y: 2.6, z: z - 20 + i * 10 }, 4);
        c.vc.box(1.4, 0.2, 0.4, '#e4e0c8', { x: s * 12.6, y: 5.2, z: z - 20 + i * 10 });
      }
      FLORA.mango!(c, s * 44, z - 20);
      FLORA.mango!(c, s * 46, z + 22);
      board(c, 'osun-ring', 'RING ROAD', '#2f5a3a', '#f4f1ea', 5.8, 1.8, s * 11.4, 4.8, z + 26, -s * 1.5);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'osun.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'osun-stadium', name: 'TOWNSHIP STADIUM', bg: DEEP, fg: '#f4f1ea', stand: BLOCK, roof: '#a8adb0', gate: CREAM });
      FLORA.cashew!(c, s * 14.5, c.zMid - 22);
      FLORA.oilpalm!(c, s * 14.5, c.zMid + 24);
    }),
  });
}
