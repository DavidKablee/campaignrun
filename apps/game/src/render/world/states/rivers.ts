import * as THREE from 'three';
import { shade } from '../../geo';
import { unlitMat } from '../../materials';
import { signTexture } from '../../textures';
import { registerPieces, type PieceDef } from '../pieces';

/**
 * Rivers' set pieces (docs/research/states/rivers.md): original stylised models, not copies.
 * A market hall under umbrellas, a creek jetty with canoes and a yam truck, a leisure park
 * with a climbing tower, a flyover that crosses the road high overhead, and the grey steel
 * lighthouse. Waterfront ones stand on the district's `waterEdge`, which supplies the water.
 */
const ZINC = '#98908a';
const PLANK = '#7a6a4a';
const PLANK_DARK = '#4a3828';
const PLANE = new THREE.PlaneGeometry(1, 1);

const piece = (at: PieceDef['at'], build: PieceDef['build']): PieceDef => ({ at, build });
const sideOf = (side: -1 | 0 | 1): 1 | -1 => (side === -1 ? -1 : 1);

export function registerRiversPieces() {
  registerPieces({
    /**
     * Mile One: a long low market hall with a shallow zinc roof and gable end to the road,
     * a painted board, a row of big umbrellas and stacked cartons along the front,
     * clothes on rails.
     */
    'rivers.mile-one': piece('venue', (c, side) => {
      const s = sideOf(side);
      const hx = s * 21;
      const z = c.zMid;
      c.vc.box(14, 4.6, 32, '#d8cdb0', { x: hx, y: 2.3, z });
      c.vc.prism(15, 2.2, 33, ZINC, { x: hx, y: 4.6, z });
      c.vc.box(0.3, 3, 28, '#2a1f17', { x: hx - s * 7.1, y: 1.6, z });
      const cols = ['#c98f3a', '#2a6f73', '#f4f1ea', '#a8553b', '#2d3c73'];
      for (let i = 0; i < 7; i++) {
        const uz = z - 13.5 + i * 4.5;
        c.vc.cyl(0.05, 0.05, 2.7, '#5a3d24', { x: hx - s * 9.2, y: 1.35, z: uz }, 4);
        c.vc.cone(1.7, 0.6, cols[i % cols.length]!, { x: hx - s * 9.2, y: 2.85, z: uz }, 8);
        c.vc.box(1.6, 0.7, 1.0, '#7a5a3a', { x: hx - s * 9.2, y: 0.35, z: uz });
        for (let k = 0; k < 3; k++) c.vc.box(0.5, 0.4, 0.4, cols[(i + k + 1) % cols.length]!, { x: hx - s * 9.2, y: 0.9 + k * 0.01, z: uz - 0.5 + k * 0.5 });
      }
      for (let i = 0; i < 4; i++) {
        const rz = z - 10 + i * 6.5;
        c.vc.box(0.08, 2.0, 2.4, '#5a3d24', { x: hx - s * 7.8, y: 1.0, z: rz });
        for (let k = 0; k < 5; k++) c.vc.box(0.05, 1.2, 0.35, cols[(i + k) % cols.length]!, { x: hx - s * 7.8, y: 1.5, z: rz - 1 + k * 0.5 });
      }
      c.vc.box(0.2, 5.8, 0.2, '#555', { x: hx - s * 7.3, y: 2.9, z: z - 16 });
      const sign = new THREE.Mesh(PLANE, unlitMat('mile1:MILE ONE MARKET', signTexture('MILE ONE MARKET', '#2d3c73', '#f4f1ea', 512, 160)));
      sign.scale.set(8.4, 2.6, 1);
      sign.position.set(hx - s * 7.6, 7.2, z - 12);
      sign.rotation.y = -s * 0.75;
      c.signs.push(sign);
    }),

    /**
     * Creek Road: a plank jetty reaching into the creek, canoes and a speedboat alongside,
     * a tarpaulin-roofed fish stall, a yam truck and stacked yam, grills smoking.
     */
    'rivers.creek-jetty': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      for (let i = 0; i < 9; i++) {
        c.vc.cyl(0.12, 0.15, 2.2, PLANK_DARK, { x: s * (15 + i * 2.2), y: 0.6, z: z - 1.2 }, 4);
        c.vc.cyl(0.12, 0.15, 2.2, PLANK_DARK, { x: s * (15 + i * 2.2), y: 0.6, z: z + 1.2 }, 4);
      }
      c.vc.box(20, 0.16, 3.2, PLANK, { x: s * 25, y: 1.6, z });
      for (let i = 0; i < 20; i++) c.vc.box(0.04, 0.02, 3.2, PLANK_DARK, { x: s * (15.5 + i * 1), y: 1.7, z });
      const hull = ['#8a7358', '#2a6f73', '#c98f3a', '#6e5a44'];
      for (let i = 0; i < 4; i++) {
        const bz = z + (i % 2 ? 3.2 : -3.2) + (i > 1 ? (i % 2 ? 2 : -2) : 0);
        const bx = s * (19 + i * 3.4);
        c.vc.cyl(0.55, 0.45, 5.2, hull[i]!, { x: bx, y: 0.45, z: bz, rx: Math.PI / 2, sx: 1.2, sy: 0.95 }, 6);
        c.vc.box(0.9, 0.08, 0.4, shade(hull[i]!, -0.15), { x: bx, y: 0.85, z: bz + 0.4 });
      }
      // speedboat at the end of the jetty
      c.vc.box(2, 0.6, 6.4, '#e8e6de', { x: s * 37, y: 0.6, z: z - 3 });
      c.vc.box(2.1, 0.12, 6.5, '#2d3c73', { x: s * 37, y: 0.92, z: z - 3 });
      c.vc.box(1.6, 0.8, 1.2, '#cfd6d6', { x: s * 37, y: 1.2, z: z - 1.5 });
      // fish stall under a tarp, grills with smoke, stacked baskets
      const sx = s * 14;
      for (const dx of [-1.4, 1.4]) for (const dz of [-1.2, 1.2]) c.vc.cyl(0.05, 0.05, 2.4, '#5d4037', { x: sx + dx, y: 1.2, z: z + 7 + dz }, 4);
      c.vc.box(3.2, 0.08, 3.0, '#2a6f73', { x: sx, y: 2.5, z: z + 7, rz: s * 0.14 });
      c.vc.box(2.4, 0.7, 1.0, '#7a5a3a', { x: sx, y: 0.35, z: z + 6.2 });
      for (let i = 0; i < 5; i++) c.vc.sphere(0.2, i % 2 ? '#c9a56e' : '#b9b2a2', { x: sx - 0.9 + i * 0.45, y: 0.85, z: z + 6.2, sx: 1.6, sy: 0.6 }, 5);
      for (let i = 0; i < 2; i++) {
        c.vc.box(0.9, 0.5, 0.5, '#2a2a28', { x: sx + s * 2.6, y: 0.5, z: z + 9 + i * 1.4 });
        c.vc.cone(0.25, 0.7, '#cfd0c6', { x: sx + s * 2.6, y: 1.2, z: z + 9 + i * 1.4 }, 5);
      }
      // yam truck and its load
      c.vc.box(2.6, 1.6, 7, '#8a5a3c', { x: s * 15.5, y: 1.4, z: z - 9 });
      c.vc.box(2.4, 1.5, 1.8, '#2d3c73', { x: s * 15.5, y: 1.35, z: z - 5 });
      for (let i = 0; i < 12; i++) c.vc.cyl(0.2, 0.2, 0.9, '#b99a62', { x: s * (14.8 + (i % 3) * 0.7), y: 2.35, z: z - 11.5 + Math.floor(i / 3) * 1.3, rz: Math.PI / 2, rx: 0.2 }, 5);
      for (const dz of [-3.2, 0.2, 2.8]) c.vc.cyl(0.5, 0.5, 0.4, '#1a1a1a', { x: s * 14.2, y: 0.5, z: z - 9 + dz, rz: Math.PI / 2 }, 8);
    }),

    /**
     * The leisure park: a gate arch with its sign, a tall cylindrical climbing tower with
     * a ring of platforms, a carousel (cone over disc), a pond and a low cinema block.
     */
    'rivers.pleasure-park': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(20, 0.1, 34, '#6e8a4a', { x: s * 24, y: 0.05, z });
      c.vc.cyl(8, 8, 0.1, '#5e8b9a', { x: s * 30, y: 0.11, z: z + 6 }, 14);
      c.vc.cyl(8.3, 8.3, 0.08, '#cfc7b5', { x: s * 30, y: 0.09, z: z + 6 }, 14);
      // gate arch
      for (const dz of [-3.5, 3.5]) c.vc.box(1.1, 6.2, 1.1, '#d8c9a7', { x: s * 13.5, y: 3.1, z: z - 10 + dz });
      c.vc.box(1.6, 1.4, 9, '#d8c9a7', { x: s * 13.5, y: 6.7, z: z - 10 });
      const sign = new THREE.Mesh(PLANE, unlitMat('pp:PLEASURE PARK', signTexture('PLEASURE PARK', '#2a6f73', '#f4f1ea', 512, 160)));
      sign.scale.set(7.2, 2.2, 1);
      sign.position.set(s * 12.5, 6.8, z - 10);
      sign.rotation.y = -s * 0.5;
      c.signs.push(sign);
      // climbing tower
      c.vc.cyl(1.6, 2.0, 15, '#b9b6ab', { x: s * 22, y: 7.5, z: z - 4 }, 10);
      for (let i = 0; i < 4; i++) c.vc.cyl(2.6, 2.6, 0.25, ['#c98f3a', '#2a6f73', '#a8553b', '#2d3c73'][i]!, { x: s * 22, y: 3.5 + i * 3.2, z: z - 4 }, 10);
      c.vc.cone(2.4, 2.4, '#a8553b', { x: s * 22, y: 16.2, z: z - 4 }, 10);
      // carousel
      c.vc.cyl(3.2, 3.2, 0.3, '#cfc7b5', { x: s * 22, y: 0.25, z: z + 12 }, 12);
      c.vc.cyl(0.25, 0.25, 3.2, '#8a7a5e', { x: s * 22, y: 1.8, z: z + 12 }, 6);
      c.vc.cone(3.6, 1.6, '#c98f3a', { x: s * 22, y: 4.2, z: z + 12 }, 12);
      // cinema block
      c.vc.box(8, 5.6, 14, '#e8dcc0', { x: s * 36, y: 2.8, z: z - 6 });
      c.vc.box(8.4, 0.4, 14.4, '#2d3c73', { x: s * 36, y: 5.8, z: z - 6 });
      c.vc.box(0.3, 3, 8, '#2a1f17', { x: s * 31.9, y: 1.5, z: z - 6 });
    }),

    /**
     * Garrison junction: a flyover deck that crosses the road far overhead, on two pairs of
     * piers with sloping approach ramps, plain concrete rails and lamp posts.
     */
    'rivers.flyover': piece('entry', (c, side) => {
      void side;
      const z = c.zStart + 11;
      const deckY = 9;
      c.vc.box(96, 1.1, 12, '#a9a59a', { x: 0, y: deckY, z });
      for (const dz of [-5.8, 5.8]) c.vc.box(96, 1.0, 0.35, '#8f8b82', { x: 0, y: deckY + 1.05, z: z + dz });
      for (const x of [-20, 20, -40, 40]) {
        for (const dz of [-3.5, 3.5]) c.vc.box(1.6, deckY, 1.8, '#bdb8ad', { x, y: deckY / 2, z: z + dz });
        c.vc.box(2.2, 0.9, 10, '#b3aea3', { x, y: deckY - 0.45, z });
      }
      for (const sx of [-1, 1]) {
        c.vc.box(25, 1.1, 12, '#a9a59a', { x: sx * 59.5, y: 4.9, z, rz: -sx * 0.38 });
      }
      for (let i = 0; i < 6; i++) c.vc.cyl(0.09, 0.09, 4.2, '#555', { x: -40 + i * 16, y: deckY + 3, z: z - 5.6 }, 4);
    }),

    /** Owns the other side of the flyover chunk so no building pokes through the deck. */
    'rivers.flyover-clear': piece('entry', () => {}),

    /**
     * The Bonny River lighthouse: a grey square skeletal steel tower narrowing to a gallery,
     * a lantern room and a small cap, standing on a mud bank with a plank landing.
     */
    'rivers.lighthouse': piece('venue', (c, side) => {
      const s = sideOf(side);
      const x = s * 25;
      const z = c.zMid;
      const grey = '#aab0ae';
      const baseW = 7;
      const topW = 2.4;
      const h = 28;
      c.vc.cyl(7, 8, 0.8, '#5a4632', { x, y: 0.4, z }, 10);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          // each leg leans in from the base corner to the gallery corner
          const bx = sx * baseW / 2;
          const bz = sz * baseW / 2;
          const tx = sx * topW / 2;
          const tz = sz * topW / 2;
          const len = Math.hypot(h, bx - tx, bz - tz);
          c.vc.cyl(0.14, 0.2, len, grey, { x: x + (bx + tx) / 2, y: h / 2 + 0.8, z: z + (bz + tz) / 2, rz: -sx * Math.atan((bx - tx) / h), rx: sz * Math.atan((bz - tz) / h) }, 4);
        }
      }
      for (let i = 1; i <= 5; i++) {
        const t = i / 6;
        const w = baseW + (topW - baseW) * t;
        const y = 0.8 + h * t;
        for (const dz of [-1, 1]) c.vc.box(w, 0.14, 0.14, grey, { x, y, z: z + dz * w / 2 });
        for (const dx of [-1, 1]) c.vc.box(0.14, 0.14, w, grey, { x: x + dx * w / 2, y, z });
      }
      c.vc.cyl(2.2, 2.2, 0.3, '#6e6e6a', { x, y: h + 0.9, z }, 8);
      c.vc.cyl(1.4, 1.4, 1.8, '#e8e6de', { x, y: h + 1.9, z }, 8);
      c.vc.cone(1.7, 1.4, '#a8553b', { x, y: h + 3.5, z }, 8);
      // plank landing
      c.vc.box(6, 0.16, 2, PLANK, { x: x - s * 9, y: 0.5, z });
    }),
  });
}
