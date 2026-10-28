import * as THREE from 'three';
import { shade } from '../../geo';
import { unlitMat } from '../../materials';
import { signTexture } from '../../textures';
import type { Ctx } from '../ctx';
import { FLORA } from '../flora';
import { registerPieces, type PieceDef } from '../pieces';

/**
 * Anambra's set pieces, drawn from the dossier (docs/research/states/anambra.md), not
 * copied from any building: stacked painted market plazas with water tanks, a long
 * concrete box-girder bridge with a toll canopy, a river port with cranes and a barge,
 * a roundabout island with a sign column and keke, and a town stadium bowl. Colours are
 * cream, terracotta, faded teal, indigo and wine; no flags, no party trios, no lettering
 * beyond each place's own name.
 */
const CREAM = '#e7d9b6';
const TERRACOTTA = '#9c5a3a';
const TEAL = '#5e9c95';
const INDIGO = '#3c4b7a';
const WINE = '#7a2f3e';
const CONCRETE = '#b3b0a6';
const ZINC = '#98908a';

const piece = (at: PieceDef['at'], build: PieceDef['build']): PieceDef => ({ at, build });
const PLANE = new THREE.PlaneGeometry(1, 1);
const sideOf = (side: -1 | 0 | 1): 1 | -1 => (side === -1 ? -1 : 1);

function board(c: Ctx, id: string, text: string, bg: string, fg: string, w: number, h: number, x: number, y: number, z: number, ry: number) {
  const sign = new THREE.Mesh(PLANE, unlitMat(`an:${id}`, signTexture(text, bg, fg, 512, 160)));
  sign.scale.set(w, h, 1);
  sign.position.set(x, y, z);
  sign.rotation.y = ry;
  c.signs.push(sign);
}

export function registerAnambraPieces() {
  registerPieces({
    /**
     * Onitsha Main Market: three stepped plazas of painted render, shutters rolled up along
     * the ground floor, flat roofs with parapets, black water tanks, a stair tower, a gate
     * board across the entrance and parasols with handcarts in front.
     */
    'anambra.main-market': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const blocks: [number, number, number, number, string][] = [
        [20, 9, 12, -12, CREAM],
        [22, 12.5, 12, 1, TERRACOTTA],
        [24, 10, 12, 14, TEAL],
      ];
      for (const [x, h, d, dz, col] of blocks) {
        const bx = s * x;
        c.vc.box(d, h, 11, col, { x: bx, y: h / 2, z: z + dz });
        c.vc.box(d + 0.5, 0.5, 11.5, '#8a8a86', { x: bx, y: h + 0.25, z: z + dz });
        c.vc.box(0.2, 3.0, 9.6, '#2a1f17', { x: bx - s * (d / 2 + 0.02), y: 1.6, z: z + dz });
        c.vc.box(0.2, 0.55, 9.6, shade(col, -0.18), { x: bx - s * (d / 2 + 0.02), y: 3.3, z: z + dz });
        for (let f = 1; f * 3 < h - 1; f++) {
          for (let k = -1; k <= 1; k++) c.vc.box(0.14, 1.3, 1.9, '#2f3a44', { x: bx - s * (d / 2 + 0.02), y: 3.3 + f * 2.6 - 0.4, z: z + dz + k * 3.2 });
        }
        for (let t = 0; t < 2; t++) c.vc.cyl(0.85, 0.85, 1.4, t ? '#25282c' : '#2f4a63', { x: bx + s * 2, y: h + 1.2, z: z + dz - 2.5 + t * 4.5 }, 8);
      }
      c.vc.box(3, 16, 3, '#d8cdb0', { x: s * 30, y: 8, z: z + 6 });
      c.vc.box(3.6, 0.5, 3.6, '#8a8a86', { x: s * 30, y: 16.2, z: z + 6 });
      const cols = [INDIGO, WINE, '#cc9a2c', '#2a6f73', CREAM];
      for (let i = 0; i < 8; i++) {
        const uz = z - 15 + i * 4.3;
        c.vc.cyl(0.05, 0.05, 2.4, '#5a3d24', { x: s * 12.6, y: 1.2, z: uz }, 4);
        c.vc.cone(1.6, 0.55, cols[i % cols.length]!, { x: s * 12.6, y: 2.5, z: uz }, 8);
        c.vc.box(1.5, 0.7, 1.0, '#7a5a3a', { x: s * 12.6, y: 0.35, z: uz });
      }
      for (let i = 0; i < 3; i++) {
        const hz = z - 9 + i * 8;
        c.vc.box(1.6, 0.15, 0.9, '#7a5a3a', { x: s * 10.6, y: 0.6, z: hz });
        for (let k = 0; k < 4; k++) c.vc.cyl(0.3, 0.26, 0.22, cols[(i + k) % cols.length]!, { x: s * 10.6 + (k - 1.5) * 0.28, y: 0.8 + (k % 2) * 0.2, z: hz }, 7);
        for (const dz of [-0.4, 0.4]) c.vc.cyl(0.3, 0.3, 0.08, '#1a1a1a', { x: s * 10.6, y: 0.3, z: hz + dz, rz: Math.PI / 2 }, 8);
      }
      c.vc.box(0.25, 5, 0.25, '#555', { x: s * 12, y: 2.5, z: z - 17 });
      board(c, 'main-market', 'ONITSHA MAIN MARKET', INDIGO, '#f4f1ea', 9, 2.8, s * 11.4, 6.2, z - 14, -s * 0.5);
    }),

    /**
     * The toll plaza at the bridgehead: a flat canopy slab over the whole carriageway on
     * slim posts, booth islands under it, a lamp pylon at each end.
     */
    'anambra.toll-plaza': piece('entry', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(26, 0.7, 12, '#cfc9b8', { x: 0, y: 7.4, z });
      c.vc.box(26.4, 0.3, 12.4, TERRACOTTA, { x: 0, y: 7.85, z });
      for (const px of [-11.5, 11.5]) for (const dz of [-4.5, 4.5]) c.vc.box(0.7, 7.1, 0.7, '#d8d4c6', { x: px, y: 3.55, z: z + dz });
      for (const px of [-7.2, -2.4, 2.4, 7.2]) {
        c.vc.box(1.6, 0.5, 8, '#9a968c', { x: px, y: 0.25, z });
        c.vc.box(1.5, 3.0, 2.8, '#e7e3d4', { x: px, y: 2.0, z });
        c.vc.box(1.7, 0.25, 3.1, '#5a5a56', { x: px, y: 3.6, z });
        c.vc.box(1.52, 1.0, 1.6, '#2f3a44', { x: px, y: 2.3, z });
        c.vc.box(0.2, 1.2, 0.2, '#cc9a2c', { x: px, y: 1.1, z: z - 3.4 });
      }
      for (const px of [-11.5, 11.5]) {
        c.vc.cyl(0.1, 0.12, 10, '#8a8a86', { x: px, y: 5, z: z + 8 }, 5);
        c.vc.box(2.4, 0.2, 0.4, '#6a6a66', { x: px - Math.sign(px) * 1.0, y: 10, z: z + 8 });
      }
      board(c, 'toll', 'TOLL PLAZA', '#2f3a44', '#f4f1ea', 7, 2.2, 0, 8.9, z - 6.3, 0);
      void s;
    }),
    /** Keeps the far side of the toll plaza's chunk clear so its posts have room. */
    'anambra.toll-clear': piece('entry', () => {}),

    /**
     * The Second Niger Bridge: a long concrete box-girder deck seen beside the road on tall
     * piers, thick over each pier and thinner mid-span, a median barrier and lamp posts.
     */
    'anambra.bridge-deck': piece('venue', (c, side) => {
      const s = sideOf(side);
      const dx = s * 34;
      const z = c.zMid;
      const deckY = 13;
      c.vc.box(26, 1.6, 40, CONCRETE, { x: dx, y: deckY, z });
      for (let i = 0; i < 2; i++) {
        const pz = c.zStart + 8 + i * 24;
        c.vc.box(26, 1.4, 6, shade(CONCRETE, -0.08), { x: dx, y: deckY - 1.4, z: pz });
        c.vc.box(5, deckY - 0.6, 3.2, '#c9c5b8', { x: dx, y: (deckY - 0.6) / 2, z: pz });
        c.vc.box(5.6, 0.7, 3.8, '#a8a498', { x: dx, y: 0.35, z: pz });
      }
      c.vc.box(0.5, 1.0, 40, '#8a8a86', { x: dx, y: deckY + 1.3, z });
      for (const ex of [-12.2, 12.2]) c.vc.box(0.4, 0.9, 40, '#a8a498', { x: dx + ex, y: deckY + 1.2, z });
      for (let i = 0; i < 5; i++) {
        c.vc.cyl(0.1, 0.12, 6, '#7a7a76', { x: dx, y: deckY + 4, z: c.zStart + 4 + i * 8 }, 5);
        c.vc.box(3.2, 0.2, 0.4, '#6a6a66', { x: dx, y: deckY + 7, z: c.zStart + 4 + i * 8 });
      }
    }),

    /**
     * Onitsha River Port: a concrete quay edge, two harbour cranes (round tower, long boom,
     * cab), a container stack, a warehouse shed and a flat barge with a wedge bow alongside.
     */
    'anambra.river-port': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      c.vc.box(14, 0.8, 40, '#9a968c', { x: s * 19, y: 0.4, z });
      c.vc.box(0.5, 1.2, 40, '#7a7a76', { x: s * 26.2, y: 1.0, z });
      for (let i = 0; i < 8; i++) c.vc.cyl(0.24, 0.28, 0.7, '#2b2b2e', { x: s * 26, y: 1.15, z: c.zStart + 3 + i * 5 }, 6);
      for (const dz of [-9, 9]) {
        c.vc.box(5, 1.0, 5, '#5a5a56', { x: s * 21, y: 1.3, z: z + dz });
        c.vc.cyl(1.0, 1.3, 14, '#c9a56e', { x: s * 21, y: 8.3, z: z + dz }, 10);
        c.vc.box(3.0, 2.2, 3.4, '#cfcfca', { x: s * 21, y: 15.6, z: z + dz });
        c.vc.box(2.0, 1.6, 26, '#c9a56e', { x: s * 25, y: 16, z: z + dz, rx: dz > 0 ? -0.12 : 0.12 });
        c.vc.box(0.3, 4.6, 0.3, '#6a6a66', { x: s * 21, y: 18.6, z: z + dz });
      }
      const boxes = [TERRACOTTA, INDIGO, TEAL, WINE, '#8a8a86'];
      for (let i = 0; i < 4; i++) c.vc.box(2.5, 2.6, 6.1, boxes[i % boxes.length]!, { x: s * 15.4, y: 2.1, z: z - 10 + i * 6.3 });
      c.vc.box(2.5, 2.6, 6.1, boxes[1]!, { x: s * 15.4, y: 4.7, z: z - 3.7 });
      const barge = '#6b6458';
      c.vc.box(7.5, 1.7, 22, barge, { x: s * 32, y: 0.75, z });
      c.vc.cone(3.9, 4, barge, { x: s * 32, y: 0.75, z: z - 13, rx: -Math.PI / 2, sx: 1.0, sy: 1.0, sz: 0.45 }, 4);
      c.vc.box(7.7, 0.25, 22.2, '#b0623c', { x: s * 32, y: 1.7, z });
      c.vc.box(4, 2.2, 5, '#e7e3d4', { x: s * 32, y: 3, z: z + 7 });
      c.vc.box(4.3, 0.3, 5.3, TERRACOTTA, { x: s * 32, y: 4.2, z: z + 7 });
    }),

    /**
     * Nnewi's centre: a round island with a kerb ring, a lawn, a tall sign column topped by
     * a drum, a few palms, parked keke and tyre stacks around the ring.
     */
    'anambra.nnewi-roundabout': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 29;
      c.vc.cyl(11.2, 11.2, 0.25, '#4f5558', { x: cx, y: 0.1, z }, 20);
      c.vc.cyl(10.4, 10.4, 0.5, '#cfc9b8', { x: cx, y: 0.25, z }, 20);
      c.vc.cyl(9.6, 9.6, 0.6, '#6f9a4a', { x: cx, y: 0.3, z }, 20);
      c.vc.box(2.6, 5.8, 2.6, CREAM, { x: cx, y: 3.4, z });
      c.vc.cyl(2.4, 2.4, 1.6, INDIGO, { x: cx, y: 7.0, z }, 10);
      c.vc.cone(1.6, 1.4, TERRACOTTA, { x: cx, y: 8.5, z }, 10);
      board(c, 'nnewi', 'NNEWI', INDIGO, '#f4f1ea', 5, 1.5, cx - s * 2.8, 4.6, z, s * 1.2);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.6;
        FLORA.oilpalm!(c, cx + Math.cos(a) * 6.2, z + Math.sin(a) * 6.2);
      }
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * 0.55 + i * 0.28;
        const kx = cx - s * Math.cos(a - Math.PI / 2) * 9.8;
        const kz = z + Math.sin(a - Math.PI / 2) * 9.8;
        c.vc.box(1.2, 0.7, 2.0, '#ece5cf', { x: kx, y: 0.85, z: kz });
        c.vc.box(1.3, 0.12, 2.2, '#cc9a2c', { x: kx, y: 1.9, z: kz });
      }
      for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) c.vc.cyl(0.46, 0.46, 0.3, '#1c1c1c', { x: s * 14.4, y: 0.17 + k * 0.3, z: z - 12 + i * 12, rx: Math.PI / 2 }, 8);
    }),

    /**
     * Awka Township Stadium: an oval bowl of three raked tiers around a pitch and track,
     * a pavilion roof slab on posts on the road side, four floodlight masts and a gate
     * block with the name above it.
     */
    'anambra.awka-stadium': piece('venue', (c, side) => {
      const s = sideOf(side);
      const z = c.zMid;
      const cx = s * 47;
      const rx = 22;
      const rz = 18;
      c.vc.cyl(rx + 3, rx + 3, 0.1, '#8a8a82', { x: cx, y: 0.05, z, sz: (rz + 3) / (rx + 3) }, 20);
      c.vc.cyl(rx - 4, rx - 4, 0.14, '#a85a38', { x: cx, y: 0.08, z, sz: (rz - 4) / (rx - 4) }, 20);
      c.vc.cyl(rx - 8, rx - 8, 0.18, '#5e8a3e', { x: cx, y: 0.1, z, sz: (rz - 8) / (rx - 8) }, 20);
      const N = 22;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const near = Math.cos(a) * s < -0.55;
        for (let t = 0; t < 3; t++) {
          if (near && t > 0) continue;
          const k = 1 + t * 0.09;
          const bx = cx + Math.cos(a) * rx * k;
          const bz = z + Math.sin(a) * rz * k;
          const len = ((Math.PI * 2 * Math.hypot(rx, rz)) / 2 / N) * 1.12 * k;
          c.vc.box(3.2, 2.6 + t * 1.5, len, t % 2 ? '#cfc9b8' : '#b9b2a2', { x: bx, y: (2.6 + t * 1.5) / 2, z: bz, ry: -a });
        }
      }
      const px = cx - s * (rx + 2);
      c.vc.box(7, 0.3, 20, ZINC, { x: px, y: 6.4, z, rz: -s * 0.14 });
      for (const dz of [-8, -2.7, 2.7, 8]) c.vc.cyl(0.18, 0.2, 6.2, '#8a8a82', { x: px - s * 2.8, y: 3.1, z: z + dz }, 5);
      c.vc.box(3, 3.4, 6, CREAM, { x: s * 22, y: 1.7, z });
      c.vc.box(3.4, 0.4, 6.4, TERRACOTTA, { x: s * 22, y: 3.6, z });
      board(c, 'awka', 'AWKA TOWNSHIP STADIUM', INDIGO, '#f4f1ea', 9, 2.4, s * 20.4, 6.6, z, -s * 0.9);
      c.vc.box(0.2, 3.4, 0.2, '#555', { x: s * 20.4, y: 5.0, z });
      for (const [mx, mz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]] as const) {
        c.vc.cyl(0.16, 0.22, 17, '#8a8f99', { x: cx + mx * (rx + 1.5), y: 8.5, z: z + mz * (rz + 1.5) }, 6);
        c.vc.box(3, 0.9, 0.5, '#f4efd0', { x: cx + mx * (rx + 1.5), y: 17, z: z + mz * (rz + 1.5) });
      }
    }),
  });
}
