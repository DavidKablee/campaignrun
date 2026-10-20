import * as THREE from 'three';
import type { SimConfig } from '@cr/content';
import { loadAsset } from './assets';
import { GeoBuilder, TexBuckets, mulberry, shade, texBox, type Rng } from './geo';
import { bend, flatMat, texMat, unlitMat, vcMat } from './materials';
import { personGeo } from './props';
import type { WeatherContext } from '../weather';
import {
  SHOP_VARIANTS,
  cloudTexture,
  facadeTexture,
  roadTexture,
  shopTexture,
  signTexture,
  skyTexture,
  sunTexture,
} from './textures';

/**
 * CC0 Lagos biome-kit templates (ADR-0009), loaded once and cloned into chunks
 * as they're built. `clone()` shares geometry/material buffers — only
 * Object3D nodes are duplicated — so this is cheap per placement. Chunks
 * recycle every ~40 m anyway, so a chunk built before the kit finishes
 * loading just falls back to the procedural prop for its lifetime; the next
 * time that slot rebuilds (a few seconds later) it picks up the CC0 model.
 */
const PALM_IDS = ['tree-palm', 'tree-palm-bend', 'tree-palm-short'] as const;
const BUILDING_IDS = ['building-a', 'building-c', 'building-e', 'building-g', 'building-i', 'building-k', 'building-wide-a', 'building-wide-b'] as const;
const PARASOL_IDS = ['parasol-a', 'parasol-b'] as const;
const PALM_SCALE = 4.6; // native ~1.5 m tall -> ~7 m
const PARASOL_SCALE = 5.3; // native ~0.45 m tall -> ~2.4 m, matches the procedural stall cone
// `buildings` is preloaded for a near-term follow-up (swapping some of the
// procedural shop/facade boxes for CC0 silhouettes) — not placed yet; the
// existing buildings()/towers() methods already have real per-shop styling
// (awnings, balconies, roofs, billboards) that a straight model swap would lose.

let kitPromise: Promise<{
  palms: THREE.Object3D[];
  buildings: THREE.Object3D[];
  parasols: THREE.Object3D[];
}> | null = null;

function lagosKit() {
  if (!kitPromise) {
    kitPromise = Promise.all([
      Promise.all(PALM_IDS.map((id) => loadAsset('lagos', id))),
      Promise.all(BUILDING_IDS.map((id) => loadAsset('lagos', id))),
      Promise.all(PARASOL_IDS.map((id) => loadAsset('lagos', id))),
    ]).then(([palms, buildings, parasols]) => ({ palms, buildings, parasols }));
  }
  return kitPromise;
}

export /**
 * Daylight rig. Hemisphere light is NOT put through the toon ramp, so its value
 * is a hard floor on every surface in the scene: at the old 1.35 the floor alone
 * already saturated the ramp's top step and the whole city rendered as flat
 * colour fills with no shadow side. Keeping the floor near 0.5 and the sun near
 * 1.3 is what lets the ramp band.
 *
 * Night/NEPA values scale from these in applyWeather — they live here together so
 * the pair cannot drift apart (they were previously duplicated as literals in two
 * places).
 */
const DAY_HEMI = 0.58;
const DAY_SUN = 1.3;
// Night is not scaled down as far as day: the daytime cut was about letting the
// toon ramp band, but at night the floor is all that keeps the road readable —
// and NEPA multiplies it by another 0.45 on top.
const NIGHT_HEMI = 0.22;
const NIGHT_SUN = 0.1;

const CHUNK = 40;
const PLANE = new THREE.PlaneGeometry(1, 1);
const SLOTS = 6; // 1 behind, 5 ahead (200 m)

export type Theme = 'ojuelegba' | 'bridge' | 'link' | 'market' | 'park' | 'island';
const THEMES: Theme[] = ['ojuelegba', 'bridge', 'link', 'market', 'park'];

export interface Slot {
  group: THREE.Group;
  index: number;
  owned: THREE.BufferGeometry[];
}

const FACADE_N = 6;

/**
 * The Lagos world: an endless strip of 40 m chunks that recycle around the
 * player so the road, kerbs and buildings cover the WHOLE course. Themes follow
 * the course segments (landmarks from the state pack).
 */
export class World {
  private slots: Slot[] = [];
  private queue: number[] = [];
  private roadGeo: THREE.BufferGeometry;
  private groundGeo: THREE.BufferGeometry;
  private clouds = new THREE.Group();
  private lagoonNames: string[];
  private gateM: number;
  private segM: number;
  private segCount: number;
  private kit: { palms: THREE.Object3D[]; buildings: THREE.Object3D[]; parasols: THREE.Object3D[] } | null = null;
  // C30: refs kept for applyWeather() — everything else in this file builds roads/props, not light.
  private hemi!: THREE.HemisphereLight;
  private sun!: THREE.DirectionalLight;
  private fog!: THREE.Fog;
  private dayFogColor = new THREE.Color('#f1e2bd');
  private nightFogColor = new THREE.Color('#141b2e');
  private daySunColor = new THREE.Color('#fff1cf');
  private nightSunColor = new THREE.Color('#3a4a6e');

  constructor(
    private scene: THREE.Scene,
    cfg: SimConfig,
    landmarks: string[],
    weather?: WeatherContext,
  ) {
    this.lagoonNames = landmarks;
    this.gateM = cfg.course.borderGateMm / 1000;
    this.segM = cfg.course.segmentLengthMm / 1000;
    this.segCount = cfg.course.segmentCount;
    lagosKit().then((k) => {
      this.kit = k;
    });

    scene.background = skyTexture();
    this.fog = new THREE.Fog('#f1e2bd', 35, 135);
    scene.fog = this.fog;

    this.roadGeo = new THREE.PlaneGeometry(18, CHUNK);
    const uv = this.roadGeo.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * (CHUNK / 8));
    this.roadGeo.rotateX(-Math.PI / 2);
    this.groundGeo = new THREE.PlaneGeometry(700, CHUNK);
    this.groundGeo.rotateX(-Math.PI / 2);

    this.hemi = new THREE.HemisphereLight('#fff6df', '#7a6a55', DAY_HEMI);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff1cf', DAY_SUN);
    this.sun.position.set(-30, 50, 20);
    scene.add(this.sun);

    const sunSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: sunTexture(), fog: false, transparent: true, depthWrite: false, opacity: 0.8 }),
    );
    sunSprite.scale.set(90, 90, 1);
    sunSprite.position.set(-55, 70, -170);
    this.clouds.add(sunSprite);

    const cl = cloudTexture();
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cl, fog: false, transparent: true, depthWrite: false, opacity: 0.85 }));
      s.scale.set(70 + (i % 3) * 25, 26 + (i % 2) * 8, 1);
      s.position.set(-120 + i * 48, 62 + (i % 3) * 9, -150);
      this.clouds.add(s);
    }
    scene.add(this.clouds);

    for (let i = 0; i < SLOTS; i++) {
      const group = new THREE.Group();
      scene.add(group);
      this.slots.push({ group, index: -999, owned: [] });
    }

    if (weather) this.applyWeather(weather);
  }

  /**
   * C30: time-of-day, NEPA, harmattan and rainy-season all boil down to the same four knobs —
   * hemisphere/sun intensity, sun/fog colour, and fog draw distance — set once per run from a
   * real clock the caller already read (see weather.ts). Nothing here re-reads the clock itself.
   */
  private applyWeather(ctx: WeatherContext) {
    // Smooth day/night blend: 1 at midnight (dayPhase 0 or 1), 0 at noon (dayPhase 0.5).
    const night = (1 + Math.cos(ctx.dayPhase * Math.PI * 2)) / 2;
    const nepaDarken = ctx.isNepaOut ? 0.45 : 1;

    this.hemi.intensity = (DAY_HEMI * (1 - night) + NIGHT_HEMI * night) * nepaDarken;
    this.sun.intensity = (DAY_SUN * (1 - night) + NIGHT_SUN * night) * nepaDarken;
    this.sun.color.copy(this.daySunColor).lerp(this.nightSunColor, night);

    let fogColor = this.dayFogColor.clone().lerp(this.nightFogColor, night);
    let fogFar = 135;
    if (ctx.isHarmattan) {
      fogColor = fogColor.lerp(new THREE.Color('#cdbd96'), 0.55); // dusty tan haze
      fogFar = 85; // reduced visibility
    }
    if (ctx.isRainySeason) {
      fogColor = fogColor.lerp(new THREE.Color('#90a0a8'), 0.4); // wet grey-blue
      fogFar = Math.min(fogFar, 105);
    }
    this.fog.color.copy(fogColor);
    this.fog.far = fogFar;
    const mood = ctx.isHarmattan ? 'harmattan' : ctx.isRainySeason ? 'rainy' : night > 0.5 ? 'night' : 'day';
    this.scene.background = skyTexture(mood);

    // Sun glow + clouds read wrong against a dark sky — fade them out at night.
    const skyOpacity = 0.85 * (1 - night * 0.9);
    for (const c of this.clouds.children) {
      if (c instanceof THREE.Sprite) (c.material as THREE.SpriteMaterial).opacity = skyOpacity;
    }
  }

  themeAt(chunk: number): Theme {
    const zm = chunk * CHUNK;
    if (zm < this.gateM) return 'ojuelegba';
    const seg = Math.floor((zm - this.gateM) / this.segM);
    if (seg >= this.segCount) return 'island';
    return THEMES[Math.min(seg, THEMES.length - 1)]!;
  }

  private labelFor(theme: Theme): string {
    switch (theme) {
      case 'ojuelegba':
        return this.lagoonNames[0] ?? 'OJUELEGBA';
      case 'bridge':
        return this.lagoonNames[1] ?? 'THIRD MAINLAND BRIDGE';
      case 'link':
        return this.lagoonNames[2] ?? 'LEKKI–IKOYI LINK BRIDGE';
      case 'market':
        return this.lagoonNames[3] ?? 'BALOGUN MARKET';
      case 'park':
        return this.lagoonNames[4] ?? 'FREEDOM PARK';
      default:
        return 'VICTORIA ISLAND';
    }
  }

  /** distance travelled (m). Builds at most one chunk per call after the first fill. */
  update(distM: number, initial = false) {
    const kp = Math.max(0, Math.floor(distM / CHUNK));
    const want = new Set<number>();
    for (let k = Math.max(0, kp - 1); k < Math.max(0, kp - 1) + SLOTS; k++) want.add(k);
    const have = new Set(this.slots.map((s) => s.index));
    this.queue = [...want].filter((k) => !have.has(k)).sort((a, b) => a - b);
    const free = this.slots.filter((s) => !want.has(s.index));
    let budget = initial ? 99 : 1;
    while (budget-- > 0 && this.queue.length && free.length) {
      const k = this.queue.shift()!;
      this.buildInto(free.shift()!, k);
    }

    // curve + crest, slowly varying with distance
    bend.uCurveX.value = 0.0003 * Math.sin(distM * 0.0021) + 0.00012 * Math.sin(distM * 0.0057 + 1);
    bend.uCurveY.value = 0.00016 + 0.00010 * Math.sin(distM * 0.0013 + 2);
    this.clouds.position.set(Math.sin(distM * 0.0006) * 20, 0, -distM);
  }

  private buildInto(slot: Slot, k: number) {
    for (const o of [...slot.group.children]) slot.group.remove(o);
    for (const g of slot.owned) g.dispose();
    slot.owned = [];
    slot.index = k;
    const theme = this.themeAt(k);
    const prev = k > 0 ? this.themeAt(k - 1) : null;
    const zMid = -(k + 0.5) * CHUNK;
    const zStart = -(k + 1) * CHUNK;
    const zEnd = -k * CHUNK;
    const r = mulberry(k * 9301 + 49297);

    // road + ground (shared geometry)
    const road = new THREE.Mesh(this.roadGeo, texMat('road', roadTexture()));
    road.position.set(0, 0, zMid);
    slot.group.add(road);
    const water = theme === 'bridge' || theme === 'link';
    const groundCol = theme === 'park' ? '#5d9a45' : theme === 'island' ? '#b9a27a' : '#a97b50';
    const ground = new THREE.Mesh(this.groundGeo, water ? flatMat('water', '#2f93ad') : flatMat(`ground-${theme}`, groundCol));
    ground.position.set(0, water ? -4.6 : -0.05, zMid);
    slot.group.add(ground);

    const vc = new GeoBuilder();
    vc.segScale = 0.6;
    const tb = new TexBuckets();
    const signs: THREE.Mesh[] = [];
    const ctx: Ctx = { vc, tb, signs, r, zStart, zEnd, zMid, k, theme, slot: slot.group };

    // theme gantry at the first chunk of each segment
    if (prev && prev !== theme) this.gantry(ctx, this.labelFor(theme));

    if (water) this.bridge(ctx);
    for (const side of [-1, 1] as const) {
      this.furniture(ctx, side);
      this.people(ctx, side);
      switch (theme) {
        case 'ojuelegba':
          this.buildings(ctx, side, { minF: 2, maxF: 4, shops: 0.85 });
          this.stalls(ctx, side, 0.6);
          break;
        case 'market':
          this.buildings(ctx, side, { minF: 1, maxF: 2, shops: 1 });
          this.stalls(ctx, side, 2.2);
          break;
        case 'island':
          this.towers(ctx, side, true);
          this.palms(ctx, side, 5);
          break;
        case 'park':
          this.trees(ctx, side, 5);
          this.parkBits(ctx, side);
          break;
        default:
          this.towers(ctx, side, false);
          break;
      }
    }
    if (theme === 'ojuelegba' && k % 4 === 2) this.footbridge(ctx);
    if (theme === 'link') this.pylons(ctx);
    if (theme === 'bridge') this.boats(ctx);

    const merged = vc.build();
    if (merged) {
      slot.owned.push(merged);
      slot.group.add(new THREE.Mesh(merged, vcMat()));
    }
    for (const [key, geo] of tb.build()) {
      slot.owned.push(geo);
      const tex = key.startsWith('facade')
        ? facadeTexture(Number(key.slice(6)))
        : shopTexture(Number(key.slice(4)));
      slot.group.add(new THREE.Mesh(geo, texMat(key, tex)));
    }
    for (const s of signs) slot.group.add(s);
  }

  // ------------------------------------------------------------ pieces
  private gantry(c: Ctx, label: string) {
    const z = c.zEnd - 2;
    for (const s of [-1, 1]) {
      c.vc.box(0.5, 6.6, 0.5, '#d9d9d4', { x: s * 5.6, y: 3.3, z });
      c.vc.box(0.9, 0.3, 0.9, '#7a7a76', { x: s * 5.6, y: 0.15, z });
    }
    c.vc.box(11.8, 0.4, 0.5, '#d9d9d4', { y: 6.7, z });
    const s = new THREE.Mesh(
      PLANE,
      unlitMat(`gant:${label}`, signTexture(label.toUpperCase(), '#1b2a4a', '#f5c518', 1024, 256, 'Campaign trail')),
    );
    s.scale.set(10.4, 2.6, 1);
    s.position.set(0, 5.1, z + 0.3);
    c.signs.push(s);
  }

  private buildings(c: Ctx, side: 1 | -1, o: { minF: number; maxF: number; shops: number }) {
    const { vc, tb, r } = c;
    const facadeSet = [r.int(0, FACADE_N - 1), r.int(0, FACADE_N - 1), r.int(0, FACADE_N - 1)];
    const shopSet = [r.int(0, SHOP_VARIANTS - 1), r.int(0, SHOP_VARIANTS - 1)];
    let z = c.zStart + r.range(0, 1.5);
    const awn = ['#c8281e', '#1f5f8b', '#e0902b', '#1fa45b', '#7b5ea7'];
    while (z < c.zEnd - 4) {
      const w = Math.min(r.range(7, 12), c.zEnd - z);
      if (w < 4) break;
      const d = r.range(8, 12);
      const x0 = 9.8 + r.range(0, 1.8);
      const cx = side * (x0 + d / 2);
      const cz = z + w / 2;
      const floors = r.int(o.minF, o.maxF);
      const shop = r.chance(o.shops);
      const fv = r.pick(facadeSet);
      const sv = r.pick(shopSet);
      const shopH = 3.4;
      let top: number;
      if (shop) {
        tb.add(`shop${sv}`, texBox(w, shopH, d, 3.5, 3.4), { x: cx, y: shopH / 2, z: cz });
        if (floors > 1) tb.add(`facade${fv}`, texBox(w, (floors - 1) * 3, d, 3.5, 3), { x: cx, y: shopH + ((floors - 1) * 3) / 2, z: cz });
        top = shopH + (floors - 1) * 3;
        // awning
        const ac = r.pick(awn);
        const n = 6;
        for (let i = 0; i < n; i++) {
          vc.box(((w * 0.88) / n), 0.07, 1.4, i % 2 ? '#f4f1ea' : ac, { x: side * (x0 - 0.65), y: 3.0, z: cz - (w * 0.44) + (i + 0.5) * ((w * 0.88) / n), rz: side * 0.12 });
        }
      } else {
        const h = floors * 3;
        tb.add(`facade${fv}`, texBox(w, h, d, 3.5, 3), { x: cx, y: h / 2, z: cz });
        top = h;
        // compound wall + gate
        vc.box(0.25, 1.9, w, shade('#d8c9a7', -0.05 * r.int(0, 3)), { x: side * (x0 - 1.6), y: 0.95, z: cz });
        vc.box(0.5, 2.4, 0.5, '#8a7a5e', { x: side * (x0 - 1.6), y: 1.2, z: cz - w * 0.18 });
        vc.box(0.5, 2.4, 0.5, '#8a7a5e', { x: side * (x0 - 1.6), y: 1.2, z: cz + w * 0.18 });
        vc.box(0.12, 1.6, w * 0.3, '#2b4a6b', { x: side * (x0 - 1.6), y: 0.85, z: cz });
      }
      // balconies
      if (floors >= 3 && r.chance(0.6)) {
        vc.box(0.9, 0.14, w * 0.7, '#cfc7b5', { x: side * (x0 - 0.4), y: shopH + 2.9, z: cz });
        vc.box(0.05, 0.9, w * 0.7, '#222', { x: side * (x0 - 0.8), y: shopH + 3.4, z: cz });
      }
      // roof
      if (r.chance(0.55)) {
        vc.box(w + 0.2, 0.3, d + 0.2, '#8a8a86', { x: cx, y: top + 0.15, z: cz });
        for (let i = 0; i < r.int(1, 2); i++) {
          const tx = cx + r.range(-d / 3, d / 3);
          const tz = cz + r.range(-w / 3, w / 3);
          vc.cyl(0.75, 0.75, 1.3, '#25282c', { x: tx, y: top + 0.95, z: tz }, 8);
          vc.cyl(0.8, 0.8, 0.1, '#3b3f45', { x: tx, y: top + 1.65, z: tz }, 8);
        }
        vc.cyl(0.03, 0.03, 3.0, '#444', { x: cx + 1, y: top + 1.8, z: cz }, 4);
      } else {
        const zc = r.pick(['#9a6b4b', '#7d8a93', '#8b5a3c', '#a1887f']);
        vc.prism(d + 1.0, 1.5, w + 0.6, zc, { x: cx, y: top, z: cz });
        for (let i = 0; i < 6; i++) vc.box(d + 1.02, 0.03, 0.05, shade(zc, -0.12), { x: cx, y: top + 0.6, z: cz - w / 2 + (i + 0.5) * (w / 6) });
      }
      // billboard on some roofs
      if (r.chance(0.18)) {
        const label = r.pick(['FRESH BREAD', 'PURE WATER', 'GENERATOR REPAIR', 'BEWARE OF DOG', 'POS · AIRTIME', 'KEEP LAGOS CLEAN']);
        const bg = r.pick(['#1f5f8b', '#b3261e', '#1fa45b', '#f5c518']);
        const s = new THREE.Mesh(PLANE, unlitMat(`bb:${label}:${bg}`, signTexture(label, bg, bg === '#f5c518' ? '#161616' : '#fff', 512, 160)));
        s.scale.set(5, 1.6, 1);
        s.position.set(side * (x0 + 0.3), top + 2.8, cz);
        s.rotation.y = side * -0.35;
        c.signs.push(s);
        vc.box(0.12, 2.4, 0.12, '#444', { x: side * (x0 + 0.3), y: top + 1.2, z: cz });
      }
      z += w + (r.chance(0.35) ? r.range(1.5, 3.5) : r.range(0.2, 0.6));
    }
  }

  private towers(c: Ctx, side: 1 | -1, near: boolean) {
    const { vc, r } = c;
    const n = near ? 3 : 2;
    const cols = ['#9fb4c2', '#7e97a8', '#b8c6cf', '#8aa0b0'];
    for (let i = 0; i < n; i++) {
      const w = r.range(9, 14);
      const h = near ? r.range(24, 58) : r.range(16, 60);
      const x = side * (near ? r.range(15, 26) : r.range(34, 80));
      const z = c.zStart + (i + 0.5) * (CHUNK / n) + r.range(-3, 3);
      const col = r.pick(cols);
      vc.box(w, h, w, col, { x, y: h / 2, z });
      for (let j = 1; j < 7; j++) vc.box(w + 0.1, 0.45, w + 0.1, shade(col, -0.22), { x, y: (h * j) / 7, z });
      if (r.chance(0.5)) vc.box(w * 0.5, 4, w * 0.5, shade(col, -0.1), { x, y: h + 2, z });
    }
    if (near) {
      // low podium shops facing the road
      vc.box(8, 3.2, 16, '#cfc7b5', { x: side * 11.5, y: 1.6, z: c.zMid });
    }
  }

  private furniture(c: Ctx, side: 1 | -1) {
    const { vc, zStart } = c;
    // street lamps
    for (const dz of [5, 25]) {
      const z = zStart + dz;
      vc.cyl(0.07, 0.09, 6.6, '#4a4d52', { x: side * 5.4, y: 3.3, z }, 6);
      vc.box(1.7, 0.09, 0.09, '#4a4d52', { x: side * 4.6, y: 6.6, z });
      vc.box(0.7, 0.14, 0.3, '#f4efd0', { x: side * 3.8, y: 6.52, z });
    }
    // utility pole + wires
    const pz = zStart + 12;
    vc.cyl(0.1, 0.12, 8, '#6b4a2b', { x: side * 8.8, y: 4, z: pz }, 6);
    vc.box(0.1, 0.1, 2.4, '#5a3d24', { x: side * 8.8, y: 7.5, z: pz });
    vc.box(2.4, 0.1, 0.1, '#5a3d24', { x: side * 8.8, y: 7.3, z: pz });
    for (const dx of [-1, 0, 1]) vc.box(0.03, 0.03, CHUNK, '#1a1a1a', { x: side * 8.8 + dx * 1.0, y: 7.35, z: c.zMid });
  }

  private people(c: Ctx, side: 1 | -1) {
    const { vc, r } = c;
    const n = r.int(1, 3);
    for (let i = 0; i < n; i++) {
      const seed = r.int(0, 23);
      const pose = r.pick(['stand', 'wave', 'stand'] as const);
      vc.addBuilt(personGeo(seed, pose), {
        x: side * r.range(5.6, 8.2),
        z: c.zStart + r.range(1, CHUNK - 1),
        ry: r.chance(0.6) ? (side > 0 ? -Math.PI / 2 : Math.PI / 2) + r.range(-0.5, 0.5) : r.range(0, 6.28),
      });
    }
  }

  private stalls(c: Ctx, side: 1 | -1, density: number) {
    const { vc, r } = c;
    const n = Math.round(density * r.range(1, 3));
    const cols = ['#e85d04', '#f5c518', '#2ec4b6', '#c23fa0', '#1fa45b', '#2a6f97'];
    const kit = this.kit;
    for (let i = 0; i < n; i++) {
      const x = side * r.range(5.9, 6.7);
      const z = c.zStart + r.range(2, CHUNK - 2);
      vc.box(1.7, 0.8, 0.9, '#6b4a2b', { x, y: 0.4, z });
      vc.cyl(0.03, 0.03, 2.3, '#444', { x, y: 1.15, z }, 4);
      if (kit && kit.parasols.length > 0) {
        const obj = r.pick(kit.parasols).clone(true);
        obj.scale.setScalar(PARASOL_SCALE);
        obj.rotation.y = r.range(0, Math.PI * 2);
        obj.position.set(x, 1.65, z);
        c.slot.add(obj);
      } else {
        vc.cone(1.5, 0.55, r.pick(cols), { x, y: 2.4, z }, 8);
      }
      for (let j = 0; j < 5; j++) vc.sphere(0.13, r.pick(cols), { x: x - 0.65 + j * 0.32, y: 0.95, z: z + r.range(-0.2, 0.2) }, 5);
    }
  }

  private trees(c: Ctx, side: 1 | -1, n: number) {
    const { r } = c;
    for (let i = 0; i < n; i++) {
      const x = side * r.range(9.4, 30);
      const z = c.zStart + r.range(1, CHUNK - 1);
      if (r.chance(0.5)) this.placePalm(c, x, z);
      else this.mango(c.vc, r, x, z);
    }
  }

  private palms(c: Ctx, side: 1 | -1, n: number) {
    for (let i = 0; i < n; i++) this.placePalm(c, side * 9.4, c.zStart + (i + 0.5) * (CHUNK / n));
  }

  /** CC0 palm model once the Lagos kit has loaded; the hand-built primitive palm until then (ADR-0009). */
  private placePalm(c: Ctx, x: number, z: number) {
    const kit = this.kit;
    if (!kit || kit.palms.length === 0) {
      this.palm(c.vc, c.r, x, z);
      return;
    }
    const template = c.r.pick(kit.palms);
    const obj = template.clone(true);
    obj.scale.setScalar(PALM_SCALE * c.r.range(0.85, 1.15));
    obj.rotation.y = c.r.range(0, Math.PI * 2);
    obj.position.set(x, 0, z);
    c.slot.add(obj);
  }

  private palm(vc: GeoBuilder, r: Rng, x: number, z: number) {
    const h = r.range(6, 9);
    const lean = r.range(-0.12, 0.12);
    for (let i = 0; i < 5; i++) {
      vc.cyl(0.2 - i * 0.02, 0.24 - i * 0.02, h / 5, i % 2 ? '#8a6a45' : '#7a5c3b', { x: x + lean * i * 0.4, y: (h / 5) * (i + 0.5), z, rz: lean }, 6);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.28;
      vc.cone(0.3, 3.2, i % 2 ? '#2e8b3a' : '#3fa24a', { x: x + lean * 2 + Math.cos(a) * 1.3, y: h + 0.1, z: z + Math.sin(a) * 1.3, rx: Math.sin(a) * 1.25, rz: -Math.cos(a) * 1.25, sz: 0.35 }, 4);
    }
    vc.sphere(0.25, '#6b4a2b', { x: x + lean * 2, y: h - 0.15, z }, 5);
  }

  private mango(vc: GeoBuilder, r: Rng, x: number, z: number) {
    const h = r.range(2.5, 3.5);
    vc.cyl(0.25, 0.35, h, '#6b4a2b', { x, y: h / 2, z }, 6);
    const cols = ['#2f7a3a', '#3b8f45', '#2a6b33'];
    for (let i = 0; i < 4; i++) vc.sphere(r.range(1.4, 2.1), r.pick(cols), { x: x + r.range(-1, 1), y: h + r.range(0.8, 1.8), z: z + r.range(-1, 1), sy: 0.8 }, 7);
  }

  private parkBits(c: Ctx, side: 1 | -1) {
    const { vc, r } = c;
    for (let i = 0; i < 2; i++) {
      const z = c.zStart + r.range(3, CHUNK - 3);
      const x = side * 6.6;
      vc.box(1.8, 0.1, 0.5, '#6b4a2b', { x, y: 0.5, z });
      vc.box(1.8, 0.5, 0.08, '#6b4a2b', { x: x + side * 0.22, y: 0.8, z });
      vc.box(0.1, 0.5, 0.45, '#333', { x: x - 0.8, y: 0.25, z });
      vc.box(0.1, 0.5, 0.45, '#333', { x: x + 0.8, y: 0.25, z });
    }
    for (let i = 0; i < 6; i++) {
      const col = r.pick(['#e85d04', '#f5c518', '#c23fa0', '#fff']);
      vc.box(CHUNK / 6 - 0.3, 0.7, 0.9, '#2f7a3a', { x: side * 9.4, y: 0.35, z: c.zStart + (i + 0.5) * (CHUNK / 6) });
      for (let j = 0; j < 4; j++) vc.sphere(0.12, col, { x: side * 9.4 + r.range(-0.3, 0.3), y: 0.78, z: c.zStart + (i + 0.5) * (CHUNK / 6) + r.range(-1, 1) }, 4);
    }
  }

  private bridge(c: Ctx) {
    const { vc, zMid } = c;
    vc.box(18.4, 1.2, CHUNK, '#8f8f8a', { y: -0.65, z: zMid });
    for (const s of [-1, 1]) {
      vc.box(0.55, 1.1, CHUNK, '#cfcac0', { x: s * 8.9, y: 0.55, z: zMid });
      vc.box(0.2, 0.12, CHUNK, '#f5c518', { x: s * 8.9, y: 1.16, z: zMid });
      vc.box(1.4, 4.4, 1.4, '#8f8f8a', { x: s * 5, y: -3.0, z: zMid });
    }
    vc.box(12, 0.4, 1.8, '#8f8f8a', { y: -1.4, z: zMid });
    vc.box(1.4, 4.0, 1.4, '#8f8f8a', { y: -3.2, z: zMid });
  }

  private pylons(c: Ctx) {
    const { vc, zMid } = c;
    for (const s of [-1, 1]) {
      const x = s * 9.3;
      vc.box(0.7, 30, 0.7, '#f4f1ea', { x, y: 15, z: zMid });
      vc.box(0.8, 0.8, 3.2, '#f4f1ea', { x, y: 26, z: zMid });
      for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        const dz = i * 4.4;
        const dy = -24.5;
        const len = Math.hypot(dy, dz);
        vc.box(0.07, len, 0.07, '#e8e8e4', { x: x - s * 0.2, y: 26 + dy / 2, z: zMid + dz / 2, rx: Math.atan2(dz, dy) + Math.PI });
      }
    }
  }

  private boats(c: Ctx) {
    const { vc, r } = c;
    for (let i = 0; i < 2; i++) {
      const x = (r.chance(0.5) ? -1 : 1) * r.range(18, 46);
      const z = c.zStart + r.range(4, CHUNK - 4);
      const col = r.pick(['#c8281e', '#1f5f8b', '#f5c518', '#f4f1ea']);
      vc.box(2.2, 0.6, 7, col, { x, y: -4.3, z });
      vc.cone(1.1, 2.2, col, { x, y: -4.3, z: z - 4.4, rx: -Math.PI / 2 }, 4);
      vc.box(1.5, 1.1, 2.2, '#e8e4d4', { x, y: -3.5, z: z + 1 });
      vc.box(1.6, 0.1, 2.4, '#6b4a2b', { x, y: -2.9, z: z + 1 });
    }
  }

  private footbridge(c: Ctx) {
    const { vc, zMid } = c;
    const y = 5.8;
    vc.box(19, 0.35, 3.2, '#9a9a94', { y, z: zMid });
    vc.box(19, 1.0, 0.1, '#c8281e', { y: y + 0.65, z: zMid - 1.55 });
    vc.box(19, 1.0, 0.1, '#c8281e', { y: y + 0.65, z: zMid + 1.55 });
    vc.box(19.4, 0.12, 3.5, '#2a6f97', { y: y + 1.9, z: zMid });
    for (const sx of [-1, 1]) {
      for (const dz of [-1.4, 1.4]) vc.box(0.42, y, 0.42, '#b0b0aa', { x: sx * 9.2, y: y / 2, z: zMid + dz });
      for (const dz of [-1.55, 1.55]) vc.box(7.6, 0.1, 0.1, '#c8281e', { x: sx * 12.6, y: 3.0, z: zMid + dz, rz: -sx * 0.73 });
      vc.box(7.6, 0.25, 3.0, '#9a9a94', { x: sx * 12.6, y: 2.9, z: zMid, rz: -sx * 0.73 });
    }
    const s = new THREE.Mesh(
      PLANE,
      unlitMat('fb-sign', signTexture('USE THE FOOTBRIDGE', '#f5c518', '#161616', 512, 128)),
    );
    s.scale.set(7, 1.0, 1);
    s.position.set(0, y + 0.9, zMid + 1.62);
    c.signs.push(s);
  }

  dispose() {
    for (const s of this.slots) {
      for (const g of s.owned) g.dispose();
      this.scene.remove(s.group);
    }
    this.roadGeo.dispose();
    this.groundGeo.dispose();
    this.scene.remove(this.clouds);
  }
}

interface Ctx {
  vc: GeoBuilder;
  tb: TexBuckets;
  signs: THREE.Mesh[];
  r: Rng;
  zStart: number;
  zEnd: number;
  zMid: number;
  k: number;
  theme: Theme;
  slot: THREE.Group;
}

