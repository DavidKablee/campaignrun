import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * GeoBuilder bakes many primitives into ONE vertex-coloured BufferGeometry.
 * Every model in the game is built this way so a whole danfo, a building, or a
 * person costs a single draw call.
 */
export interface Xf {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

export function xfMatrix(t: Xf, out = new THREE.Matrix4()): THREE.Matrix4 {
  _e.set(t.rx ?? 0, t.ry ?? 0, t.rz ?? 0, 'YXZ');
  _q.setFromEuler(_e);
  _p.set(t.x ?? 0, t.y ?? 0, t.z ?? 0);
  _s.set(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1);
  return out.compose(_p, _q, _s);
}

export function shade(hex: string, amount: number): string {
  _c.set(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  _c.getHSL(hsl);
  _c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amount)));
  return `#${_c.getHexString()}`;
}

export function mix(a: string, b: string, t: number): string {
  _c.set(a).lerp(new THREE.Color(b), t);
  return `#${_c.getHexString()}`;
}

function prep(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
  }
  return g;
}

export class GeoBuilder {
  private parts: THREE.BufferGeometry[] = [];
  /** < 1 lowers segment counts (crowd / distant LODs). */
  segScale = 1;
  private sg(n: number) {
    return Math.max(3, Math.round(n * this.segScale));
  }

  addGeo(geo: THREE.BufferGeometry, color: string, t: Xf = {}): this {
    const g = prep(geo);
    g.applyMatrix4(xfMatrix(t, _m));
    _c.set(color);
    const n = g.getAttribute('position').count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = _c.r;
      arr[i * 3 + 1] = _c.g;
      arr[i * 3 + 2] = _c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    this.parts.push(g);
    return this;
  }

  /** Merge an already vertex-coloured geometry (e.g. a cached person) with a transform. */
  addBuilt(geo: THREE.BufferGeometry, t: Xf = {}): this {
    const g = geo.clone();
    g.applyMatrix4(xfMatrix(t, _m));
    this.parts.push(g);
    return this;
  }

  box(w: number, h: number, d: number, color: string, t: Xf = {}) {
    return this.addGeo(new THREE.BoxGeometry(w, h, d), color, t);
  }
  cyl(rt: number, rb: number, h: number, color: string, t: Xf = {}, seg = 8) {
    return this.addGeo(new THREE.CylinderGeometry(rt, rb, h, this.sg(seg)), color, t);
  }
  sphere(r: number, color: string, t: Xf = {}, seg = 8) {
    return this.addGeo(new THREE.SphereGeometry(r, this.sg(seg), Math.max(3, this.sg(seg) - 2)), color, t);
  }
  /** Partial sphere: a cap from the north pole down to `theta` radians. */
  cap(r: number, theta: number, color: string, t: Xf = {}, seg = 10) {
    return this.addGeo(new THREE.SphereGeometry(r, this.sg(seg), this.sg(8), 0, Math.PI * 2, 0, theta), color, t);
  }
  cone(r: number, h: number, color: string, t: Xf = {}, seg = 8) {
    return this.addGeo(new THREE.ConeGeometry(r, h, this.sg(seg)), color, t);
  }
  torus(r: number, tube: number, color: string, t: Xf = {}, arc = Math.PI * 2, seg = 10) {
    return this.addGeo(new THREE.TorusGeometry(r, tube, this.segScale < 1 ? 3 : 6, this.sg(seg), arc), color, t);
  }
  plane(w: number, h: number, color: string, t: Xf = {}) {
    return this.addGeo(new THREE.PlaneGeometry(w, h), color, t);
  }
  /** Triangular prism (gable roof): width along x, height along y, length along z. */
  prism(w: number, h: number, len: number, color: string, t: Xf = {}) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(0, h);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false });
    geo.translate(0, 0, -len / 2);
    return this.addGeo(geo, color, t);
  }

  get count() {
    return this.parts.length;
  }

  build(): THREE.BufferGeometry | null {
    if (this.parts.length === 0) return null;
    const merged = mergeGeometries(this.parts, false);
    for (const p of this.parts) p.dispose();
    this.parts = [];
    if (merged) merged.computeBoundingSphere();
    return merged;
  }
}

/** BoxGeometry whose UVs tile a texture by whole bays/floors. */
export function texBox(w: number, h: number, d: number, tileW: number, tileH: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  const faceU = [d, d, w, w, w, w];
  const faceV = [h, h, d, d, h, h];
  for (let i = 0; i < uv.count; i++) {
    const f = Math.floor(i / 4);
    const su = Math.max(1, Math.round((faceU[f] ?? w) / tileW));
    const sv = Math.max(1, Math.round((faceV[f] ?? h) / tileH));
    uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  }
  uv.needsUpdate = true;
  return g;
}

/** Group of merged geometries keyed by material id (for textured pieces). */
export class TexBuckets {
  private map = new Map<string, THREE.BufferGeometry[]>();
  add(key: string, geo: THREE.BufferGeometry, t: Xf = {}) {
    const g = prep(geo);
    g.applyMatrix4(xfMatrix(t, _m));
    const list = this.map.get(key) ?? [];
    list.push(g);
    this.map.set(key, list);
  }
  build(): Map<string, THREE.BufferGeometry> {
    const out = new Map<string, THREE.BufferGeometry>();
    for (const [k, list] of this.map) {
      const merged = mergeGeometries(list, false);
      for (const p of list) p.dispose();
      if (merged) {
        merged.computeBoundingSphere();
        out.set(k, merged);
      }
    }
    this.map.clear();
    return out;
  }
}

/** Tiny deterministic PRNG for scenery (renderer-only; sim is separate). */
export function mulberry(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (lo: number, hi: number) => lo + (hi - lo) * next(),
    int: (lo: number, hi: number) => Math.floor(lo + (hi - lo + 1) * next()),
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)]!,
    chance: (p: number) => next() < p,
  };
}
export type Rng = ReturnType<typeof mulberry>;
