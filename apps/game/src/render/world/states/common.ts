import * as THREE from 'three';
import { shade } from '../../geo';
import { unlitMat } from '../../materials';
import { signTexture } from '../../textures';
import type { Ctx } from '../ctx';
import type { PieceDef } from '../pieces';

/**
 * Helpers the second batch of state pieces share (Delta, Kwara, Oyo, Borno): the piece and
 * side shorthands, a painted board, and the two structures that more than one state needs,
 * a flyover deck on piers and a steel through-truss.
 */
const PLANE = new THREE.PlaneGeometry(1, 1);

export const piece = (at: PieceDef['at'], build: PieceDef['build']): PieceDef => ({ at, build });
export const sideOf = (side: -1 | 0 | 1): 1 | -1 => (side === -1 ? -1 : 1);

/** A painted board facing the road, cached by id so two chunks with the same board share a material. */
export function board(c: Ctx, id: string, text: string, bg: string, fg: string, w: number, h: number, x: number, y: number, z: number, ry: number) {
  const sign = new THREE.Mesh(PLANE, unlitMat(`b2:${id}`, signTexture(text, bg, fg, 512, 160)));
  sign.scale.set(w, h, 1);
  sign.position.set(x, y, z);
  sign.rotation.y = ry;
  c.signs.push(sign);
}

/**
 * A flyover deck running along the road (z) at `x`, on pairs of square piers with a cap beam,
 * plain parapet rails and lamp posts. `len` metres long and `deckY` high; both ends are left
 * open so it reads as part of a longer structure.
 */
export function flyoverDeck(c: Ctx, x: number, z: number, len: number, deckY: number, concrete: string, rail: string) {
  c.vc.box(11, 1.1, len, concrete, { x, y: deckY, z });
  for (const e of [-1, 1]) c.vc.box(0.35, 1.0, len, rail, { x: x + e * 5.4, y: deckY + 1.05, z });
  const n = Math.max(2, Math.round(len / 14));
  for (let i = 0; i < n; i++) {
    const pz = z - len / 2 + ((i + 0.5) / n) * len;
    for (const dx of [-3, 3]) c.vc.box(1.8, deckY, 1.8, shade(concrete, 0.05), { x: x + dx, y: deckY / 2, z: pz });
    c.vc.box(9, 0.9, 2.4, shade(concrete, -0.05), { x, y: deckY - 0.45, z: pz });
  }
  for (let i = 0; i < n + 1; i++) c.vc.cyl(0.09, 0.09, 4.2, '#555', { x: x - 5.4, y: deckY + 3, z: z - len / 2 + (i / n) * len }, 4);
}

/**
 * A steel through-truss road or rail bridge running along z at `x`: two trusses with top and
 * bottom chords, verticals and diagonals, cross-braces overhead and round piers. `arch` raises
 * the top chord toward mid-span, as on the multi-span river bridges.
 */
export function steelTruss(c: Ctx, x: number, z: number, len: number, deckY: number, steel: string, deck: string, arch = 0) {
  const w = 11;
  const h = 5.2;
  c.vc.box(w, 0.9, len, deck, { x, y: deckY, z });
  const n = Math.max(6, Math.round(len / 5));
  for (const e of [-1, 1]) {
    const ex = x + e * (w / 2 - 0.2);
    c.vc.box(0.4, 0.4, len, steel, { x: ex, y: deckY + 0.7, z });
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const lift = (t: number) => arch * Math.sin(Math.PI * t);
      const y0 = deckY + h + lift(t0);
      const y1 = deckY + h + lift(t1);
      const z0 = z - len / 2 + t0 * len;
      const z1 = z - len / 2 + t1 * len;
      const seg = Math.hypot(z1 - z0, y1 - y0);
      c.vc.box(0.4, 0.4, seg, steel, { x: ex, y: (y0 + y1) / 2, z: (z0 + z1) / 2, rx: -Math.atan2(y1 - y0, z1 - z0) });
      const vh = y0 - (deckY + 0.7);
      c.vc.box(0.28, vh, 0.28, steel, { x: ex, y: deckY + 0.7 + vh / 2, z: z0 });
      const dz = z1 - z0;
      const dh = (y0 + y1) / 2 - (deckY + 0.7);
      c.vc.box(0.22, Math.hypot(dz, dh), 0.22, shade(steel, 0.06), { x: ex, y: deckY + 0.7 + dh / 2, z: (z0 + z1) / 2, rx: (i % 2 ? 1 : -1) * Math.atan2(dz, dh) });
    }
  }
  for (let i = 0; i <= n; i += 2) {
    const t = i / n;
    c.vc.box(w - 0.4, 0.3, 0.3, steel, { x, y: deckY + h + arch * Math.sin(Math.PI * t), z: z - len / 2 + t * len });
  }
  const spans = Math.max(1, Math.round(len / 34));
  for (let i = 0; i <= spans; i++) {
    const pz = z - len / 2 + (i / spans) * len;
    c.vc.cyl(1.7, 2.1, deckY, '#a8a498', { x, y: deckY / 2 - 0.4, z: pz }, 10);
  }
}

/**
 * A town stadium beside the road: a terrace of stepped concrete, a roofed main stand with a
 * tilted slab, four floodlight masts, a gate block with the board, kiosks and shade. The later
 * states share it; `name` is the board text (always a generic role name).
 */
export function stadiumBlock(c: Ctx, s: 1 | -1, z: number, o: { name: string; bg: string; fg: string; stand: string; roof: string; gate: string; id: string }) {
  const sx = s * 24;
  for (let step = 0; step < 5; step++) c.vc.box(3.0, 0.9 + step * 0.9, 32, step % 2 ? shade(o.stand, 0.05) : o.stand, { x: sx + s * step * 2.6, y: (0.9 + step * 0.9) / 2, z });
  c.vc.box(5.2, 0.25, 33, o.roof, { x: sx + s * 3.8, y: 6.6, z, rz: -s * 0.1 });
  for (const dz of [-14, -5, 5, 14]) c.vc.cyl(0.16, 0.18, 6.2, '#8a8f99', { x: sx + s * 1.4, y: 3.1, z: z + dz }, 5);
  for (const dz of [-18, 18]) {
    for (const dx of [-2, 17]) {
      c.vc.cyl(0.16, 0.22, 17, '#8a8f99', { x: sx + s * dx, y: 8.5, z: z + dz }, 6);
      c.vc.box(3.2, 0.9, 0.5, '#f4efd0', { x: sx + s * dx, y: 17, z: z + dz });
    }
  }
  c.vc.box(3.6, 3.3, 7, o.gate, { x: s * 19.5, y: 1.65, z: z + 12 });
  c.vc.box(3.9, 0.4, 7.3, o.roof, { x: s * 19.5, y: 3.5, z: z + 12 });
  board(c, o.id, o.name, o.bg, o.fg, 8, 2.1, s * 17.4, 6.2, z + 8, -s * 0.9);
  c.vc.box(0.2, 3.4, 0.2, '#555', { x: s * 17.4, y: 4.7, z: z + 8 });
  for (let i = 0; i < 3; i++) {
    c.vc.cyl(0.04, 0.04, 2.4, '#5a3d24', { x: s * 12.2, y: 1.2, z: z - 12 + i * 3.4 }, 4);
    c.vc.cone(1.4, 0.5, [o.bg, o.gate, '#8a8f6a'][i]!, { x: s * 12.2, y: 2.5, z: z - 12 + i * 3.4 }, 8);
  }
}
