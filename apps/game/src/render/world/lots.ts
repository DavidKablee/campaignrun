import { texBox, shade } from '../geo';
import { unlitMat } from '../materials';
import { signTexture } from '../textures';
import * as THREE from 'three';
import type { Ctx } from './ctx';
import { facadeKey, shopKey } from './ctx';

/** One plot along the road. `x0` is the distance of its front face from the centre line. */
export interface Lot {
  c: Ctx;
  side: 1 | -1;
  z0: number;
  w: number;
  d: number;
  x0: number;
  floors: number;
  palette: readonly string[];
  billboards: readonly string[];
  accent: string;
}

export type LotBuilder = (lot: Lot) => void;

const PLANE = new THREE.PlaneGeometry(1, 1);

function parapet(lot: Lot, top: number, col: string, pinnacles: boolean) {
  const { c, side, w, d, x0 } = lot;
  const cx = side * (x0 + d / 2);
  const cz = lot.z0 + w / 2;
  const t = 0.28;
  const h = 0.55;
  c.vc.box(d + 0.1, h, t, col, { x: cx, y: top + h / 2, z: cz - w / 2 + t / 2 });
  c.vc.box(d + 0.1, h, t, col, { x: cx, y: top + h / 2, z: cz + w / 2 - t / 2 });
  c.vc.box(t, h, w, col, { x: cx - side * (d / 2 - t / 2), y: top + h / 2, z: cz });
  c.vc.box(t, h, w, col, { x: cx + side * (d / 2 - t / 2), y: top + h / 2, z: cz });
  if (!pinnacles) return;
  // The four horn-like corner pinnacles that tell you this is earthen Hausa building.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      c.vc.cone(0.26, 0.9, shade(col, -0.05), { x: cx + sx * (d / 2 - 0.15), y: top + h + 0.4, z: cz + sz * (w / 2 - 0.15) }, 5);
    }
  }
}

function awning(lot: Lot, y: number, depth: number) {
  const { c, side, w, x0 } = lot;
  const cz = lot.z0 + w / 2;
  const cols = lot.palette.length ? lot.palette : ['#c98f3a', '#2d3c73', '#8a5a2b', '#8ea4ae'];
  const col = c.rx.pick(cols);
  const n = 6;
  for (let i = 0; i < n; i++) {
    c.vc.box((w * 0.88) / n, 0.07, depth, i % 2 ? '#f4f1ea' : col, { x: side * (x0 - depth / 2 + 0.05), y, z: cz - w * 0.44 + (i + 0.5) * ((w * 0.88) / n), rz: side * 0.12 });
  }
}

export const LOT_STYLES: Record<string, LotBuilder> = {
  /**
   * An earthen compound: a plastered block with a parapet and horn pinnacles,
   * a projecting entrance hall with a dark pointed door, relief bands and
   * a low yard wall.
   */
  'mudbrick-compound'(lot) {
    const { c, side, w, d, x0, floors } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const fset = c.district.facade;
    const h = floors * 3;
    const tint = r.int(0, 5);
    c.tb.add(facadeKey(fset, tint), texBox(w, h, d, 3.5, 3), { x: cx, y: h / 2, z: cz });
    const wall = lot.palette.length ? r.pick(lot.palette) : '#c98f58';
    parapet(lot, h, wall, true);
    // entrance hall (zaure): a projecting box with a dark door and a pointed arch
    const ez = cz + r.range(-w * 0.2, w * 0.2);
    const ew = 2.8;
    const ed = 1.3;
    c.vc.box(ed, 3.4, ew, wall, { x: side * (x0 - ed / 2 + 0.05), y: 1.7, z: ez });
    c.vc.box(0.12, 2.3, 1.5, '#2a1a10', { x: side * (x0 - ed - 0.0), y: 1.15, z: ez });
    c.vc.cone(0.9, 1.0, '#2a1a10', { x: side * (x0 - ed - 0.0), y: 2.8, z: ez, rz: side * Math.PI / 2 }, 4);
    c.vc.box(ed + 0.1, 0.22, ew + 0.3, shade(wall, -0.1), { x: side * (x0 - ed / 2 + 0.05), y: 3.5, z: ez });
    // water spouts
    for (let i = 0; i < 2; i++) c.vc.cyl(0.07, 0.07, 0.7, '#5a3a22', { x: side * (x0 - 0.3), y: h - 0.1, z: cz + (i ? 1 : -1) * w * 0.3, rz: Math.PI / 2 }, 5);
    // yard wall
    if (r.chance(0.7)) {
      c.vc.box(0.35, 1.6, w * 0.34, shade(wall, 0.04), { x: side * (x0 - 1.4), y: 0.8, z: cz - w * 0.33 });
      c.vc.box(0.35, 1.6, w * 0.34, shade(wall, 0.04), { x: side * (x0 - 1.4), y: 0.8, z: cz + w * 0.33 });
    }
  },
  /** Single-storey open shopfronts under striped canvas, behind a flat roof with a parapet. */
  'flatroof-shopfront'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const shopH = 3.4;
    c.tb.add(shopKey(c.district.shops, r.int(0, 5)), texBox(w, shopH, d, 3.5, 3.4), { x: cx, y: shopH / 2, z: cz });
    awning(lot, 3.0, 1.5);
    parapet(lot, shopH, '#b9895a', false);
    // stacked goods and sacks at the kerb
    for (let i = 0; i < r.int(1, 3); i++) {
      c.vc.box(0.7, 0.45, 0.5, r.pick(['#d9c9a0', '#9a6b4b', '#c9b27a']), { x: side * (x0 - 0.9), y: 0.23, z: lot.z0 + r.range(1, w - 1) });
    }
  },
  /**
   * A waterside house on piles: weathered planks, a low zinc roof, a door onto a plank
   * walkway, a fish-drying rack. The posts stand in mud, the planks stand over it.
   */
  'stilt-house'(lot) {
    const { c, side, w, x0 } = lot;
    const r = c.rx;
    const hw = Math.min(w, 7.5);
    const hd = r.range(5, 6.5);
    const cx = side * (x0 + hd / 2 + 1.2);
    const cz = lot.z0 + w / 2;
    const lift = r.range(1.3, 2.1);
    const wallH = 2.8;
    for (const dx of [-1, 0, 1]) for (const dz of [-1, 1]) c.vc.cyl(0.14, 0.18, lift, '#4a3828', { x: cx + dx * (hd / 2 - 0.3), y: lift / 2, z: cz + dz * (hw / 2 - 0.3) }, 5);
    c.vc.box(hd + 0.6, 0.18, hw + 0.6, '#7a6a4a', { x: cx, y: lift, z: cz });
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(hw, wallH, hd, 3.2, 2.8), { x: cx, y: lift + 0.1 + wallH / 2, z: cz });
    const roof = r.pick(['#a8553b', '#98908a', '#8a6a4a', '#7d8a93']);
    c.vc.prism(hd + 1.2, 1.4, hw + 0.8, roof, { x: cx, y: lift + 0.1 + wallH, z: cz });
    c.vc.box(0.12, 1.9, 0.9, r.pick(['#2a6f73', '#c98f3a', '#3b4f80', '#6e5a44']), { x: cx - side * (hd / 2 + 0.01), y: lift + 1.15, z: cz + r.range(-1, 1) });
    // plank walkway to the road and a fish rack on the deck
    c.vc.box(Math.max(0.6, x0 + 1.2 - 9), 0.12, 1.1, '#7a6a4a', { x: side * ((9 + x0 + 1.2) / 2), y: lift - 0.1, z: cz });
    if (r.chance(0.6)) {
      for (const dz of [-1.2, 1.2]) c.vc.cyl(0.04, 0.04, 1.2, '#4a3828', { x: cx + side * (hd / 2 + 0.7), y: lift + 0.6, z: cz + dz }, 4);
      c.vc.box(0.06, 0.06, 2.6, '#4a3828', { x: cx + side * (hd / 2 + 0.7), y: lift + 1.2, z: cz });
      for (let i = 0; i < 4; i++) c.vc.box(0.05, 0.5, 0.18, '#b9a98a', { x: cx + side * (hd / 2 + 0.7), y: lift + 0.95, z: cz - 0.9 + i * 0.6 });
    }
  },
  /**
   * A colonial bungalow in its garden: cream walls, a deep verandah on slim columns,
   * a pitched roof, a low garden wall and gate pillars at the road.
   */
  'colonial-bungalow'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const h = 3.4;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.8, h, d * 0.75, 3.5, 3.4), { x: cx + side * d * 0.1, y: h / 2, z: cz });
    const roof = r.pick(lot.palette.length ? lot.palette : ['#8a5a3c', '#6e7a6a', '#a8553b']);
    c.vc.prism(d * 0.75 + 1.8, 2.2, w * 0.8 + 1.4, roof, { x: cx + side * d * 0.1, y: h, z: cz });
    // verandah along the road face
    const vx = cx - side * (d * 0.4 + 0.2);
    c.vc.box(2.1, 0.14, w * 0.8 + 0.6, '#cfc7b5', { x: vx, y: 0.1, z: cz });
    c.vc.box(2.4, 0.2, w * 0.8 + 0.8, shade(roof, -0.05), { x: vx, y: h - 0.2, z: cz, rz: side * 0.12 });
    for (let i = 0; i < 5; i++) c.vc.cyl(0.1, 0.1, h - 0.3, '#f4f1ea', { x: vx - side * 0.8, y: (h - 0.3) / 2, z: cz - w * 0.36 + i * ((w * 0.72) / 4) }, 5);
    // garden wall and gate
    c.vc.box(0.3, 1.1, w, '#e8dcc0', { x: side * (x0 - 1.2), y: 0.55, z: cz });
    for (const dz of [-1.4, 1.4]) c.vc.box(0.6, 1.9, 0.6, '#d8c9a7', { x: side * (x0 - 1.2), y: 0.95, z: cz + dz });
  },
  /** Oil storage: three fat grey tanks with ring bands and a ladder, behind a low bund wall. */
  'tank-farm'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cz = lot.z0 + w / 2;
    const tr = Math.min(3.6, w / 3);
    c.vc.box(d + 1, 0.9, w, '#a9a59a', { x: side * (x0 + d / 2), y: 0.45, z: cz });
    for (let i = 0; i < 2; i++) {
      const tx = side * (x0 + d * (0.3 + i * 0.4));
      const tz = cz + (i ? 1 : -1) * w * 0.2;
      const th = r.range(6.5, 9);
      const col = r.pick(['#d6d3c8', '#bdc4c4', '#c9c3b0']);
      c.vc.cyl(tr, tr, th, col, { x: tx, y: th / 2 + 0.9, z: tz }, 12);
      c.vc.cyl(tr + 0.05, tr + 0.05, 0.25, '#8f8f8a', { x: tx, y: th * 0.4 + 0.9, z: tz }, 12);
      c.vc.cyl(tr + 0.05, tr + 0.05, 0.25, '#8f8f8a', { x: tx, y: th * 0.8 + 0.9, z: tz }, 12);
      c.vc.cyl(tr + 0.1, tr, 0.4, '#8f8f8a', { x: tx, y: th + 1.1, z: tz }, 12);
      c.vc.box(0.12, th, 0.5, '#555', { x: tx - side * (tr + 0.1), y: th / 2 + 0.9, z: tz });
    }
    c.vc.box(d * 0.7, 0.3, 0.3, '#7a7a76', { x: side * (x0 + d * 0.5), y: 1.5, z: cz });
  },
  /** A market hall: a long low shop front with a shallow zinc roof, a row of big umbrellas out front. */
  'market-shed'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const h = 3.6;
    c.tb.add(shopKey(c.district.shops, r.int(0, 5)), texBox(w, h, d, 3.5, 3.6), { x: cx, y: h / 2, z: cz });
    c.vc.prism(d + 0.8, 1.0, w + 0.6, r.pick(['#98908a', '#7d8a93', '#a8553b']), { x: cx, y: h, z: cz });
    const cols = lot.palette.length ? lot.palette : ['#c98f3a', '#2a6f73', '#f4f1ea', '#a8553b'];
    for (let i = 0; i < 3; i++) {
      const uz = lot.z0 + ((i + 0.5) * w) / 3;
      c.vc.cyl(0.04, 0.04, 2.5, '#5a3d24', { x: side * (x0 - 1.8), y: 1.25, z: uz }, 4);
      c.vc.cone(1.5, 0.55, r.pick(cols), { x: side * (x0 - 1.8), y: 2.6, z: uz }, 8);
      c.vc.box(1.3, 0.6, 0.9, '#7a5a3a', { x: side * (x0 - 1.8), y: 0.3, z: uz });
    }
  },
  /**
   * A market plaza: three or four floors of painted render over open shop fronts with
   * rolled shutters, flat roof and parapet, plastic water tanks, parasols and a loaded
   * handcart at the kerb.
   */
  'market-block'(lot) {
    const { c, side, w, d, x0, floors } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const shopH = 3.4;
    c.tb.add(shopKey(c.district.shops, r.int(0, 5)), texBox(w, shopH, d, 3.5, 3.4), { x: cx, y: shopH / 2, z: cz });
    const upper = Math.max(1, floors - 1) * 3;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w, upper, d, 3.5, 3), { x: cx, y: shopH + upper / 2, z: cz });
    const top = shopH + upper;
    c.vc.box(d + 0.3, 0.35, w + 0.3, '#8a8a86', { x: cx, y: top + 0.17, z: cz });
    parapet(lot, top + 0.3, '#cfc7b5', false);
    for (let i = 0; i < r.int(1, 3); i++) {
      c.vc.cyl(0.8, 0.8, 1.4, r.pick(['#25282c', '#2f4a63']), { x: cx + r.range(-d / 4, d / 4), y: top + 1.0, z: cz + r.range(-w / 3, w / 3) }, 8);
    }
    if (floors >= 3) {
      c.vc.box(0.9, 0.14, w * 0.8, '#cfc7b5', { x: side * (x0 - 0.4), y: shopH + 2.9, z: cz });
      c.vc.box(0.05, 0.8, w * 0.8, '#3a3a38', { x: side * (x0 - 0.8), y: shopH + 3.3, z: cz });
    }
    const cols = lot.palette.length ? lot.palette : ['#7a2f3e', '#3c4b7a', '#9c5a3a', '#e7d9b6'];
    for (let i = 0; i < 2; i++) {
      const uz = lot.z0 + ((i + 0.5) * w) / 2;
      c.vc.cyl(0.04, 0.04, 2.4, '#5a3d24', { x: side * (x0 - 1.7), y: 1.2, z: uz }, 4);
      c.vc.cone(1.4, 0.5, r.pick(cols), { x: side * (x0 - 1.7), y: 2.5, z: uz }, 8);
    }
    if (r.chance(0.6)) {
      const hz = lot.z0 + r.range(1.5, w - 1.5);
      c.vc.box(1.5, 0.15, 0.9, '#7a5a3a', { x: side * (x0 - 3.2), y: 0.6, z: hz });
      for (let k = 0; k < 4; k++) c.vc.cyl(0.3, 0.26, 0.22, r.pick(cols), { x: side * (x0 - 3.2 + (k - 1.5) * 0.28), y: 0.8 + (k % 2) * 0.2, z: hz }, 7);
      for (const dz of [-0.4, 0.4]) c.vc.cyl(0.3, 0.3, 0.08, '#1a1a1a', { x: side * (x0 - 3.2), y: 0.3, z: hz + dz, rz: Math.PI / 2 }, 8);
    }
  },
  /**
   * A return-home mansion: tall rendered storeys, a columned portico under a balcony
   * with a balustrade, a parapet with a central pediment, ball finials, and a high
   * boundary wall with a steel gate between pillars at the road.
   */
  mansion(lot) {
    const { c, side, w, d, x0, floors } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2 + 1.6);
    const cz = lot.z0 + w / 2;
    const bw = Math.min(w, 11);
    const bd = Math.max(5, d - 3);
    const h = Math.max(2, floors) * 3.1;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(bw, h, bd, 3.5, 3.1), { x: cx, y: h / 2, z: cz });
    const trim = r.pick(['#f0ebdd', '#e7d9b6', '#d8c9a7']);
    c.vc.box(bd + 0.5, 0.4, bw + 0.5, trim, { x: cx, y: h + 0.2, z: cz });
    if (r.chance(0.55)) c.vc.prism(bd + 0.8, 1.6, bw + 0.8, r.pick(['#8e5233', '#5e6b63', '#9aa3a6']), { x: cx, y: h + 0.4, z: cz });
    else c.vc.box(0.5, 1.5, bw * 0.4, trim, { x: cx - side * (bd / 2), y: h + 1.1, z: cz });
    // portico
    const px = cx - side * (bd / 2 + 1.0);
    c.vc.box(2.2, 0.16, bw * 0.75, trim, { x: px, y: h * 0.52, z: cz });
    for (let i = 0; i < 4; i++) c.vc.cyl(0.24, 0.26, h * 0.52, trim, { x: px - side * 0.9, y: h * 0.26, z: cz - bw * 0.33 + i * ((bw * 0.66) / 3) }, 8);
    c.vc.box(0.12, 0.8, bw * 0.75, '#e8e4d4', { x: px - side * 1.0, y: h * 0.52 + 0.5, z: cz });
    // boundary wall, gate, pillars with ball finials
    const wx = side * (x0 - 0.4);
    const wallCol = r.pick(['#e8dcc0', '#d8c9a7', '#c9b58a']);
    c.vc.box(0.35, 2.3, w * 0.38, wallCol, { x: wx, y: 1.15, z: cz - w * 0.31 });
    c.vc.box(0.35, 2.3, w * 0.38, wallCol, { x: wx, y: 1.15, z: cz + w * 0.31 });
    for (const dz of [-1, 1]) {
      c.vc.box(0.7, 2.9, 0.7, trim, { x: wx, y: 1.45, z: cz + dz * 1.9 });
      c.vc.sphere(0.4, trim, { x: wx, y: 3.1, z: cz + dz * 1.9 }, 6);
    }
    c.vc.box(0.1, 2.0, 3.0, '#23262a', { x: wx, y: 1.1, z: cz });
  },
  /** Block-wall bungalow compound: plain rendered house, rust zinc roof, a yard wall and a steel gate. */
  'zinc-bungalow'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const h = 3.2;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.7, h, d * 0.7, 3.5, 3.2), { x: cx + side * d * 0.1, y: h / 2, z: cz });
    c.vc.prism(d * 0.7 + 1.2, 1.7, w * 0.7 + 1.0, r.pick(['#8e5233', '#9aa3a6', '#a8553b']), { x: cx + side * d * 0.1, y: h, z: cz });
    const wallCol = r.pick(['#d8c9a7', '#e8dcc0', '#c9b58a']);
    c.vc.box(0.3, 1.5, w * 0.34, wallCol, { x: side * (x0 - 0.8), y: 0.75, z: cz - w * 0.33 });
    c.vc.box(0.3, 1.5, w * 0.34, wallCol, { x: side * (x0 - 0.8), y: 0.75, z: cz + w * 0.33 });
    c.vc.box(0.08, 1.4, 2.6, '#23262a', { x: side * (x0 - 0.8), y: 0.7, z: cz });
    if (r.chance(0.5)) c.vc.sphere(0.3, '#6a8a3a', { x: side * (x0 + 1.0), y: 1.1, z: cz + r.range(-2, 2), sy: 1.4 }, 5);
  },
  /** A spare-parts factory shed: long low block, saw-tooth zinc roof, painted boundary wall, tyre stack. */
  'factory-shed'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const h = 5.2;
    c.tb.add(shopKey(c.district.shops, r.int(0, 5)), texBox(w, h, d, 3.5, 3.4), { x: cx, y: h / 2, z: cz });
    const teeth = Math.max(3, Math.round(w / 3.4));
    for (let i = 0; i < teeth; i++) c.vc.prism(d + 0.4, 1.2, w / teeth + 0.1, i % 2 ? '#9aa3a6' : '#8d979a', { x: cx, y: h + 0.5, z: cz - w / 2 + (i + 0.5) * (w / teeth) });
    c.vc.box(0.3, 2.3, w, '#e8dcc0', { x: side * (x0 - 1.6), y: 1.15, z: cz });
    c.vc.box(0.16, 2.0, 4.2, '#2f3a44', { x: side * (x0 - 1.62), y: 1.0, z: cz });
    for (let i = 0; i < 3; i++) c.vc.cyl(0.5, 0.5, 0.34, '#1c1c1c', { x: side * (x0 - 2.8), y: 0.2 + i * 0.34, z: cz + w * 0.3, rx: Math.PI / 2 }, 8);
  },
  /** A river-port shed: long zinc-roofed warehouse and a stack of shipping containers. */
  'port-shed'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    c.vc.box(d, 4.6, w, '#d8cdb0', { x: cx, y: 2.3, z: cz });
    c.vc.prism(d + 0.8, 1.6, w + 0.6, '#98908a', { x: cx, y: 4.6, z: cz });
    c.vc.box(0.12, 3.2, 5, '#3a3f44', { x: cx - side * (d / 2 + 0.05), y: 1.6, z: cz });
    const boxes = ['#9c5a3a', '#3c4b7a', '#5e9c95', '#7a2f3e', '#8a8a86'];
    for (let i = 0; i < 4; i++) {
      const bz = cz - w / 2 + 3.6 + i * 6.4;
      for (let tier = 0; tier < (r.chance(0.5) ? 2 : 1); tier++) {
        const col = r.pick(boxes);
        const y = 1.3 + tier * 2.62;
        c.vc.box(2.4, 2.6, 5.8, col, { x: side * (x0 - 5), y, z: bz });
        // corrugated ribs and door bars on the road-facing end
        for (let k = 0; k < 6; k++) c.vc.box(0.1, 2.4, 0.18, shade(col, -0.22), { x: side * (x0 - 5 - 1.22), y, z: bz - 2.5 + k * 1.0 });
        c.vc.box(0.12, 0.12, 5.8, shade(col, -0.3), { x: side * (x0 - 5 - 1.22), y: y + 1.3, z: bz });
      }
    }
  },
  /** A newer two-storey villa: rendered walls, a multi-level hipped roof in coloured tile, a balcony, a gate wall with iron grille. */
  'tiled-villa'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2 + 0.8);
    const cz = lot.z0 + w / 2;
    const bw = Math.min(w, 10);
    const bd = Math.max(5, d - 2);
    const h = 6.2;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(bw, h, bd, 3.5, 3.1), { x: cx, y: h / 2, z: cz });
    const tile = r.pick(lot.palette.length ? lot.palette : ['#a5573a', '#8e5233', '#6e7a6a']);
    c.vc.prism(bd + 1.2, 2.2, bw + 1.0, tile, { x: cx, y: h, z: cz });
    c.vc.prism(bd * 0.5, 1.6, bw * 0.45 + 0.6, shade(tile, -0.08), { x: cx - side * (bd * 0.28), y: h + 1.0, z: cz + r.range(-1, 1) });
    c.vc.box(1.2, 0.16, bw * 0.6, '#d8cdb0', { x: cx - side * (bd / 2 + 0.5), y: 3.2, z: cz });
    c.vc.box(0.06, 0.8, bw * 0.6, '#2a2a28', { x: cx - side * (bd / 2 + 1.0), y: 3.7, z: cz });
    const wx = side * (x0 - 0.2);
    const wallCol = r.pick(['#eadfc6', '#d9cdb0', '#cda66b']);
    c.vc.box(0.3, 1.9, w * 0.4, wallCol, { x: wx, y: 0.95, z: cz - w * 0.3 });
    c.vc.box(0.3, 1.9, w * 0.4, wallCol, { x: wx, y: 0.95, z: cz + w * 0.3 });
    c.vc.box(0.08, 1.7, 2.8, '#23262a', { x: wx, y: 0.85, z: cz });
  },
  /** A contemporary plaza: four to six floors of glass and cladding on a base with a ramp down to an underground floor. */
  'plaza-block'(lot) {
    const { c, side, w, d, x0, floors } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const baseH = 3.6;
    c.tb.add(shopKey(c.district.shops, r.int(0, 5)), texBox(w, baseH, d, 3.5, 3.4), { x: cx, y: baseH / 2, z: cz });
    const upper = Math.max(2, floors - 1) * 3;
    const clad = r.pick(['#b8b2a2', '#cfc7b5', '#8d979a']);
    c.vc.box(w - 0.2, upper, d - 0.4, clad, { x: cx, y: baseH + upper / 2, z: cz });
    for (let f = 0; f < Math.max(2, floors - 1); f++) {
      c.vc.box(0.12, 1.8, w - 1.2, '#4a6a72', { x: side * (x0 - 0.02), y: baseH + 1.6 + f * 3, z: cz });
      c.vc.box(0.5, 0.16, w - 0.4, '#e8e4d4', { x: side * (x0 - 0.2), y: baseH + f * 3 + 0.1, z: cz });
    }
    const top = baseH + upper;
    c.vc.box(d, 0.5, w, '#8a8a86', { x: cx, y: top + 0.25, z: cz });
    c.vc.box(1.8, 1.6, 1.8, '#a5a59e', { x: cx, y: top + 1.3, z: cz + r.range(-w / 4, w / 4) });
    c.vc.box(3.2, 0.2, 5, '#5a5a56', { x: side * (x0 - 1.6), y: 0.1, z: cz - w * 0.3, rz: side * 0.18 });
    if (lot.billboards.length && r.chance(0.35)) {
      const label = r.pick(lot.billboards);
      const bg = r.pick(['#2f3a44', '#4f6d85', '#a5573a']);
      const sgn = new THREE.Mesh(PLANE, unlitMat(`bb:${label}:${bg}`, signTexture(label, bg, '#f4f1ea', 512, 160)));
      sgn.scale.set(5, 1.6, 1);
      sgn.position.set(side * (x0 + 0.3), top + 2.8, cz);
      sgn.rotation.y = side * -0.35;
      c.signs.push(sgn);
      c.vc.box(0.12, 2.4, 0.12, '#444', { x: side * (x0 + 0.3), y: top + 1.2, z: cz });
    }
  },
  /** A hill-village hut: mud-plastered rectangular walls, a steep thatched gable with a jutting front peak, a low yard wall. */
  'thatch-hut'(lot) {
    const { c, side, w, x0 } = lot;
    const r = c.rx;
    const hw = Math.min(w, 5.2);
    const hd = r.range(4.2, 5.4);
    const cx = side * (x0 + hd / 2 + 1);
    const cz = lot.z0 + w / 2;
    c.vc.box(hd, 2.2, hw, r.pick(['#b87e4a', '#c98f58', '#a9733f']), { x: cx, y: 1.1, z: cz });
    c.vc.prism(hd + 1.6, 2.8, hw + 1.4, r.pick(['#b99a58', '#a88a4a', '#c0a566']), { x: cx, y: 2.2, z: cz });
    c.vc.box(0.12, 1.5, 0.8, '#2a1a10', { x: cx - side * (hd / 2 + 0.01), y: 0.8, z: cz });
    c.vc.box(0.35, 1.0, w * 0.6, '#a9733f', { x: side * (x0 - 0.3), y: 0.5, z: cz });
  },
  /** A mill or works compound: a very long blank wall with a gate, a tall zinc shed rising behind, a kiosk against the wall. */
  'works-shed'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2 + 1.5);
    const cz = lot.z0 + w / 2;
    c.vc.box(0.5, 3.4, w, r.pick(['#d8cdb0', '#c9b58a', '#cfc7b5']), { x: side * (x0 - 0.2), y: 1.7, z: cz });
    for (const dz of [-2.4, 2.4]) c.vc.box(0.9, 4.0, 0.9, '#b8b2a2', { x: side * (x0 - 0.2), y: 2.0, z: cz + dz });
    c.vc.box(0.12, 3.0, 4.4, '#2f3a44', { x: side * (x0 - 0.2), y: 1.5, z: cz });
    const h = r.range(7, 10);
    c.vc.box(d, h, w * 0.8, '#98a2a5', { x: cx, y: h / 2, z: cz });
    const teeth = Math.max(2, Math.round(w / 4));
    for (let i = 0; i < teeth; i++) c.vc.prism(d + 0.4, 1.4, (w * 0.8) / teeth + 0.1, i % 2 ? '#8d979a' : '#a2abad', { x: cx, y: h + 0.6, z: cz - w * 0.4 + (i + 0.5) * ((w * 0.8) / teeth) });
    if (r.chance(0.6)) {
      const kz = lot.z0 + r.range(1.5, w - 1.5);
      c.vc.box(1.6, 2.1, 1.8, '#98a2a5', { x: side * (x0 - 1.3), y: 1.05, z: kz });
      c.vc.box(0.1, 1.0, 1.1, '#4f6d85', { x: side * (x0 - 2.15), y: 1.1, z: kz });
    }
  },
  /**
   * The old-city compound of Ilorin: a plastered earth-and-sandcrete block whose street front
   * is a flat, parapeted entrance face with a dark arched door and a small shuttered window,
   * and behind it a low zinc gable range. No horns or pinnacles: that is a different city.
   */
  'ilorin-compound'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cz = lot.z0 + w / 2;
    const fh = r.range(3.6, 4.6);
    const front = Math.min(d * 0.45, 3.6);
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.92, fh, front, 3.5, 3.6), { x: side * (x0 + front / 2), y: fh / 2, z: cz });
    const wall = lot.palette.length ? r.pick(lot.palette) : '#c99a62';
    c.vc.box(front + 0.2, 0.4, w * 0.92 + 0.2, shade(wall, -0.08), { x: side * (x0 + front / 2), y: fh + 0.2, z: cz });
    c.vc.box(0.12, 2.3, 1.5, '#2a1a10', { x: side * (x0 - 0.02), y: 1.15, z: cz + r.range(-w * 0.15, w * 0.15) });
    c.vc.cone(0.8, 0.8, '#2a1a10', { x: side * (x0 - 0.02), y: 2.55, z: cz, rz: side * Math.PI / 2 }, 4);
    const bd = d - front;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.85, 3.0, bd, 3.5, 3), { x: side * (x0 + front + bd / 2), y: 1.5, z: cz });
    c.vc.prism(bd + 1.0, 1.6, w * 0.85 + 0.8, r.pick(['#8e5a3a', '#98a0a2', '#8d979a']), { x: side * (x0 + front + bd / 2), y: 3.0, z: cz });
    if (r.chance(0.5)) c.vc.cyl(0.7, 0.7, 1.2, '#25282c', { x: side * (x0 + front + bd / 2), y: 4.9, z: cz + r.range(-w / 4, w / 4) }, 8);
    if (r.chance(0.5)) c.vc.box(0.3, 1.2, w * 0.3, shade(wall, 0.04), { x: side * (x0 - 0.8), y: 0.6, z: cz - w * 0.4 });
  },
  /**
   * A long single-storey Yoruba range: a low, wide zinc roof over a deep posted veranda
   * along the street, window grilles, a doorway between, a tank on a stand.
   */
  'veranda-range'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const hd = Math.min(d, 8);
    const cx = side * (x0 + hd / 2 + 1.2);
    const cz = lot.z0 + w / 2;
    const h = 3.1;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.9, h, hd * 0.7, 3.5, 3.1), { x: cx + side * hd * 0.12, y: h / 2, z: cz });
    const roof = r.pick(lot.palette.length ? lot.palette : ['#8e5a3a', '#98a0a2', '#8d979a']);
    c.vc.prism(hd + 1.4, 1.5, w * 0.9 + 1.0, roof, { x: cx, y: h, z: cz });
    const vx = cx - side * (hd * 0.35 + 0.8);
    c.vc.box(1.8, 0.14, w * 0.9, '#cfc7b5', { x: vx, y: 0.1, z: cz });
    for (let i = 0; i < 5; i++) c.vc.cyl(0.1, 0.1, h - 0.2, '#5a4330', { x: vx - side * 0.7, y: (h - 0.2) / 2, z: cz - w * 0.4 + i * ((w * 0.8) / 4) }, 5);
    c.vc.box(0.25, 0.3, w * 0.9, shade(roof, -0.1), { x: vx - side * 0.8, y: h - 0.1, z: cz });
    c.vc.cyl(0.7, 0.7, 1.2, '#25282c', { x: cx + side * hd * 0.2, y: h + 2.1, z: cz + r.range(-w / 4, w / 4) }, 8);
    c.vc.box(0.3, 0.9, w * 0.22, '#e8dcc0', { x: side * (x0 - 0.6), y: 0.45, z: cz - w * 0.33 });
    c.vc.box(0.3, 0.9, w * 0.22, '#e8dcc0', { x: side * (x0 - 0.6), y: 0.45, z: cz + w * 0.33 });
  },
  /** A rendered block house in the sea of rust roofs: plain walls, a roof taken from the district palette, a yard wall and gate. */
  'rust-bungalow'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const h = r.chance(0.3) ? 6.0 : 3.2;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.7, h, d * 0.7, 3.5, 3.2), { x: cx + side * d * 0.1, y: h / 2, z: cz });
    const roof = r.pick(lot.palette.length ? lot.palette : ['#9a4b2e', '#8a5a3c', '#a77052', '#8f9699']);
    c.vc.prism(d * 0.7 + 1.2, 1.5, w * 0.7 + 1.0, roof, { x: cx + side * d * 0.1, y: h, z: cz });
    if (h > 5) c.vc.box(1.4, 0.14, w * 0.5, '#cfc7b5', { x: cx - side * (d * 0.35 + 0.5), y: 3.3, z: cz });
    const wallCol = r.pick(['#e9dfc6', '#d8c9a7', '#c9b58a']);
    c.vc.box(0.3, 1.5, w * 0.34, wallCol, { x: side * (x0 - 0.8), y: 0.75, z: cz - w * 0.33 });
    c.vc.box(0.3, 1.5, w * 0.34, wallCol, { x: side * (x0 - 0.8), y: 0.75, z: cz + w * 0.33 });
    c.vc.box(0.08, 1.4, 2.6, '#23262a', { x: side * (x0 - 0.8), y: 0.7, z: cz });
    if (r.chance(0.4)) c.vc.cyl(0.7, 0.7, 1.2, '#25282c', { x: cx, y: h + 1.9, z: cz + r.range(-w / 4, w / 4) }, 8);
  },
  /**
   * The Yoruba courtyard block: a long low run of rooms under one long single-pitch rust
   * sheet roof, a deep veranda on posts along the street, a washing line, a yard wall.
   */
  'compound-row'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const hd = Math.min(d, 7.5);
    const cx = side * (x0 + hd / 2 + 1.0);
    const cz = lot.z0 + w / 2;
    const h = 3.2;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.94, h, hd * 0.7, 3.5, 3.2), { x: cx + side * hd * 0.12, y: h / 2, z: cz });
    const roof = r.pick(lot.palette.length ? lot.palette : ['#9a4b2e', '#8a5a3c', '#a77052', '#6b3a28']);
    c.vc.box(hd + 1.6, 0.18, w * 0.94 + 0.8, roof, { x: cx, y: h + 0.6, z: cz, rz: side * 0.17 });
    const vx = cx - side * (hd * 0.35 + 0.9);
    c.vc.box(1.8, 0.14, w * 0.94, '#cfc7b5', { x: vx, y: 0.1, z: cz });
    for (let i = 0; i < 6; i++) c.vc.cyl(0.1, 0.1, h - 0.2, '#5a4330', { x: vx - side * 0.7, y: (h - 0.2) / 2, z: cz - w * 0.44 + i * ((w * 0.88) / 5) }, 5);
    if (r.chance(0.6)) {
      for (const dz of [-1, 1]) c.vc.cyl(0.04, 0.04, 1.8, '#4a3828', { x: side * (x0 - 1.6), y: 0.9, z: cz + dz * w * 0.3 }, 4);
      for (let i = 0; i < 4; i++) c.vc.box(0.05, 0.8, 0.5, r.pick(['#2e3c69', '#f1eee4', '#cdbb95', '#7a2f3e']), { x: side * (x0 - 1.6), y: 1.4, z: cz - w * 0.25 + i * (w * 0.17) });
    }
    c.vc.box(0.3, 1.0, w * 0.36, '#e9dfc6', { x: side * (x0 - 0.5), y: 0.5, z: cz - w * 0.32 });
    c.vc.box(0.3, 1.0, w * 0.36, '#e9dfc6', { x: side * (x0 - 0.5), y: 0.5, z: cz + w * 0.32 });
  },
  /**
   * An old-quarter stucco house: two storeys, arched openings, a balustraded balcony over a
   * shaded ground floor, a plain parapet with a small central pediment.
   */
  'afro-brazilian-storey'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const h = 7.0;
    const bw = Math.min(w, 9);
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(bw, h, d * 0.8, 3.5, 3.5), { x: cx, y: h / 2, z: cz });
    for (let i = 0; i < 3; i++) {
      c.vc.box(0.12, 2.2, 1.0, '#2a1a10', { x: side * (x0 + d * 0.1 - 0.05), y: 1.2, z: cz - bw * 0.3 + i * bw * 0.3 });
      c.vc.cyl(0.5, 0.5, 0.14, '#2a1a10', { x: side * (x0 + d * 0.1 - 0.05), y: 2.3, z: cz - bw * 0.3 + i * bw * 0.3, rz: Math.PI / 2 }, 8);
    }
    c.vc.box(1.3, 0.16, bw * 0.9, '#d8cdb0', { x: side * (x0 + d * 0.1 - 0.6), y: 3.6, z: cz });
    for (let i = 0; i < 9; i++) c.vc.cyl(0.07, 0.07, 0.8, '#efe8d6', { x: side * (x0 + d * 0.1 - 1.1), y: 4.1, z: cz - bw * 0.42 + i * ((bw * 0.84) / 8) }, 5);
    c.vc.box(0.15, 0.12, bw * 0.9, '#efe8d6', { x: side * (x0 + d * 0.1 - 1.1), y: 4.55, z: cz });
    c.vc.box(d * 0.8 + 0.3, 0.4, bw + 0.3, '#e9dfc6', { x: cx, y: h + 0.2, z: cz });
    c.vc.box(0.3, 1.1, bw * 0.3, '#e9dfc6', { x: cx - side * d * 0.34, y: h + 0.95, z: cz });
  },
  /** A low laterite boundary wall with two gate pillars and a small plain house set back behind it. */
  'laterite-compound'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cz = lot.z0 + w / 2;
    c.vc.box(0.5, 1.6, w * 0.4, '#a87656', { x: side * (x0 - 0.5), y: 0.8, z: cz - w * 0.3 });
    c.vc.box(0.5, 1.6, w * 0.4, '#a87656', { x: side * (x0 - 0.5), y: 0.8, z: cz + w * 0.3 });
    for (const dz of [-1.6, 1.6]) c.vc.box(0.7, 2.3, 0.7, '#98583c', { x: side * (x0 - 0.5), y: 1.15, z: cz + dz });
    c.vc.box(0.1, 1.6, 2.6, '#23262a', { x: side * (x0 - 0.5), y: 0.8, z: cz });
    const hh = 3.0;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.55, hh, d * 0.55, 3.5, 3), { x: side * (x0 + d * 0.45), y: hh / 2, z: cz });
    c.vc.prism(d * 0.55 + 1.0, 1.4, w * 0.55 + 0.9, r.pick(['#9a4b2e', '#8a5a3c']), { x: side * (x0 + d * 0.45), y: hh, z: cz });
  },
  /**
   * A hillside terrace: three blocks stepping up away from the road, each taller than the one
   * in front, flat zinc slabs on top with water tanks, a concrete stair running up the side.
   */
  'hillside-terrace'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cz = lot.z0 + w / 2;
    const steps = 3;
    const sd = Math.max(3.2, Math.min(d, 9) / steps);
    const roofs = lot.palette.length ? lot.palette : ['#8e5a3a', '#7c8a84', '#9a4b2e'];
    for (let i = 0; i < steps; i++) {
      const h = 3.0 + i * 2.9;
      const cx = side * (x0 + sd * (i + 0.5));
      c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.9, h, sd, 3.5, 3.0), { x: cx, y: h / 2, z: cz });
      c.vc.box(sd + 0.2, 0.22, w * 0.9 + 0.3, r.pick(roofs), { x: cx, y: h + 0.1, z: cz });
      if (r.chance(0.6)) c.vc.cyl(0.55, 0.55, 1.1, '#25282c', { x: cx, y: h + 0.8, z: cz + r.range(-w / 4, w / 4) }, 8);
    }
    for (let k = 0; k < 6; k++) c.vc.box(1.0, 0.3, 0.6, '#b2ac9c', { x: side * (x0 + 0.5 + k * sd * 0.5), y: 0.3 + k * 1.0, z: cz + w * 0.46 });
    if (r.chance(0.4)) c.vc.box(0.05, 0.05, w * 0.7, '#6a6258', { x: side * (x0 - 0.5), y: 2.4, z: cz });
  },
  /**
   * A ridge-top cottage: a one-and-a-half storey block on a stone plinth, a high hipped roof, a
   * deep veranda on posts, a chimney stub, a low front wall.
   */
  'gra-cottage'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const hd = Math.min(d, 9);
    const cx = side * (x0 + hd / 2 + 1.5);
    const cz = lot.z0 + w / 2;
    const h = 3.6;
    c.vc.box(hd, 0.6, w * 0.8, '#8f8a7e', { x: cx, y: 0.3, z: cz });
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.76, h, hd * 0.9, 3.5, 3.2), { x: cx, y: 0.6 + h / 2, z: cz });
    const roof = r.pick(lot.palette.length ? lot.palette : ['#9a4b2e', '#8e5a3a']);
    c.vc.prism(hd * 0.9 + 1.2, 2.4, w * 0.76 + 1.2, roof, { x: cx, y: 0.6 + h, z: cz });
    c.vc.box(0.7, 2.2, 0.7, '#a8a498', { x: cx + side * 1.2, y: 0.6 + h + 2.2, z: cz + w * 0.2 });
    for (const dz of [-0.4, 0, 0.4]) c.vc.cyl(0.08, 0.08, 2.6, '#efe8d6', { x: cx - side * (hd * 0.45 + 0.9), y: 1.9, z: cz + dz * w * 0.8 }, 4);
    c.vc.box(1.3, 0.14, w * 0.8, roof, { x: cx - side * (hd * 0.45 + 0.9), y: 3.3, z: cz });
    c.vc.box(0.25, 0.9, w * 0.95, '#b2ac9c', { x: side * (x0 - 0.5), y: 0.45, z: cz });
  },
  /**
   * A mid-century slab tower: a tall cream block with a grid of vertical fins, a flat roof
   * and a plain rooftop sign box (no wording).
   */
  'slab-tower'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const hd = Math.min(d, 8);
    const cx = side * (x0 + hd / 2 + 1);
    const cz = lot.z0 + w / 2;
    const floors = r.int(5, 7);
    const h = floors * 3.2;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.85, h, hd, 3.5, 3.2), { x: cx, y: h / 2, z: cz });
    for (let i = 0; i < 6; i++) c.vc.box(0.3, h, 0.3, '#d8d0bc', { x: cx - side * (hd / 2 + 0.2), y: h / 2, z: cz - w * 0.4 + (i / 5) * w * 0.8 });
    c.vc.box(hd + 0.4, 0.5, w * 0.85 + 0.4, '#a8a498', { x: cx, y: h + 0.25, z: cz });
    c.vc.box(0.5, 1.2, w * 0.5, '#4f6d85', { x: cx, y: h + 1.1, z: cz });
  },
  /**
   * A welder's yard: an open-front zinc shed, a stack of steel gate frames and door frames
   * leaning outside, a few coiled bars and an anvil block.
   */
  'welding-shed'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const hd = Math.min(d, 7);
    const cx = side * (x0 + hd / 2 + 1.5);
    const cz = lot.z0 + w / 2;
    c.vc.box(hd, 2.9, 0.2, '#7c8a84', { x: cx, y: 1.45, z: cz - w * 0.4 });
    c.vc.box(hd, 2.9, 0.2, '#7c8a84', { x: cx, y: 1.45, z: cz + w * 0.4 });
    c.vc.box(0.2, 2.9, w * 0.8, '#6c7a74', { x: cx + side * hd / 2, y: 1.45, z: cz });
    c.vc.box(hd + 1.4, 0.15, w * 0.9, r.pick(lot.palette.length ? lot.palette : ['#8e5a3a', '#7c8a84']), { x: cx - side * 0.3, y: 3.0, z: cz, rz: side * 0.05 });
    for (let i = 0; i < 4; i++) {
      const gz = cz - w * 0.35 + i * (w * 0.23);
      c.vc.box(0.12, 2.0, 1.4, '#34383b', { x: side * (x0 - 0.4), y: 1.0, z: gz });
      c.vc.box(0.14, 1.7, 1.2, '#4a4f52', { x: side * (x0 - 0.4), y: 0.95, z: gz });
    }
    c.vc.box(0.7, 0.6, 0.7, '#25282c', { x: side * (x0 + 1.4), y: 0.3, z: cz });
  },
  /**
   * A sandcrete bungalow: one storey of cream render under a low hipped silver-zinc roof with a
   * deep eave, a dark steel door, a block stack and a dish in the bare yard.
   */
  'sandcrete-hip'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const hd = Math.min(d, 8);
    const cx = side * (x0 + hd / 2 + 1.2);
    const cz = lot.z0 + w / 2;
    const h = 3.0;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.7, h, hd * 0.85, 3.5, 3.0), { x: cx, y: h / 2, z: cz });
    c.vc.prism(hd * 0.85 + 1.6, 1.3, w * 0.7 + 1.6, r.pick(lot.palette.length ? lot.palette : ['#a8adb0', '#9aa0a3', '#b4b8ba']), { x: cx, y: h, z: cz });
    c.vc.box(0.1, 2.0, 1.1, '#23262a', { x: cx - side * (hd * 0.425 + 0.05), y: 1.0, z: cz + r.range(-w * 0.15, w * 0.15) });
    for (let i = 0; i < 4; i++) c.vc.box(0.5, 0.25, 0.25, '#b8b2a2', { x: side * (x0 - 0.2) , y: 0.15 + (i % 2) * 0.25, z: cz + w * 0.3 + i * 0.28 });
    if (r.chance(0.4)) c.vc.cyl(0.35, 0.35, 0.12, '#cfd2d4', { x: cx, y: h + 1.3, z: cz + w * 0.2, rz: 0.5 }, 8);
  },
  /**
   * A stone-walled compound: a single-storey house set behind a mortared boulder wall with a
   * gate gap, one big tree behind it.
   */
  'stone-wall-compound'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const hd = Math.min(d, 8);
    const cx = side * (x0 + hd / 2 + 2.5);
    const cz = lot.z0 + w / 2;
    const h = 3.0;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.6, h, hd * 0.8, 3.5, 3.0), { x: cx, y: h / 2, z: cz });
    c.vc.prism(hd * 0.8 + 1.6, 1.4, w * 0.6 + 1.6, r.pick(lot.palette.length ? lot.palette : ['#8e8a84', '#a8adb0']), { x: cx, y: h, z: cz });
    for (const dz of [-1, 1]) {
      for (let i = 0; i < 4; i++) c.vc.sphere(r.range(0.45, 0.65), r.pick(['#8e8a84', '#9c9892', '#7f7b74']), { x: side * (x0 + 0.4), y: 0.5 + (i % 2) * 0.4, z: cz + dz * (w * 0.3 + i * 0.7) * 0.9, sy: 0.8 }, 5);
    }
    c.vc.box(0.5, 0.2, w * 0.95, '#a8a498', { x: side * (x0 + 0.4), y: 1.1, z: cz });
  },
  /**
   * A relief compound: a cream or rose render block with a low stepped parapet (no horns), an
   * arched doorway in a projecting entrance framed by a raised relief panel, a small high
   * shuttered window and a red dado.
   */
  'relief-compound'(lot) {
    const { c, side, w, d, x0, floors } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const h = Math.max(1, floors) * 3.2;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w, h, d, 3.5, 3.2), { x: cx, y: h / 2, z: cz });
    const wall = lot.palette.length ? r.pick(lot.palette) : '#d9b5a0';
    for (let i = 0; i < 3; i++) c.vc.box(d + 0.2 - i * 0.5, 0.3, w + 0.2 - i * 2.2, shade(wall, -0.04 * i), { x: cx, y: h + 0.15 + i * 0.3, z: cz });
    c.vc.box(d + 0.12, 0.9, w + 0.12, '#a5553f', { x: cx, y: 0.45, z: cz });
    const ez = cz + r.range(-w * 0.2, w * 0.2);
    c.vc.box(0.7, 3.1, 3.4, wall, { x: side * (x0 - 0.3), y: 1.55, z: ez });
    c.vc.box(0.14, 2.2, 1.5, '#2a1a10', { x: side * (x0 - 0.68), y: 1.1, z: ez });
    c.vc.cyl(0.75, 0.75, 0.14, '#2a1a10', { x: side * (x0 - 0.68), y: 2.2, z: ez, rz: Math.PI / 2 }, 8);
    for (const dz of [-1.35, 1.35]) c.vc.box(0.1, 2.6, 0.3, '#b98a6e', { x: side * (x0 - 0.7), y: 1.5, z: ez + dz });
    c.vc.box(0.1, 0.3, 3.0, '#b98a6e', { x: side * (x0 - 0.7), y: 2.95, z: ez });
    if (r.chance(0.5)) c.vc.cyl(0.7, 0.7, 1.2, '#25282c', { x: cx, y: h + 1.4, z: cz + r.range(-w / 4, w / 4) }, 8);
  },
  /**
   * A long red-brick hall: one storey of red-baked brick behind a deep arcade of dark openings,
   * a central gate block with a stepped top and a short stair, a sandy forecourt.
   */
  'redbrick-hall'(lot) {
    const { c, side, w, d, x0 } = lot;
    const hd = Math.min(d, 9);
    const cx = side * (x0 + hd / 2 + 1.5);
    const cz = lot.z0 + w / 2;
    const h = 4.2;
    c.vc.box(hd, h, w, '#a5553f', { x: cx, y: h / 2, z: cz });
    c.vc.box(hd + 0.5, 0.35, w + 0.5, '#7a3a2a', { x: cx, y: h + 0.18, z: cz });
    c.vc.prism(hd + 1.2, 1.6, w + 1.2, '#8f8a7e', { x: cx, y: h + 0.35, z: cz });
    const n = Math.max(3, Math.floor(w / 2.4));
    for (let i = 0; i < n; i++) {
      const z = cz - w / 2 + (i + 0.5) * (w / n);
      c.vc.box(0.2, 2.6, 1.2, '#2a1a10', { x: cx - side * (hd / 2 + 0.05), y: 1.5, z });
      c.vc.box(1.1, 0.3, 0.5, '#c9bfa4', { x: cx - side * (hd / 2 + 0.5), y: 3.0, z: z - w / (2 * n) });
    }
    c.vc.box(2.2, 6.4, 5.4, '#a5553f', { x: cx - side * (hd / 2 + 0.7), y: 3.2, z: cz });
    c.vc.box(2.4, 0.5, 5.8, '#7a3a2a', { x: cx - side * (hd / 2 + 0.7), y: 6.6, z: cz });
    c.vc.box(1.6, 0.5, 3.6, '#a5553f', { x: cx - side * (hd / 2 + 0.7), y: 7.1, z: cz });
    c.vc.box(0.2, 2.8, 1.8, '#2a1a10', { x: cx - side * (hd / 2 + 1.82), y: 1.5, z: cz });
    for (let i = 0; i < 3; i++) c.vc.box(1.0, 0.25, 4.2, '#c9bfa4', { x: cx - side * (hd / 2 + 2.3 + i * 0.5), y: 0.12 + i * 0.15, z: cz });
  },
  /**
   * An adire yard: a terraced shop block with rows of long indigo cloths hung on poles in front,
   * dark round dye tubs with indigo liquid, cloth bundles on a bench.
   */
  'adire-yard'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const hd = Math.min(d, 7);
    const cx = side * (x0 + hd / 2 + 3.2);
    const cz = lot.z0 + w / 2;
    const h = r.pick([3.2, 6.4]);
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.9, h, hd, 3.5, 3.2), { x: cx, y: h / 2, z: cz });
    c.vc.box(hd + 0.4, 0.3, w * 0.9 + 0.4, '#9ea5a8', { x: cx, y: h + 0.15, z: cz });
    const rows = Math.max(2, Math.floor(w / 3.4));
    for (let i = 0; i < rows; i++) {
      const z = cz - w * 0.4 + (i + 0.5) * ((w * 0.8) / rows);
      c.vc.cyl(0.05, 0.05, 3.4, '#5a3d24', { x: side * (x0 + 0.6), y: 1.7, z: z - 0.9 }, 4);
      c.vc.cyl(0.05, 0.05, 3.4, '#5a3d24', { x: side * (x0 + 0.6), y: 1.7, z: z + 0.9 }, 4);
      c.vc.box(0.05, 2.6, 1.7, r.pick(['#2b3045', '#2e3c69', '#6f7fa8', '#e4dcc6']), { x: side * (x0 + 0.6), y: 2.2, z });
    }
    for (let i = 0; i < 2; i++) {
      c.vc.cyl(0.55, 0.5, 0.7, '#25282c', { x: side * (x0 + 1.9), y: 0.35, z: cz - w * 0.3 + i * w * 0.55 }, 8);
      c.vc.cyl(0.45, 0.45, 0.05, '#2b3045', { x: side * (x0 + 1.9), y: 0.72, z: cz - w * 0.3 + i * w * 0.55 }, 8);
    }
  },
  /**
   * A house against the granite: a single-storey rust or zinc roofed block pushed up against a
   * grey boulder and a dome-shaped rock face that forms its back wall.
   */
  'boulder-house'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const hd = Math.min(d, 7);
    const cx = side * (x0 + hd / 2 + 1.5);
    const cz = lot.z0 + w / 2;
    const h = 3.0;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w * 0.6, h, hd * 0.7, 3.5, 3.0), { x: cx, y: h / 2, z: cz });
    c.vc.prism(hd * 0.7 + 1.2, 1.2, w * 0.6 + 1.2, r.pick(lot.palette.length ? lot.palette : ['#8e5038', '#9ea5a8', '#c3c8ca']), { x: cx, y: h, z: cz });
    c.vc.sphere(r.range(3.2, 4.4), '#a29b92', { x: cx + side * (hd * 0.7 + 1.5), y: 1.2, z: cz, sy: 0.9 }, 7);
    c.vc.sphere(r.range(1.4, 2.0), '#8d8a84', { x: cx + side * (hd * 0.4), y: 0.8, z: cz + w * 0.35, sy: 0.8 }, 6);
    c.vc.box(0.1, 2.0, 1.1, '#23262a', { x: cx - side * (hd * 0.35 + 0.05), y: 1.0, z: cz });
  },
  /**
   * A cement works seen from the road: three tall pale silos, a slim preheater tower, a plain
   * chimney (no smoke), a conveyor gallery on legs and a white shed. Industry as shape only.
   */
  'silo-works'(lot) {
    const { c, side, w, x0 } = lot;
    const cx = side * (x0 + 9);
    const cz = lot.z0 + w / 2;
    for (let i = 0; i < 3; i++) {
      c.vc.cyl(2.4, 2.4, 16, '#e4e6e4', { x: cx, y: 8, z: cz - 6 + i * 5.4 }, 10);
      c.vc.cone(2.4, 1.6, '#c3c8ca', { x: cx, y: 16.8, z: cz - 6 + i * 5.4 }, 10);
    }
    c.vc.box(3, 24, 3, '#d8dadb', { x: cx + side * 6, y: 12, z: cz + 2 });
    c.vc.cyl(0.8, 1.2, 28, '#b8b6ae', { x: cx + side * 6, y: 14, z: cz - 5 }, 8);
    c.vc.box(1.2, 1.2, 14, '#8fa0a8', { x: cx + side * 3, y: 9, z: cz + 2, rx: 0.0 });
    c.vc.box(8, 5, w * 0.7, '#e4e6e4', { x: side * (x0 + 4), y: 2.5, z: cz });
    c.vc.box(8.4, 0.3, w * 0.7 + 0.4, '#8fa0a8', { x: side * (x0 + 4), y: 5.1, z: cz });
  },
  /**
   * A Kanuri compound: a pale clay-and-sand block with a plain flat roof and a low rounded
   * parapet, a dark arched door in a slightly projecting entrance, a mat-screen fence, no
   * pinnacles of any kind.
   */
  'kanuri-compound'(lot) {
    const { c, side, w, d, x0, floors } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const h = Math.max(1, floors) * 3.1;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w, h, d, 3.5, 3.1), { x: cx, y: h / 2, z: cz });
    const wall = lot.palette.length ? r.pick(lot.palette) : '#d3bf98';
    c.vc.box(d + 0.2, 0.5, w + 0.2, shade(wall, -0.06), { x: cx, y: h + 0.25, z: cz });
    const ez = cz + r.range(-w * 0.2, w * 0.2);
    c.vc.box(0.9, 3.0, 2.8, wall, { x: side * (x0 - 0.4), y: 1.5, z: ez });
    c.vc.box(0.12, 2.2, 1.4, '#2a1a10', { x: side * (x0 - 0.88), y: 1.1, z: ez });
    c.vc.cone(0.75, 0.8, '#2a1a10', { x: side * (x0 - 0.88), y: 2.4, z: ez, rz: side * Math.PI / 2 }, 4);
    if (r.chance(0.6)) {
      c.vc.box(0.12, 1.5, w * 0.36, '#c9b27a', { x: side * (x0 - 1.4), y: 0.75, z: cz - w * 0.34 });
      c.vc.box(0.12, 1.5, w * 0.3, '#c9b27a', { x: side * (x0 - 1.4), y: 0.75, z: cz + w * 0.36 });
    }
    if (r.chance(0.35)) c.vc.cyl(0.7, 0.7, 1.2, '#25282c', { x: cx, y: h + 1.1, z: cz + r.range(-w / 4, w / 4) }, 8);
  },
  /**
   * A row of one-storey concrete lock-up shops under one shared flat canopy: roller shutters
   * in faded paint, a plain fascia, a solar lamp post at the end.
   */
  'lockup-row'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const hd = Math.min(d, 6);
    const cx = side * (x0 + hd / 2 + 0.8);
    const cz = lot.z0 + w / 2;
    const n = Math.max(3, Math.round(w / 2.6));
    const cols = lot.palette.length ? lot.palette : ['#2f4560', '#d3bf98', '#b58e62', '#bdb8aa'];
    c.vc.box(hd, 3.2, w, '#bdb8aa', { x: cx, y: 1.6, z: cz });
    for (let i = 0; i < n; i++) {
      const z = cz - w / 2 + (i + 0.5) * (w / n);
      c.vc.box(0.1, 2.3, w / n - 0.3, r.pick(cols), { x: cx - side * (hd / 2 + 0.03), y: 1.25, z });
      c.vc.box(0.1, 0.6, w / n - 0.3, '#2a1f17', { x: cx - side * (hd / 2 + 0.03), y: 2.75, z });
    }
    c.vc.box(hd + 1.8, 0.18, w + 0.4, '#8f8b82', { x: cx - side * 0.8, y: 3.4, z: cz });
    c.vc.box(0.3, 0.3, w + 0.4, '#6f6a62', { x: cx - side * (hd / 2 + 1.6), y: 3.3, z: cz });
    c.vc.cyl(0.08, 0.1, 5, '#7a7a76', { x: side * (x0 - 0.7), y: 2.5, z: cz + w / 2 - 0.4 }, 5);
    c.vc.box(1.0, 0.1, 0.6, '#2f3a44', { x: side * (x0 - 0.7), y: 5.1, z: cz + w / 2 - 0.4 });
  },
  /**
   * A sawmill: a long open-sided shed under a low gable zinc roof on posts, a bench with a
   * saw blade, stacks of planks and logs beside it, and a mound of sawdust.
   */
  'sawmill-shed'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2 + 1);
    const cz = lot.z0 + w / 2;
    const hw = Math.min(w, 10);
    const hd = Math.min(d, 8.5);
    for (const dx of [-1, 1]) for (let i = 0; i < 4; i++) c.vc.cyl(0.11, 0.13, 3.4, '#5a4330', { x: cx + dx * (hd / 2 - 0.3), y: 1.7, z: cz - hw / 2 + 0.4 + i * ((hw - 0.8) / 3) }, 4);
    c.vc.box(hd - 0.4, 0.5, hw - 0.4, '#8a6f4a', { x: cx, y: 0.25, z: cz });
    c.vc.prism(hd + 1.0, 1.3, hw + 0.8, r.pick(['#9aa3a6', '#a8553b', '#8d979a']), { x: cx, y: 3.4, z: cz });
    c.vc.box(1.6, 0.9, 3.2, '#6b5a3a', { x: cx, y: 0.95, z: cz - 1 });
    c.vc.cyl(0.8, 0.8, 0.08, '#b8bcbc', { x: cx - side * 0.7, y: 1.5, z: cz - 1, rz: Math.PI / 2 }, 12);
    for (let i = 0; i < 5; i++) c.vc.box(3.2, 0.09, 0.5, i % 2 ? '#c9a66b' : '#b99058', { x: cx + side * 1.0, y: 0.7 + i * 0.1, z: cz + 2.4 });
    for (let k = 0; k < 3; k++) {
      c.vc.box(2.6, 0.5, 0.4, r.pick(['#c9a66b', '#d0b27a']), { x: side * (x0 - 1.6), y: 0.25 + k * 0.5, z: lot.z0 + w * 0.3 });
      c.vc.box(2.6, 0.5, 0.4, '#c9a66b', { x: side * (x0 - 1.6), y: 0.25 + k * 0.5, z: lot.z0 + w * 0.3 + 0.5 });
    }
    for (let i = 0; i < 3; i++) c.vc.cyl(0.55, 0.55, 3.0, '#9a5a38', { x: side * (x0 - 2.0), y: 0.55 + (i % 2) * 1.0, z: lot.z0 + w * 0.72 + (i % 2 ? 0.5 : -0.5) * (i === 2 ? 0 : 1), rx: Math.PI / 2 }, 8);
    c.vc.cone(1.6, 1.0, '#d8c08a', { x: side * (x0 - 1.0), y: 0.5, z: lot.z0 + w * 0.9 }, 7);
  },
  /**
   * A row of narrow plank-and-zinc lock-ups on a raised deck: shutters in faded paint,
   * a shared slanted zinc roof, a walkway board in front and goods hung under the eaves.
   */
  'plank-lockups'(lot) {
    const { c, side, w, d, x0 } = lot;
    const r = c.rx;
    const hd = Math.min(d, 5.4);
    const cx = side * (x0 + hd / 2 + 0.6);
    const cz = lot.z0 + w / 2;
    c.vc.box(hd + 1.4, 0.3, w, '#6e5a44', { x: cx - side * 0.3, y: 0.55, z: cz });
    const n = Math.max(3, Math.round(w / 2.4));
    const cols = lot.palette.length ? lot.palette : ['#8a7358', '#4f6d85', '#a9c0a8', '#b8892e', '#c9b58a'];
    for (let i = 0; i < n; i++) {
      const bw = w / n - 0.12;
      const z = cz - w / 2 + (i + 0.5) * (w / n);
      c.vc.box(hd, 2.5, bw, '#8a7358', { x: cx, y: 1.95, z });
      c.vc.box(0.1, 1.9, bw * 0.78, r.pick(cols), { x: cx - side * (hd / 2 + 0.03), y: 1.8, z });
      c.vc.box(0.1, 0.5, bw * 0.78, '#2a1f17', { x: cx - side * (hd / 2 + 0.03), y: 2.95, z });
      if (r.chance(0.55)) c.vc.box(0.4, 0.7, 0.5, r.pick(['#d6c59a', '#b99058', '#9a6b4b']), { x: cx - side * (hd / 2 + 0.3), y: 1.05, z: z + r.range(-0.3, 0.3) });
    }
    c.vc.box(hd + 1.6, 0.14, w + 0.4, '#98908a', { x: cx - side * 0.1, y: 3.35, z: cz, rz: side * 0.1 });
    c.vc.box(0.18, 3.2, 0.18, '#5a4330', { x: cx - side * (hd / 2 + 0.7), y: 1.7, z: cz - w / 2 + 0.2 });
    c.vc.box(0.18, 3.2, 0.18, '#5a4330', { x: cx - side * (hd / 2 + 0.7), y: 1.7, z: cz + w / 2 - 0.2 });
  },
  /** The contemporary block: three or four floors of painted concrete over a shop front, a tank on the roof. */
  shophouse(lot) {
    const { c, side, w, d, x0, floors } = lot;
    const r = c.rx;
    const cx = side * (x0 + d / 2);
    const cz = lot.z0 + w / 2;
    const shopH = 3.4;
    c.tb.add(shopKey(c.district.shops, r.int(0, 5)), texBox(w, shopH, d, 3.5, 3.4), { x: cx, y: shopH / 2, z: cz });
    const upper = Math.max(1, floors - 1) * 3;
    c.tb.add(facadeKey(c.district.facade, r.int(0, 5)), texBox(w, upper, d, 3.5, 3), { x: cx, y: shopH + upper / 2, z: cz });
    const top = shopH + upper;
    awning(lot, 3.0, 1.4);
    c.vc.box(d + 0.3, 0.3, w + 0.3, '#8a8a86', { x: cx, y: top + 0.15, z: cz });
    c.vc.cyl(0.75, 0.75, 1.3, '#25282c', { x: cx + r.range(-d / 4, d / 4), y: top + 0.95, z: cz + r.range(-w / 4, w / 4) }, 8);
    if (floors >= 3 && r.chance(0.5)) {
      c.vc.box(0.9, 0.14, w * 0.7, '#cfc7b5', { x: side * (x0 - 0.4), y: shopH + 2.9, z: cz });
      c.vc.box(0.05, 0.9, w * 0.7, '#222', { x: side * (x0 - 0.8), y: shopH + 3.4, z: cz });
    }
    if (lot.billboards.length && r.chance(0.3)) {
      const label = r.pick(lot.billboards);
      const bg = r.pick(['#2d3c73', '#8a5a2b', '#5b7f8a', '#f5c518', lot.accent]);
      const s = new THREE.Mesh(PLANE, unlitMat(`bb:${label}:${bg}`, signTexture(label, bg, bg === '#f5c518' ? '#161616' : '#fff', 512, 160)));
      s.scale.set(5, 1.6, 1);
      s.position.set(side * (x0 + 0.3), top + 2.8, cz);
      s.rotation.y = side * -0.35;
      c.signs.push(s);
      c.vc.box(0.12, 2.4, 0.12, '#444', { x: side * (x0 + 0.3), y: top + 1.2, z: cz });
    }
  },
};
