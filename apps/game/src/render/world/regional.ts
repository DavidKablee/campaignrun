import type { SideOp } from '@cr/content';
import { shade } from '../geo';
import type { Ctx } from './ctx';
import { CROPS, FLORA } from './flora';
import { LOT_STYLES } from './lots';

/** Per-world values the regional builders need from the World that owns them. */
export interface RegionalEnv {
  accent: string;
  billboards: readonly string[];
}

function pickWeighted(r: { next(): number }, entries: readonly (readonly [string, number])[]): string {
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let t = r.next() * total;
  for (const [id, w] of entries) {
    t -= w;
    if (t <= 0) return id;
  }
  return entries[entries.length - 1]![0];
}

/** A row of plots along one side of the road. */
function lots(c: Ctx, side: 1 | -1, op: Extract<SideOp, { op: 'lots' }>, env: RegionalEnv) {
  const r = c.rx;
  let z = c.zStart + r.range(0, 1.2);
  while (z < c.zEnd - 3) {
    const w = Math.min(r.range(7, 12), c.zEnd - z);
    if (w < 4) break;
    const d = r.range(7.5, 11);
    const x0 = op.setback + r.range(0, 1.6);
    const floors = r.int(op.floors[0], op.floors[1]);
    const style = pickWeighted(r, op.styles);
    LOT_STYLES[style]!({ c, side, z0: z, w, d, x0, floors, palette: op.palette, billboards: env.billboards, accent: env.accent });
    z += w + r.range(0.3, 0.7) + op.spacing * r.range(0, 5);
  }
}

function flora(c: Ctx, side: 1 | -1, op: Extract<SideOp, { op: 'flora' }>) {
  const r = c.rx;
  for (let i = 0; i < op.n; i++) {
    const kind = pickWeighted(r, op.kinds);
    FLORA[kind]!(c, side * r.range(op.x[0], op.x[1]), c.zStart + (i + r.range(0.1, 0.9)) * (40 / op.n));
  }
}

/** Dense stalls under striped cloth shades close to the road, with cloth hung on lines between them. */
function bazaar(c: Ctx, side: 1 | -1, op: Extract<SideOp, { op: 'bazaar' }>) {
  const r = c.rx;
  const cols = op.palette.length ? op.palette : ['#d9482b', '#e0a82b', '#1f5f8b', '#f4f1ea', '#2f7a46'];
  const n = Math.max(1, Math.round(op.density * r.range(2, 4)));
  for (let i = 0; i < n; i++) {
    const x = side * r.range(5.8, 7.6);
    const z = c.zStart + r.range(2, 38);
    for (const dx of [-0.9, 0.9]) for (const dz of [-0.7, 0.7]) c.vc.cyl(0.04, 0.04, 2.2, '#5d4037', { x: x + dx, y: 1.1, z: z + dz }, 4);
    for (let s = 0; s < 5; s++) c.vc.box(0.4, 0.05, 1.8, s % 2 ? '#f4f1ea' : r.pick(cols), { x: x - 0.8 + s * 0.4, y: 2.25, z, rz: side * 0.1 });
    c.vc.box(1.8, 0.7, 1.0, '#6b4a2b', { x, y: 0.35, z });
    for (let g = 0; g < 6; g++) c.vc.sphere(0.14, r.pick(cols), { x: x - 0.7 + g * 0.28, y: 0.8, z: z + r.range(-0.3, 0.3) }, 5);
    // a line of cloth for sale
    if (r.chance(0.5)) for (let k = 0; k < 3; k++) c.vc.box(0.7, 1.6, 0.04, r.pick(cols), { x: x - 0.7 + k * 0.7, y: 1.5, z: z - 0.75 });
  }
}

export const WALL_KINDS = ['earthen', 'mill', 'cutbank', 'clay-low', 'boulder-wall'] as const;

/** Earthen city wall: a long run with a stepped parapet, set back from the road. */
function wall(c: Ctx, side: 1 | -1, op: Extract<SideOp, { op: 'wall' }>) {
  const r = c.rx;
  const x = side * r.range(op.x[0], op.x[1]);
  const h = r.range(5.5, 7);
  c.vc.box(2.6, h, 36, '#b9814c', { x, y: h / 2, z: c.zMid });
  c.vc.box(3.0, 0.4, 36, shade('#b9814c', -0.12), { x, y: h + 0.2, z: c.zMid });
  for (let i = 0; i < 9; i++) c.vc.box(3.0, 1.1, 2.0, '#a9733f', { x, y: h + 0.95, z: c.zStart + (i + 0.5) * (40 / 9) });
  for (let i = 0; i < 3; i++) c.vc.box(0.5, 0.8, 0.4, '#8a5a33', { x: x - side * 1.4, y: h * 0.6, z: c.zStart + r.range(3, 37) });
}


/** A low rounded-top whitewashed clay compound wall with a few pilasters and a gate gap, close to the verge. */
function clayLow(c: Ctx, side: 1 | -1, op: Extract<SideOp, { op: 'wall' }>) {
  const r = c.rx;
  const x = side * r.range(op.x[0], op.x[1]);
  c.vc.box(0.5, 1.7, 17, '#e6dcc4', { x, y: 0.85, z: c.zStart + 8.5 });
  c.vc.box(0.5, 1.7, 17, '#e6dcc4', { x, y: 0.85, z: c.zStart + 31.5 });
  c.vc.cyl(0.3, 0.3, 0.6, '#d8cdb0', { x, y: 1.9, z: c.zStart + 8.5, rx: Math.PI / 2 }, 6);
  for (const dz of [-3, 3]) c.vc.box(0.8, 2.3, 0.8, '#d3bf98', { x, y: 1.15, z: c.zMid + dz });
  c.vc.box(0.1, 1.9, 5.2, '#2f4560', { x, y: 0.95, z: c.zMid });
}

/** A mortared boulder wall: a rough low wall of grey boulders with a flat cap and a gate gap. */
function boulderWall(c: Ctx, side: 1 | -1, op: Extract<SideOp, { op: 'wall' }>) {
  const r = c.rx;
  const x = side * r.range(op.x[0], op.x[1]);
  for (const z0 of [c.zStart + 8, c.zStart + 32]) {
    c.vc.box(0.7, 1.0, 14, '#8e8a84', { x, y: 0.5, z: z0 });
    for (let i = 0; i < 8; i++) c.vc.sphere(r.range(0.4, 0.6), r.pick(['#8e8a84', '#9c9892', '#7f7b74']), { x: x + r.range(-0.2, 0.2), y: 1.0 + r.range(0, 0.2), z: z0 - 6.5 + i * 1.85, sy: 0.8 }, 5);
  }
  for (const dz of [-2.8, 2.8]) c.vc.box(0.9, 2.0, 0.9, '#a8a498', { x, y: 1.0, z: c.zMid + dz });
}

/** An escarpment road cut: a high raw laterite bank in stepped faces, with a few boulders and a low post rail at its foot. */
function cutBank(c: Ctx, side: 1 | -1, op: Extract<SideOp, { op: 'wall' }>) {
  const r = c.rx;
  const x = side * r.range(op.x[0], op.x[1]);
  for (let i = 0; i < 4; i++) {
    const h = 5 + i * 2.2;
    c.vc.box(3.2, h, 10.2, i % 2 ? '#a8643f' : '#b3724a', { x: x + side * i * 2.2, y: h / 2, z: c.zStart + (i + 0.5) * 10 });
  }
  for (let i = 0; i < 3; i++) c.vc.sphere(r.range(0.9, 1.5), r.pick(['#8e8a84', '#9a968e']), { x: x - side * 2.2, y: 0.6, z: c.zStart + r.range(3, 37), sy: 0.7 }, 6);
  for (let i = 0; i < 10; i++) c.vc.box(0.14, 0.9, 0.14, '#e8e4d4', { x: x - side * 3.2, y: 0.45, z: c.zStart + 2 + i * 4 });
  c.vc.box(0.1, 0.12, 40, '#e8e4d4', { x: x - side * 3.2, y: 0.85, z: c.zMid });
}

/** A mill's very long blank perimeter wall: cream render, a darker cap, pilasters, set well back. */
function millWall(c: Ctx, side: 1 | -1, op: Extract<SideOp, { op: 'wall' }>) {
  const r = c.rx;
  const x = side * r.range(op.x[0], op.x[1]);
  c.vc.box(0.5, 3.6, 40, '#d8cdb0', { x, y: 1.8, z: c.zMid });
  c.vc.box(0.8, 0.3, 40, '#a9a08a', { x, y: 3.75, z: c.zMid });
  for (let i = 0; i < 6; i++) c.vc.box(0.9, 4.0, 0.7, '#c9bfa6', { x, y: 2.0, z: c.zStart + 3 + i * 6.6 });
}

/**
 * A creek, river or lagoon edge on one side: a dark mud bank where the verge would
 * be, then open brown water out to the edge of the world, with a few dugout canoes
 * pulled up or floating near the bank.
 */
function waterEdge(c: Ctx, side: 1 | -1, op: Extract<SideOp, { op: 'waterEdge' }>) {
  const r = c.rx;
  const [lo, hi] = op.x;
  c.vc.box(Math.max(0.5, lo - 9.4), 0.07, 40, '#6b5a40', { x: side * ((9.4 + lo) / 2), y: 0.035, z: c.zMid });
  c.vc.box(hi - lo, 0.09, 40, op.color, { x: side * ((lo + hi) / 2), y: 0.05, z: c.zMid });
  c.vc.box(hi - lo, 0.02, 40, shade(op.color, 0.22), { x: side * ((lo + hi) / 2 + 6), y: 0.1, z: c.zMid });
  for (let i = 0; i < op.boats; i++) {
    const bx = side * (lo + r.range(1.5, Math.min(14, hi - lo - 2)));
    const bz = c.zStart + r.range(4, 36);
    const col = r.pick(['#8a7358', '#6e5a44', '#7a5a3a', '#2a6f73']);
    c.vc.cyl(0.42, 0.34, 4.6, col, { x: bx, y: 0.22, z: bz, rx: Math.PI / 2, sy: 0.9, sx: 1.2 }, 6);
    c.vc.box(0.7, 0.06, 0.3, shade(col, -0.15), { x: bx, y: 0.5, z: bz + 0.6 });
    c.vc.cone(0.16, 1.4, '#c9a56e', { x: bx + 0.2, y: 0.9, z: bz - 0.4, rx: 0.5 }, 4);
  }
}

const KERBSIDE: Record<string, (c: Ctx, x: number, z: number) => void> = {
  /** A bole stand: a charcoal drum with a glowing grate, a wooden table of plantain and fish, a striped umbrella. */
  bole(c, x, z) {
    const { vc, rx: r } = c;
    const umbrella = r.pick(['#c98f3a', '#2a6f73', '#f4f1ea', '#a8553b']);
    vc.cyl(0.4, 0.34, 0.8, '#2a2a28', { x, y: 0.4, z }, 8);
    vc.cyl(0.36, 0.36, 0.06, '#e8742a', { x, y: 0.82, z }, 8);
    vc.box(1.2, 0.08, 0.7, '#7a5a3a', { x: x + 0.9, y: 0.8, z });
    for (const dz of [-0.28, 0.28]) vc.box(0.08, 0.8, 0.08, '#5a3d24', { x: x + 1.4, y: 0.4, z: z + dz });
    for (let i = 0; i < 4; i++) vc.sphere(0.12, r.pick(['#d9bd6c', '#8a9a5a', '#c9a56e']), { x: x + 0.6 + i * 0.28, y: 0.95, z: z + r.range(-0.15, 0.15), sx: 1.6 }, 5);
    vc.cyl(0.03, 0.03, 2.4, '#5a3d24', { x: x + 0.1, y: 1.2, z: z - 0.5 }, 4);
    vc.cone(1.3, 0.5, umbrella, { x: x + 0.1, y: 2.5, z: z - 0.5 }, 8);
  },
  /** A stack of car tyres, three high, and a spare loose against it. */
  tyres(c, x, z) {
    for (let i = 0; i < 4; i++) c.vc.cyl(0.46, 0.46, 0.3, '#1c1c1c', { x, y: 0.17 + i * 0.3, z, rx: Math.PI / 2 }, 8);
    c.vc.cyl(0.46, 0.46, 0.3, '#232323', { x: x + 1.1, y: 0.47, z: z + 0.2, rz: 1.1 }, 8);
  },
  /** A parked keke: ivory body, ochre canopy, three black wheels. */
  keke(c, x, z) {
    c.vc.box(1.3, 0.7, 2.2, '#ece5cf', { x, y: 0.75, z });
    c.vc.box(1.4, 0.12, 2.4, '#cc9a2c', { x, y: 1.85, z: z - 0.1 });
    for (const dx of [-0.62, 0.62]) c.vc.cyl(0.04, 0.04, 1.0, '#3a3a38', { x: x + dx, y: 1.3, z: z + 0.3 }, 4);
    for (const [dx, dz] of [[-0.6, -0.8], [0.6, -0.8], [0, 0.9]] as const) c.vc.cyl(0.28, 0.28, 0.14, '#1a1a1a', { x: x + dx, y: 0.28, z: z + dz, rz: Math.PI / 2 }, 8);
  },
  /** A bolt of cloth rack: leaning bolts in the trade colours. */
  cloth(c, x, z) {
    const cols = ['#3c4b7a', '#7a2f3e', '#cc9a2c', '#2a6f73', '#e7d9b6'];
    c.vc.box(1.6, 0.08, 0.5, '#6b4a2b', { x, y: 0.5, z });
    for (let i = 0; i < 5; i++) c.vc.cyl(0.12, 0.12, 0.9, cols[(i + Math.floor(c.rx.range(0, 5))) % 5]!, { x: x - 0.6 + i * 0.3, y: 1.0, z, rz: 0.12 }, 6);
  },
  /** A tea seller's corner (mai shayi): a bench, a charcoal kettle, a small canvas awning. */
  teastall(c, x, z) {
    c.vc.box(1.4, 0.1, 0.5, '#6b4a2b', { x: x + 0.8, y: 0.45, z });
    for (const dz of [-0.2, 0.2]) c.vc.box(0.08, 0.45, 0.08, '#5a3d24', { x: x + 1.4, y: 0.22, z: z + dz });
    c.vc.cyl(0.3, 0.26, 0.5, '#2a2a28', { x, y: 0.25, z }, 8);
    c.vc.cyl(0.14, 0.14, 0.26, '#b8b2a2', { x, y: 0.65, z }, 6);
    for (const [dx, dz] of [[-0.4, -0.6], [-0.4, 0.6], [1.7, -0.6], [1.7, 0.6]] as const) c.vc.cyl(0.03, 0.03, 2.0, '#5a3d24', { x: x + dx, y: 1.0, z: z + dz }, 4);
    c.vc.box(2.4, 0.06, 1.5, '#cda66b', { x: x + 0.65, y: 2.05, z, rz: 0.1 });
  },
  /** A tarp-shaded produce counter: heaps of onion, pepper, tomato and mango. */
  produce(c, x, z) {
    const { vc, rx: r } = c;
    vc.box(2.0, 0.6, 1.0, '#6b4a2b', { x, y: 0.3, z });
    const heaps = ['#8a4a62', '#9c2f2a', '#b23a2a', '#b8863a', '#c9b58a'];
    for (let i = 0; i < 4; i++) vc.sphere(0.3, r.pick(heaps), { x: x - 0.7 + i * 0.47, y: 0.7, z: z + r.range(-0.15, 0.15), sy: 0.8 }, 6);
    for (const dx of [-0.9, 0.9]) vc.cyl(0.04, 0.04, 2.2, '#5a3d24', { x: x + dx, y: 1.1, z: z - 0.5 }, 4);
    vc.box(2.2, 0.05, 1.7, r.pick(['#cda66b', '#4f6d85', '#c9b58a']), { x, y: 2.2, z, rz: 0.12 });
  },
  /** Plastic basins and a woven fish basket, stacked on the kerb. */
  basins(c, x, z) {
    const { vc, rx: r } = c;
    for (let i = 0; i < 3; i++) vc.cyl(0.42, 0.3, 0.2, r.pick(['#2a6f73', '#c98f3a', '#a8553b']), { x: x + (i - 1) * 0.55, y: 0.12 + (i % 2) * 0.2, z: z + r.range(-0.15, 0.15) }, 7);
    vc.cyl(0.3, 0.38, 0.45, '#b99a62', { x: x + 1.1, y: 0.23, z }, 7);
  },
  /** A two-handled hand barrow parked at the kerb, loaded. */
  barrow(c, x, z) {
    const { vc, rx: r } = c;
    vc.box(1.4, 0.4, 0.9, '#7a5a3a', { x, y: 0.62, z });
    vc.cyl(0.38, 0.38, 0.12, '#1a1a1a', { x, y: 0.38, z: z + 0.5, rz: Math.PI / 2 }, 8);
    vc.cyl(0.38, 0.38, 0.12, '#1a1a1a', { x, y: 0.38, z: z - 0.5, rz: Math.PI / 2 }, 8);
    vc.box(0.06, 0.06, 1.3, '#5a3d24', { x: x + 0.7, y: 0.75, z, ry: 0.0 });
    for (let i = 0; i < 4; i++) vc.sphere(0.17, r.pick(['#d9482b', '#e0a82b', '#2f7a46']), { x: x - 0.4 + i * 0.28, y: 0.98, z: z + r.range(-0.2, 0.2) }, 5);
  },
  /** Two squared logs and a round one, end-grain showing, stacked on the verge. */
  logs(c, x, z) {
    for (let i = 0; i < 3; i++) c.vc.cyl(0.42, 0.42, 3.4, i === 1 ? '#8a5a3c' : '#9a5a38', { x: x + (i - 1) * 0.8, y: 0.42 + (i === 1 ? 0.6 : 0), z, rx: Math.PI / 2 }, 7);
  },
  /** A stack of sawn planks on bearers. */
  planks(c, x, z) {
    for (let i = 0; i < 6; i++) c.vc.box(2.4, 0.08, 0.5, i % 2 ? '#c9a66b' : '#b99058', { x, y: 0.2 + i * 0.1, z });
    for (const dz of [-0.9, 0.9]) c.vc.box(0.14, 0.14, 1.3, '#5a4330', { x, y: 0.07, z: z + dz });
  },
  /** Four jerrycans of palm oil in muted amber, two on top. */
  jerrycans(c, x, z) {
    for (let i = 0; i < 4; i++) c.vc.box(0.36, 0.5, 0.26, i % 2 ? '#a88a3e' : '#9a7a34', { x: x + (i % 2) * 0.42, y: 0.25 + (i > 1 ? 0.5 : 0), z: z + (i % 2 ? 0.05 : -0.05) });
  },
  /** A tray stack of sachet water in bags, pale blue-grey film. */
  sachets(c, x, z) {
    for (let i = 0; i < 3; i++) c.vc.box(0.7, 0.28, 0.5, '#c4d4d8', { x: x + (i - 1) * 0.15, y: 0.15 + i * 0.28, z });
    c.vc.box(0.74, 0.04, 0.54, '#5b7f8a', { x, y: 0.1, z });
  },
  /** A wall of fired pots: red and black rounds stacked in rows on a low bench. */
  potwall(c, x, z) {
    const { vc, rx: r } = c;
    vc.box(2.2, 0.3, 0.9, '#6b4a2b', { x, y: 0.15, z });
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 4 - row; i++) vc.sphere(0.3, (i + row) % 3 === 0 ? '#2a2420' : r.pick(['#a9573a', '#b4623f']), { x: x - 0.7 + i * 0.5 + row * 0.25, y: 0.5 + row * 0.45, z, sy: 1.05 }, 6);
    }
  },
  /** A crate of tomatoes on a tray, with a tarp shade. */
  tomatoes(c, x, z) {
    const { vc, rx: r } = c;
    vc.box(1.0, 0.4, 0.7, '#8a6a45', { x, y: 0.2, z });
    for (let i = 0; i < 5; i++) vc.sphere(0.13, '#a83a2a', { x: x - 0.3 + i * 0.15, y: 0.5, z: z + r.range(-0.15, 0.15) }, 5);
    vc.cyl(0.03, 0.03, 1.9, '#5a3d24', { x: x + 0.6, y: 0.95, z: z - 0.3 }, 4);
    vc.box(1.6, 0.05, 1.2, '#4f6d85', { x: x + 0.1, y: 1.9, z: z - 0.2, rz: 0.1 });
  },
  /** A vulcanizer: a tall tyre stack, two loose tyres and a plank sign on a post. */
  vulcanizer(c, x, z) {
    const { vc } = c;
    for (let i = 0; i < 5; i++) vc.cyl(0.46, 0.46, 0.3, '#1c1c1c', { x, y: 0.17 + i * 0.3, z, rx: Math.PI / 2 }, 8);
    vc.cyl(0.46, 0.46, 0.3, '#232323', { x: x + 1.1, y: 0.2, z: z + 0.1, rz: 1.5 }, 8);
    vc.cyl(0.05, 0.05, 1.8, '#5a3d24', { x: x + 0.8, y: 0.9, z: z - 0.4 }, 4);
    vc.box(0.9, 0.35, 0.05, '#e8e4d4', { x: x + 0.8, y: 1.7, z: z - 0.4 });
  },
  /** A cooking fire on a low earth mound with a few puffs of smoke. */
  firemound(c, x, z) {
    const { vc } = c;
    vc.cyl(0.8, 1.0, 0.35, '#8a5a3c', { x, y: 0.17, z }, 7);
    vc.cone(0.28, 0.5, '#d98a2c', { x, y: 0.55, z }, 5);
    for (let i = 0; i < 3; i++) vc.sphere(0.34 + i * 0.12, '#c9c5bb', { x: x + i * 0.12, y: 1.2 + i * 0.7, z, sy: 0.9 }, 5);
  },
  /** A parked motorcycle taxi, dull body, black seat, two wheels. */
  okada(c, x, z) {
    const { vc, rx: r } = c;
    vc.box(0.4, 0.45, 1.8, r.pick(['#6f7f8c', '#8a4a3a', '#2a2a2c', '#e4dcc6']), { x, y: 0.62, z });
    vc.box(0.36, 0.14, 0.8, '#1a1a1a', { x, y: 0.92, z: z - 0.2 });
    vc.box(0.5, 0.06, 0.06, '#3a3a38', { x, y: 1.0, z: z + 0.8 });
    for (const dz of [-0.75, 0.75]) vc.cyl(0.3, 0.3, 0.12, '#1a1a1a', { x, y: 0.3, z: z + dz, rz: Math.PI / 2 }, 8);
  },
  /** Indigo and white adire cloth hung to dry on a pole line between two uprights. */
  adireline(c, x, z) {
    const { vc } = c;
    for (const dz of [-1.4, 1.4]) vc.cyl(0.04, 0.04, 2.2, '#5a4330', { x, y: 1.1, z: z + dz }, 4);
    vc.box(0.05, 0.05, 2.9, '#5a4330', { x, y: 2.1, z });
    for (let i = 0; i < 4; i++) vc.box(0.04, 1.2, 0.6, i % 2 ? '#f1eee4' : '#2e3c69', { x, y: 1.4, z: z - 1.05 + i * 0.7 });
  },
  /** A heap of cocoa beans drying on a mat, with two sacks beside it. */
  cocoasacks(c, x, z) {
    const { vc } = c;
    vc.box(1.6, 0.04, 1.2, '#a9814f', { x, y: 0.03, z });
    vc.sphere(0.6, '#6f4a2e', { x, y: 0.1, z, sy: 0.3 }, 6);
    for (let i = 0; i < 2; i++) vc.sphere(0.3, '#d6c59a', { x: x + 1.2 + i * 0.4, y: 0.3, z: z + 0.2 * i, sy: 1.1 }, 6);
  },
  /** A stack of welded steel gate frames leaning on a wall, charcoal, with a pair of door frames. */
  gatestack(c, x, z) {
    const { vc } = c;
    for (let i = 0; i < 4; i++) vc.box(0.1, 1.9, 1.3, i % 2 ? '#34383b' : '#4a4f52', { x: x + i * 0.16, y: 0.95, z, rz: -0.12 });
    vc.box(0.1, 2.0, 0.9, '#6a6258', { x: x - 0.4, y: 1.0, z: z + 1.4, rz: 0.1 });
  },
  /** A bus shelter: a slate roof slab on two posts and a long bench. */
  busshelter(c, x, z) {
    const { vc } = c;
    for (const dz of [-1.4, 1.4]) vc.cyl(0.07, 0.07, 2.6, '#6a6258', { x, y: 1.3, z: z + dz }, 4);
    vc.box(1.5, 0.12, 3.6, '#4f6d85', { x, y: 2.6, z });
    vc.box(0.5, 0.12, 2.6, '#8a8f99', { x: x + 0.3, y: 0.55, z });
  },
  /** A chevron board row on the outside of a bend: alternating charcoal and pale plates on short posts. */
  chevrons(c, x, z) {
    const { vc } = c;
    for (let i = 0; i < 4; i++) {
      vc.cyl(0.04, 0.04, 1.2, '#6a6258', { x, y: 0.6, z: z - 2.4 + i * 1.6 }, 4);
      vc.box(0.05, 0.7, 0.9, i % 2 ? '#34383b' : '#e8e6da', { x, y: 1.3, z: z - 2.4 + i * 1.6 });
    }
  },
  /** A parked minibus in dull ochre with a charcoal stripe, windows dark. */
  minibus(c, x, z) {
    const { vc } = c;
    vc.box(1.9, 1.5, 4.8, '#c2a03e', { x, y: 1.1, z });
    vc.box(1.94, 0.25, 4.84, '#34383b', { x, y: 0.9, z });
    vc.box(1.92, 0.6, 3.9, '#2b3340', { x, y: 1.55, z: z - 0.3 });
    for (const dz of [-1.5, 1.5]) for (const dx of [-0.95, 0.95]) vc.cyl(0.4, 0.4, 0.2, '#1a1a1a', { x: x + dx, y: 0.4, z: z + dz, rz: Math.PI / 2 }, 8);
  },
  /** Potato sacks stacked on a pallet with a few vegetable crates, a hand scale on top. */
  potatosacks(c, x, z) {
    const { vc } = c;
    vc.box(1.4, 0.12, 1.2, '#7a5a3a', { x, y: 0.06, z });
    for (let i = 0; i < 4; i++) vc.box(0.5, 0.45, 0.8, i % 2 ? '#c9b58a' : '#b79a6c', { x: x - 0.4 + (i % 2) * 0.7, y: 0.35 + Math.floor(i / 2) * 0.45, z });
    vc.box(0.5, 0.3, 0.45, '#7fa05a', { x: x + 0.3, y: 1.1, z: z + 0.2 });
  },
  /** Charcoal: tall woven sacks leaning together and a loose black heap. */
  charcoal(c, x, z) {
    const { vc } = c;
    for (let i = 0; i < 4; i++) vc.cyl(0.3, 0.34, 0.95, i % 2 ? '#c9b58a' : '#b8a27a', { x: x + (i % 2) * 0.55, y: 0.5, z: z + Math.floor(i / 2) * 0.6 }, 6);
    vc.cone(0.6, 0.5, '#25282c', { x: x - 0.9, y: 0.25, z }, 6);
  },
  /** A hand-cart with a pile of jackets and shoes. */
  handcart(c, x, z) {
    const { vc, rx: r } = c;
    vc.box(1.0, 0.14, 2.0, '#7a5a3a', { x, y: 0.6, z });
    for (const dx of [-0.55, 0.55]) vc.cyl(0.38, 0.38, 0.1, '#1a1a1a', { x: x + dx, y: 0.38, z, rz: Math.PI / 2 }, 8);
    for (let i = 0; i < 5; i++) vc.sphere(0.28, r.pick(['#b6ae9c', '#4a4e52', '#d8cdb4', '#9a6b4c']), { x: x + r.range(-0.3, 0.3), y: 0.9 + r.range(0, 0.3), z: z + r.range(-0.7, 0.7), sy: 0.7 }, 5);
    vc.box(0.08, 0.08, 1.4, '#5a3d24', { x, y: 0.7, z: z + 1.6 });
  },
  /** A grey water tub on a stand with a ladle and a few bundles of sugarcane. */
  watertub(c, x, z) {
    const { vc } = c;
    vc.cyl(0.5, 0.42, 0.7, '#8a8f99', { x, y: 0.55, z }, 8);
    for (const dz of [-0.35, 0.35]) vc.box(0.08, 0.3, 0.08, '#5a3d24', { x, y: 0.15, z: z + dz });
    for (let i = 0; i < 3; i++) vc.cyl(0.05, 0.05, 1.6, '#b9a85a', { x: x + 0.9 + i * 0.12, y: 0.8, z: z + 0.2, rz: 0.2 }, 4);
  },
  /** Two keke at a rank: muted cream bodies with dull brown roofs. */
  kekecream(c, x, z) {
    const { vc } = c;
    for (const dz of [-1.5, 1.5]) {
      vc.box(1.3, 0.7, 2.2, '#e3d8c0', { x, y: 0.75, z: z + dz });
      vc.box(1.4, 0.12, 2.4, '#7a4a3a', { x, y: 1.85, z: z + dz - 0.1 });
      for (const ddx of [-0.62, 0.62]) vc.cyl(0.04, 0.04, 1.0, '#3a3a38', { x: x + ddx, y: 1.3, z: z + dz + 0.3 }, 4);
      for (const [ddx, ddz] of [[-0.6, -0.8], [0.6, -0.8], [0, 0.9]] as const) vc.cyl(0.28, 0.28, 0.14, '#1a1a1a', { x: x + ddx, y: 0.28, z: z + dz + ddz, rz: Math.PI / 2 }, 8);
    }
  },
  /** A block yard: rows of pale sandcrete blocks stacked on the ground and a heap of grey gravel. */
  blockyard(c, x, z) {
    const { vc } = c;
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) vc.box(0.45, 0.5, 1.2, '#b9b6ac', { x: x + r * 0.5, y: 0.25 + (i % 2) * 0.5, z: z + i * 1.25 });
    vc.cone(1.3, 1.0, '#8d8a84', { x: x + 2.2, y: 0.5, z: z + 1.2 }, 7);
  },
  /** A tipper truck: a short ochre cab, a dark tray tilted a little, six wheels. */
  tipper(c, x, z) {
    const { vc } = c;
    vc.box(1.8, 1.4, 1.6, '#b98a3e', { x, y: 1.1, z: z - 1.6 });
    vc.box(1.9, 1.2, 3.4, '#3a3d40', { x, y: 1.5, z: z + 0.9, rx: 0.06 });
    for (const dz of [-1.6, 0.4, 1.8]) for (const dx of [-0.9, 0.9]) vc.cyl(0.46, 0.46, 0.25, '#1a1a1a', { x: x + dx, y: 0.46, z: z + dz, rz: Math.PI / 2 }, 8);
  },
  /** Kola baskets: round woven baskets stacked and a small pile of nuts on a mat. */
  kolabaskets(c, x, z) {
    const { vc } = c;
    for (let i = 0; i < 3; i++) vc.cyl(0.4, 0.34, 0.5, '#b08a63', { x: x + (i % 2) * 0.5, y: 0.25 + (i >> 1) * 0.5, z: z + (i % 2) * 0.2 }, 8);
    vc.box(1.0, 0.04, 0.8, '#c9b58a', { x: x + 1.1, y: 0.02, z });
    vc.sphere(0.2, '#9a6a4a', { x: x + 1.1, y: 0.14, z, sy: 0.7 }, 5);
  },
  /** Dye tubs: three dark round tubs with indigo liquid and a pole with a hung cloth. */
  dyetubs(c, x, z) {
    const { vc } = c;
    for (let i = 0; i < 3; i++) {
      vc.cyl(0.5, 0.45, 0.6, '#25282c', { x, y: 0.3, z: z + i * 1.2 }, 8);
      vc.cyl(0.42, 0.42, 0.05, '#2b3045', { x, y: 0.62, z: z + i * 1.2 }, 8);
    }
    vc.cyl(0.05, 0.05, 3.0, '#5a3d24', { x: x + 0.9, y: 1.5, z }, 4);
    vc.box(0.05, 2.2, 1.4, '#2e3c69', { x: x + 0.9, y: 1.7, z: z + 0.8 });
  },
  /** Water bags in a tub: stacked plastic bags of cold water, a small awning on a pole. */
  waterbags(c, x, z) {
    const { vc } = c;
    vc.box(1.4, 0.5, 0.8, '#5b7f8a', { x, y: 0.25, z });
    for (let i = 0; i < 5; i++) vc.box(0.28, 0.3, 0.2, '#d6e2e4', { x: x - 0.5 + i * 0.25, y: 0.65, z });
    vc.cyl(0.04, 0.04, 2.0, '#5a3d24', { x: x + 0.8, y: 1.0, z: z - 0.3 }, 4);
    vc.box(1.8, 0.05, 1.3, '#2f4560', { x: x + 0.1, y: 2.0, z: z - 0.2, rz: 0.1 });
  },
  /** A rack of folded caps in cream, sand and white on a stand. */
  caprack(c, x, z) {
    const { vc, rx: r } = c;
    vc.box(1.2, 0.08, 0.5, '#6b4a2b', { x, y: 0.8, z });
    for (const dz of [-0.2, 0.2]) vc.box(0.06, 0.8, 0.06, '#5a3d24', { x: x - 0.5, y: 0.4, z: z + dz });
    for (const dz of [-0.2, 0.2]) vc.box(0.06, 0.8, 0.06, '#5a3d24', { x: x + 0.5, y: 0.4, z: z + dz });
    for (let i = 0; i < 6; i++) vc.cyl(0.14, 0.12, 0.14, r.pick(['#f4f1ea', '#e6dcc4', '#d3bf98', '#2f4560']), { x: x - 0.45 + i * 0.18, y: 0.92 + (i % 2) * 0.12, z }, 6);
  },
  /** Bolts of plain cloth leaning against a low bench. */
  clothbolts(c, x, z) {
    const { vc } = c;
    vc.box(1.6, 0.08, 0.5, '#6b4a2b', { x, y: 0.5, z });
    const cols = ['#f4f1ea', '#2f4560', '#e6dcc4', '#b58e62', '#bdb8aa'];
    for (let i = 0; i < 5; i++) vc.cyl(0.12, 0.12, 0.9, cols[i]!, { x: x - 0.6 + i * 0.3, y: 1.0, z, rz: 0.12 }, 6);
  },
  /** A grass-mat screen: a pale woven fence panel on posts. */
  matscreen(c, x, z) {
    const { vc } = c;
    vc.box(0.08, 1.7, 3.2, '#c9b27a', { x, y: 0.85, z });
    for (const dz of [-1.6, 1.6]) vc.cyl(0.06, 0.06, 1.9, '#5a3d24', { x, y: 0.95, z: z + dz }, 4);
  },
  /** A donkey-less handcart with a tarp roll and jerrycans. */
  donkeycart(c, x, z) {
    const { vc } = c;
    vc.box(1.0, 0.18, 2.2, '#7a5a3a', { x, y: 0.7, z });
    for (const dz of [-0.2, 0.2]) vc.cyl(0.42, 0.42, 0.1, '#1a1a1a', { x: x + (dz < 0 ? -0.55 : 0.55), y: 0.42, z, rz: Math.PI / 2 }, 8);
    vc.box(0.08, 0.08, 1.2, '#5a3d24', { x, y: 0.85, z: z + 1.6 });
    for (let i = 0; i < 3; i++) vc.box(0.3, 0.42, 0.24, '#a88a3e', { x: x - 0.25 + i * 0.28, y: 1.0, z: z - 0.5 });
  },
  /** Two yellow keke at a rank, mustard body with a black roof. */
  kekerank(c, x, z) {
    const { vc } = c;
    for (const dz of [-1.5, 1.5]) {
      vc.box(1.3, 0.7, 2.2, '#d9a22b', { x, y: 0.75, z: z + dz });
      vc.box(1.4, 0.12, 2.4, '#1c1c1c', { x, y: 1.85, z: z + dz - 0.1 });
      for (const ddx of [-0.62, 0.62]) vc.cyl(0.04, 0.04, 1.0, '#3a3a38', { x: x + ddx, y: 1.3, z: z + dz + 0.3 }, 4);
      for (const [ddx, ddz] of [[-0.6, -0.8], [0.6, -0.8], [0, 0.9]] as const) vc.cyl(0.28, 0.28, 0.14, '#1a1a1a', { x: x + ddx, y: 0.28, z: z + dz + ddz, rz: Math.PI / 2 }, 8);
    }
  },
  sacks(c, x, z) {
    for (let i = 0; i < 3; i++) c.vc.sphere(0.34, '#d6c59a', { x: x + (i - 1) * 0.5, y: 0.3, z: z + c.rx.range(-0.15, 0.15), sy: 1.1 }, 6);
  },
  pots(c, x, z) {
    for (let i = 0; i < 3; i++) c.vc.sphere(0.3, '#a8623a', { x: x + (i - 1) * 0.42, y: 0.32, z: z + c.rx.range(-0.2, 0.2), sy: 1.1 }, 6);
  },
  crates(c, x, z) {
    c.vc.box(0.8, 0.5, 0.6, '#8a6a45', { x, y: 0.25, z });
    c.vc.box(0.7, 0.45, 0.55, '#a37d52', { x, y: 0.72, z });
  },
};
export const KERBSIDE_ITEMS = Object.keys(KERBSIDE);

function kerbside(c: Ctx, side: 1 | -1, op: Extract<SideOp, { op: 'kerbside' }>) {
  const r = c.rx;
  for (let i = 0; i < op.n; i++) {
    KERBSIDE[pickWeighted(r, op.items)]!(c, side * r.range(5.7, 6.5), c.zStart + r.range(2, 38));
  }
}

/** Regional side ops. An op with no builder is a bug the registry test catches. */
export function regionalSide(c: Ctx, side: 1 | -1, op: SideOp, env: RegionalEnv): void {
  switch (op.op) {
    case 'lots':
      return lots(c, side, op, env);
    case 'flora':
      return flora(c, side, op);
    case 'crops':
      return CROPS[op.kind]!(c, op.x[0], op.x[1], side);
    case 'bazaar':
      return bazaar(c, side, op);
    case 'wall':
      if (!(WALL_KINDS as readonly string[]).includes(op.kind)) throw new Error(`No wall kind ${op.kind}`);
      return op.kind === 'mill' ? millWall(c, side, op) : op.kind === 'cutbank' ? cutBank(c, side, op) : op.kind === 'clay-low' ? clayLow(c, side, op) : op.kind === 'boulder-wall' ? boulderWall(c, side, op) : wall(c, side, op);
    case 'kerbside':
      return kerbside(c, side, op);
    case 'waterEdge':
      return waterEdge(c, side, op);
    default:
      throw new Error(`No builder for side op ${op.op}`);
  }
}
