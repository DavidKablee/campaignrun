import { shade } from '../../geo';
import { FLORA } from '../flora';
import { registerPieces } from '../pieces';
import { board, piece, sideOf } from './common';

/**
 * Kwara's set pieces (docs/research/states/kwara.md), original stylised models: a pottery
 * market of red-and-black pot walls and smoking fire mounds, a bus-park junction with a
 * sign column, a town stadium with a tilted pavilion, a zoological garden gate with a
 * suspension footbridge (no animals), and a bare granite twin-cone hill. Earth ochre,
 * fired-pot terracotta, slate and indigo; no dome, minaret, cross or palace anywhere.
 */
const OCHRE = '#c99a62';
const CHALK = '#efe8d6';
const POT = '#a9573a';
const SLATE = '#4f6d85';
const INDIGO = '#34406e';
const ZINC = '#98a0a2';
const GRANITE = '#8e8a84';

export function registerKwaraPieces() {
  registerPieces({
    /**
     * Okelele pottery market: low walls of red and black pots, rows of pot stacks on benches,
     * fire mounds with smoke, a zinc-roofed drying shed, a big shade tree and a gate board.
     */
    'kwara.pottery-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let row = 0; row < 3; row++) {
        const x = s * (14.5 + row * 6);
        for (let i = 0; i < 5; i++) {
          const zi = z - 15 + i * 7 + (row % 2) * 2.5;
          c.vc.box(3.0, 0.3, 1.4, '#6b4a2b', { x, y: 0.15, z: zi });
          for (let tier = 0; tier < 3; tier++) {
            for (let k = 0; k < 4 - tier; k++) {
              c.vc.sphere(0.34, (k + tier + row) % 3 === 0 ? '#2a2420' : POT, { x: x - 0.9 + k * 0.6 + tier * 0.3, y: 0.55 + tier * 0.5, z: zi, sy: 1.05 }, 6);
            }
          }
        }
      }
      for (let i = 0; i < 3; i++) {
        const fz = z - 9 + i * 9;
        c.vc.cyl(0.9, 1.1, 0.35, '#8a5a3c', { x: s * 34, y: 0.17, z: fz }, 7);
        c.vc.cone(0.3, 0.5, '#d98a2c', { x: s * 34, y: 0.55, z: fz }, 5);
        for (let k = 0; k < 3; k++) c.vc.sphere(0.4 + k * 0.14, '#c9c5bb', { x: s * 34 + k * 0.2, y: 1.4 + k * 0.8, z: fz, sy: 0.9 }, 5);
      }
      c.vc.box(9, 3.4, 10, '#c4a06c', { x: s * 40, y: 1.7, z: z + 12 });
      c.vc.prism(10, 1.6, 11, '#8e5a3a', { x: s * 40, y: 3.4, z: z + 12 });
      c.vc.box(0.2, 2.4, 6, '#2a1a10', { x: s * 35.4, y: 1.3, z: z + 12 });
      FLORA.neem!(c, s * 24, z + 17);
      FLORA.shea!(c, s * 44, z - 15);
      c.vc.box(0.25, 5, 0.25, '#555', { x: s * 12.4, y: 2.5, z: z - 17 });
      board(c, 'okelele', 'OKELELE POTTERY MARKET', POT, '#fff1cf', 9, 2.6, s * 11.8, 6.0, z - 14, -s * 0.5);
    }),

    /**
     * Post Office Junction: a round kerb island with a plain sign column, a bus-park shelter of
     * zinc on posts, muted taxis and keke waiting round the ring, a tyre pile and umbrellas.
     */
    'kwara.post-office-junction': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 28;
      c.vc.cyl(11, 11, 0.25, '#4f5558', { x: cx, y: 0.1, z }, 20);
      c.vc.cyl(10.2, 10.2, 0.5, '#cfc9b8', { x: cx, y: 0.25, z }, 20);
      c.vc.cyl(9.4, 9.4, 0.6, '#8a8a55', { x: cx, y: 0.3, z }, 20);
      c.vc.box(2.4, 5.6, 2.4, CHALK, { x: cx, y: 3.3, z });
      c.vc.cyl(2.2, 2.2, 1.4, INDIGO, { x: cx, y: 6.8, z }, 10);
      c.vc.cone(1.5, 1.2, POT, { x: cx, y: 8.1, z }, 10);
      board(c, 'post-office', 'POST OFFICE', INDIGO, '#f4f1ea', 5.4, 1.5, cx - s * 2.7, 4.6, z, s * 1.2);
      FLORA.neem!(c, cx + 5, z + 5);
      FLORA.mango!(c, cx - 5, z - 5);
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * 0.55 + i * 0.3;
        const kx = cx - s * Math.cos(a - Math.PI / 2) * 9.6;
        const kz = z + Math.sin(a - Math.PI / 2) * 9.6;
        const taxi = i % 2 === 0;
        c.vc.box(taxi ? 1.6 : 1.2, 0.8, taxi ? 3.0 : 2.0, taxi ? '#5e7f4c' : '#ece5cf', { x: kx, y: 0.9, z: kz });
        c.vc.box(taxi ? 1.62 : 1.3, 0.12, taxi ? 1.2 : 2.2, '#c9a24a', { x: kx, y: taxi ? 1.35 : 1.9, z: kz });
      }
      for (const dz of [-1, 1]) for (const dx of [0, 5.6]) c.vc.cyl(0.1, 0.12, 3.0, '#5a4330', { x: s * 14 + dx * s, y: 1.5, z: z - 14 + dz * 3 }, 4);
      c.vc.box(7, 0.18, 8, ZINC, { x: s * 16.8, y: 3.1, z: z - 14, rz: s * 0.06 });
      for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) c.vc.cyl(0.46, 0.46, 0.3, '#1c1c1c', { x: s * 14, y: 0.17 + k * 0.3, z: z + 13 + i * 1.3, rx: Math.PI / 2 }, 8);
    }),

    /**
     * Ilorin Township Stadium: a low stand with a tilted pavilion slab on posts on the road
     * side, four floodlight masts, a gate block with the name over it, and fruit sellers'
     * umbrellas under neem and mango shade.
     */
    'kwara.township-stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const sx = s * 24;
      for (let step = 0; step < 5; step++) c.vc.box(3.0, 0.9 + step * 0.9, 30, step % 2 ? '#cfc7b5' : '#b9b2a2', { x: sx + s * step * 2.6, y: (0.9 + step * 0.9) / 2, z });
      c.vc.box(5, 0.25, 31, ZINC, { x: sx + s * 3.8, y: 6.6, z, rz: -s * 0.1 });
      c.vc.box(5.2, 0.12, 31.2, SLATE, { x: sx + s * 3.8, y: 6.8, z, rz: -s * 0.1 });
      for (const dz of [-13, -4.5, 4.5, 13]) c.vc.cyl(0.16, 0.18, 6.2, '#8a8f99', { x: sx + s * 1.4, y: 3.1, z: z + dz }, 5);
      for (const dz of [-17, 17]) {
        c.vc.cyl(0.16, 0.22, 17, '#8a8f99', { x: sx - 2, y: 8.5, z: z + dz }, 6);
        c.vc.box(3.2, 0.9, 0.5, '#f4efd0', { x: sx - 2, y: 17, z: z + dz });
        c.vc.cyl(0.16, 0.22, 17, '#8a8f99', { x: sx + s * 17, y: 8.5, z: z + dz }, 6);
        c.vc.box(3.2, 0.9, 0.5, '#f4efd0', { x: sx + s * 17, y: 17, z: z + dz });
      }
      c.vc.box(3.6, 3.2, 7, CHALK, { x: s * 20.5, y: 1.6, z: z + 12 });
      c.vc.box(3.9, 0.4, 7.3, POT, { x: s * 20.5, y: 3.4, z: z + 12 });
      board(c, 'ilorin-stadium', 'ILORIN TOWNSHIP STADIUM', SLATE, '#f4f1ea', 9.4, 2.4, s * 18.4, 6.4, z + 8, -s * 0.9);
      c.vc.box(0.2, 3.4, 0.2, '#555', { x: s * 18.4, y: 4.8, z: z + 8 });
      for (let i = 0; i < 4; i++) {
        const uz = z - 14 + i * 3.6;
        c.vc.cyl(0.04, 0.04, 2.4, '#5a3d24', { x: s * 12.2, y: 1.2, z: uz }, 4);
        c.vc.cone(1.4, 0.5, [OCHRE, SLATE, CHALK, '#6e7442'][i]!, { x: s * 12.2, y: 2.5, z: uz }, 8);
        c.vc.box(1.3, 0.6, 0.9, '#7a5a3a', { x: s * 12.2, y: 0.3, z: uz });
      }
      FLORA.neem!(c, s * 16, z + 17);
      FLORA.mango!(c, s * 15, z - 18);
    }),

    /**
     * University Zoological Garden: a plain gate with the name over it, a suspension footbridge
     * with two stub towers and a catenary deck, picnic shelters and big shade trees. No animals.
     */
    'kwara.zoo-garden': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (const dz of [-3.6, 3.6]) c.vc.box(1.4, 6.4, 1.4, CHALK, { x: s * 14, y: 3.2, z: z - 13 + dz });
      c.vc.box(1.8, 1.4, 9.2, '#6e7442', { x: s * 14, y: 6.6, z: z - 13 });
      board(c, 'zoo', 'ZOOLOGICAL GARDEN', '#6e7442', '#f4f1ea', 7.6, 2.0, s * 13.2, 6.8, z - 13, -s * 1.57);
      const fx = s * 26;
      for (const dz of [-9, 9]) {
        c.vc.box(1.2, 8, 1.2, '#b2ac9c', { x: fx, y: 4, z: z + 2 + dz });
        c.vc.box(2.4, 0.4, 1.6, '#8a8a86', { x: fx, y: 8.1, z: z + 2 + dz });
      }
      c.vc.box(1.8, 0.2, 20, '#8a7358', { x: fx, y: 3.0, z: z + 2 });
      for (const e of [-1, 1]) {
        c.vc.box(0.1, 0.1, 20, '#5a4330', { x: fx + e * 0.9, y: 3.9, z: z + 2 });
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          const zi = z + 2 - 9 + t * 18;
          const cableY = 3.0 + 4.6 * (1 - Math.sin(Math.PI * t) * 0.55 - 0.0) - 0.4;
          c.vc.cyl(0.04, 0.04, Math.max(0.3, cableY - 3.1), '#6a6a66', { x: fx + e * 0.9, y: 3.1 + Math.max(0.3, cableY - 3.1) / 2, z: zi }, 4);
        }
      }
      for (let i = 0; i < 2; i++) {
        const px = s * (17 + i * 5.5);
        c.vc.box(3.6, 0.2, 3.6, OCHRE, { x: px, y: 2.8, z: z + 14 });
        for (const dx of [-1.5, 1.5]) for (const dz of [-1.5, 1.5]) c.vc.cyl(0.08, 0.08, 2.8, '#5a3d24', { x: px + dx, y: 1.4, z: z + 14 + dz }, 4);
      }
      FLORA.neem!(c, s * 37, z + 14);
      FLORA.mango!(c, s * 38, z - 14);
      FLORA.shea!(c, s * 17, z + 19);
      FLORA.pawpaw!(c, s * 40, z - 3);
    }),

    /**
     * Sobi Hill: a bare granite inselberg of two rounded cones joined by a saddle beside the
     * road, with boulder heaps at its foot and scrub. A natural landform only, with no structure,
     * path, cross or figures on it.
     */
    'kwara.sobi-hill': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const hx = s * 38;
      c.vc.cap(1, Math.PI / 2, GRANITE, { x: hx + s * 4, y: -1, z: z - 4, sx: 15, sy: 26, sz: 13 }, 12);
      c.vc.cap(1, Math.PI / 2, shade(GRANITE, 0.05), { x: hx - s * 6, y: -1, z: z + 8, sx: 11, sy: 19, sz: 10 }, 12);
      c.vc.box(11, 9, 9, '#98948c', { x: hx - s * 1, y: 8, z: z + 2 });
      for (let i = 0; i < 7; i++) FLORA.boulder!(c, s * (17 + (i % 4) * 4.5), z - 17 + i * 5.4);
      FLORA.shea!(c, s * 16, z + 14);
      FLORA.neem!(c, s * 15, z - 16);
      for (let i = 0; i < 4; i++) FLORA.scrub!(c, s * (22 + i * 3), z + 18 - i * 11);
    }),
  });
}
