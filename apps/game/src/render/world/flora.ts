import { shade } from '../geo';
import type { Ctx } from './ctx';

/**
 * Trees and crops by name. Each takes the chunk context and a ground position;
 * all of them draw from the regional stream so adding one to a district never
 * moves a roll anywhere else.
 */
export type FloraBuilder = (c: Ctx, x: number, z: number) => void;

const GREENS = ['#6f8a3c', '#7d9444', '#5f7a35'];
const NEEM = ['#3c6b2e', '#467a35', '#355f29'];

export const FLORA: Record<string, FloraBuilder> = {
  /** Flat-topped umbrella canopy on a thin, leaning trunk. */
  acacia(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(3.6, 5.2);
    const lean = r.range(-0.12, 0.12);
    vc.cyl(0.11, 0.2, h, '#5a4330', { x, y: h / 2, z, rz: lean }, 5);
    vc.cyl(0.07, 0.1, 1.6, '#5a4330', { x: x + 0.5, y: h - 0.3, z, rz: -0.8 }, 4);
    for (let i = 0; i < 4; i++) {
      vc.sphere(r.range(1.5, 2.3), r.pick(GREENS), { x: x + r.range(-1.3, 1.3), y: h + r.range(0.1, 0.5), z: z + r.range(-1.3, 1.3), sy: 0.34 }, 6);
    }
  },
  /** Dense, rounded, dark canopy: the shade tree of every compound and yard. */
  neem(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(2.6, 3.6);
    vc.cyl(0.22, 0.34, h, '#5d4630', { x, y: h / 2, z }, 6);
    for (let i = 0; i < 5; i++) {
      vc.sphere(r.range(1.3, 2.0), r.pick(NEEM), { x: x + r.range(-1.2, 1.2), y: h + r.range(0.7, 1.9), z: z + r.range(-1.2, 1.2), sy: 0.82 }, 7);
    }
  },
  /** A fat bottle trunk, a few stubby limbs and a thin crown. */
  baobab(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(5.5, 7.5);
    vc.cyl(0.9, 1.5, h, '#8d7a64', { x, y: h / 2, z }, 9);
    vc.sphere(1.05, '#8d7a64', { x, y: h, z, sy: 0.6 }, 8);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + r.range(0, 0.6);
      vc.cyl(0.14, 0.26, 2.6, '#7d6b58', { x: x + Math.cos(a) * 0.9, y: h + 0.7, z: z + Math.sin(a) * 0.9, rx: Math.sin(a) * 0.9, rz: -Math.cos(a) * 0.9 }, 5);
      vc.sphere(r.range(0.6, 0.95), '#7f9a46', { x: x + Math.cos(a) * 1.9, y: h + 1.8, z: z + Math.sin(a) * 1.9, sy: 0.7 }, 5);
    }
  },
  /** A tall slim trunk with a head of drooping fronds. */
  datepalm(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(6.5, 9);
    for (let i = 0; i < 5; i++) vc.cyl(0.17 - i * 0.01, 0.21 - i * 0.01, h / 5, i % 2 ? '#8a6a45' : '#7a5c3b', { x, y: (h / 5) * (i + 0.5), z }, 6);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      vc.cone(0.26, 3.0, i % 2 ? '#5f7a35' : '#6f8a3c', { x: x + Math.cos(a) * 1.2, y: h + 0.1, z: z + Math.sin(a) * 1.2, rx: Math.sin(a) * 1.3, rz: -Math.cos(a) * 1.3, sz: 0.3 }, 4);
    }
  },
  /** Broad dark crown on a short trunk: the shade tree of the Garden City's avenues and yards. */
  mango(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(2.4, 3.2);
    vc.cyl(0.26, 0.4, h, '#5b4631', { x, y: h / 2, z }, 6);
    for (let i = 0; i < 6; i++) {
      vc.sphere(r.range(1.5, 2.3), r.pick(['#2f5b3b', '#376a43', '#285032']), { x: x + r.range(-1.5, 1.5), y: h + r.range(0.8, 2.2), z: z + r.range(-1.5, 1.5), sy: 0.85 }, 7);
    }
  },
  /** Oil palm: a thick ringed trunk, a heavy crown of stiff fronds, a bunch of orange fruit. */
  oilpalm(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(5.5, 8);
    for (let i = 0; i < 4; i++) vc.cyl(0.26 - i * 0.015, 0.3 - i * 0.015, h / 4, i % 2 ? '#6e5a44' : '#5e4c38', { x, y: (h / 4) * (i + 0.5), z }, 6);
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      vc.cone(0.3, 3.6, i % 2 ? '#3d6b34' : '#4a7a3a', { x: x + Math.cos(a) * 1.4, y: h + 0.1, z: z + Math.sin(a) * 1.4, rx: Math.sin(a) * 1.2, rz: -Math.cos(a) * 1.2, sz: 0.3 }, 4);
    }
    vc.sphere(0.42, '#c9742c', { x: x + 0.2, y: h - 0.5, z: z + 0.2 }, 5);
  },
  /** Nipa: no trunk at all, a fan of long upright fronds rising straight out of the mud. */
  nipa(c, x, z) {
    const { vc, rx: r } = c;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + r.range(0, 0.5);
      const len = r.range(4.2, 6);
      vc.cone(0.2, len, i % 2 ? '#5e8b3a' : '#6e9a44', { x: x + Math.cos(a) * 0.5, y: len / 2, z: z + Math.sin(a) * 0.5, rx: Math.sin(a) * 0.35, rz: -Math.cos(a) * 0.35, sz: 0.35 }, 4);
    }
  },
  /** Mangrove: arched stilt roots standing in the mud under a dark, dense crown. */
  mangrove(c, x, z) {
    const { vc, rx: r } = c;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      vc.cyl(0.07, 0.12, 2.2, '#4a3828', { x: x + Math.cos(a) * 0.7, y: 1.0, z: z + Math.sin(a) * 0.7, rx: Math.sin(a) * 0.5, rz: -Math.cos(a) * 0.5 }, 4);
    }
    vc.cyl(0.2, 0.28, 1.6, '#4a3828', { x, y: 2.4, z }, 5);
    for (let i = 0; i < 4; i++) vc.sphere(r.range(1.0, 1.6), r.pick(['#2f5b3b', '#285032', '#356244']), { x: x + r.range(-0.9, 0.9), y: 3.6 + r.range(0, 1), z: z + r.range(-0.9, 0.9), sy: 0.8 }, 6);
  },
  /** Plantain: a short soft trunk and a spray of broad, torn leaves. */
  banana(c, x, z) {
    const { vc, rx: r } = c;
    vc.cyl(0.18, 0.24, 2.2, '#8a9a5a', { x, y: 1.1, z }, 5);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      vc.box(0.2, 0.05, 2.0, r.pick(['#5e8b3a', '#6e9a44']), { x: x + Math.cos(a) * 0.9, y: 2.3, z: z + Math.sin(a) * 0.9, ry: -a + Math.PI / 2, rx: 0.5 });
    }
  },
  /** Cashew: a low, wide, dark canopy on a short bent trunk, with a few orange fruit. */
  cashew(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(1.6, 2.2);
    vc.cyl(0.18, 0.3, h, '#5b4631', { x, y: h / 2, z, rz: r.range(-0.15, 0.15) }, 5);
    for (let i = 0; i < 5; i++) {
      vc.sphere(r.range(1.3, 1.9), r.pick(['#3f6b34', '#4a7a3a', '#355f29']), { x: x + r.range(-1.4, 1.4), y: h + r.range(0.3, 1.1), z: z + r.range(-1.4, 1.4), sy: 0.6 }, 6);
    }
    for (let i = 0; i < 3; i++) vc.sphere(0.14, '#d98a2c', { x: x + r.range(-1.1, 1.1), y: h + 0.3, z: z + r.range(-1.1, 1.1) }, 4);
  },
  /** Raffia: clumped, very long arching fronds on a short thick base. */
  raffia(c, x, z) {
    const { vc, rx: r } = c;
    vc.cyl(0.3, 0.4, 1.4, '#7a5c3b', { x, y: 0.7, z }, 6);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + r.range(0, 0.4);
      vc.cone(0.22, 5.2, i % 2 ? '#4f7a34' : '#5f8a3c', { x: x + Math.cos(a) * 1.2, y: 2.6, z: z + Math.sin(a) * 1.2, rx: Math.sin(a) * 0.9, rz: -Math.cos(a) * 0.9, sz: 0.3 }, 4);
    }
  },
  /** A yam barn (oba ji): upright posts and cross-poles, tubers hung in rows on raffia ties, open to the air. */
  yambarn(c, x, z) {
    const { vc, rx: r } = c;
    const rows = r.int(3, 5);
    const h = 2.6;
    for (let i = 0; i <= rows; i++) vc.cyl(0.06, 0.07, h, '#6e5a44', { x, y: h / 2, z: z - 1.4 + i * (2.8 / rows) }, 4);
    for (const y of [0.9, 1.7, 2.5]) vc.box(0.08, 0.08, 3, '#5e4c38', { x, y, z });
    for (let i = 0; i < rows * 3; i++) vc.cyl(0.1, 0.12, 0.7, r.pick(['#c9a66b', '#b99058', '#d0b27a']), { x: x + 0.12, y: 1.4 + (i % 3) * 0.55, z: z - 1.3 + (i / 3) * (2.6 / rows) + 0.15 }, 5);
    vc.box(0.2, 0.06, 3.2, '#c9a66b', { x, y: h + 0.1, z });
  },
  /** A heap of weathered granite boulders, rounded and pale, with a little dry grass in the cracks. */
  boulder(c, x, z) {
    const { vc, rx: r } = c;
    const n = r.int(2, 4);
    for (let i = 0; i < n; i++) {
      const rad = r.range(0.9, 2.1);
      vc.sphere(rad, r.pick(['#8d8a84', '#9a968e', '#7f7c76']), { x: x + r.range(-1.6, 1.6), y: rad * 0.55, z: z + r.range(-1.6, 1.6), sy: 0.7 }, 7);
    }
    for (let i = 0; i < 3; i++) vc.cone(0.05, 0.6, '#c9b777', { x: x + r.range(-1.6, 1.6), y: 0.3, z: z + r.range(-1.6, 1.6) }, 4);
  },
  /** A rainforest giant: a tall straight trunk on flared buttress roots under a broad, high crown. */
  'forest-giant'(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(10, 14);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      vc.box(0.22, 2.6, 1.3, '#6b5a46', { x: x + Math.cos(a) * 0.6, y: 1.2, z: z + Math.sin(a) * 0.6, ry: -a, rz: Math.cos(a) * 0.12 });
    }
    vc.cyl(0.55, 0.8, h, '#7a6a56', { x, y: h / 2, z }, 7);
    for (let i = 0; i < 5; i++) {
      vc.sphere(r.range(2.2, 3.4), r.pick(['#2f5b3b', '#376a43', '#3d7348']), { x: x + r.range(-2.4, 2.4), y: h + r.range(0, 1.6), z: z + r.range(-2.4, 2.4), sy: 0.62 }, 7);
    }
  },
  /** Shea: a broad, low, rounded dark crown on a short rough trunk, with pale fruit. */
  shea(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(2.2, 3.0);
    vc.cyl(0.24, 0.36, h, '#4f3d2e', { x, y: h / 2, z }, 6);
    for (let i = 0; i < 5; i++) vc.sphere(r.range(1.3, 1.9), r.pick(['#3f6b34', '#355f29', '#4a7a3a']), { x: x + r.range(-1.2, 1.2), y: h + r.range(0.5, 1.5), z: z + r.range(-1.2, 1.2), sy: 0.75 }, 6);
    for (let i = 0; i < 3; i++) vc.sphere(0.12, '#b5c46a', { x: x + r.range(-1, 1), y: h + 0.6, z: z + r.range(-1, 1) }, 4);
  },
  /** Pawpaw: one slim straight trunk topped by a rosette of big lobed leaves and a clump of yellow-green fruit. */
  pawpaw(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(3.4, 4.6);
    vc.cyl(0.12, 0.18, h, '#8a8a5a', { x, y: h / 2, z }, 5);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      vc.box(0.12, 0.05, 1.6, i % 2 ? '#5e8b3a' : '#6e9a44', { x: x + Math.cos(a) * 0.8, y: h + 0.1, z: z + Math.sin(a) * 0.8, ry: -a + Math.PI / 2, rx: 0.35 });
    }
    for (let i = 0; i < 3; i++) vc.sphere(0.2, '#c4c25a', { x: x + r.range(-0.25, 0.25), y: h - 0.3, z: z + r.range(-0.25, 0.25), sy: 1.2 }, 5);
  },
  /** Cocoa: a low, wide tree with a dark, dense crown and a few ridged pods in yellow-ochre on the trunk. */
  cocoa(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(1.6, 2.2);
    vc.cyl(0.14, 0.2, h, '#5b4631', { x, y: h / 2, z }, 5);
    for (let i = 0; i < 4; i++) vc.sphere(r.range(1.0, 1.5), r.pick(['#2f5b3b', '#376a43', '#285032']), { x: x + r.range(-1.0, 1.0), y: h + r.range(0.3, 1.0), z: z + r.range(-1.0, 1.0), sy: 0.7 }, 6);
    for (let i = 0; i < 3; i++) vc.sphere(0.13, '#9c8036', { x: x + r.range(-0.25, 0.25), y: 0.9 + i * 0.35, z: z + r.range(-0.25, 0.25), sy: 1.4 }, 4);
  },
  /** Teak: a plantation of straight pale poles with a small flat crown at the top. */
  teak(c, x, z) {
    const { vc, rx: r } = c;
    for (let i = 0; i < 4; i++) {
      const h = r.range(6, 9);
      const tx = x + (i % 2) * 2.2 + r.range(-0.4, 0.4);
      const tz = z + Math.floor(i / 2) * 2.2 + r.range(-0.4, 0.4);
      vc.cyl(0.14, 0.2, h, '#8a7a62', { x: tx, y: h / 2, z: tz }, 5);
      vc.sphere(r.range(1.0, 1.4), '#4f7a3a', { x: tx, y: h + 0.2, z: tz, sy: 0.55 }, 6);
    }
  },
  /** Pine: a tall thin trunk under two stacked dark cones, in the colonial reserves of the uplands. */
  pine(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(8, 12);
    vc.cyl(0.18, 0.28, h, '#5b4631', { x, y: h / 2, z }, 5);
    vc.cone(1.9, h * 0.5, '#2f5b3b', { x, y: h * 0.62, z }, 7);
    vc.cone(1.4, h * 0.38, '#3a6a40', { x, y: h * 0.86, z }, 7);
  },
  /** Eucalyptus: a tall pale trunk with a thin, drooping, blue-green crown. */
  eucalyptus(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(9, 13);
    vc.cyl(0.14, 0.26, h, '#cfc9b8', { x, y: h / 2, z }, 5);
    for (let i = 0; i < 3; i++) vc.sphere(r.range(1.0, 1.5), r.pick(['#6f8f6a', '#7c9a76', '#6a8a70']), { x: x + r.range(-0.8, 0.8), y: h - i * 1.3, z: z + r.range(-0.8, 0.8), sy: 0.8 }, 5);
  },
  /** Faidherbia: a sparse, flat-topped, wide acacia kept in the fields, leafy in the dry season. */
  faidherbia(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(4.5, 6.5);
    vc.cyl(0.18, 0.34, h, '#6a5a44', { x, y: h / 2, z }, 5);
    for (let i = 0; i < 4; i++) vc.sphere(r.range(1.2, 1.9), r.pick(['#8da36a', '#7f9560', '#98ab76']), { x: x + r.range(-1.6, 1.6), y: h + r.range(0, 0.6), z: z + r.range(-1.6, 1.6), sy: 0.35 }, 6);
  },
  /** Rubber: rows of straight pale trunks with a small high crown and a cup on the bark. */
  rubber(c, x, z) {
    const { vc, rx: r } = c;
    for (let i = 0; i < 6; i++) {
      const h = r.range(6, 8);
      const tx = x + (i % 3) * 2.4 + r.range(-0.3, 0.3);
      const tz = z + Math.floor(i / 3) * 2.4 + r.range(-0.3, 0.3);
      vc.cyl(0.12, 0.18, h, '#9a9082', { x: tx, y: h / 2, z: tz, rz: r.range(-0.05, 0.05) }, 5);
      vc.sphere(r.range(0.9, 1.3), '#3f5a38', { x: tx, y: h + 0.1, z: tz, sy: 0.7 }, 5);
      vc.cyl(0.07, 0.07, 0.1, '#25282c', { x: tx + 0.14, y: 1.0, z: tz }, 5);
    }
  },
  /** Kola: a broad, dark, dense rounded tree with a short trunk. */
  kola(c, x, z) {
    const { vc, rx: r } = c;
    const h = r.range(2.0, 2.8);
    vc.cyl(0.26, 0.4, h, '#5b4631', { x, y: h / 2, z }, 6);
    for (let i = 0; i < 5; i++) vc.sphere(r.range(1.4, 2.1), r.pick(['#2f4a34', '#35553a', '#2a4430']), { x: x + r.range(-1.6, 1.6), y: h + r.range(0.4, 1.8), z: z + r.range(-1.6, 1.6), sy: 0.85 }, 7);
  },
  /** A low grey granite dome with a boulder or two at its foot. */
  granitedome(c, x, z) {
    const { vc, rx: r } = c;
    vc.cap(1, Math.PI / 2, '#a29b92', { x, y: -0.6, z, sx: r.range(3.5, 6), sy: r.range(2.2, 3.4), sz: r.range(3.5, 5) }, 9);
    for (let i = 0; i < 2; i++) vc.sphere(r.range(0.6, 1.0), '#8d8a84', { x: x + r.range(-3.5, 3.5), y: 0.5, z: z + r.range(-3, 3), sy: 0.8 }, 5);
  },
  /** A reed bed: dense upright pale-green and straw stems in a clump, with a few seed plumes. */
  reedbed(c, x, z) {
    const { vc, rx: r } = c;
    for (let i = 0; i < 12; i++) {
      const h = r.range(1.8, 3.2);
      vc.cone(0.07, h, i % 3 ? '#a9a36b' : '#8e9a5a', { x: x + r.range(-1.0, 1.0), y: h / 2, z: z + r.range(-1.0, 1.0), rz: r.range(-0.12, 0.12) }, 4);
    }
    for (let i = 0; i < 3; i++) vc.sphere(0.12, '#d9d2a8', { x: x + r.range(-0.8, 0.8), y: 3.0, z: z + r.range(-0.8, 0.8), sy: 1.6 }, 4);
  },
  /** Low thorny bush and dry grass tufts. */
  scrub(c, x, z) {
    const { vc, rx: r } = c;
    for (let i = 0; i < 3; i++) vc.sphere(r.range(0.45, 0.8), shade(r.pick(GREENS), -0.08), { x: x + r.range(-0.6, 0.6), y: 0.4, z: z + r.range(-0.6, 0.6), sy: 0.6 }, 5);
    for (let i = 0; i < 4; i++) vc.cone(0.05, r.range(0.5, 0.9), '#c9b27a', { x: x + r.range(-0.8, 0.8), y: 0.35, z: z + r.range(-0.8, 0.8) }, 4);
  },
};

export const CROPS: Record<string, (c: Ctx, x0: number, x1: number, side: 1 | -1) => void> = {
  /** Cassava ridges: knee-high bushy stems with a few bare sticks, on dark red-brown soil. */
  cassava(c, x0, x1, side) {
    const { vc, rx: r } = c;
    const lo = Math.min(x0, x1);
    const hi = Math.max(x0, x1);
    const rows = 4;
    vc.box(hi - lo, 0.06, 36, '#6e4a30', { x: side * ((lo + hi) / 2), y: 0.02, z: c.zMid });
    for (let row = 0; row < rows; row++) {
      const x = side * (lo + ((row + 0.5) / rows) * (hi - lo));
      for (let i = 0; i < 9; i++) {
        const z = c.zStart + 2 + i * 4 + r.range(-0.5, 0.5);
        const h = r.range(1.2, 1.8);
        vc.cyl(0.04, 0.05, h, '#8a7a5a', { x: x + r.range(-0.2, 0.2), y: h / 2, z }, 4);
        vc.sphere(r.range(0.4, 0.6), r.pick(['#5e8b3a', '#4f7a34']), { x: x + r.range(-0.2, 0.2), y: h + 0.1, z, sy: 0.7 }, 5);
      }
    }
  },
  /** Flooded rice paddies: low bright green rows between pale bunds, with a standing egret. */
  rice(c, x0, x1, side) {
    const { vc, rx: r } = c;
    const lo = Math.min(x0, x1);
    const hi = Math.max(x0, x1);
    vc.box(hi - lo, 0.05, 38, '#7c8c5a', { x: side * ((lo + hi) / 2), y: 0.03, z: c.zMid });
    for (let k = 0; k < 3; k++) vc.box(hi - lo, 0.14, 0.4, '#b9a97c', { x: side * ((lo + hi) / 2), y: 0.08, z: c.zStart + 6 + k * 14 });
    for (let row = 0; row < 5; row++) {
      const x = side * (lo + ((row + 0.5) / 5) * (hi - lo));
      for (let i = 0; i < 16; i++) {
        const z = c.zStart + 1.5 + i * 2.3 + r.range(-0.3, 0.3);
        vc.cone(0.14, r.range(0.45, 0.7), r.pick(['#8ab24a', '#7ca23f', '#96bb52']), { x: x + r.range(-0.3, 0.3), y: 0.3, z }, 4);
      }
    }
    vc.cyl(0.04, 0.04, 0.7, '#e8e4d4', { x: side * (lo + (hi - lo) * 0.4), y: 0.4, z: c.zStart + r.range(8, 32) }, 4);
  },
  /** Maize rows: head-high stalks with long drooping leaves and pale cobs, on red-brown soil. */
  maize(c, x0, x1, side) {
    const { vc, rx: r } = c;
    const lo = Math.min(x0, x1);
    const hi = Math.max(x0, x1);
    vc.box(hi - lo, 0.06, 36, '#8a5a3c', { x: side * ((lo + hi) / 2), y: 0.02, z: c.zMid });
    for (let row = 0; row < 4; row++) {
      const x = side * (lo + ((row + 0.5) / 4) * (hi - lo));
      for (let i = 0; i < 10; i++) {
        const z = c.zStart + 2 + i * 3.6 + r.range(-0.4, 0.4);
        const h = r.range(1.7, 2.3);
        vc.cyl(0.04, 0.05, h, '#8a9a4a', { x: x + r.range(-0.2, 0.2), y: h / 2, z }, 4);
        vc.cone(0.28, 1.1, r.pick(['#6a8a3a', '#7c9a44']), { x: x + r.range(-0.2, 0.2), y: h - 0.1, z, rz: r.range(-0.9, 0.9) }, 4);
        vc.sphere(0.1, '#d9bd6c', { x: x + 0.1, y: h * 0.6, z }, 4);
      }
    }
  },
  /** Dry-season masakwa sorghum on pale clay: bright green, knee to waist high, in tight rows. */
  masakwa(c, x0, x1, side) {
    const { vc, rx: r } = c;
    const lo = Math.min(x0, x1);
    const hi = Math.max(x0, x1);
    vc.box(hi - lo, 0.06, 36, '#d3bf98', { x: side * ((lo + hi) / 2), y: 0.02, z: c.zMid });
    for (let row = 0; row < 5; row++) {
      const x = side * (lo + ((row + 0.5) / 5) * (hi - lo));
      for (let i = 0; i < 10; i++) {
        const z = c.zStart + 2 + i * 3.6 + r.range(-0.4, 0.4);
        const h = r.range(0.7, 1.2);
        vc.cone(0.3, h, r.pick(['#7fa05a', '#8aac62', '#74975a']), { x: x + r.range(-0.2, 0.2), y: h / 2, z }, 5);
      }
    }
  },
  /** Potato terraces: low contour ridges of pale-green mounds on tan soil, stepped across the slope. */
  potato(c, x0, x1, side) {
    const { vc, rx: r } = c;
    const lo = Math.min(x0, x1);
    const hi = Math.max(x0, x1);
    vc.box(hi - lo, 0.06, 36, '#b79a6c', { x: side * ((lo + hi) / 2), y: 0.02, z: c.zMid });
    for (let row = 0; row < 5; row++) {
      const x = side * (lo + ((row + 0.5) / 5) * (hi - lo));
      for (let i = 0; i < 9; i++) {
        const z = c.zStart + 2 + i * 4 + r.range(-0.4, 0.4);
        vc.sphere(r.range(0.7, 1.0), r.pick(['#7fa05a', '#8aac62', '#6f9556']), { x: x + r.range(-0.3, 0.3), y: 0.2, z, sy: 0.35, sx: 2.4 }, 5);
      }
    }
  },
  /** Irrigated dry-season plots: strips of dull green crop and bare brown soil, a pump box and a hose line. */
  irrigation(c, x0, x1, side) {
    const { vc, rx: r } = c;
    const lo = Math.min(x0, x1);
    const hi = Math.max(x0, x1);
    vc.box(hi - lo, 0.06, 36, '#b79a7a', { x: side * ((lo + hi) / 2), y: 0.02, z: c.zMid });
    for (let row = 0; row < 5; row++) {
      const x = side * (lo + ((row + 0.5) / 5) * (hi - lo));
      vc.box((hi - lo) / 6, 0.14, 33, row % 2 ? '#8c9a5b' : '#7c8a50', { x, y: 0.1, z: c.zMid });
      for (let i = 0; i < 6; i++) vc.sphere(r.range(0.35, 0.5), '#6f8a4a', { x: x + r.range(-0.3, 0.3), y: 0.35, z: c.zStart + 4 + i * 5.8, sy: 0.6 }, 5);
    }
    vc.box(0.8, 0.6, 0.8, '#6a6258', { x: side * (lo - 0.3), y: 0.3, z: c.zMid + 6 });
    vc.box(0.05, 0.05, 20, '#25282c', { x: side * (lo + 0.2), y: 0.1, z: c.zMid + 6 });
  },
  /** Tilled rows of millet or sorghum, tall as a person, with pale seed heads. */
  millet(c, x0, x1, side) {
    const { vc, rx: r } = c;
    const lo = Math.min(x0, x1);
    const hi = Math.max(x0, x1);
    const rows = 4;
    vc.box(hi - lo, 0.06, 36, '#a9814f', { x: side * ((lo + hi) / 2), y: 0.02, z: c.zMid });
    for (let row = 0; row < rows; row++) {
      const x = side * (lo + ((row + 0.5) / rows) * (hi - lo));
      for (let i = 0; i < 9; i++) {
        const z = c.zStart + 2 + i * 4 + r.range(-0.5, 0.5);
        const h = r.range(1.6, 2.4);
        vc.cyl(0.03, 0.04, h, '#b5a05a', { x: x + r.range(-0.2, 0.2), y: h / 2, z }, 4);
        vc.cone(0.1, 0.45, '#d9bd6c', { x: x + r.range(-0.2, 0.2), y: h + 0.1, z }, 5);
      }
    }
  },
};
