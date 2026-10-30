import { GeoBuilder, mulberry, shade } from '../geo';

/**
 * Distant silhouettes, built once per world into one merged mesh and slid along
 * with the player a little beyond the fog, so they read as hills and skylines
 * on the horizon rather than as scenery you can drive up to. Under a thousand
 * triangles each.
 */
export type SkylineBuilder = (b: GeoBuilder) => void;

/** The y of the top of a granite dome of height h standing at y = -1 (used to seat a tree on its crown). */
const hgtTop = (h: number) => h - 1.6;

export const SKYLINES: Record<string, SkylineBuilder> = {
  /**
   * A flat wet horizon with a tank farm, a gantry crane or two and one slim flare stack
   * with a small orange flame, all hazed by the fog. Industry as skyline only: no smoke
   * plume, no spill, nothing near the road.
   */
  'oil-flares'(b) {
    const r = mulberry(3301);
    const grey = ['#aab4b6', '#9aa6a8', '#b7bfbf'];
    for (let i = 0; i < 6; i++) {
      const x = -120 + i * 36 + r.range(-6, 6);
      const h = r.range(7, 12);
      b.cyl(7, 7, h, r.pick(grey), { x, y: h / 2 - 1, z: r.range(-6, 6) }, 9);
      b.cyl(7.2, 7.2, 0.6, '#8a9496', { x, y: h - 1, z: 0 }, 9);
    }
    for (const x of [-70, 40]) {
      b.box(2, 26, 2, '#8a9496', { x, y: 12, z: -4 });
      b.box(2, 2, 28, '#8a9496', { x, y: 25, z: 4 });
      b.box(1, 10, 1, '#8a9496', { x, y: 20, z: 17 });
    }
    b.cyl(0.9, 1.3, 34, '#8f9696', { x: 85, y: 16, z: -8 }, 6);
    b.cone(1.8, 5.5, '#f0a030', { x: 85, y: 36.5, z: -8 }, 6);
    b.cone(0.9, 3, '#fff0b0', { x: 85, y: 36, z: -8 }, 6);
  },
  /**
   * The Niger's far bank: a long low blue-green ridge of hills across the water, two or
   * three small cranes of the river port, and a faint slim bridge deck on piers. Hazed by the fog.
   */
  'niger-bluffs'(b) {
    const r = mulberry(4401);
    for (let i = 0; i < 7; i++) {
      const x = -170 + i * 56 + r.range(-10, 10);
      b.cap(1, Math.PI / 2, r.pick(['#8da58f', '#97ad98', '#82997f']), { x, y: -1, z: r.range(-8, 6), sx: r.range(26, 44), sy: r.range(7, 13), sz: 12 }, 8);
    }
    b.box(150, 1.4, 3, '#b3bcba', { x: 20, y: 7, z: -10 });
    for (let i = 0; i < 6; i++) b.box(1.6, 8, 1.8, '#a6b0ae', { x: -45 + i * 27, y: 3, z: -10 });
    for (const x of [-95, -78]) {
      b.cyl(0.8, 1.1, 18, '#9aa6a8', { x, y: 8, z: -4 }, 6);
      b.box(1, 1, 16, '#9aa6a8', { x, y: 17, z: 1 });
    }
  },
  /**
   * A flat-topped escarpment seen from the city: three long ridges one behind the other, each a
   * flat-topped frustum, fading from blue-grey to pale. No spire, dome or tower.
   */
  'udi-cuesta'(b) {
    const cols = ['#7e9aa6', '#98afb6', '#b3c3c6'];
    for (let i = 0; i < 3; i++) {
      b.cyl(1, 1.22, 1, cols[i]!, { x: -30 + i * 38, y: 6 + i * 2, z: -26 + i * 10, sx: 110 - i * 14, sy: 16 - i * 3, sz: 12 + i * 3 }, 12);
    }
    for (let i = 0; i < 5; i++) {
      const x = -140 + i * 62;
      b.cyl(1, 1.2, 1, '#a6b5b8', { x, y: 2.5, z: -14, sx: 26, sy: 5, sz: 8 }, 8);
    }
  },
  /**
   * The Jos horizon: a low band of pale roofs, three bare granite domes of different sizes with
   * boulder heaps at their feet, a long flat ridge behind and one slim lattice mast. No spire,
   * dome-on-tower or cross.
   */
  'jos-domes'(b) {
    const r = mulberry(5502);
    b.cap(1, Math.PI / 2, '#9c9892', { x: -50, y: -2, z: 0, sx: 30, sy: 17, sz: 14 }, 12);
    b.cap(1, Math.PI / 2, shade('#9c9892', 0.05), { x: -4, y: -2, z: 3, sx: 22, sy: 12, sz: 11 }, 12);
    b.cap(1, Math.PI / 2, shade('#9c9892', -0.04), { x: 46, y: -2, z: -2, sx: 34, sy: 20, sz: 14 }, 12);
    for (let i = 0; i < 8; i++) b.sphere(r.range(1.6, 3.0), r.pick(['#8d8a84', '#9a968e', '#b8b2a2']), { x: -70 + i * 20 + r.range(-4, 4), y: r.range(1, 4), z: r.range(-2, 3), sy: 0.7 }, 6);
    b.box(150, 3.2, 3, '#d8cfb8', { x: 0, y: 1.4, z: 8 });
    for (let i = 0; i < 14; i++) b.box(r.range(6, 11), r.range(2.5, 4.2), 3, r.pick(['#c9c3b0', '#d8cdb4', '#a8adb0']), { x: -66 + i * 10, y: 1.5, z: r.range(6, 12) });
    b.cyl(0.08, 0.5, 26, '#8a8f99', { x: 20, y: 13, z: 6 }, 4);
    for (let i = 0; i < 5; i++) {
      const x = -170 + i * 78 + r.range(-10, 10);
      b.cyl(1, 1.2, 1, r.pick(['#a9b4b6', '#b3bcbe']), { x, y: 3, z: -16, sx: 34, sy: 6, sz: 9 }, 8);
    }
  },
  /**
   * Bauchi's horizon: nine bare rock hills of different heights scattered across the haze, a few
   * with boulder heaps at their feet and one with a small tank on its crown, a low band of pale
   * roofs, and a thin broken line of baobab and neem crowns. No tower, spire or dome.
   */
  'bauchi-hills'(b) {
    const r = mulberry(9904);
    const hills: [number, number, number][] = [[-170, 12, 22], [-132, 18, 28], [-96, 9, 18], [-58, 15, 24], [-20, 10, 20], [22, 20, 30], [66, 11, 20], [104, 16, 26], [146, 8, 16]];
    hills.forEach(([x, hgt, wd], i) => b.cap(1, Math.PI / 2, i % 2 ? '#a79d8c' : '#968d7e', { x, y: -1, z: -6 - (i % 3) * 5, sx: wd * 1.5, sy: hgt, sz: wd }, 10));
    for (let i = 0; i < 9; i++) b.sphere(r.range(1.6, 2.8), r.pick(['#8d8a84', '#9a968e', '#b8b2a2']), { x: -150 + i * 36 + r.range(-6, 6), y: r.range(1, 3), z: r.range(-3, 2), sy: 0.7 }, 6);
    b.cyl(1.0, 1.0, 1.4, '#b9bec0', { x: 22, y: hgtTop(20) + 1.1, z: -16 }, 8);
    for (let i = 0; i < 24; i++) b.box(r.range(6, 10), r.range(1, 2.2), r.range(5, 8), r.pick(['#d8cdb4', '#c9b58a', '#bdb8aa', '#a8adb0']), { x: -120 + i * 10 + r.range(-2, 2), y: 2.2, z: r.range(4, 10) });
    for (let i = 0; i < 14; i++) {
      const x = -150 + i * 22 + r.range(-6, 6);
      const h = r.range(3.5, 5.5);
      b.cyl(0.25, 0.4, h, '#8a7a5a', { x, y: h / 2, z: r.range(-2, 2) }, 5);
      b.sphere(r.range(2.2, 3.2), r.pick(['#8da36a', '#7f9560', '#98ab76']), { x, y: h + 0.5, z: r.range(-2, 2), sy: 0.4 }, 6);
    }
  },
  /**
   * Sokoto's flat horizon: a very low pale dune ridge, a thin broken line of deleb and date palm
   * crowns on tall slim trunks, a low band of pale flat roofs and a faint river-silt strip, all in
   * haze. No hills, tower or dome.
   */
  'sokoto-plain'(b) {
    const r = mulberry(9905);
    for (let i = 0; i < 6; i++) {
      const x = -180 + i * 64 + r.range(-12, 12);
      b.cap(1, Math.PI / 2, r.pick(['#dccfae', '#d4c6a2', '#e0d4b6']), { x, y: -1, z: r.range(-14, -6), sx: r.range(34, 56), sy: r.range(2, 4), sz: 10 }, 8);
    }
    for (let i = 0; i < 28; i++) b.box(r.range(5, 9), r.range(0.8, 1.8), r.range(4, 7), r.pick(['#e0d2b4', '#d2bf98', '#c9b58a', '#bdb8aa']), { x: -125 + i * 9.4 + r.range(-2, 2), y: 1.6, z: r.range(-8, -3) });
    b.box(170, 0.2, 5, '#a8b49a', { x: 0, y: 0.1, z: -4 });
    for (let i = 0; i < 15; i++) {
      const x = -150 + i * 21 + r.range(-6, 6);
      const h = r.range(5.5, 8.5);
      b.cyl(0.16, 0.26, h, '#8a7a5a', { x, y: h / 2, z: r.range(-6, -2) }, 5);
      for (let k = 0; k < 4; k++) b.cone(0.3, 2.4, '#6f8a3c', { x: x + Math.cos(k * 1.6) * 0.9, y: h + 0.3, z: -4 + Math.sin(k * 1.6) * 0.9, rx: Math.sin(k * 1.6) * 1.1, rz: -Math.cos(k * 1.6) * 1.1 }, 4);
    }
  },
  /**
   * Akwa Ibom's horizon: a low dark-green forest line of rounded canopy crowns, slim raffia
   * palms standing out of it, a band of pale roofs, one far flat flyover deck on piers and a
   * pale banded sky of haze. No rig, flare, tower or dome.
   */
  'ibom-treeline'(b) {
    const r = mulberry(9906);
    for (let i = 0; i < 9; i++) {
      const x = -170 + i * 44 + r.range(-8, 8);
      b.cap(1, Math.PI / 2, r.pick(['#4f7a52', '#5a8458', '#466f4c']), { x, y: -1, z: r.range(-14, -6), sx: r.range(34, 52), sy: r.range(5, 9), sz: 11 }, 8);
    }
    for (let i = 0; i < 22; i++) b.box(r.range(5, 9), r.range(1, 2.4), r.range(4, 7), r.pick(['#e0dac8', '#cfc9b6', '#b9b3a2', '#a8adb0']), { x: -105 + i * 9.6 + r.range(-2, 2), y: 2, z: r.range(-6, -1) });
    b.box(64, 1.1, 3, '#c9c4b6', { x: 70, y: 4.6, z: -12 });
    for (let i = 0; i < 5; i++) b.box(1.4, 4.4, 1.6, '#bcb7a8', { x: 46 + i * 12.5, y: 2.2, z: -12 });
    for (let i = 0; i < 16; i++) {
      const x = -150 + i * 19 + r.range(-6, 6);
      const h = r.range(6, 9);
      b.cyl(0.14, 0.22, h, '#7a6a4a', { x, y: h / 2, z: r.range(-6, -2) }, 5);
      for (let k = 0; k < 6; k++) b.cone(0.22, 2.6, '#5f7a35', { x: x + Math.cos(k * 1.05) * 0.8, y: h + 0.4, z: -4 + Math.sin(k * 1.05) * 0.8, rx: Math.sin(k * 1.05) * 1.2, rz: -Math.cos(k * 1.05) * 1.2 }, 4);
    }
  },
  /**
   * Imo's horizon: a low rolling ridge of red earth in haze, rows of oil-palm crowns on slim
   * trunks across it, a band of pale roofs and three slim pale hotel blocks standing above them.
   * No tower, spire, dome or rig.
   */
  'imo-palms'(b) {
    const r = mulberry(9907);
    for (let i = 0; i < 7; i++) {
      const x = -175 + i * 58 + r.range(-8, 8);
      b.cap(1, Math.PI / 2, r.pick(['#a47a5e', '#9a7054', '#b08a6c']), { x, y: -1, z: r.range(-16, -8), sx: r.range(40, 62), sy: r.range(4, 8), sz: 12 }, 8);
    }
    for (let i = 0; i < 22; i++) b.box(r.range(5, 9), r.range(1, 2.2), r.range(4, 7), r.pick(['#e0d6c0', '#cfc3aa', '#b9b09a', '#a8adb0']), { x: -105 + i * 9.6 + r.range(-2, 2), y: 2, z: r.range(-6, -1) });
    for (const [x, h] of [[-40, 14], [8, 18], [52, 11]] as const) {
      b.box(7, h, 7, '#dcd6c4', { x, y: h / 2, z: -8 });
      b.box(7.2, 0.5, 7.2, '#9a968b', { x, y: h + 0.25, z: -8 });
    }
    for (let i = 0; i < 18; i++) {
      const x = -160 + i * 18 + r.range(-6, 6);
      const h = r.range(5, 8);
      b.cyl(0.18, 0.28, h, '#7a6a4a', { x, y: h / 2, z: r.range(-5, -2) }, 5);
      for (let k = 0; k < 6; k++) b.cone(0.22, 2.4, '#5a7a38', { x: x + Math.cos(k * 1.05) * 0.8, y: h + 0.3, z: -3.5 + Math.sin(k * 1.05) * 0.8, rx: Math.sin(k * 1.05) * 1.2, rz: -Math.cos(k * 1.05) * 1.2 }, 4);
    }
  },
  /**
   * Benue's horizon: a low blue-grey ridge of hills with a smaller one in front, a long line of
   * mango and shea crowns on a pale grass plain, a band of pale and zinc roofs and a faint thin
   * steel bridge span in haze. No tower, spire, herd or flag.
   */
  'benue-hills'(b) {
    const r = mulberry(9917);
    for (const [x, w, h, c] of [[-100, 70, 12, '#8fa3b2'], [30, 80, 15, '#9bb0bc'], [140, 50, 9, '#a4b6c0']] as const) b.cap(1, Math.PI / 2, c, { x, y: -1, z: -22, sx: w, sy: h, sz: 14 }, 8);
    for (let i = 0; i < 6; i++) b.cap(1, Math.PI / 2, r.pick(['#a8b070', '#b4ba7e', '#9ea868']), { x: -175 + i * 62 + r.range(-8, 8), y: -1, z: r.range(-14, -8), sx: r.range(40, 60), sy: r.range(2, 4), sz: 10 }, 8);
    for (let i = 0; i < 20; i++) b.box(r.range(5, 9), r.range(1, 2.0), r.range(4, 7), r.pick(['#e0d6c0', '#cfc3aa', '#98948a', '#c8bc9a']), { x: -105 + i * 10.4 + r.range(-2, 2), y: 1.8, z: r.range(-5, -1) });
    for (let i = 0; i < 20; i++) {
      const x = -160 + i * 16 + r.range(-5, 5);
      const h = r.range(3.5, 5.5);
      b.cyl(0.16, 0.24, h, '#6a5a3e', { x, y: h / 2, z: r.range(-6, -3) }, 5);
      b.sphere(r.range(1.8, 2.8), r.pick(['#5a7a3a', '#6a8a42', '#4f7035']), { x, y: h + 0.5, z: r.range(-6, -3), sy: 0.7 }, 5);
    }
    b.box(54, 0.5, 1.4, '#9aa0a4', { x: 60, y: 5.6, z: -9 });
    for (let i = 0; i < 6; i++) b.box(0.4, 2.6, 0.4, '#9aa0a4', { x: 36 + i * 9.5, y: 4.3, z: -9 });
  },
  /**
   * Abia's horizon: a flat wet plain with a long low band of saw-tooth shed roofs, a few slim
   * lamp masts, a row of oil-palm crowns, three pale plaza blocks and a thin line of far trees.
   * No tower, chimney smoke, flare, spire or flag.
   */
  'abia-sheds'(b) {
    const r = mulberry(9915);
    for (let i = 0; i < 6; i++) b.cap(1, Math.PI / 2, r.pick(['#a8b09a', '#b4bca6', '#9fa892']), { x: -175 + i * 62 + r.range(-8, 8), y: -1, z: -16, sx: r.range(40, 60), sy: r.range(3, 5), sz: 10 }, 8);
    for (let i = 0; i < 26; i++) {
      const x = -125 + i * 9.8 + r.range(-1.5, 1.5);
      b.prism(r.range(6, 9), r.range(1.2, 2.2), r.range(5, 8), r.pick(['#98948a', '#a8a49a', '#8a8f90', '#b4b0a4']), { x, y: 1.4, z: r.range(-6, -2) });
    }
    for (const [x, h] of [[-60, 13], [-5, 10], [50, 15]] as const) {
      b.box(7, h, 7, '#dcd6c4', { x, y: h / 2, z: -9 });
      b.box(7.2, 0.5, 7.2, '#9a968b', { x, y: h + 0.25, z: -9 });
    }
    for (const x of [-95, -30, 25, 85]) {
      b.cyl(0.18, 0.24, 14, '#8a8f90', { x, y: 7, z: -4 }, 5);
      b.box(2.4, 0.3, 0.6, '#d8d4c0', { x, y: 14, z: -4 });
    }
    for (let i = 0; i < 18; i++) {
      const x = -160 + i * 18 + r.range(-6, 6);
      const h = r.range(5, 8);
      b.cyl(0.18, 0.28, h, '#7a6a4a', { x, y: h / 2, z: r.range(-5, -2) }, 5);
      for (let k = 0; k < 6; k++) b.cone(0.22, 2.4, '#5a7a38', { x: x + Math.cos(k * 1.05) * 0.8, y: h + 0.3, z: -3.5 + Math.sin(k * 1.05) * 0.8, rx: Math.sin(k * 1.05) * 1.2, rz: -Math.cos(k * 1.05) * 1.2 }, 4);
    }
  },
  /**
   * Cross River's horizon: a low blue-grey hill behind a long dark band of rainforest canopy, a
   * band of tin and pale roofs, tall oil and raffia palms, one grey harbour crane and mast lights.
   * Nothing stands on the hill (no tower, mast, building or flag).
   */
  'calabar-canopy'(b) {
    const r = mulberry(9951);
    b.cap(1, Math.PI / 2, '#8fa6b4', { x: 20, y: -1, z: -24, sx: 90, sy: 14, sz: 14 }, 8);
    for (let i = 0; i < 8; i++) {
      const x = -175 + i * 50 + r.range(-8, 8);
      b.cap(1, Math.PI / 2, r.pick(['#2f5d3a', '#3a6a40', '#28502f']), { x, y: -1, z: r.range(-16, -8), sx: r.range(36, 56), sy: r.range(5, 9), sz: 12 }, 8);
    }
    for (let i = 0; i < 24; i++) b.box(r.range(5, 9), r.range(1, 2.0), r.range(4, 7), r.pick(['#e6dcc6', '#cfc8b4', '#98948a', '#a4a8aa', '#b8b0a0']), { x: -110 + i * 9.4 + r.range(-2, 2), y: 1.8, z: r.range(-6, -1) });
    for (let i = 0; i < 20; i++) {
      const x = -165 + i * 17 + r.range(-4, 4);
      const h = r.range(5, 8);
      b.cyl(0.14, 0.22, h, '#6a5a44', { x, y: h / 2, z: r.range(-7, -3) }, 5);
      for (let k = 0; k < 6; k++) b.cone(0.22, 2.4, '#4a7a38', { x: x + Math.cos(k * 1.05) * 0.8, y: h + 0.3, z: -5 + Math.sin(k * 1.05) * 0.8, rx: Math.sin(k * 1.05) * 1.2, rz: -Math.cos(k * 1.05) * 1.2 }, 4);
    }
    b.box(1.2, 14, 1.2, '#8a8f90', { x: 60, y: 7, z: -5 });
    b.box(14, 0.8, 1.0, '#8a8f90', { x: 66, y: 14.2, z: -5 });
    for (const x of [-120, -40, 30, 100]) {
      b.cyl(0.16, 0.22, 13, '#8a8f90', { x, y: 6.5, z: -3 }, 5);
      b.box(2.4, 0.3, 0.6, '#d8d4c0', { x, y: 13, z: -3 });
    }
  },
  /**
   * Jigawa's horizon: a low pale dune ridge, three rounded granite domes of different sizes
   * rising out of it, a thin band of date-palm and neem crowns, a band of flat pale roofs and
   * a faint rail gantry. Nothing stands on any dome (no tower, palace, minaret or flag).
   */
  'jigawa-inselbergs'(b) {
    const r = mulberry(9941);
    for (let i = 0; i < 6; i++) {
      const x = -170 + i * 64 + r.range(-8, 8);
      b.cap(1, Math.PI / 2, r.pick(['#d8c49a', '#cfba8e', '#dcc9a0']), { x, y: -1, z: r.range(-14, -8), sx: r.range(44, 66), sy: r.range(2.5, 4.5), sz: 12 }, 8);
    }
    for (const [x, w, h, c] of [[-110, 22, 12, '#9a9c96'], [-10, 30, 18, '#8e908a'], [95, 20, 9, '#a0a29c']] as const) b.cap(1, Math.PI / 2, c, { x, y: -1, z: -16, sx: w, sy: h, sz: 12 }, 10);
    for (let i = 0; i < 22; i++) b.box(r.range(5, 9), r.range(1, 1.8), r.range(4, 7), r.pick(['#e6d8b8', '#d6c49a', '#c9ab7a', '#b8a888']), { x: -105 + i * 9.6 + r.range(-2, 2), y: 1.6, z: r.range(-5, -1) });
    for (let i = 0; i < 18; i++) {
      const x = -160 + i * 19 + r.range(-4, 4);
      const h = r.range(4, 6.5);
      b.cyl(0.12, 0.2, h, '#6a5a44', { x, y: h / 2, z: r.range(-6, -3) }, 5);
      for (let k = 0; k < 5; k++) b.cone(0.25, 2.2, '#5a7a38', { x: x + Math.cos(k * 1.26) * 0.7, y: h + 0.2, z: -4 + Math.sin(k * 1.26) * 0.7, rx: Math.sin(k * 1.26) * 1.2, rz: -Math.cos(k * 1.26) * 1.2 }, 4);
    }
    b.box(60, 0.15, 0.15, '#6a6e72', { x: 70, y: 8.6, z: -10 });
    for (let i = 0; i < 3; i++) b.box(0.2, 2, 0.2, '#6a6e72', { x: 45 + i * 25, y: 7.6, z: -10 });
  },
  /**
   * Adamawa's horizon: a long grey granite ridge with one high bare peak behind it, a lower
   * ochre foothill band, a band of pale and zinc roofs, baobabs and acacia crowns, a few mast
   * lights. Nothing stands on any hill (no building, tower, palace, wall or flag).
   */
  'adamawa-mandara'(b) {
    const r = mulberry(9931);
    for (const [x, w, h, c] of [[-120, 70, 16, '#9a9c96'], [-30, 60, 22, '#8e908a'], [60, 56, 46, '#868882'], [135, 66, 18, '#a0a29c']] as const) b.cap(1, Math.PI / 2, c, { x, y: -1, z: -20, sx: w, sy: h, sz: 14 }, 10);
    for (let i = 0; i < 8; i++) {
      const x = -175 + i * 50 + r.range(-8, 8);
      b.cap(1, Math.PI / 2, r.pick(['#b09468', '#a88a5e', '#b8a070']), { x, y: -1, z: r.range(-14, -8), sx: r.range(34, 52), sy: r.range(3, 6), sz: 10 }, 8);
    }
    for (let i = 0; i < 22; i++) b.box(r.range(5, 9), r.range(1, 2.0), r.range(4, 7), r.pick(['#e6dcc6', '#d6c8a8', '#98948a', '#a4a8aa', '#c9b88c']), { x: -105 + i * 9.6 + r.range(-2, 2), y: 1.8, z: r.range(-5, -1) });
    for (let i = 0; i < 16; i++) {
      const x = -160 + i * 21 + r.range(-5, 5);
      const h = r.range(3.5, 5.5);
      b.cyl(i % 5 === 0 ? 0.5 : 0.14, i % 5 === 0 ? 0.7 : 0.2, i % 5 === 0 ? h - 0.5 : h, '#6a5a44', { x, y: h / 2, z: r.range(-6, -3) }, 5);
      b.sphere(i % 5 === 0 ? 2.4 : r.range(1.3, 2.0), r.pick(['#6a7a3c', '#7a8a46', '#5a6a34']), { x, y: h + 0.5, z: r.range(-6, -3), sy: 0.7 }, 5);
    }
    for (const x of [-95, -25, 40, 110]) {
      b.cyl(0.16, 0.22, 13, '#8a8f90', { x, y: 6.5, z: -3 }, 5);
      b.box(2.4, 0.3, 0.6, '#d8d4c0', { x, y: 13, z: -3 });
    }
  },
  /**
   * The capital's horizon: a far granite ridge in blue-grey, a long band of mid-rise blocks in
   * pale concrete with a few taller slabs and glass-blue towers, a line of leafy trees, and
   * mast lights. Generic: no dome, minaret, spire, hall, villa or flag, and nothing on the ridge.
   */
  'fct-capital'(b) {
    const r = mulberry(9941);
    for (const [x, w, h, c] of [[-130, 80, 12, '#8e98a2'], [-20, 70, 18, '#848e98'], [95, 90, 14, '#939ca5']] as const) b.cap(1, Math.PI / 2, c, { x, y: -1, z: -22, sx: w, sy: h, sz: 14 }, 10);
    for (let i = 0; i < 26; i++) {
      const tall = i % 7 === 3;
      const h = tall ? r.range(11, 17) : r.range(3.5, 8);
      b.box(r.range(5, 8.5), h, r.range(4.5, 7), r.pick(tall ? ['#aab6be', '#9aa9b4', '#cfd4d6'] : ['#ece9e2', '#d6d3cb', '#cfd4d6', '#e0ddd5']), { x: -118 + i * 9.2 + r.range(-2, 2), y: h / 2 - 0.4, z: r.range(-9, -2) });
    }
    for (let i = 0; i < 14; i++) {
      const x = -150 + i * 23 + r.range(-5, 5);
      const h = r.range(3.5, 5.5);
      b.cyl(0.14, 0.2, h, '#6a5a44', { x, y: h / 2, z: r.range(-5, -2) }, 5);
      b.sphere(r.range(1.4, 2.1), r.pick(['#5f7a3c', '#6f8a46', '#527034']), { x, y: h + 0.5, z: r.range(-5, -2), sy: 0.75 }, 5);
    }
    for (const x of [-85, -15, 55, 120]) {
      b.cyl(0.16, 0.22, 12, '#8a8f90', { x, y: 6, z: -2 }, 5);
      b.box(2.4, 0.3, 0.6, '#d8d8d2', { x, y: 12, z: -2 });
    }
  },
  /**
   * Osun's horizon: a low rolling line of forest-savanna canopy in two greens, a long band of pale
   * and zinc roofs, a few tall oil palms, the frame of a ring-road flyover, mast lights and a
   * faint rail gantry. No tower, dome, spire, grove, shrine, palace or flag.
   */
  'osun-forest'(b) {
    const r = mulberry(9921);
    for (let i = 0; i < 8; i++) {
      const x = -175 + i * 50 + r.range(-8, 8);
      b.cap(1, Math.PI / 2, r.pick(['#4f6f3a', '#5e7a3a', '#46663a']), { x, y: -1, z: r.range(-16, -8), sx: r.range(34, 54), sy: r.range(4, 8), sz: 12 }, 8);
    }
    for (let i = 0; i < 24; i++) b.box(r.range(5, 9), r.range(1, 2.2), r.range(4, 7), r.pick(['#e6dcc6', '#d6ccb2', '#98948a', '#a4a8aa', '#b4a89a']), { x: -110 + i * 9.4 + r.range(-2, 2), y: 1.9, z: r.range(-6, -1) });
    for (let i = 0; i < 20; i++) {
      const x = -165 + i * 16 + r.range(-4, 4);
      const h = r.range(4.5, 7.5);
      b.cyl(0.14, 0.22, h, '#6a5a44', { x, y: h / 2, z: r.range(-7, -3) }, 5);
      b.sphere(r.range(1.5, 2.3), r.pick(['#3f6b3a', '#4a7a42', '#365e34']), { x, y: h + 0.6, z: r.range(-7, -3), sy: 0.8 }, 5);
    }
    b.box(40, 1, 2.6, '#b4b0a4', { x: -60, y: 6.0, z: -4 });
    for (let i = 0; i < 4; i++) b.box(1.2, 6, 1.4, '#a8a498', { x: -76 + i * 10, y: 3, z: -4 });
    for (const x of [-120, -40, 30, 100]) {
      b.cyl(0.16, 0.22, 13, '#8a8f90', { x, y: 6.5, z: -3 }, 5);
      b.box(2.4, 0.3, 0.6, '#d8d4c0', { x, y: 13, z: -3 });
    }
    b.box(60, 0.15, 0.15, '#6a6e72', { x: 70, y: 8.6, z: -10 });
    for (let i = 0; i < 3; i++) b.box(0.2, 2, 0.2, '#6a6e72', { x: 45 + i * 25, y: 7.6, z: -10 });
  },
  /**
   * Ondo's horizon: two big bare grey granite domes and one smaller, a band of dark cocoa and
   * forest canopy across their feet and a band of pale and zinc roofs in front. Nothing stands on
   * or beside any dome (no tower, building, shrine or flag).
   */
  'ondo-inselbergs'(b) {
    const r = mulberry(9913);
    for (const [x, w, h, c] of [[-95, 40, 24, '#9a9c96'], [-20, 30, 17, '#a6a8a2'], [70, 46, 30, '#92948e']] as const) b.cap(1, Math.PI / 2, c, { x, y: -1, z: -18, sx: w, sy: h, sz: 16 }, 10);
    for (let i = 0; i < 8; i++) {
      const x = -175 + i * 50 + r.range(-8, 8);
      b.cap(1, Math.PI / 2, r.pick(['#3a5f34', '#44703c', '#325630']), { x, y: -1, z: r.range(-12, -6), sx: r.range(30, 48), sy: r.range(4, 7), sz: 10 }, 8);
    }
    for (let i = 0; i < 22; i++) b.box(r.range(5, 9), r.range(1, 2.0), r.range(4, 7), r.pick(['#e0d6c0', '#cfc3aa', '#98948a', '#a4a8aa']), { x: -105 + i * 9.6 + r.range(-2, 2), y: 1.8, z: r.range(-5, -1) });
    for (let i = 0; i < 22; i++) {
      const x = -160 + i * 15 + r.range(-4, 4);
      const h = r.range(3.5, 5.5);
      b.cyl(0.14, 0.2, h, '#5a4a38', { x, y: h / 2, z: r.range(-6, -3) }, 5);
      b.sphere(r.range(1.4, 2.2), r.pick(['#3a6a38', '#468040', '#2f5a30']), { x, y: h + 0.6, z: r.range(-6, -3), sy: 0.8 }, 5);
    }
  },
  /**
   * Edo's horizon: a low rolling ridge of red earth, a long tree-lined bank in front of it with a
   * dark band of rubber-tree crowns, a band of pale and zinc roofs, two far blue hills and the
   * grey frame of a flyover going up. No tower, spire, dome, palace or flag.
   */
  'edo-rubber'(b) {
    const r = mulberry(9911);
    for (let i = 0; i < 2; i++) b.cap(1, Math.PI / 2, i ? '#8fa6b4' : '#9bb0bc', { x: -90 + i * 150, y: -1, z: -22, sx: 60, sy: 14, sz: 14 }, 8);
    for (let i = 0; i < 7; i++) {
      const x = -175 + i * 58 + r.range(-8, 8);
      b.cap(1, Math.PI / 2, r.pick(['#9a6048', '#8a5440', '#a86c52']), { x, y: -1, z: r.range(-16, -8), sx: r.range(40, 62), sy: r.range(4, 7), sz: 12 }, 8);
    }
    for (let i = 0; i < 22; i++) b.box(r.range(5, 9), r.range(1, 2.2), r.range(4, 7), r.pick(['#e0d6c0', '#cfc3aa', '#b9b09a', '#98948a']), { x: -105 + i * 9.6 + r.range(-2, 2), y: 2, z: r.range(-6, -1) });
    for (let i = 0; i < 26; i++) {
      const x = -165 + i * 13 + r.range(-4, 4);
      const h = r.range(4, 6.5);
      b.cyl(0.14, 0.2, h, '#6a5a44', { x, y: h / 2, z: r.range(-6, -3) }, 5);
      b.sphere(r.range(1.4, 2.2), r.pick(['#3f6b3a', '#4a7a42', '#365e34']), { x, y: h + 0.6, z: r.range(-6, -3), sy: 0.8 }, 5);
    }
    b.box(46, 1, 2.6, '#b4b0a4', { x: 70, y: 6.2, z: -4 });
    for (let i = 0; i < 4; i++) b.box(1.2, 6, 1.4, '#a8a498', { x: 52 + i * 12, y: 3, z: -4 });
  },
  /**
   * Katsina's flat horizon: a thin broken line of faidherbia crowns, a very low pale dune ridge,
   * a faint low red wall strip and a distant flat flyover deck on piers, all in haze.
   */
  'katsina-flat'(b) {
    const r = mulberry(9902);
    for (let i = 0; i < 6; i++) {
      const x = -180 + i * 64 + r.range(-12, 12);
      b.cap(1, Math.PI / 2, r.pick(['#d3c8b4', '#cdbfa8', '#d9cdb8']), { x, y: -1, z: r.range(-14, -6), sx: r.range(34, 56), sy: r.range(2, 4), sz: 10 }, 8);
    }
    b.box(70, 3.4, 2.4, '#b98a76', { x: -60, y: 1.7, z: -8 });
    b.box(60, 1.1, 3, '#c9c4b6', { x: 70, y: 4.6, z: -10 });
    for (let i = 0; i < 5; i++) b.box(1.4, 4.4, 1.6, '#bcb7a8', { x: 46 + i * 12, y: 2.2, z: -10 });
    for (let i = 0; i < 16; i++) {
      const x = -150 + i * 19 + r.range(-6, 6);
      const h = r.range(3.5, 5.5);
      b.cyl(0.2, 0.32, h, '#8a7a5a', { x, y: h / 2, z: r.range(-6, -2) }, 5);
      b.sphere(r.range(2.2, 3.4), r.pick(['#8da36a', '#7f9560', '#98ab76']), { x, y: h + 0.5, z: r.range(-6, -2), sy: 0.35 }, 6);
    }
  },
  /**
   * Ogun's horizon: a band of zinc and rust roofs, six bare grey granite domes of different
   * sizes standing out of it (one with a single dark tree), two pale silos and a plain chimney
   * far off (no smoke), all in haze. Nothing on or beside any dome.
   */
  'ogun-domes'(b) {
    const r = mulberry(9903);
    for (let i = 0; i < 26; i++) {
      const x = -120 + i * 9.6 + r.range(-2, 2);
      b.box(r.range(6, 10), r.range(0.6, 1.4), r.range(5, 9), r.pick(['#9ea5a8', '#8e5038', '#c3c8ca', '#7a4a36', '#a0654a']), { x, y: 3 + r.range(0, 2), z: r.range(0, 8), rz: r.range(-0.1, 0.1) });
    }
    const domes: [number, number, number][] = [[-90, 16, 12], [-48, 11, 9], [-8, 20, 14], [34, 9, 8], [64, 14, 11], [104, 10, 9]];
    domes.forEach(([x, hgt, wd], i) => b.cap(1, Math.PI / 2, i % 2 ? '#a29b92' : '#8d8a84', { x, y: -1, z: -2 - (i % 3) * 2, sx: wd * 1.5, sy: hgt, sz: wd }, 10));
    b.cyl(0.12, 0.16, 3, '#5b4631', { x: -8, y: hgtTop(20), z: -4 }, 4);
    b.sphere(1.3, '#2f4a34', { x: -8, y: hgtTop(20) + 2, z: -4, sy: 0.8 }, 5);
    for (const x of [140, 146]) b.cyl(2, 2, 14, '#e4e6e4', { x, y: 7, z: -12 }, 8);
    b.cyl(0.6, 0.9, 22, '#b8b6ae', { x: 152, y: 11, z: -12 }, 6);
    for (let i = 0; i < 5; i++) b.cap(1, Math.PI / 2, r.pick(['#9aa6ab', '#a4aeb2']), { x: -170 + i * 78 + r.range(-8, 8), y: -1, z: -18, sx: 34, sy: 5, sz: 9 }, 8);
  },
  /**
   * A flat, empty horizon: a thin broken line of low neem and acacia crowns and a very low
   * pale dune ridge, all dissolving into haze. No hills, no towers.
   */
  'chad-plain'(b) {
    const r = mulberry(9901);
    for (let i = 0; i < 6; i++) {
      const x = -180 + i * 64 + r.range(-12, 12);
      b.cap(1, Math.PI / 2, r.pick(['#d3c8a8', '#cdbf9c', '#d9cfb0']), { x, y: -1, z: r.range(-12, -4), sx: r.range(34, 56), sy: r.range(2, 4), sz: 10 }, 8);
    }
    for (let i = 0; i < 18; i++) {
      const x = -150 + i * 17 + r.range(-6, 6);
      const h = r.range(3, 5);
      b.cyl(0.25, 0.35, h, '#8a7a5a', { x, y: h / 2, z: r.range(-8, -2) }, 5);
      b.sphere(r.range(2, 3.2), r.pick(['#8da36a', '#7f9560', '#98ab76']), { x, y: h + 0.8, z: r.range(-8, -2), sy: 0.55 }, 6);
    }
  },
  /**
   * A hill carpeted with tilted rust-brown roof planes, stepping down toward the viewer, with a
   * single slim tower slab standing out of them and a low far ridge behind. Hazed by the fog.
   */
  'ibadan-roofsea'(b) {
    const r = mulberry(8801);
    b.cap(1, Math.PI / 2, '#9a6648', { x: 0, y: -3, z: 6, sx: 120, sy: 22, sz: 26 }, 10);
    const roofs = ['#9a4b2e', '#8a5a3c', '#a77052', '#6b3a28', '#8f9699'];
    for (let i = 0; i < 70; i++) {
      const x = r.range(-95, 95);
      const k = 1 - Math.abs(x) / 110;
      const y = 4 + k * 17 * r.range(0.6, 1.0);
      b.box(r.range(9, 16), 0.6, r.range(8, 14), r.pick(roofs), { x, y, z: r.range(-10, 6), rz: r.range(-0.2, 0.2), rx: r.range(-0.15, 0.15) });
    }
    b.box(5, 46, 5, '#d8d2c2', { x: 12, y: 22, z: -4 });
    b.box(5.6, 1, 5.6, '#bcb6a6', { x: 12, y: 45.5, z: -4 });
    for (let i = 0; i < 6; i++) {
      const x = -170 + i * 62 + r.range(-10, 10);
      b.cap(1, Math.PI / 2, r.pick(['#9aa6ab', '#a4aeb2', '#8f9ca2']), { x, y: -1, z: r.range(-16, -10), sx: r.range(28, 46), sy: r.range(5, 9), sz: 10 }, 8);
    }
  },
  /**
   * One granite inselberg of two rounded cones joined by a saddle, with a heap of boulders at
   * its foot, over a low hazed ridge. A natural landform only: no structure on it. Hazed by the fog.
   */
  'sobi-twin-cone'(b) {
    const r = mulberry(7701);
    b.cap(1, Math.PI / 2, '#8e8a84', { x: -34, y: -2, z: 0, sx: 22, sy: 26, sz: 14 }, 12);
    b.cap(1, Math.PI / 2, shade('#8e8a84', 0.05), { x: -8, y: -2, z: 2, sx: 18, sy: 21, sz: 12 }, 12);
    b.box(14, 8, 8, '#98948c', { x: -21, y: 8, z: 1 });
    for (let i = 0; i < 6; i++) b.sphere(r.range(2, 3.6), r.pick(['#8d8a84', '#9a968e']), { x: -50 + i * 8 + r.range(-2, 2), y: r.range(1, 5), z: -1, sy: 0.7 }, 6);
    for (let i = 0; i < 7; i++) {
      const x = -170 + i * 56 + r.range(-10, 10);
      b.cap(1, Math.PI / 2, r.pick(['#9aa6ab', '#a4aeb2', '#8f9ca2']), { x, y: -1, z: r.range(-14, -6), sx: r.range(26, 44), sy: r.range(5, 9), sz: 10 }, 8);
    }
  },
  /**
   * The Delta horizon: a long low blue-green far bank across the river with two port cranes
   * and a faint slim bridge deck on piers, and at the other end a tank farm with one slim
   * flare stack, all hazed by the fog. Industry as skyline only.
   */
  'delta-horizon'(b) {
    const r = mulberry(6601);
    for (let i = 0; i < 6; i++) {
      const x = -190 + i * 52 + r.range(-8, 8);
      b.cap(1, Math.PI / 2, r.pick(['#8da58f', '#97ad98', '#82997f']), { x, y: -1, z: r.range(-8, 6), sx: r.range(24, 40), sy: r.range(6, 11), sz: 12 }, 8);
    }
    b.box(110, 1.2, 3, '#b3bcba', { x: -70, y: 6, z: -12 });
    for (let i = 0; i < 4; i++) b.box(1.6, 7, 1.8, '#a6b0ae', { x: -110 + i * 28, y: 2.5, z: -12 });
    for (const x of [-30, -16]) {
      b.cyl(0.8, 1.1, 16, '#9aa6a8', { x, y: 7, z: -4 }, 6);
      b.box(1, 1, 14, '#9aa6a8', { x, y: 15, z: 1 });
    }
    for (let i = 0; i < 4; i++) {
      const h = r.range(6, 9);
      b.cyl(6, 6, h, r.pick(['#aab4b6', '#9aa6a8', '#b7bfbf']), { x: 40 + i * 24, y: h / 2 - 1, z: r.range(-6, 4) }, 9);
    }
    b.cyl(0.9, 1.3, 30, '#8f9696', { x: 150, y: 14, z: -8 }, 6);
    b.cone(1.6, 5, '#f0a030', { x: 150, y: 32, z: -8 }, 6);
    b.cone(0.8, 2.6, '#fff0b0', { x: 150, y: 31.6, z: -8 }, 6);
  },
  /**
   * Granite inselbergs standing out of a wide plain: two big pale domes with a few rounded
   * boulder heaps on their flanks, and a low blue-grey ridge behind. Hazed by the fog.
   */
  'inselberg-ridge'(b) {
    const r = mulberry(5501);
    b.cap(1, Math.PI / 2, '#a09c94', { x: -40, y: -2, z: 0, sx: 38, sy: 22, sz: 14 }, 12);
    b.cap(1, Math.PI / 2, shade('#a09c94', 0.06), { x: 38, y: -2, z: 4, sx: 26, sy: 15, sz: 10 }, 10);
    for (let i = 0; i < 6; i++) b.sphere(r.range(2, 4), r.pick(['#8d8a84', '#9a968e']), { x: -62 + i * 9 + r.range(-3, 3), y: r.range(2, 10), z: -2, sy: 0.7 }, 6);
    for (let i = 0; i < 7; i++) {
      const x = -170 + i * 56 + r.range(-10, 10);
      b.cap(1, Math.PI / 2, r.pick(['#9aa6ab', '#a4aeb2', '#8f9ca2']), { x, y: -1, z: r.range(-14, -6), sx: r.range(28, 46), sy: r.range(6, 10), sz: 10 }, 8);
    }
  },
  /**
   * One bare red laterite mound that stands over a flat horizon (Dala), a lower
   * rounded outcrop beside it, and a few far, pale, low ones. Hazed by the fog.
   */
  'dala-hills'(b) {
    const r = mulberry(2201);
    b.cap(1, Math.PI / 2, '#a4502f', { x: -22, y: -2, z: 0, sx: 46, sy: 26, sz: 18 }, 12);
    b.cap(1, Math.PI / 2, shade('#a4502f', 0.08), { x: 6, y: -2, z: 4, sx: 20, sy: 13, sz: 10 }, 9);
    const rock = ['#9a8670', '#a39078', '#8f7b66'];
    for (let i = 0; i < 6; i++) {
      const x = -150 + i * 58 + r.range(-12, 12);
      b.cap(1, Math.PI / 2, r.pick(rock), { x, y: -1, z: r.range(-10, 6), sx: r.range(14, 26), sy: r.range(5, 9), sz: 9 }, 7);
    }
  },
};
