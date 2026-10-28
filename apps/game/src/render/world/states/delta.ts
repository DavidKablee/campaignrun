import { shade } from '../../geo';
import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, flyoverDeck, piece, sideOf, steelTruss } from './common';

/**
 * Delta's set pieces (docs/research/states/delta.md), original stylised models: the steel
 * through-truss Niger bridge at Asaba on a rise, a timber wharf of log stacks and saw sheds,
 * Effurun's wide roundabout under a flyover, Warri's covered-stand stadium, and a plank-deck
 * market on piles in the creeks. Slate, plank brown, sage and cream; no flags, no party
 * colours, no oil spill, no uniforms.
 */
const SLATE = '#4d6f86';
const STEEL = '#7d8b93';
const CREAM = '#e6dbc0';
const PLANK = '#7a6a4a';
const PLANK_DARK = '#4a3828';
const ZINC = '#98908a';
const CONCRETE = '#b3b0a6';

export function registerDeltaPieces() {
  registerPieces({
    /**
     * The Niger bridge at the Asaba head: a three-span steel through-truss whose top chord rises
     * over mid-span, on round piers, standing on a rise above the river beside the road, with a
     * ramped approach, a concrete parapet and a gate board. Different from the concrete box-girder
     * bridge of Anambra: this one is all steel members against the sky.
     */
    'delta.niger-bridge': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const bx = s * 29;
      steelTruss(c, bx, z, 40, 9.5, STEEL, '#3a3f44', 3.2);
      // the approach: a ramp wedge up from the road level and a parapet along it
      c.vc.box(11, 0.9, 16, '#3a3f44', { x: bx, y: 5.0, z: z - 28, rx: 0.3 });
      for (const e of [-1, 1]) c.vc.box(0.4, 1.0, 16, CONCRETE, { x: bx + e * 5.3, y: 5.8, z: z - 28, rx: 0.3 });
      // terraced bank below, and a lamp at each pier
      c.vc.box(14, 2.4, 40, '#a5683f', { x: bx + s * 12, y: 1.2, z });
      c.vc.box(10, 2.4, 40, '#9a5f38', { x: bx + s * 15, y: 3.6, z });
      for (const dz of [-14, 14]) c.vc.cyl(0.1, 0.12, 6, '#8a8a86', { x: bx - 5.2, y: 12.5, z: z + dz }, 5);
      board(c, 'niger-bridge', 'NIGER BRIDGE', SLATE, '#f4f1ea', 8, 2.4, s * 13.4, 6.4, z - 14, -s * 0.5);
      c.vc.box(0.25, 5.2, 0.25, '#555', { x: s * 14, y: 2.6, z: z - 14 });
      // a truck waiting on the shoulder and hawkers' basins at its tail
      c.vc.box(2.6, 2.6, 8, '#5a6a72', { x: s * 12.6, y: 1.7, z: z + 12 });
      c.vc.box(2.4, 1.6, 2.2, '#8a7358', { x: s * 12.6, y: 1.3, z: z + 7 });
      for (const dz of [-2.8, 0, 2.8]) c.vc.cyl(0.5, 0.5, 0.4, '#1a1a1a', { x: s * 11.4, y: 0.5, z: z + 12 + dz, rz: Math.PI / 2 }, 8);
    }),

    /**
     * Sapele timber wharf: a plank-decked quay on piles, stacks of squared logs and sawn planks,
     * a saw shed with a zinc roof, an A-frame derrick over a log barge alongside, and a gate board.
     * The water comes from the district's `waterEdge`.
     */
    'delta.timber-wharf': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let i = 0; i < 8; i++) {
        c.vc.cyl(0.13, 0.16, 2.2, PLANK_DARK, { x: s * (15 + i * 2.4), y: 0.6, z: z - 3 }, 4);
        c.vc.cyl(0.13, 0.16, 2.2, PLANK_DARK, { x: s * (15 + i * 2.4), y: 0.6, z: z + 3 }, 4);
      }
      c.vc.box(19, 0.2, 7, PLANK, { x: s * 24, y: 1.6, z });
      // log and plank stacks
      for (let t = 0; t < 3; t++) {
        for (let i = 0; i < 4; i++) c.vc.cyl(0.55, 0.55, 5.2, i % 2 ? '#9a5a38' : '#8a5a3c', { x: s * (16.4 + i * 1.2), y: 2.25 + t * 0.95, z: z - 0.5 + t * 1.0 - 1, rx: Math.PI / 2 }, 8);
      }
      for (let i = 0; i < 7; i++) c.vc.box(5, 0.1, 1.2, i % 2 ? '#c9a66b' : '#b99058', { x: s * 22, y: 1.8 + i * 0.12, z: z + 12 });
      // saw shed
      c.vc.box(9, 3.6, 11, '#8a7358', { x: s * 21, y: 1.8, z: z - 13 });
      c.vc.prism(10, 1.4, 12, ZINC, { x: s * 21, y: 3.6, z: z - 13 });
      c.vc.box(0.2, 2.6, 6, '#2a1f17', { x: s * 16.4, y: 1.4, z: z - 13 });
      c.vc.cone(2.0, 1.6, '#d8c08a', { x: s * 27, y: 0.8, z: z - 8 }, 7);
      // derrick over a log barge
      for (const dz of [-1.4, 1.4]) c.vc.box(0.2, 8.5, 0.2, '#5a4330', { x: s * 33, y: 4.7, z: z + dz, rx: dz * 0.06, rz: -s * 0.08 });
      c.vc.box(0.2, 0.2, 3.2, '#5a4330', { x: s * 33, y: 8.6, z });
      c.vc.box(0.06, 6, 0.06, '#2a2a28', { x: s * 33 + s * 2.4, y: 5.4, z, rz: 0.0 });
      c.vc.box(6, 1.1, 18, '#6b6458', { x: s * 35, y: 0.5, z: z + 2 });
      for (let i = 0; i < 4; i++) c.vc.cyl(0.5, 0.5, 5.4, '#9a5a38', { x: s * (33 + (i % 3) * 1.2), y: 1.5 + (i > 2 ? 0.9 : 0), z: z + 3 - (i % 2 ? 2 : 0) , rx: Math.PI / 2 }, 7);
      for (let i = 0; i < 3; i++) FLORA['forest-giant']!(c, s * (17 + i * 7), z + 17 - i * 1);
      board(c, 'timber-wharf', 'SAPELE TIMBER WHARF', '#6b5a3a', '#fff1cf', 9, 2.6, s * 12.8, 6.0, z - 6, -s * 0.6);
      c.vc.box(0.25, 4.8, 0.25, '#555', { x: s * 13.4, y: 2.4, z: z - 6 });
    }),

    /**
     * Effurun's roundabout: a wide, round island with a kerb ring and lawn, a stepped sign
     * column with a round drum, palms, parked keke around the ring, and a flyover deck on piers
     * running beside it.
     */
    'delta.effurun-roundabout': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 29;
      c.vc.cyl(12, 12, 0.25, '#4c5154', { x: cx, y: 0.1, z }, 22);
      c.vc.cyl(11.2, 11.2, 0.5, '#cfc9b8', { x: cx, y: 0.25, z }, 22);
      c.vc.cyl(10.4, 10.4, 0.6, '#5f8a4a', { x: cx, y: 0.3, z }, 22);
      c.vc.cyl(3.4, 3.4, 1.0, '#b9b6ab', { x: cx, y: 1.1, z }, 12);
      c.vc.box(2.2, 6.4, 2.2, CREAM, { x: cx, y: 4.4, z });
      c.vc.cyl(2.8, 2.8, 1.4, SLATE, { x: cx, y: 8.4, z }, 12);
      c.vc.cone(1.8, 1.4, '#c9b58a', { x: cx, y: 9.8, z }, 12);
      board(c, 'effurun', 'EFFURUN', SLATE, '#f4f1ea', 5, 1.5, cx - s * 2.5, 5.2, z, s * 1.2);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.3;
        FLORA.oilpalm!(c, cx + Math.cos(a) * 6.6, z + Math.sin(a) * 6.6);
      }
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * 0.55 + i * 0.3;
        const kx = cx - s * Math.cos(a - Math.PI / 2) * 10.4;
        const kz = z + Math.sin(a - Math.PI / 2) * 10.4;
        c.vc.box(1.2, 0.7, 2.0, '#ece5cf', { x: kx, y: 0.85, z: kz });
        c.vc.box(1.3, 0.12, 2.2, '#b8892e', { x: kx, y: 1.9, z: kz });
      }
      flyoverDeck(c, s * 56, z, 40, 8.5, CONCRETE, '#8f8b82');
      for (let i = 0; i < 2; i++) c.vc.box(9, 0.1, 3, shade(CONCRETE, -0.1), { x: s * 56, y: 0.1, z: z - 9 + i * 18 });
    }),

    /**
     * Warri's stadium: a covered main stand with a deep cantilever roof, an uncovered raked bowl
     * round the far side, a gate block with the name over it and floodlight masts.
     */
    'delta.warri-stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 45;
      const rx = 21;
      const rz = 17;
      c.vc.cyl(rx + 3, rx + 3, 0.1, '#8a8a82', { x: cx, y: 0.05, z, sz: (rz + 3) / (rx + 3) }, 20);
      c.vc.cyl(rx - 5, rx - 5, 0.14, '#9a5f38', { x: cx, y: 0.08, z, sz: (rz - 5) / (rx - 5) }, 20);
      c.vc.cyl(rx - 8.5, rx - 8.5, 0.18, '#5b8a3e', { x: cx, y: 0.1, z, sz: (rz - 8.5) / (rx - 8.5) }, 20);
      const N = 20;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const near = Math.cos(a) * s < -0.45;
        if (near) continue;
        for (let t = 0; t < 3; t++) {
          const k = 1 + t * 0.09;
          const len = ((Math.PI * 2 * Math.hypot(rx, rz)) / 2 / N) * 1.12 * k;
          c.vc.box(3.2, 2.4 + t * 1.4, len, t % 2 ? '#cfc9b8' : '#b9b2a2', { x: cx + Math.cos(a) * rx * k, y: (2.4 + t * 1.4) / 2, z: z + Math.sin(a) * rz * k, ry: -a });
        }
      }
      // the covered main stand on the road side: stepped seats under a cantilever roof
      const px = cx - s * (rx + 1);
      for (let step = 0; step < 6; step++) c.vc.box(2.4, 1.0 + step * 0.9, 34, step % 2 ? '#c4beae' : '#b0a998', { x: px - s * 1.0 + s * step * 2.2, y: (1.0 + step * 0.9) / 2, z });
      c.vc.box(11, 0.4, 36, ZINC, { x: px + s * 5, y: 8.4, z, rz: -s * 0.08 });
      c.vc.box(11.2, 0.25, 36.4, SLATE, { x: px + s * 5, y: 8.7, z, rz: -s * 0.08 });
      for (const dz of [-15, -5, 5, 15]) c.vc.cyl(0.2, 0.24, 8.2, '#8a8f99', { x: px + s * 1.4, y: 4.1, z: z + dz }, 5);
      // gate block
      c.vc.box(3.4, 3.4, 8, CREAM, { x: s * 21, y: 1.7, z });
      c.vc.box(3.8, 0.4, 8.4, '#8a6a45', { x: s * 21, y: 3.6, z });
      board(c, 'warri-stadium', 'WARRI STADIUM', SLATE, '#f4f1ea', 8, 2.4, s * 19.4, 6.6, z, -s * 0.9);
      c.vc.box(0.2, 3.4, 0.2, '#555', { x: s * 19.4, y: 5.0, z });
      for (const [mx, mz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]] as const) {
        c.vc.cyl(0.16, 0.22, 17, '#8a8f99', { x: cx + mx * (rx + 1.5), y: 8.5, z: z + mz * (rz + 1.5) }, 6);
        c.vc.box(3, 0.9, 0.5, '#f4efd0', { x: cx + mx * (rx + 1.5), y: 17, z: z + mz * (rz + 1.5) });
      }
    }),

    /**
     * Ogheye floating market: a wide plank deck on piles out over dark water, rows of narrow
     * lock-ups with zinc roofs and shuttered fronts, a landing stage with canoes tied up, and a
     * gate board. The water comes from the district's `waterEdge`.
     */
    'delta.ogheye-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let ix = 0; ix < 6; ix++) {
        for (let iz = 0; iz < 6; iz++) c.vc.cyl(0.12, 0.15, 2.2, PLANK_DARK, { x: s * (16 + ix * 3.6), y: 0.6, z: z - 15 + iz * 6 }, 4);
      }
      c.vc.box(22, 0.2, 34, PLANK, { x: s * 25, y: 1.6, z });
      const cols = ['#8a7358', '#4f6d85', '#a9c0a8', '#b8892e', '#c9b58a'];
      for (let row = 0; row < 2; row++) {
        const rx = s * (19.5 + row * 11);
        for (let i = 0; i < 6; i++) {
          const zi = z - 14 + i * 5.6;
          c.vc.box(4.2, 2.6, 4.6, '#8a7358', { x: rx, y: 3.0, z: zi });
          c.vc.box(0.12, 2.0, 3.6, cols[(i + row) % cols.length]!, { x: rx - s * 2.15, y: 2.9, z: zi });
          c.vc.box(5.0, 0.14, 5.0, ZINC, { x: rx, y: 4.4, z: zi, rz: s * 0.12 });
          c.vc.box(0.6, 0.5, 0.6, '#d6c59a', { x: rx - s * 2.6, y: 2.0, z: zi + 1.4 });
        }
      }
      const hull = ['#8a7358', '#4f6d85', '#b8892e', '#6e5a44'];
      for (let i = 0; i < 5; i++) {
        const bz = z - 12 + i * 6;
        const bx = s * (37 + (i % 2) * 2);
        c.vc.cyl(0.55, 0.45, 5.0, hull[i % hull.length]!, { x: bx, y: 0.3, z: bz, rx: Math.PI / 2, sx: 1.2 }, 6);
      }
      c.vc.box(7, 0.16, 2.4, PLANK, { x: s * 13.2, y: 1.2, z: z - 4 });
      board(c, 'ogheye', 'OGHEYE MARKET', '#6b5a3a', '#fff1cf', 8, 2.4, s * 12.8, 6.0, z - 17, -s * 0.5);
      c.vc.box(0.25, 5.0, 0.25, '#555', { x: s * 13.4, y: 2.5, z: z - 17 });
      FLORA.raffia!(c, s * 16, z + 17);
      FLORA.nipa!(c, s * 44, z + 14);
      FLORA.nipa!(c, s * 44, z - 15);
    }),
  });
}
