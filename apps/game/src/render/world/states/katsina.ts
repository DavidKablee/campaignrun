import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, flyoverDeck, piece, sideOf } from './common';

/**
 * Katsina's set pieces (docs/research/states/katsina.md), original stylised models: a grain
 * market of heaps and sack stacks under tin shades, a tall tapering red city wall with a gate
 * passage, a long red-brick college hall, a roundabout interchange under a flyover and an
 * irrigated lakeside. Rose, cream and red clay; no minaret, dome, palace, horse, flag or
 * regalia anywhere, and no mention of who built the flyover.
 */
const CREAM = '#efe6d3';
const ROSE = '#d9b5a0';
const CLAY = '#b0694e';
const BRICK = '#a5553f';
const DARK = '#7a3a2a';
const SLATE = '#5b6b73';
const TAN = '#c9b58a';

export function registerKatsinaPieces() {
  registerPieces({
    /**
     * A grain market: three rows of heaps of millet, sorghum and beans in tin-shaded bays,
     * stacks of sacks, hand carts, a sack-weighing frame, a relief gateway board.
     */
    'katsina.grain-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const heaps = ['#d6bd7a', '#c9a76a', '#8a7a4a', '#b8864a', '#e0c890'];
      for (let row = 0; row < 3; row++) {
        const x = s * (14.5 + row * 6.5);
        for (let i = 0; i < 4; i++) {
          const zi = z - 15 + i * 10 + (row % 2) * 2.5;
          for (const dz of [-1.8, 1.8]) for (const dx of [-1.6, 1.6]) c.vc.cyl(0.05, 0.05, 2.4, '#5a3d24', { x: x + dx, y: 1.2, z: zi + dz }, 4);
          c.vc.box(3.8, 0.08, 4.2, '#8f8b82', { x, y: 2.5, z: zi, rz: s * 0.07 });
          c.vc.box(3.2, 0.4, 3.4, '#7a5a3a', { x, y: 0.2, z: zi });
          for (let k = 0; k < 3; k++) c.vc.cone(0.7, 0.6, heaps[(k + i + row) % 5]!, { x: x - 0.9 + k * 0.9, y: 0.7, z: zi }, 6);
          for (let k = 0; k < 4; k++) c.vc.box(0.5, 0.35, 0.8, k % 2 ? '#c9b58a' : '#b79a6c', { x: x + 2.2, y: 0.2 + (k >> 1) * 0.35, z: zi - 1 + (k % 2) * 0.9 });
        }
      }
      for (let i = 0; i < 2; i++) {
        c.vc.box(1.0, 0.14, 2.0, '#7a5a3a', { x: s * 12.8, y: 0.6, z: z - 8 + i * 14 });
        for (const dx of [-0.55, 0.55]) c.vc.cyl(0.38, 0.38, 0.1, '#1a1a1a', { x: s * 12.8 + dx, y: 0.38, z: z - 8 + i * 14, rz: Math.PI / 2 }, 8);
        for (let k = 0; k < 3; k++) c.vc.box(0.5, 0.4, 0.5, '#b79a6c', { x: s * 12.8, y: 0.9 + k * 0.2, z: z - 8.5 + i * 14 + k * 0.4 });
      }
      for (const dz of [-3, 3]) c.vc.box(0.7, 5.2, 0.7, CREAM, { x: s * 11, y: 2.6, z: z - 20 + dz });
      c.vc.box(0.9, 1.0, 7.4, ROSE, { x: s * 11, y: 5.7, z: z - 20 });
      for (let i = 0; i < 3; i++) c.vc.box(0.12, 0.5, 0.5, CLAY, { x: s * 10.5, y: 5.7, z: z - 22 + i * 2 });
      board(c, 'grain-market', 'GRAIN MARKET', BRICK, '#fff1cf', 7.4, 2.0, s * 10.3, 7.2, z - 20, -s * 1.57);
      FLORA.faidherbia!(c, s * 38, z + 20);
      FLORA.neem!(c, s * 40, z - 20);
    }),

    /**
     * A section of the old red city wall: a tall tapering slab of three stepped courses with a
     * stepped parapet, an arched gate passage through it, a worn foot with a few zinc roofs
     * hugging it. A monument beside the road: no door leaf, no guard, no flag.
     */
    'katsina.city-wall': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const wx = s * 16;
      for (const dz of [-9, 9]) {
        c.vc.box(4.2, 5, 14, '#9c4f3a', { x: wx, y: 2.5, z: z + dz });
        c.vc.box(3.4, 4, 13.6, '#a5553f', { x: wx, y: 7, z: z + dz });
        c.vc.box(2.6, 3, 13.2, '#9c4f3a', { x: wx, y: 10.5, z: z + dz });
        for (let i = 0; i < 5; i++) c.vc.box(1.8, 1.0, 1.8, '#8f4a37', { x: wx, y: 12.5, z: z + dz - 5.2 + i * 2.6 });
      }
      c.vc.box(3.4, 4.2, 6.4, '#a5553f', { x: wx, y: 7.1, z });
      c.vc.box(2.6, 3, 6.4, '#9c4f3a', { x: wx, y: 10.5, z });
      c.vc.cyl(2.8, 2.8, 4.4, '#9c4f3a', { x: wx, y: 5, z, rz: Math.PI / 2 }, 14);
      c.vc.cyl(2.2, 2.2, 4.6, '#2a1a10', { x: wx, y: 4.9, z, rz: Math.PI / 2 }, 14);
      c.vc.box(4.4, 2.6, 4.4, '#2a1a10', { x: wx, y: 1.3, z });
      for (let i = 0; i < 4; i++) {
        c.vc.box(3.2, 0.18, 3.2, '#8f8b82', { x: s * (21 + (i % 2) * 5), y: 1.8, z: z - 12 + i * 8, rz: s * 0.1 });
        c.vc.box(2.8, 1.8, 2.8, '#c9b58a', { x: s * (21 + (i % 2) * 5), y: 0.9, z: z - 12 + i * 8 });
      }
      board(c, 'old-wall', 'OLD CITY WALL', DARK, '#fff1cf', 7, 1.9, wx - s * 2.6, 9.4, z, -s * 1.57);
      FLORA.neem!(c, s * 30, z + 22);
      FLORA.faidherbia!(c, s * 32, z - 22);
    }),

    /**
     * The old college hall: a long single-storey hall of red-baked brick behind a deep arcade of
     * dark openings, a central gate block with a stepped top, a wide sandy forecourt, neem shade.
     */
    'katsina.college': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const hx = s * 26;
      c.vc.box(10, 4.4, 40, BRICK, { x: hx, y: 2.2, z });
      c.vc.box(10.6, 0.4, 40.6, DARK, { x: hx, y: 4.6, z });
      c.vc.prism(11, 1.8, 41, '#8f8a7e', { x: hx, y: 4.8, z });
      for (let i = 0; i < 12; i++) {
        const zi = z - 17.8 + i * 3.25;
        c.vc.box(0.2, 2.8, 1.5, '#2a1a10', { x: hx - s * 5.05, y: 1.5, z: zi });
        c.vc.box(1.4, 0.3, 0.5, '#c9bfa4', { x: hx - s * 5.7, y: 3.2, z: zi + 1.4 });
      }
      c.vc.box(3.6, 7.6, 7.4, BRICK, { x: hx - s * 6.5, y: 3.8, z });
      c.vc.box(3.9, 0.5, 7.8, DARK, { x: hx - s * 6.5, y: 7.8, z });
      c.vc.box(2.6, 0.7, 4.8, BRICK, { x: hx - s * 6.5, y: 8.4, z });
      c.vc.box(0.2, 3.2, 2.2, '#2a1a10', { x: hx - s * 8.35, y: 1.7, z });
      for (let i = 0; i < 3; i++) c.vc.box(1.4, 0.25, 5, '#c9bfa4', { x: hx - s * (8.6 + i * 0.7), y: 0.12 + i * 0.14, z });
      c.vc.box(12, 0.06, 40, '#d8c8a4', { x: s * 17, y: 0.03, z });
      FLORA.neem!(c, s * 14, z - 18);
      FLORA.neem!(c, s * 14, z + 18);
      FLORA.faidherbia!(c, s * 44, z + 20);
      board(c, 'old-college', 'OLD COLLEGE', DARK, '#fff1cf', 6.6, 1.9, s * 11.4, 5.4, z - 22, -s * 1.5);
    }),

    /**
     * The interchange: a roundabout island with a plain pylon on the road side, a long flyover
     * deck beside it on box piers with two ramps, solar lamp posts and plaza blocks behind.
     */
    'katsina.interchange': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 27;
      c.vc.cyl(10, 10, 0.3, '#4f5558', { x: cx, y: 0.1, z }, 20);
      c.vc.cyl(8.6, 8.6, 0.6, '#cfc9b8', { x: cx, y: 0.3, z }, 20);
      c.vc.cyl(7.6, 7.6, 0.7, '#8c9a5b', { x: cx, y: 0.35, z }, 20);
      c.vc.box(1.2, 7, 1.2, CREAM, { x: cx, y: 4, z });
      c.vc.box(2.4, 0.6, 2.4, ROSE, { x: cx, y: 7.7, z });
      flyoverDeck(c, s * 46, z, 48, 7.4, '#cfc9b8', '#8f8a7e');
      c.vc.box(11, 0.5, 9, TAN, { x: s * 46, y: 0.25, z: z - 28, rx: 0.14 });
      c.vc.box(11, 0.5, 9, TAN, { x: s * 46, y: 0.25, z: z + 28, rx: -0.14 });
      c.vc.box(9, 10, 9, CREAM, { x: s * 20, y: 5, z: z - 22 });
      c.vc.box(9, 7, 9, ROSE, { x: s * 20, y: 3.5, z: z + 22 });
      for (let i = 0; i < 4; i++) {
        c.vc.cyl(0.07, 0.09, 6, '#7a7a76', { x: s * 12.4, y: 3, z: z - 18 + i * 12 }, 5);
        c.vc.box(1.0, 0.1, 0.6, '#2f3a44', { x: s * 12.4, y: 6.1, z: z - 18 + i * 12 });
      }
      for (const dz of [-3, 3]) c.vc.box(1.3, 0.7, 2.2, '#e3d8c0', { x: s * 13, y: 0.75, z: z + 16 + dz });
      FLORA.datepalm!(c, s * 14.5, z - 5);
      board(c, 'gra-flyover', 'GRA FLYOVER', SLATE, '#f4f1ea', 6.6, 1.8, cx - s * 3.4, 5.6, z - 10, s * 0.9);
    }),

    /**
     * Ajiwa lakeside: a low earth embankment, a wide still lake beyond it, strips of irrigated
     * dull-green plots with a pump box and hose line on the road side, faidherbia and neem.
     */
    'katsina.ajiwa': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(34, 0.12, 52, '#7e9490', { x: s * 44, y: 0.05, z });
      c.vc.box(5, 1.6, 52, '#b79a7a', { x: s * 26, y: 0.7, z, rz: s * 0.2 });
      for (let row = 0; row < 3; row++) {
        c.vc.box(5, 0.16, 40, row % 2 ? '#8c9a5b' : '#7c8a50', { x: s * (14.5 + row * 4), y: 0.1, z });
        for (let i = 0; i < 6; i++) c.vc.sphere(0.45, '#6f8a4a', { x: s * (14.5 + row * 4) + (i % 2) * 0.8 - 0.4, y: 0.4, z: z - 17 + i * 6.8, sy: 0.6 }, 5);
      }
      c.vc.box(0.8, 0.7, 0.8, '#6a6258', { x: s * 13, y: 0.35, z: z - 6 });
      c.vc.box(0.05, 0.05, 24, '#25282c', { x: s * 13.4, y: 0.1, z: z + 4 });
      c.vc.box(1.1, 0.5, 4, '#7a5a3a', { x: s * 33, y: 0.3, z: z + 12, ry: 0.3 });
      FLORA.faidherbia!(c, s * 12, z - 18);
      FLORA.faidherbia!(c, s * 12, z + 20);
      FLORA.neem!(c, s * 16, z + 24);
      FLORA.reedbed!(c, s * 30, z - 14);
      board(c, 'ajiwa', 'AJIWA LAKESIDE', SLATE, '#f4f1ea', 6.4, 1.8, s * 11.4, 4.8, z - 22, -s * 1.5);
    }),
  });
}
