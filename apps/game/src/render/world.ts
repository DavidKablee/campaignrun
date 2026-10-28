import * as THREE from 'three';
import { LAGOS_WORLD, type ChunkOp, type District, type ResolvedWorld, type SideOp, type SimConfig } from '@cr/content';
import { loadAsset } from './assets';
import { GeoBuilder, TexBuckets, mulberry, shade, texBox, type Rng } from './geo';
import { bend, flatMat, texMat, unlitMat, vcMat } from './materials';
import { personGeo } from './props';
import { CHUNK, bucketTexture, facadeKey, shopKey, type Ctx } from './world/ctx';
import { PIECES } from './world/pieces';
import { regionalSide } from './world/regional';
import { SKYLINES } from './world/skyline';
import { registerKanoPieces } from './world/states/kano';
import { registerRiversPieces } from './world/states/rivers';
import { registerAnambraPieces } from './world/states/anambra';
import { registerKadunaPieces } from './world/states/kaduna';
import { registerDeltaPieces } from './world/states/delta';
import { registerKwaraPieces } from './world/states/kwara';
import { registerBornoPieces } from './world/states/borno';
import { registerEnuguPieces } from './world/states/enugu';
import { registerPlateauPieces } from './world/states/plateau';
import { registerKatsinaPieces } from './world/states/katsina';
import { registerOgunPieces } from './world/states/ogun';
import { registerOyoPieces } from './world/states/oyo';
import { registerBauchiPieces } from './world/states/bauchi';
import { registerSokotoPieces } from './world/states/sokoto';
import { registerAkwaIbomPieces } from './world/states/akwa-ibom';
import { registerImoPieces } from './world/states/imo';
import { registerEdoPieces } from './world/states/edo';
import { registerOndoPieces } from './world/states/ondo';
import { registerAdamawaPieces } from './world/states/adamawa';
import { registerCrossRiverPieces } from './world/states/cross-river';
import { registerJigawaPieces } from './world/states/jigawa';
import { registerOsunPieces } from './world/states/osun';
import { registerAbiaPieces } from './world/states/abia';
import { registerBenuePieces } from './world/states/benue';
import type { WeatherContext } from '../weather';
import { atmosphereFor, MIN_FOG_FAR, type Atmosphere } from './hazardAtmosphere';
import {
  SHOP_VARIANTS,
  cloudTexture,
  roadTexture,
  signTexture,
  skyTexture,
  sunTexture,
} from './textures';

/** State palette passed from the content pack JSON. */
export interface StatePalette {
  sky: string;
  fog: string;
  ground: string;
  accent: string;
}

/** Zone-appropriate billboard texts for cultural authenticity per region. */
const ZONE_BILLBOARDS: Record<string, string[]> = {
  SW: [
    'HOLY GHOST PROVISIONS', 'GOD\'S GRACE ENTERPRISE', 'NO WAHALA BARBER',
    'FAVOUR BREAD BAKERY', 'BUY LAND HERE', 'BISI BEAUTY SUPPLIES',
    'AGEGE FRESH BREAD', 'FOR GOD AND COUNTRY', 'MAMA RIZQ FAST FOOD',
    'DIVINE MANDATE ENTERPRISE', 'ALHAJI MOTORS & SONS', 'WHO GOD HAS BLESSED',
    'ASK ME HOW · POS · AIRTIME', 'GRACE WILL CARRY YOU', 'AREA DEVELOPMENT LEVY',
  ],
  NW: [
    'ALHAJI GARBA MOTORS', 'ALLAH YA KIYAYE', 'MAI SHARE TAILORING',
    'KANO CHOICE TRADERS', 'BARMA GENERAL STORES', 'DILLALI ESTATES',
    'UMAR & SONS ENTERPRISES', 'PURE WATER & ICE BLOCK', 'AREWA PROPERTIES',
  ],
  NE: [
    'SAHEL ENTERPRISES', 'PEACE & HARMONY STORES', 'MAIDUGURI CHOICE',
    'BORNO GENERAL MERCHANTS', 'NORTH EAST TRADERS', 'GOMBE MOTORS',
  ],
  SE: [
    'CHUKWUEMEKA ELECTRONICS', 'NNAEMEKA & SONS', 'NGOZI PROVISION STORE',
    'ODINAKA TRADERS', 'ONYEKA MOTORS', 'ANAMBRA CHOICE', 'NNENNA HAIR SALON',
    'GOD IS ABLE ENTERPRISE', 'UMUEZE GENERAL MERCHANTS',
  ],
  SS: [
    'GARDEN CITY CHOICE', 'OIL CITY PROVISIONS', 'FRESH BOLE & FISH HERE',
    'CREEK SIDE ENTERPRISE', 'NIGER DELTA TRADERS', 'PORT HARCOURT SUPPLIES',
    'EFFIONG MOTORS', 'GARDEN CITY PURE WATER',
  ],
  NC: [
    'MIDDLE BELT TRADERS', 'BENUE GENERAL STORES', 'JOS PLATEAU ENTERPRISE',
    'CONFLUENCE MOTORS', 'LAFIA CHOICE PROPERTIES', 'MINNA ENTERPRISES',
  ],
  FCT: [
    'PLOT FOR SALE · GALADIMAWA', 'ABUJA CHOICE PROPERTIES', 'MABUSHI GENERAL',
    'CAPITAL HILL ENTERPRISE', 'FEDERAL PROPERTIES LTD', 'WUSE ZONE TRADERS',
    'ABUJA METROPOLITAN STORES', 'ASOKORO PROVISIONS',
  ],
};

const DEFAULT_BILLBOARDS = ZONE_BILLBOARDS['SW']!;

// Each state's set pieces register themselves once, when the world module loads.
registerKanoPieces();
registerRiversPieces();
registerAnambraPieces();
registerKadunaPieces();
registerDeltaPieces();
registerKwaraPieces();
registerBornoPieces();
registerEnuguPieces();
registerPlateauPieces();
registerKatsinaPieces();
registerOgunPieces();
registerOyoPieces();
registerBauchiPieces();
registerSokotoPieces();
registerAkwaIbomPieces();
registerImoPieces();
registerEdoPieces();
registerOndoPieces();
registerOsunPieces();
registerAdamawaPieces();
registerJigawaPieces();
registerCrossRiverPieces();
registerAbiaPieces();
registerBenuePieces();

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

const PLANE = new THREE.PlaneGeometry(1, 1);
const SLOTS = 6; // 1 behind, 5 ahead (200 m)

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
  private skyline: THREE.Mesh | null = null;
  private dust: THREE.Points | null = null;
  private lagoonNames: string[];
  private world: ResolvedWorld;
  private dataSaver: boolean;
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
  private billboards: string[] = DEFAULT_BILLBOARDS;
  private accentCol = '#c8281e';
  private groundCol = '#a97b50';

  constructor(
    private scene: THREE.Scene,
    cfg: SimConfig,
    landmarks: string[],
    weather?: WeatherContext,
    palette?: StatePalette,
    zone?: string,
    private scenery: string[] = [],
    world: ResolvedWorld = LAGOS_WORLD,
    dataSaver = false,
    hazards: readonly string[] = [],
  ) {
    this.lagoonNames = landmarks;
    this.world = world;
    this.dataSaver = dataSaver;
    this.gateM = cfg.course.borderGateMm / 1000;
    this.segM = cfg.course.segmentLengthMm / 1000;
    this.segCount = cfg.course.segmentCount;
    lagosKit().then((k) => {
      this.kit = k;
    });

    // Apply state palette when provided; fall back to warm Lagos defaults.
    if (palette) {
      this.dayFogColor = new THREE.Color(palette.fog);
      this.accentCol = palette.accent;
      this.groundCol = palette.ground;
    }
    if (world.billboards && world.billboards.length > 0) {
      this.billboards = world.billboards;
    } else if (zone && ZONE_BILLBOARDS[zone]) {
      this.billboards = ZONE_BILLBOARDS[zone]!;
    }

    scene.background = skyTexture();
    this.fog = new THREE.Fog(this.dayFogColor.getHex(), 35, 135);
    scene.fog = this.fog;

    this.roadGeo = new THREE.PlaneGeometry(18, CHUNK);
    const uv = this.roadGeo.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * (CHUNK / 8));
    this.roadGeo.rotateX(-Math.PI / 2);
    this.groundGeo = new THREE.PlaneGeometry(700, CHUNK);
    this.groundGeo.rotateX(-Math.PI / 2);

    // Tint hemisphere sky slightly toward palette sky color for state identity.
    const skyTint = palette ? new THREE.Color(palette.sky).lerp(new THREE.Color('#fff6df'), 0.6).getStyle() : '#fff6df';
    this.hemi = new THREE.HemisphereLight(skyTint, '#7a6a55', DAY_HEMI);
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

    const sky = world.skyline ? SKYLINES[world.skyline] : undefined;
    if (sky) {
      const b = new GeoBuilder();
      b.segScale = 0.6;
      sky(b);
      const geo = b.build();
      if (geo) {
        this.skyline = new THREE.Mesh(geo, vcMat());
        scene.add(this.skyline);
      }
    }
    const atmosphere = atmosphereFor(hazards);
    if ((world.ambient === 'dust' || atmosphere?.dust) && !dataSaver) {
      const n = 140;
      const pos = new Float32Array(n * 3);
      const r = mulberry(77);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = r.range(-16, 16);
        pos[i * 3 + 1] = r.range(0.3, 6);
        pos[i * 3 + 2] = r.range(-70, 4);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.dust = new THREE.Points(
        geo,
        new THREE.PointsMaterial({ color: '#d9b98a', size: 0.55, transparent: true, opacity: 0.35, depthWrite: false }),
      );
      this.dust.frustumCulled = false;
      scene.add(this.dust);
    }

    for (let i = 0; i < SLOTS; i++) {
      const group = new THREE.Group();
      scene.add(group);
      this.slots.push({ group, index: -999, owned: [] });
    }

    if (weather) this.applyWeather(weather);
    if (atmosphere) this.applyAtmosphere(atmosphere);
  }

  /** The state's hazards in the air: a tint on the fog and a slightly nearer far plane. */
  private applyAtmosphere(a: Atmosphere) {
    this.fog.color.lerp(new THREE.Color(a.tint), a.tintAmount);
    this.fog.far = Math.max(MIN_FOG_FAR, this.fog.far * a.farMul);
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

  /** Which district a chunk is in: the start lane before the gate, then one per segment, then the finish. */
  districtAt(chunk: number): { id: string; seg: number } {
    const zm = chunk * CHUNK;
    const w = this.world;
    if (zm < this.gateM) return { id: w.start.district, seg: -1 };
    const seg = Math.floor((zm - this.gateM) / this.segM);
    if (seg >= this.segCount) return { id: w.finish.district, seg: this.segCount };
    return { id: w.route[Math.min(seg, w.route.length - 1)]!, seg };
  }

  /**
   * The gantry text where a district begins. Segment i carries landmark i; the
   * segments past the fifth landmark and the finish name their district instead.
   */
  private labelFor(d: { id: string; seg: number }, district: District): string {
    if (d.seg >= this.segCount) return this.world.finish.label;
    if (d.seg >= 0 && d.seg < 5) return this.lagoonNames[d.seg] ?? district.label;
    return district.label;
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
    if (this.skyline) this.skyline.position.set(0, 0, -distM - 118);
    if (this.dust) this.dust.position.set(Math.sin(distM * 0.05) * 1.5, 0, -distM - 6 + ((distM * 0.7) % 8));
  }

  private buildInto(slot: Slot, k: number) {
    for (const o of [...slot.group.children]) slot.group.remove(o);
    for (const g of slot.owned) g.dispose();
    slot.owned = [];
    slot.index = k;
    const here = this.districtAt(k);
    const district = this.world.districts[here.id]!;
    const prev = k > 0 ? this.districtAt(k - 1) : null;
    const zMid = -(k + 0.5) * CHUNK;
    const zStart = -(k + 1) * CHUNK;
    const zEnd = -k * CHUNK;
    const salt = this.world.salt;
    // `r` is the legacy stream: with salt 0 it is exactly what Lagos has always drawn, and
    // only the Lagos builders touch it. `rx` is for everything regional, so adding a regional
    // op to a district never shifts a Lagos roll.
    const r = mulberry((k * 9301 + 49297) ^ salt);
    const rx = mulberry((k * 7717 + 104729) ^ salt ^ 0x5bd1e995);

    // road + ground (shared geometry)
    const roadStyle = (district.road && this.world.roads[district.road]) || this.world.road;
    const road = new THREE.Mesh(this.roadGeo, texMat(`road:${roadStyle.texture}`, roadTexture(roadStyle.texture)));
    road.position.set(0, 0, zMid);
    slot.group.add(road);
    const water = district.water;
    const baseGround = district.ground ?? this.groundCol;
    const ground = new THREE.Mesh(
      this.groundGeo,
      water ? flatMat(`water-${water.color}`, water.color) : flatMat(`ground-${baseGround}`, baseGround),
    );
    ground.position.set(0, water ? water.y : -0.05, zMid);
    slot.group.add(ground);

    const vc = new GeoBuilder();
    vc.segScale = 0.6;
    const tb = new TexBuckets();
    const signs: THREE.Mesh[] = [];
    const ctx: Ctx = { vc, tb, signs, r, rx, zStart, zEnd, zMid, k, district, slot: slot.group, world: this.world, dataSaver: this.dataSaver };

    // gantry at the first chunk of each district
    if (prev && prev.id !== here.id) this.gantry(ctx, this.labelFor(here, district));

    for (const op of district.pre) this.chunkOp(ctx, op);
    // A set piece owns the side it stands on in its chunk: the plots, walls, stalls and
    // trees that would stand inside it are left out (the roadside furniture stays).
    const owned = this.pieceSides(k);
    for (const side of [-1, 1] as const) {
      for (const op of district.side) {
        if ('side' in op && op.side !== undefined && op.side !== side) continue;
        if (owned.has(side) && (op.op === 'lots' || op.op === 'wall' || op.op === 'bazaar' || op.op === 'crops' || op.op === 'flora')) continue;
        this.sideOp(ctx, side, op);
      }
    }
    for (const op of district.post) this.chunkOp(ctx, op);
    this.placePieces(ctx, k);
    // State-specific scenery injected from the content pack.
    if (this.scenery.length > 0 && k % 3 === 0) this.buildScenery(ctx);
    // Road edge detail present on every chunk
    this.kerbDetail(ctx);

    const merged = vc.build();
    if (merged) {
      slot.owned.push(merged);
      slot.group.add(new THREE.Mesh(merged, vcMat()));
    }
    for (const [key, geo] of tb.build()) {
      slot.owned.push(geo);
      slot.group.add(new THREE.Mesh(geo, texMat(key, bucketTexture(key))));
    }
    for (const s of signs) slot.group.add(s);
  }

  /** The chunk a landmark piece belongs in: the stage's chunk, or the first chunk of the segment. */
  private pieceChunk(landmark: number, at: 'venue' | 'entry'): number {
    const segStart = this.gateM + landmark * this.segM;
    return at === 'venue' ? Math.floor((segStart + 230) / CHUNK) : Math.ceil(segStart / CHUNK);
  }

  private pieceSides(k: number): Set<number> {
    const out = new Set<number>();
    for (const p of this.world.pieces) {
      const def = PIECES[p.piece];
      if (def && this.pieceChunk(p.landmark, def.at) === k) out.add(p.side === -1 ? -1 : 1);
    }
    return out;
  }

  private placePieces(c: Ctx, k: number) {
    for (const p of this.world.pieces) {
      const def = PIECES[p.piece];
      if (def && this.pieceChunk(p.landmark, def.at) === k) def.build(c, p.side);
    }
  }

  private sideOp(c: Ctx, side: 1 | -1, op: SideOp) {
    switch (op.op) {
      case 'furniture':
        return this.furniture(c, side);
      case 'people':
        return this.people(c, side);
      case 'lagos.buildings':
        return this.buildings(c, side, op);
      case 'lagos.towers':
        return this.towers(c, side, op.near);
      case 'lagos.stalls':
        return this.stalls(c, side, op.density);
      case 'lagos.trees':
        return this.trees(c, side, op.n);
      case 'lagos.palms':
        return this.palms(c, side, op.n);
      case 'lagos.parkBits':
        return this.parkBits(c, side);
      default:
        return regionalSide(c, side, op, { accent: this.accentCol, billboards: this.billboards });
    }
  }

  private chunkOp(c: Ctx, op: ChunkOp) {
    switch (op.op) {
      case 'bridge':
        return this.bridge(c);
      case 'pylons':
        return this.pylons(c);
      case 'boats':
        return this.boats(c);
      case 'footbridge':
        if (c.k % op.every === op.offset) this.footbridge(c);
    }
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
    const fset = c.district.facade;
    const sset = c.district.shops;
    const facadeSet = [r.int(0, FACADE_N - 1), r.int(0, FACADE_N - 1), r.int(0, FACADE_N - 1)];
    const shopSet = [r.int(0, SHOP_VARIANTS - 1), r.int(0, SHOP_VARIANTS - 1)];
    let z = c.zStart + r.range(0, 1.5);
    const awn = ['#c8281e', '#1f5f8b', '#e0902b', '#1fa45b', '#7b5ea7', this.accentCol];
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
        tb.add(shopKey(sset, sv), texBox(w, shopH, d, 3.5, 3.4), { x: cx, y: shopH / 2, z: cz });
        if (floors > 1) tb.add(facadeKey(fset, fv), texBox(w, (floors - 1) * 3, d, 3.5, 3), { x: cx, y: shopH + ((floors - 1) * 3) / 2, z: cz });
        top = shopH + (floors - 1) * 3;
        // awning
        const ac = r.pick(awn);
        const n = 6;
        for (let i = 0; i < n; i++) {
          vc.box(((w * 0.88) / n), 0.07, 1.4, i % 2 ? '#f4f1ea' : ac, { x: side * (x0 - 0.65), y: 3.0, z: cz - (w * 0.44) + (i + 0.5) * ((w * 0.88) / n), rz: side * 0.12 });
        }
      } else {
        const h = floors * 3;
        tb.add(facadeKey(fset, fv), texBox(w, h, d, 3.5, 3), { x: cx, y: h / 2, z: cz });
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
        const label = r.pick(this.billboards);
        const bg = r.pick(['#1f5f8b', '#b3261e', '#1fa45b', '#f5c518', this.accentCol]);
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
    const cols = ['#c85c1a', '#d4a017', '#3a7d44', '#1b4f8a', '#8b2252', '#e8d5a3'];
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
    const dress = c.world.dress;
    for (let i = 0; i < n; i++) {
      const seed = r.int(0, 23);
      const pose = r.pick(['stand', 'wave', 'stand'] as const);
      vc.addBuilt(personGeo(seed, pose, dress), {
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

  /** Road-edge kerb chevrons + power pole cables on every chunk. */
  private kerbDetail(c: Ctx) {
    const { vc, r, zMid, zStart, district } = c;
    // Bridges and causeways have their own edge treatment.
    if (district.kerb === 'none') return;

    for (const side of [-1, 1] as const) {
      const kx = side * 9.35;
      // Alternate yellow/black kerb blocks (4 per chunk)
      for (let i = 0; i < 4; i++) {
        const dz = zStart - (i + 0.5) * (CHUNK / 4);
        const col = i % 2 === 0 ? '#f5c518' : '#1a1a1a';
        vc.box(0.38, 0.22, CHUNK / 4 - 0.2, col, { x: kx, y: 0.11, z: dz });
      }

      // Power cables: thin horizontal cylinder between poles every 2nd chunk
      const poleX = side * 11.2;
      const poleH = 7.5 + r.range(0, 1.5);
      vc.cyl(0.08, 0.08, poleH, '#4a3f35', { x: poleX, y: poleH / 2, z: zStart }, 5);
      vc.cyl(0.025, 0.025, CHUNK, '#2a2a2a', { x: poleX, y: poleH + 0.4, z: zMid }, 4);
      // Cross-arm
      vc.box(0.8, 0.07, 0.07, '#4a3f35', { x: poleX, y: poleH + 0.2, z: zStart });
    }

    // Centre median for busy urban themes
    if (district.median) {
      vc.box(0.45, 0.16, CHUNK, '#9e9e9e', { x: 0, y: 0.08, z: zMid });
      // Median reflector dots
      for (let i = 0; i < 6; i++) {
        const dz = zStart - (i + 0.5) * (CHUNK / 6);
        vc.cyl(0.12, 0.12, 0.1, '#f5c518', { x: 0, y: 0.21, z: dz }, 4);
      }
    }
  }

  /**
   * State-specific scenery elements placed every 3rd chunk.
   * The scenery strings come from the content pack and describe visible landmarks
   * like "old city walls", "dye pits", "creek stilts", "granite inselbergs".
   */
  private buildScenery(c: Ctx) {
    const { vc, r } = c;
    for (const item of this.scenery) {
      switch (item) {
        // Kano: ancient mud-brick city walls (thick ochre/red wall with crenellations)
        case 'old city walls':
          for (const side of [-1, 1] as const) {
            const x = side * r.range(28, 38);
            const wallH = r.range(4.5, 6.0);
            vc.box(2.4, wallH, CHUNK * 0.9, '#c47a3a', { x, y: wallH / 2, z: c.zMid });
            // crenellations
            for (let i = 0; i < 8; i++) {
              const dz = c.zStart + (i + 0.5) * (CHUNK / 8);
              vc.box(2.6, 1.2, 1.8, '#b86a2a', { x, y: wallH + 0.6, z: dz });
            }
          }
          break;

        // Kano: dye pits — sunken indigo pools with cloth hanging between poles
        case 'dye pits':
          for (const side of [-1, 1] as const) {
            const bx = side * r.range(14, 20);
            const bz = c.zStart + r.range(4, CHUNK - 4);
            // pit (flat dark circle suggestion)
            vc.box(5, 0.15, 5, '#1a237e', { x: bx, y: -0.06, z: bz });
            vc.box(4, 0.12, 4, '#283593', { x: bx, y: -0.03, z: bz });
            // poles for hanging cloth
            for (let p = 0; p < 3; p++) {
              const px = bx + (p - 1) * 1.8;
              vc.cyl(0.06, 0.06, 4.2, '#5d4037', { x: px, y: 2.1, z: bz }, 5);
            }
            // hanging dyed cloth (indigo rectangles)
            for (let p = 0; p < 4; p++) {
              const px = bx - 1.8 + p * 1.2;
              vc.box(0.9, 2.8, 0.06, p % 2 === 0 ? '#283593' : '#1565c0', { x: px, y: 1.8, z: bz - 0.5 });
            }
          }
          break;

        // Rivers: stilt houses on the water margin
        case 'creek stilts': {
          const sx = (r.chance(0.5) ? -1 : 1) * r.range(22, 34);
          const bz2 = c.zStart + r.range(2, CHUNK - 2);
          // stilts
          for (let p = 0; p < 4; p++) {
            vc.cyl(0.14, 0.14, 2.8, '#5d4037', { x: sx + (p - 1.5) * 1.4, y: 1.4, z: bz2 }, 5);
          }
          // platform
          vc.box(5.6, 0.2, 3.8, '#795548', { x: sx, y: 2.9, z: bz2 });
          // small hut
          vc.box(3.8, 2.2, 2.8, '#bcaaa4', { x: sx, y: 4.0, z: bz2 });
          vc.prism(4.2, 1.2, 3.2, '#8d6e63', { x: sx, y: 5.1, z: bz2 });
          break;
        }

        // FCT / Plateau: granite rock formations on the skyline
        case 'granite inselbergs':
        case 'escarpment hairpins':
          for (const side of [-1, 1] as const) {
            const rx = side * r.range(55, 90);
            const rz = c.zStart + r.range(0, CHUNK);
            const rh = r.range(18, 40);
            const rw = r.range(8, 16);
            const col = r.pick(['#795548', '#6d4c41', '#8d6e63', '#9e9e9e']);
            vc.box(rw, rh, rw * 0.8, col, { x: rx, y: rh / 2, z: rz });
            // add a rounded top suggestion
            vc.sphere(rw * 0.55, shade(col, 0.08), { x: rx, y: rh, z: rz, sy: 0.5 }, 6);
          }
          break;

        // Oyo: cocoa warehouses (long low terracotta buildings)
        case 'cocoa warehouses':
          for (const side of [-1, 1] as const) {
            const wx = side * r.range(18, 28);
            const wz = c.zMid;
            vc.box(CHUNK * 0.7, 4.2, 10, '#8d6e63', { x: wx, y: 2.1, z: wz });
            vc.prism(CHUNK * 0.72, 1.0, 10.4, '#795548', { x: wx, y: 4.2, z: wz });
            vc.box(CHUNK * 0.72, 0.15, 10.4, '#6d4c41', { x: wx, y: 4.7, z: wz });
          }
          break;

        // Enugu: coal-camp industrial sheds
        case 'coal-camp sheds':
          for (const side of [-1, 1] as const) {
            const shx = side * r.range(16, 26);
            const shz = c.zStart + r.range(3, CHUNK - 3);
            vc.box(8, 3.5, 12, '#546e7a', { x: shx, y: 1.75, z: shz });
            vc.prism(8.2, 1.8, 12.4, '#455a64', { x: shx, y: 3.5, z: shz });
            // chimney
            vc.cyl(0.35, 0.4, 4.5, '#37474f', { x: shx + 2.5, y: 5.2, z: shz }, 6);
          }
          break;

        // Seven hills skyline (Oyo/Ibadan): rolling hill silhouettes in background
        case 'seven hills skyline':
          for (let i = 0; i < 3; i++) {
            const hx = (i - 1) * 45 + r.range(-10, 10);
            const hh = r.range(22, 38);
            const hw = r.range(28, 48);
            vc.sphere(hw * 0.5, shade('#6d4c41', -0.1 + i * 0.04), { x: hx, y: hh * 0.6, z: c.zMid - 80, sx: 2.0, sy: 0.75, sz: 1.4 }, 6);
          }
          break;

        default:
          break;
      }
    }
  }

  /** Test hook: the live chunk slots, so a test can fingerprint what was built. */
  debugSlots(): readonly Slot[] {
    return this.slots;
  }

  dispose() {
    for (const s of this.slots) {
      for (const g of s.owned) g.dispose();
      this.scene.remove(s.group);
    }
    this.roadGeo.dispose();
    this.groundGeo.dispose();
    this.scene.remove(this.clouds);
    if (this.skyline) {
      this.skyline.geometry.dispose();
      this.scene.remove(this.skyline);
    }
    if (this.dust) {
      this.dust.geometry.dispose();
      (this.dust.material as THREE.Material).dispose();
      this.scene.remove(this.dust);
    }
  }
}
