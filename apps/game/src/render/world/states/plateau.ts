import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, flyoverDeck, piece, sideOf, stadiumBlock } from './common';

/**
 * Plateau's set pieces (docs/research/states/plateau.md), original stylised models: a produce
 * market of pastel flat-roof strips with potato sacks and charcoal, a wildlife-park gate under
 * pines, a tripod-monument roundabout under a flyover, a township stadium and a bare granite
 * dome and boulder landform. Cream, pale stone, granite slate and pale grass; no dome-on-tower,
 * cross, palace, uniform, pit or flag anywhere.
 */
const CREAM = '#e4dcc8';
const MINT = '#b9cdbd';
const PINK = '#cfae9c';
const STONE = '#9c9892';
const SLATE = '#707a84';
const GATE = '#e8dca0';

export function registerPlateauPieces() {
  registerPieces({
    /**
     * A produce market: two rows of pastel flat-roof strips with balcony rails, heaps of potato
     * sacks and vegetable crates, charcoal stacks, hand-carts, a parasol cluster and a granite
     * dome behind the roofs.
     */
    'plateau.produce-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let row = 0; row < 2; row++) {
        const x = s * (19 + row * 11);
        for (let i = 0; i < 3; i++) {
          const zi = z - 13 + i * 13;
          const h = 7 + (i + row) % 2 * 3;
          c.vc.box(9, h, 11, [MINT, PINK, CREAM][(i + row) % 3]!, { x, y: h / 2, z: zi });
          c.vc.box(9.4, 0.3, 11.4, '#8f8a7e', { x, y: h + 0.15, z: zi });
          c.vc.box(0.08, 0.9, 8, '#4a4e52', { x: x - s * 4.6, y: h * 0.62, z: zi });
          c.vc.box(0.12, 1.8, 7, '#23262a', { x: x - s * 4.55, y: 1.0, z: zi });
        }
      }
      for (let i = 0; i < 4; i++) {
        const pz = z - 14 + i * 9;
        for (let k = 0; k < 4; k++) c.vc.box(0.6, 0.45, 0.9, k % 2 ? '#c9b58a' : '#b79a6c', { x: s * 13.6, y: 0.25 + (k >> 1) * 0.45, z: pz + (k % 2) * 0.7 });
        c.vc.box(0.7, 0.4, 0.6, '#7fa05a', { x: s * 13.6, y: 1.1, z: pz + 0.4 });
      }
      for (let i = 0; i < 3; i++) {
        c.vc.cyl(0.04, 0.04, 2.3, '#5a3d24', { x: s * 16, y: 1.15, z: z - 6 + i * 6 }, 4);
        c.vc.cone(1.5, 0.5, ['#b6ae9c', '#707a84', '#d8cdb4'][i]!, { x: s * 16, y: 2.4, z: z - 6 + i * 6 }, 8);
      }
      for (let i = 0; i < 4; i++) c.vc.cyl(0.3, 0.34, 0.95, i % 2 ? '#c9b58a' : '#b8a27a', { x: s * 13.5 + (i % 2) * 0.55, y: 0.5, z: z + 20 + (i >> 1) * 0.6 }, 6);
      c.vc.cap(1, Math.PI / 2, STONE, { x: s * 56, y: -1, z: z + 6, sx: 22, sy: 14, sz: 12 }, 10);
      FLORA.eucalyptus!(c, s * 12.6, z - 22);
      FLORA.pine!(c, s * 12.6, z + 24);
      board(c, 'produce-market', 'HIGHLAND PRODUCE MARKET', SLATE, '#f4f1ea', 9.6, 2.5, s * 11.4, 6.6, z - 18, -s * 1.5);
    }),

    /**
     * The wildlife park gate: a lintel slab on two pale-yellow piers with the board, a laterite
     * track beyond, a rain-tree avenue, rows of pines, two open round rest shelters and a stone
     * wall. No animals.
     */
    'plateau.wildlife-gate': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const gx = s * 15;
      for (const dz of [-5, 5]) c.vc.box(1.8, 6, 1.8, GATE, { x: gx, y: 3, z: z + dz });
      c.vc.box(2.0, 1.2, 12.4, GATE, { x: gx, y: 6.4, z });
      c.vc.box(2.2, 0.3, 12.8, '#8e8a84', { x: gx, y: 7.1, z });
      board(c, 'wildlife-gate', 'JOS WILDLIFE PARK', '#56665a', '#f4f1ea', 7.6, 1.8, gx - s * 1.2, 6.4, z, -s * 1.57);
      c.vc.box(14, 0.08, 6, '#c07a4a', { x: s * 22, y: 0.04, z });
      c.vc.box(14, 0.08, 40, '#b36c3d', { x: s * 29, y: 0.04, z: z + 14 });
      for (let i = 0; i < 6; i++) {
        FLORA.pine!(c, s * (19 + (i % 2) * 5), z + 8 + i * 5);
        FLORA.pine!(c, s * (36 + (i % 2) * 5), z - 16 + i * 6);
      }
      FLORA.neem!(c, s * 14, z - 14);
      FLORA.neem!(c, s * 14, z + 14);
      for (const dz of [-8, 12]) {
        c.vc.cyl(2.0, 2.0, 0.2, '#8e8a84', { x: s * 24, y: 0.1, z: z + dz }, 8);
        c.vc.cone(2.8, 1.6, '#a88a4a', { x: s * 24, y: 2.8, z: z + dz }, 8);
        for (const a of [0, 2.1, 4.2]) c.vc.cyl(0.06, 0.06, 2.0, '#5a3d24', { x: s * 24 + Math.cos(a) * 1.6, y: 1.1, z: z + dz + Math.sin(a) * 1.6 }, 4);
      }
      c.vc.box(0.6, 1.0, 20, '#8e8a84', { x: s * 13.6, y: 0.5, z: z - 20 });
    }),

    /**
     * Tower roundabout: a round raised island with a tripod of cream fins carrying a round head,
     * a flyover deck on box piers behind it, plaza blocks with one curved glass corner, a lattice
     * mast and a ring of hawkers' umbrellas.
     */
    'plateau.tower-roundabout': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 28;
      c.vc.cyl(10, 10, 0.3, '#4f5558', { x: cx, y: 0.1, z }, 20);
      c.vc.cyl(8.6, 8.6, 0.6, '#cfc9b8', { x: cx, y: 0.3, z }, 20);
      c.vc.cyl(7.6, 7.6, 0.7, '#9db279', { x: cx, y: 0.35, z }, 20);
      for (const a of [0, 2.09, 4.19]) c.vc.box(0.7, 7.5, 1.6, CREAM, { x: cx + Math.cos(a) * 1.7, y: 4.2, z: z + Math.sin(a) * 1.7, rz: -Math.cos(a) * 0.18, rx: Math.sin(a) * 0.18, ry: a });
      c.vc.cyl(2.4, 2.4, 1.4, '#d8cdb4', { x: cx, y: 8.4, z }, 12);
      c.vc.cyl(2.5, 2.5, 0.3, '#707a84', { x: cx, y: 9.2, z }, 12);
      flyoverDeck(c, s * 48, z - 4, 40, 7.2, '#cfc9b8', '#8f8a7e');
      c.vc.box(9, 11, 9, MINT, { x: s * 20, y: 5.5, z: z - 20 });
      c.vc.box(3.2, 11, 3.2, '#9db2c0', { x: s * 15.6, y: 5.5, z: z - 24.4 });
      c.vc.box(9, 8, 9, PINK, { x: s * 20, y: 4, z: z + 22 });
      c.vc.cyl(0.08, 0.5, 22, '#8a8f99', { x: s * 12.6, y: 11, z: z + 12 }, 4);
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * 0.7 + i * 0.35;
        const ux = cx - s * Math.cos(a) * 9.8;
        const uz = z + Math.sin(a) * 9.8;
        c.vc.cyl(0.04, 0.04, 2.2, '#5a3d24', { x: ux, y: 1.1, z: uz }, 4);
        c.vc.cone(1.3, 0.45, ['#b6ae9c', '#707a84', '#d8cdb4', '#9a6b4c', '#56665a'][i]!, { x: ux, y: 2.3, z: uz }, 8);
      }
      FLORA.eucalyptus!(c, s * 14, z + 8);
      board(c, 'tower-roundabout', 'TOWER ROUNDABOUT', SLATE, '#f4f1ea', 7, 1.8, cx - s * 2.7, 5.4, z - 9, s * 0.9);
    }),

    /** Township stadium: a small terraced bowl, one roofed stand, floodlight masts, gate and kiosks. */
    'plateau.stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      stadiumBlock(c, s, c.zMid, { id: 'jos-stadium', name: 'TOWNSHIP STADIUM', bg: SLATE, fg: '#f4f1ea', stand: '#b6ae9c', roof: '#a8adb0', gate: CREAM });
      FLORA.eucalyptus!(c, s * 14.5, c.zMid - 22);
      FLORA.eucalyptus!(c, s * 14.5, c.zMid + 24);
    }),

    /**
     * Shere Hills: a bare natural landform beside the road: two dark granite domes with boulder
     * stacks at their feet, a flat dark slab, sparse pale grass and a few pines. Nothing is built
     * on it and nobody stands on it.
     */
    'plateau.shere-hills': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.cap(1, Math.PI / 2, '#8a8680', { x: s * 34, y: -1, z: z - 6, sx: 16, sy: 12, sz: 13 }, 12);
      c.vc.cap(1, Math.PI / 2, '#98948c', { x: s * 52, y: -1, z: z + 12, sx: 12, sy: 8, sz: 10 }, 12);
      c.vc.box(8, 0.6, 10, '#5f5a55', { x: s * 22, y: 0.35, z: z + 4 });
      for (let i = 0; i < 10; i++) {
        const bx = s * (18 + (i % 5) * 3.4);
        const bz = z - 14 + (i >> 1) * 4.6;
        c.vc.sphere(1.0 + (i % 3) * 0.5, i % 2 ? '#8d8a84' : '#a39f96', { x: bx, y: 0.9 + (i % 4) * 0.5, z: bz, sy: 0.85 }, 6);
        c.vc.sphere(0.8, '#b89a6a', { x: bx + 0.2, y: 2.0 + (i % 3) * 0.4, z: bz + 0.2, sy: 0.7 }, 5);
      }
      for (const [px, pz] of [[16, -20], [14, 20], [40, 22], [44, -18]] as const) FLORA.pine!(c, s * px, z + pz);
      FLORA.scrub!(c, s * 15, z - 3);
      FLORA.scrub!(c, s * 16, z + 10);
      board(c, 'shere-hills', 'SHERE HILLS', '#56665a', '#f4f1ea', 5.8, 1.7, s * 11.4, 4.4, z - 20, -s * 1.5);
    }),
  });
}
