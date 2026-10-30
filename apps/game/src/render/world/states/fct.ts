import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, piece, sideOf, stadiumBlock } from './common';

/**
 * The capital's set pieces (docs/research/states/fct.md), original stylised models: a concrete
 * market hall with produce and cloth stalls, a landscaped roundabout with a fountain basin, a
 * lakeside promenade with pedal boats, a terraced amphitheatre park and a city stadium. Pale
 * concrete, lawn green and lake blue. Nothing in the capital's government district, no flag, no
 * place of worship, no named hall, no person anywhere.
 */
const CONCRETE = '#d6d3cb';
const SLAB = '#bcb9b0';
const DEEP = '#2b3340';
const BLOCK = '#c4c1b8';
const ZINC = '#98a0a4';
const LAWN = '#7f9f55';
const LAKE = '#6f9aa8';

export function registerFctPieces() {
  registerPieces({
    /**
     * A market hall: two long flat concrete roofs on square piers over stall tables of tomatoes,
     * peppers, yam stacks, folded cloth and basins, two handcarts, parasol stalls, mango and
     * neem shade. Goods only: no figure, no crowd surge, no fire.
     */
    'fct.market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let row = 0; row < 2; row++) {
        const x = s * (17 + row * 11.5);
        for (const dz of [-1, 1]) for (const dx of [-3.2, 3.2]) c.vc.box(0.45, 3.2, 0.45, SLAB, { x: x + dx, y: 1.6, z: z + dz * 17 });
        c.vc.box(8.2, 0.5, 36.5, row ? '#c9c6bd' : CONCRETE, { x, y: 3.4, z });
        c.vc.box(8.4, 0.25, 36.8, '#8d9296', { x, y: 3.75, z });
        c.vc.box(6.8, 0.3, 35, '#a9a69c', { x, y: 0.15, z });
        for (let i = 0; i < 9; i++) {
          const zi = z - 15 + i * 3.8;
          const kind = (i + row) % 3;
          if (kind === 0) for (let k = 0; k < 3; k++) c.vc.sphere(0.5, ['#b5412e', '#c8562c', '#a8402e'][k]!, { x: x - 1.3 + k * 1.2, y: 0.8, z: zi, sy: 0.8 }, 6);
          else if (kind === 1) for (let k = 0; k < 4; k++) c.vc.cyl(0.32, 0.36, 1.0, '#c4a46a', { x: x - 1.4 + (k % 2) * 1.5, y: 0.7 + (k >> 1) * 0.9, z: zi + (k % 2) * 0.3, rz: 1.35 }, 6);
          else for (let k = 0; k < 3; k++) c.vc.box(0.9, 0.25, 0.7, ['#2f4560', '#e8e2d0', '#a8823a'][k]!, { x: x - 1.1 + k * 1.1, y: 0.65 + k * 0.1, z: zi });
        }
      }
      for (let i = 0; i < 2; i++) {
        c.vc.box(1.0, 0.14, 2.0, '#7a5a3a', { x: s * 12.8, y: 0.6, z: z - 10 + i * 20 });
        c.vc.cyl(0.4, 0.4, 0.12, '#3a3a3a', { x: s * 12.8, y: 0.3, z: z - 10 + i * 20 + 1.2, rz: Math.PI / 2 }, 8);
        for (let k = 0; k < 3; k++) c.vc.sphere(0.4, '#6a8a3c', { x: s * 12.8, y: 0.85, z: z - 10.5 + i * 20 + k * 0.5, sy: 0.8 }, 5);
      }
      for (const [k, pz] of [[0, -20], [1, 20]] as const) {
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: s * 14.2, y: 1.15, z: z + pz }, 4);
        c.vc.cone(1.5, 0.5, ['#c98f3a', '#3f6f84'][k]!, { x: s * 14.2, y: 2.4, z: z + pz }, 8);
      }
      FLORA.mango!(c, s * 40, z - 14);
      FLORA.neem!(c, s * 38, z + 16);
      board(c, 'fct-market', 'MARKET', DEEP, '#fff1cf', 5.2, 2.0, s * 11.4, 5.6, z - 22, -s * 1.5);
    }),

    /**
     * A landscaped roundabout: a paved ring round a raised kerb, a lawn island with flower beds,
     * a round fountain basin with a single plain jet, six lamp columns and a few trees. A square
     * of the planned city: no monument, no flag, no figure.
     */
    'fct.roundabout-plaza': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 34;
      c.vc.cyl(17, 17, 0.1, '#4a4e52', { x: cx, y: 0.05, z }, 28);
      c.vc.cyl(13.2, 13.4, 0.5, '#b9b6ad', { x: cx, y: 0.25, z }, 28);
      c.vc.cyl(12.6, 12.6, 0.62, LAWN, { x: cx, y: 0.31, z }, 28);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        c.vc.sphere(1.0, ['#e0b23a', '#f1e9d8', '#c98f3a'][i % 3]!, { x: cx + Math.cos(a) * 8.6, y: 0.8, z: z + Math.sin(a) * 8.6, sy: 0.6 }, 5);
      }
      c.vc.cyl(5.2, 5.4, 0.7, '#c9c6bd', { x: cx, y: 0.65, z }, 20);
      c.vc.cyl(4.5, 4.5, 0.75, LAKE, { x: cx, y: 0.7, z }, 20);
      c.vc.cyl(0.18, 0.28, 3.6, '#f4f1ea', { x: cx, y: 2.4, z }, 6);
      c.vc.sphere(0.5, '#e8f2f4', { x: cx, y: 4.3, z, sy: 0.9 }, 6);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        c.vc.cyl(0.1, 0.14, 5.4, '#6a6e72', { x: cx + Math.cos(a) * 11.2, y: 2.7, z: z + Math.sin(a) * 11.2 }, 5);
        c.vc.box(0.9, 0.22, 0.4, '#e4e0c8', { x: cx + Math.cos(a) * 11.2, y: 5.5, z: z + Math.sin(a) * 11.2 });
      }
      FLORA.neem!(c, cx - s * 7, z - 6);
      FLORA.mango!(c, cx + s * 6, z + 7);
      FLORA.neem!(c, s * 15, z - 24);
      board(c, 'fct-roundabout', 'ROUNDABOUT', DEEP, '#f2eed8', 6.2, 1.8, s * 11.4, 4.8, z - 26, -s * 1.5);
    }),

    /**
     * A lake promenade: a broad calm lake on the far side, a paved promenade with plain rails and
     * lamps along the road side, a timber jetty with four pedal boats, a café kiosk with
     * parasols, reed beds and trees. Still water: no flood, no wreck, no crowd.
     */
    'fct.lakefront': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(46, 0.12, 62, LAKE, { x: s * 56, y: 0.05, z });
      c.vc.box(10, 0.3, 58, '#c4c1b8', { x: s * 18, y: 0.15, z });
      c.vc.box(0.3, 0.9, 58, '#8a8f93', { x: s * 23.2, y: 0.75, z });
      for (let i = 0; i < 9; i++) {
        c.vc.cyl(0.08, 0.1, 4.2, '#6a6e72', { x: s * 23.2, y: 2.1, z: z - 24 + i * 6 }, 5);
        c.vc.box(0.7, 0.18, 0.35, '#e4e0c8', { x: s * 23.2, y: 4.2, z: z - 24 + i * 6 });
      }
      c.vc.box(14, 0.25, 3.4, '#8a6a42', { x: s * 31, y: 0.3, z: z - 4 });
      for (let i = 0; i < 4; i++) c.vc.cyl(0.1, 0.1, 1.0, '#5a3d24', { x: s * (26 + i * 3.6), y: 0.2, z: z - 5.6 }, 4);
      for (let i = 0; i < 4; i++) {
        const bx = s * (28 + i * 3.2);
        const bz = z - 7.4 - (i % 2) * 0.6;
        c.vc.box(1.2, 0.5, 2.3, ['#e0b23a', '#f1e9d8', '#5a86a0', '#c98f3a'][i]!, { x: bx, y: 0.3, z: bz });
        c.vc.box(1.3, 0.12, 1.2, '#e8e4d4', { x: bx, y: 1.1, z: bz });
      }
      c.vc.box(4.2, 2.8, 4.2, '#e0ddd5', { x: s * 17, y: 1.7, z: z + 16 });
      c.vc.box(5.0, 0.25, 5.0, '#7a8a90', { x: s * 17, y: 3.25, z: z + 16 });
      for (const [k, pz] of [[0, 8], [1, 22]] as const) {
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: s * 17.5, y: 1.4, z: z + pz }, 4);
        c.vc.cone(1.5, 0.5, ['#f1e9d8', '#2f4560'][k]!, { x: s * 17.5, y: 2.6, z: z + pz }, 8);
      }
      FLORA.reedbed!(c, s * 42, z - 22);
      FLORA.reedbed!(c, s * 44, z + 18);
      FLORA.mango!(c, s * 14, z - 24);
      FLORA.neem!(c, s * 14.4, z + 26);
      board(c, 'fct-lake', 'LAKE WATERFRONT', DEEP, '#f2eed8', 7.2, 1.8, s * 11.4, 4.8, z - 28, -s * 1.5);
    }),

    /**
     * A terraced park: a half-ring amphitheatre of five stepped lawn and stone tiers facing a
     * flat stage lawn, a long fountain pool with a row of low jets, a curved paved walk, lamp
     * posts, benches and a belt of trees. Empty: no crowd, no flag, no monument.
     */
    'fct.park': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(70, 0.1, 64, LAWN, { x: s * 50, y: 0.05, z });
      for (let step = 0; step < 5; step++) {
        const r = 10 + step * 2.6;
        for (let i = 0; i < 9; i++) {
          const a = -Math.PI * 0.45 + (i / 8) * Math.PI * 0.9;
          c.vc.box(3.0, 0.5 + step * 0.45, 3.6, step % 2 ? '#c4c1b8' : '#9db26a', { x: s * (22 + Math.cos(a) * r * 0.55 + step * 2.2), y: (0.5 + step * 0.45) / 2, z: z + Math.sin(a) * r * 1.5, ry: -a });
        }
      }
      c.vc.box(10, 0.3, 14, '#bcb9b0', { x: s * 22, y: 0.15, z });
      c.vc.box(5, 0.35, 44, LAKE, { x: s * 46, y: 0.18, z });
      c.vc.box(5.6, 0.2, 44.6, '#d6d3cb', { x: s * 46, y: 0.1, z });
      for (let i = 0; i < 6; i++) c.vc.cyl(0.07, 0.1, 1.5, '#f4f1ea', { x: s * 46, y: 1.0, z: z - 18 + i * 7.2 }, 5);
      c.vc.box(2.4, 0.08, 58, '#d8d4c8', { x: s * 56, y: 0.12, z });
      for (let i = 0; i < 6; i++) {
        c.vc.cyl(0.08, 0.1, 3.6, '#6a6e72', { x: s * 52, y: 1.8, z: z - 25 + i * 10 }, 5);
        c.vc.box(0.7, 0.18, 0.35, '#e4e0c8', { x: s * 52, y: 3.6, z: z - 25 + i * 10 });
        c.vc.box(1.8, 0.3, 0.6, '#8a6a42', { x: s * 58, y: 0.5, z: z - 25 + i * 10 });
      }
      FLORA.mango!(c, s * 18, z - 26);
      FLORA.neem!(c, s * 17, z + 26);
      FLORA.eucalyptus!(c, s * 72, z - 14);
      FLORA.neem!(c, s * 74, z + 16);
      board(c, 'fct-park', 'MILLENNIUM PARK', DEEP, '#f2eed8', 7.2, 1.8, s * 11.4, 4.8, z - 30, -s * 1.5);
    }),

    /** City stadium: a terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'fct.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'fct-stadium', name: 'CITY STADIUM', bg: DEEP, fg: '#f4f1ea', stand: BLOCK, roof: ZINC, gate: '#e0ddd5' });
      FLORA.neem!(c, s * 14.5, c.zMid - 22);
      FLORA.mango!(c, s * 14.5, c.zMid + 24);
    }),
  });
}
