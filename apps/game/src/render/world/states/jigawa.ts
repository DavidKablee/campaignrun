import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, piece, sideOf, stadiumBlock } from './common';

/**
 * Jigawa's set pieces (docs/research/states/jigawa.md), original stylised models: a market of
 * grain, date and onion stalls under neem shade, a bare granite outcrop with an overhang (no
 * painting, no animal), dry-season rice paddies with a canal and a plank footbridge, a plain
 * mud-brick town gate in a low wall (no palace, no mosque) and a township stadium. Sand, grey
 * granite and paddy green; no flood, herd, shrine, flag or person anywhere.
 */
const MUD = '#c9ab7a';
const SAND = '#d8c49a';
const DEEP = '#3a2f20';
const BLOCK = '#bdb7a6';
const ZINC = '#98948a';
const GRANITE = '#8c8d86';

export function registerJigawaPieces() {
  registerPieces({
    /**
     * A market: two open zinc ranges with sacks of grain, trays of dates, mesh sacks of onions and
     * folded indigo cloth on low tables, two handcarts, parasol stalls and neem and date-palm
     * shade. Goods only: no figure, no herd, no flood or fire.
     */
    'jigawa.market': piece('venue', (c, side) => {
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
          else if (kind === 1) for (let k = 0; k < 3; k++) c.vc.cyl(0.5, 0.42, 0.3, '#7a4a28', { x: x - 1.3 + k * 1.2, y: 0.65, z: zi }, 8);
          else for (let k = 0; k < 3; k++) c.vc.box(0.9, 0.25, 0.7, ['#2f3a66', '#e8e2d0', '#a8423a'][k]!, { x: x - 1.1 + k * 1.1, y: 0.65 + k * 0.1, z: zi });
        }
      }
      for (let i = 0; i < 2; i++) {
        c.vc.box(1.0, 0.14, 2.0, '#7a5a3a', { x: s * 12.8, y: 0.6, z: z - 10 + i * 20 });
        c.vc.cyl(0.4, 0.4, 0.12, '#3a3a3a', { x: s * 12.8, y: 0.3, z: z - 10 + i * 20 + 1.2, rz: Math.PI / 2 }, 8);
        for (let k = 0; k < 3; k++) c.vc.sphere(0.4, '#a8423a', { x: s * 12.8, y: 0.85, z: z - 10.5 + i * 20 + k * 0.5, sy: 0.8 }, 5);
      }
      for (const [k, pz] of [[0, -20], [1, 20]] as const) {
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: s * 14.2, y: 1.15, z: z + pz }, 4);
        c.vc.cone(1.5, 0.5, ['#c98f3a', '#2f3a66'][k]!, { x: s * 14.2, y: 2.4, z: z + pz }, 8);
      }
      FLORA.neem!(c, s * 40, z - 14);
      FLORA.datepalm!(c, s * 38, z + 16);
      board(c, 'jigawa-market', 'MARKET', DEEP, '#fff1cf', 5.2, 2.0, s * 11.4, 5.6, z - 22, -s * 1.5);
    }),

    /**
     * A rock shelter: three bare granite domes, two of them carrying a flat capstone slab that
     * leaves a dark overhang beneath, boulders, scrub and date palms at the foot. Bare rock only:
     * no painting, no animal, no offering and no path worn to a sacred place.
     */
    'jigawa.rock-shelter': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.cap(1, Math.PI / 2, GRANITE, { x: s * 50, y: 0, z: z - 8, sx: 17, sy: 15, sz: 15 }, 12);
      c.vc.cap(1, Math.PI / 2, '#9a9b94', { x: s * 74, y: 0, z: z + 12, sx: 14, sy: 22, sz: 14 }, 12);
      c.vc.cap(1, Math.PI / 2, '#86877f', { x: s * 34, y: 0, z: z + 20, sx: 9, sy: 8, sz: 9 }, 10);
      c.vc.box(3.0, 3.4, 8, '#2a2622', { x: s * 35.2, y: 1.8, z: z - 8 });
      c.vc.box(4.6, 1.2, 10, '#7e7f78', { x: s * 34.6, y: 4.1, z: z - 8 });
      for (const [bx, bz, br] of [[s * 26, z - 20, 1.8], [s * 24, z + 2, 2.2], [s * 62, z - 22, 2.0], [s * 58, z + 26, 2.4], [s * 20, z + 14, 1.5]] as const) c.vc.sphere(br, '#85867f', { x: bx, y: br * 0.5, z: bz, sy: 0.7 }, 6);
      FLORA.scrub!(c, s * 16, z - 12);
      FLORA.scrub!(c, s * 18, z + 6);
      FLORA.datepalm!(c, s * 14, z - 22);
      FLORA.datepalm!(c, s * 14.4, z + 24);
      FLORA.acacia!(c, s * 28, z + 28);
      board(c, 'jigawa-rock', 'ROCK SHELTER', DEEP, '#f2eed8', 6.2, 1.8, s * 11.4, 4.8, z - 26, -s * 1.5);
    }),

    /**
     * Wetland paddies: a flat grid of bunded rice paddies in two greens and a drier ochre, a
     * straight irrigation canal with a plank footbridge, reed beds on the margin and a few date
     * palms on the bund. Dry-season work: no flood, no boat in crisis, no sandbag wall.
     */
    'jigawa.wetland-paddies': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let ix = 0; ix < 4; ix++) {
        for (let iz = 0; iz < 5; iz++) {
          const px = s * (22 + ix * 12);
          const pz = z - 24 + iz * 12;
          const col = ['#7a9a46', '#8aa84e', '#b8a468', '#6a8a3e'][(ix * 3 + iz) % 4]!;
          c.vc.box(10.6, 0.1, 10.6, col, { x: px, y: 0.06, z: pz });
          c.vc.box(11.2, 0.22, 0.5, '#b09468', { x: px, y: 0.12, z: pz + 5.4 });
          c.vc.box(0.5, 0.22, 11.2, '#b09468', { x: px + s * 5.4, y: 0.12, z: pz });
        }
      }
      c.vc.box(3.0, 0.1, 60, '#6f9aa8', { x: s * 17, y: 0.1, z });
      c.vc.box(2.0, 0.16, 6, '#8a6a42', { x: s * 17, y: 0.55, z: z + 4 });
      for (const e of [-1, 1]) c.vc.cyl(0.06, 0.06, 0.8, '#5a3d24', { x: s * 17 + e * 0.9, y: 0.9, z: z + 4 }, 4);
      FLORA.reedbed!(c, s * 14, z - 20);
      FLORA.reedbed!(c, s * 14.4, z + 18);
      for (const [px, pz] of [[26, -26], [44, 28], [60, -8]] as const) FLORA.datepalm!(c, s * px, z + pz);
      board(c, 'jigawa-paddies', 'WETLAND PADDIES', DEEP, '#f2eed8', 7.2, 1.8, s * 11.4, 4.8, z - 26, -s * 1.5);
    }),

    /**
     * A town gate: a low mud-brick wall with a crenellated parapet running away from the road, a
     * tall plain arch of mud brick with a flat lintel and two square piers, a worn sand road
     * through it and neem shade. No palace, mosque, minaret, banner or flag.
     */
    'jigawa.town-gate': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(34, 0.1, 9, SAND, { x: s * 33, y: 0.05, z });
      c.vc.box(5.0, 7.0, 2.4, MUD, { x: s * 28, y: 3.5, z: z - 4.6 });
      c.vc.box(5.0, 7.0, 2.4, MUD, { x: s * 28, y: 3.5, z: z + 4.6 });
      c.vc.box(5.6, 1.5, 11.8, '#b8996a', { x: s * 28, y: 7.0, z });
      for (const dz of [-5.4, -3.2, 3.2, 5.4]) c.vc.box(0.9, 0.9, 0.9, '#b8996a', { x: s * 28, y: 8.2, z: z + dz });
      for (const e of [-1, 1]) {
        const wz = z + e * 22;
        c.vc.box(2.0, 4.2, 30, MUD, { x: s * 30, y: 2.1, z: wz - e * 3 });
        for (let i = 0; i < 9; i++) c.vc.box(1.0, 0.7, 1.0, '#b8996a', { x: s * 30, y: 4.55, z: wz - e * 3 + (i - 4) * 3.3 });
      }
      for (let i = 0; i < 3; i++) c.vc.box(2.0, 0.1, 0.5, '#4a3a28', { x: s * (22 + i * 5), y: 0.12, z: z + 6 });
      FLORA.neem!(c, s * 16, z - 22);
      FLORA.neem!(c, s * 40, z + 18);
      FLORA.datepalm!(c, s * 15, z + 24);
      board(c, 'jigawa-gate', 'TOWN GATE', DEEP, '#f2eed8', 5.2, 1.8, s * 11.4, 4.8, z - 24, -s * 1.5);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'jigawa.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'jigawa-stadium', name: 'TOWNSHIP STADIUM', bg: DEEP, fg: '#f4f1ea', stand: BLOCK, roof: '#a8adb0', gate: SAND });
      FLORA.neem!(c, s * 14.5, c.zMid - 22);
      FLORA.datepalm!(c, s * 14.5, c.zMid + 24);
    }),
  });
}
