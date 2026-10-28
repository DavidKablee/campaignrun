import * as THREE from 'three';
import type { SimState, SimEvent } from '@cr/sim';
import { laneCenterMm } from '@cr/sim';
import type { CharacterLook, OutfitChoice, ResolvedWorld, SimConfig } from '@cr/content';
import { MM_TO_UNITS, ghostMat, vcMat } from './materials';
import { GeoBuilder } from './geo';
import type { GhostFrame } from '../ghostReplay';
import type { WeatherContext } from '../weather';
import { World, type StatePalette } from './world';
import { cameraFor } from './camera';
import { venueBackdrop } from './world/venues';
import { buildCharacter, disposeRig, poseCharacter, type CharacterRig } from './character';
import {
  AMBER,
  blobShadow,
  buildCoaster,
  buildDanfo,
  buildFinish,
  buildGate,
  buildGrandConvoy,
  buildHilux,
  buildKeke,
  buildObstacle,
  buildOkada,
  buildPickupZone,
  buildSupporterGroup,
  buildVenue,
  type VenueDress,
  personGeo,
} from './props';
import {
  animateVehicle,
  buildVehicle,
  isVehicleKind,
  prewarmVehicles,
  setVehicleNear,
  type VehicleKind,
  type VehicleRig,
} from './vehicles';

/**
 * Per-ride vehicle visuals (C26). Rides not listed here (Trek) render the
 * character on foot. `mounted: true` rides seat the character on/in the
 * vehicle (open rides); `mounted: false` hides the character — showing a
 * person precisely seated inside an enclosed bus cabin isn't worth the
 * clipping-avoidance effort for a chase-cam runner.
 */
const RIDE_VISUALS: Record<string, { build: () => THREE.Group; seatY: number; seatZ: number; lean: number; mounted: boolean }> = {
  okada: { build: buildOkada, seatY: 0.8, seatZ: 0.32, lean: 1.4, mounted: true },
  keke: { build: buildKeke, seatY: 0.74, seatZ: 0.15, lean: 0.6, mounted: true },
  hilux: { build: buildHilux, seatY: 0.0, seatZ: 0.0, lean: 0.5, mounted: false },
  danfo: { build: buildDanfo, seatY: 0.0, seatZ: 0.0, lean: 0.3, mounted: false },
  coaster: { build: buildCoaster, seatY: 0.0, seatZ: 0.0, lean: 0.25, mounted: false },
  'grand-convoy': { build: buildGrandConvoy, seatY: 0.0, seatZ: 0.0, lean: 0.2, mounted: false },
};

export interface RenderOpts {
  look: CharacterLook;
  outfit: OutfitChoice;
  rideId: string;
  config: SimConfig;
  landmarks: string[];
  /** C34: sign copy for the border gate and the finish line, per state. */
  gate: { label: string; sub: string };
  finish: { label: string; sub: string };
  reduceMotion: boolean;
  dataSaver: boolean;
  debug?: boolean;
  /** C29: your personal-best run for this state, precomputed into positions-per-tick. */
  ghostTrajectory?: GhostFrame[];
  /** C30: time-of-day/NEPA/harmattan/rainy-season, decided once from a real clock before the run starts. */
  weather?: WeatherContext;
  /** State-specific sky/fog/ground/accent colours from the content pack. */
  palette?: StatePalette;
  /** Geo zone for billboard copy (SW | NW | NE | SE | SS | NC | FCT). */
  zone?: string;
  /** State-specific scenery element names from the content pack. */
  scenery?: string[];
  /** The state's look (districts, road, dress). Absent: the stock Lagos world. */
  world?: ResolvedWorld;
  /** The state's road hazard ids, for fog tint and dust. */
  hazards?: readonly string[];
  /** State name for the venue stages. */
  stateName?: string;
  /** The five landmarks' venue types, for the stage backdrop. */
  venueTypes?: string[];
}

interface Follower {
  obj: THREE.Mesh;
  phase: number;
  x: number;
}
interface Runaway {
  obj: THREE.Mesh;
  vx: number;
  ttl: number;
}
interface Streak {
  obj: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  ttl: number;
}

/** Beyond this distance a vehicle is drawn as one merged mesh, without spinning wheels. */
const NEAR_DETAIL_MM = 60_000;

const AMBER_ON = new THREE.Color('#ffb020');
const AMBER_OFF = new THREE.Color('#5a3200');

const PLAYER_PROBE = new THREE.Vector3();

/** Window aspect before the canvas is attached; resize() corrects it from the real host box. */
function hostAspect(): number {
  return window.innerHeight > 0 ? window.innerWidth / window.innerHeight : 16 / 9;
}

export class GameRenderer {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private world: World;
  private playerRoot = new THREE.Group();
  private rig: CharacterRig | null = null;
  private ghostMesh: THREE.Mesh | null = null;
  private entityMeshes = new Map<number, THREE.Object3D>();
  private followers: Follower[] = [];
  private runaways: Runaway[] = [];
  private streaks: Streak[] = [];
  private streakCd = 0;
  private shakeT = 0;
  private confetti: THREE.Points | null = null;
  private dprCap: number;
  private frameTimes: number[] = [];
  private lastFrame = 0;
  private debugEl: HTMLDivElement | null = null;
  private opts: RenderOpts;
  private shadow = blobShadow(1.3, 1.1);
  private t0 = performance.now();
  private onResize = () => this.resize();
  private resizeObs: ResizeObserver | null = null;
  /** Moving and parked road vehicles, keyed by entity id (their meshes live in entityMeshes). */
  private rigs = new Map<number, VehicleRig>();
  /** Last two sim-tick lateral positions per entity, so weavers and walkers interpolate exactly. */
  private xTrack = new Map<number, { x: number; px: number }>();
  private xTick = -1;
  // camera: eased follow instead of a hard snap-to-target every frame (C22)
  private camX = 0;
  private camY = 3.3;
  private camZ = 7.2;
  private camLean = 0;
  // hop landing: brief squash-stretch + camera dip (C22)
  private prevHop = 0;
  private squashT = 0;

  constructor(opts: RenderOpts) {
    this.opts = opts;
    this.dprCap = opts.dataSaver ? 1.0 : 1.5;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cr-canvas';
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !opts.dataSaver,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.dprCap));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(60, hostAspect(), 0.1, 180);

    this.world = new World(this.scene, opts.config, opts.landmarks, opts.weather, opts.palette, opts.zone, opts.scenery, opts.world, opts.dataSaver, opts.hazards);
    this.world.update(0, true);
    prewarmVehicles(opts.dataSaver);

    this.scene.add(this.playerRoot);
    this.scene.add(this.shadow);
    this.buildPlayer();

    if (opts.weather?.isNepaOut) {
      // C30: NEPA night outage — a warm phone-torch glow riding with the player, cutting
      // through the darkened ambient/sun from World.applyWeather(). Parented to playerRoot so
      // it tracks position for free, no per-frame work needed.
      const torch = new THREE.PointLight('#ffd27a', 2.4, 11, 2);
      torch.position.set(0, 1.7, 0.6);
      this.playerRoot.add(torch);
    }

    if (opts.ghostTrajectory && opts.ghostTrajectory.length > 0) {
      this.ghostMesh = new THREE.Mesh(personGeo(7, 'run'), ghostMat());
      this.ghostMesh.rotation.y = Math.PI;
      this.scene.add(this.ghostMesh);
    }

    if (opts.debug) {
      this.debugEl = document.createElement('div');
      this.debugEl.className = 'cr-debug';
      document.body.appendChild(this.debugEl);
    }
    this.canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
    window.addEventListener('resize', this.onResize);
    // Rotation and a collapsing mobile toolbar can change the host box without a reliable window resize.
    window.visualViewport?.addEventListener('resize', this.onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObs = new ResizeObserver(this.onResize);
      queueMicrotask(() => {
        const host = this.canvas.parentElement;
        if (host && this.resizeObs) this.resizeObs.observe(host);
      });
    }
  }

  private buildPlayer() {
    for (const c of [...this.playerRoot.children]) this.playerRoot.remove(c);
    if (this.rig) disposeRig(this.rig);
    const rig = buildCharacter(this.opts.look, this.opts.outfit, 'hi');
    this.rig = rig;
    rig.group.rotation.y = Math.PI; // build faces +z; run toward -z
    const visual = RIDE_VISUALS[this.opts.rideId];
    if (visual) {
      this.playerRoot.add(visual.build());
      if (visual.mounted) {
        // Seat the rig's hip (local y = HIP_Y * height, chibi skeleton — see character.ts)
        // on the vehicle's seat height; unrelated to the character rebuild.
        rig.group.position.set(0, visual.seatY - 0.5 * this.opts.look.height, visual.seatZ);
        this.playerRoot.add(rig.group);
      }
      // Enclosed rides (bus-type): no character mesh added — see RIDE_VISUALS doc comment.
    } else {
      this.playerRoot.add(rig.group);
    }
  }

  setOpts(partial: Partial<RenderOpts>) {
    this.opts = { ...this.opts, ...partial };
    if (partial.look || partial.outfit || partial.rideId) this.buildPlayer();
  }

  resize() {
    const host = this.canvas.parentElement;
    const w = host?.clientWidth || window.innerWidth;
    const h = host?.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  notifyEvents(events: SimEvent[]) {
    for (const e of events) {
      if (e.type === 'dent' || e.type === 'hit' || e.type === 'toll') this.shakeT = this.opts.reduceMotion ? 0.05 : 0.28;
      if (e.type === 'fullHouse' || e.type === 'onBeat') this.spawnConfetti();
    }
  }

  private spawnConfetti() {
    if (this.confetti) {
      this.scene.remove(this.confetti);
      this.confetti.geometry.dispose();
    }
    const n = 90;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = Math.random() * 3 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      const c = new THREE.Color().setHSL(Math.random(), 0.85, 0.55);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.confetti = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.16, vertexColors: true }));
    this.confetti.position.copy(this.playerRoot.position);
    this.scene.add(this.confetti);
    setTimeout(() => {
      if (this.confetti) {
        this.scene.remove(this.confetti);
        this.confetti.geometry.dispose();
        this.confetti = null;
      }
    }, 900);
  }

  /** Thin fading streak beside the player at high momentum — cheap "speed" juice (C22). */
  private spawnStreak(pX: number, pZ: number) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const geo = new THREE.PlaneGeometry(0.035, 0.9 + Math.random() * 0.9);
    const mat = new THREE.MeshBasicMaterial({ color: '#fff7df', transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
    const obj = new THREE.Mesh(geo, mat);
    obj.rotation.y = Math.PI / 2;
    obj.position.set(pX + side * (1.5 + Math.random() * 0.7), 0.5 + Math.random() * 0.9, pZ + 1.2);
    this.scene.add(obj);
    this.streaks.push({ obj, mat, ttl: 0.22 });
  }

  private syncFollowers(carried: number, pX: number, pZ: number) {
    const target = Math.min(carried, 10);
    while (this.followers.length > target) {
      const f = this.followers.pop()!;
      this.runaways.push({ obj: f.obj, vx: (f.x > pX ? 1 : -1) * (3 + Math.random() * 2), ttl: 1.2 });
    }
    while (this.followers.length < target) {
      const i = this.followers.length;
      const m = new THREE.Mesh(personGeo(i * 5 + 3, 'run'), vcMat());
      m.rotation.y = Math.PI;
      m.position.set(pX, 0, pZ + 2);
      this.scene.add(m);
      this.followers.push({ obj: m, phase: i * 0.9, x: pX });
    }
  }

  render(prev: SimState, curr: SimState, alpha: number) {
    const now = performance.now();
    const t = (now - this.t0) / 1000;
    const dt = this.lastFrame ? Math.min(0.1, (now - this.lastFrame) / 1000) : 0.016;
    this.lastFrame = now;
    this.frameTimes.push(dt);
    if (this.frameTimes.length > 120) this.frameTimes.shift();
    this.qualityGovernor();

    const cfg = this.opts.config;
    const lerp = (a: number, b: number) => a + (b - a) * alpha;
    const zMm = lerp(prev.z, curr.z);
    const laneX = lerp(prev.laneX, curr.laneX);
    const pX = (((laneX - 1000) * cfg.laneSpacingMm) / 1000) * MM_TO_UNITS;
    const pZ = -zMm * MM_TO_UNITS;
    const hop = curr.hopT > 0 ? Math.sin((1 - curr.hopT / cfg.hopTicks) * Math.PI) * 1.3 : 0;
    const speed01 = Math.max(0, Math.min(1, (curr.speed - cfg.brakeSpeedUm) / (cfg.maxSpeedUm - cfg.brakeSpeedUm)));

    // world follows the player along the full course
    this.world.update(-pZ);

    // player
    const visual = RIDE_VISUALS[this.opts.rideId];
    this.playerRoot.position.set(pX, hop, pZ);
    this.playerRoot.rotation.z = -(curr.targetLane - 1) * (this.opts.reduceMotion ? 0.02 : 0.07) * (visual?.lean ?? 0.5);
    this.playerRoot.visible = curr.invulnTicks === 0 || ((curr.invulnTicks >> 2) & 1) === 0;
    this.shadow.position.set(pX, 0.04, pZ);
    // hop landing: detect the hop→ground transition and trigger a brief squash (foot rides only — a vehicle doesn't "tuck")
    if (this.prevHop > 0.15 && hop <= 0.001 && !visual) this.squashT = 0.16;
    this.prevHop = hop;
    if (this.squashT > 0) {
      this.squashT = Math.max(0, this.squashT - dt);
      const k = this.squashT / 0.16; // 1 → 0, eased back to neutral
      const sq = k * k;
      this.rig?.body.scale.set(1 + sq * 0.12, 1 - sq * 0.18, 1 + sq * 0.12);
    } else {
      this.rig?.body.scale.set(1, 1, 1);
    }

    if (this.rig) {
      poseCharacter(this.rig, visual?.mounted ? 'sit' : 'run', t, speed01);
      // ease the hop tuck in/out by blending with whatever poseCharacter just set,
      // instead of a hard overwrite past a fixed threshold (used to snap)
      if (!visual && hop > 0.001) {
        const hopAmt = Math.min(1, hop / 1.1);
        const p = this.rig.parts;
        p.thighL.rotation.x = p.thighL.rotation.x * (1 - hopAmt) + -1.1 * hopAmt;
        p.thighR.rotation.x = p.thighR.rotation.x * (1 - hopAmt) + -0.6 * hopAmt;
        p.shinL.rotation.x = p.shinL.rotation.x * (1 - hopAmt) + 1.2 * hopAmt;
        p.shinR.rotation.x = p.shinR.rotation.x * (1 - hopAmt) + 1.4 * hopAmt;
      }
    }

    // C29: ghost replay — pure position lookup, no live sim running for it.
    if (this.ghostMesh) {
      const traj = this.opts.ghostTrajectory!;
      const last = traj.length - 1;
      const gPrevIdx = Math.min(prev.tick, last);
      const gCurrIdx = Math.min(curr.tick, last);
      if (curr.tick > last) {
        this.ghostMesh.visible = false;
      } else {
        this.ghostMesh.visible = true;
        const gp = traj[gPrevIdx]!;
        const gc = traj[gCurrIdx]!;
        const gLaneX = lerp(gp.laneX, gc.laneX);
        const gZ = lerp(gp.z, gc.z);
        const gX = (((gLaneX - 1000) * cfg.laneSpacingMm) / 1000) * MM_TO_UNITS;
        this.ghostMesh.position.set(gX, 0, -gZ * MM_TO_UNITS);
      }
    }

    this.syncFollowers(curr.carried, pX, pZ);
    this.followers.forEach((f, i) => {
      const row = Math.floor(i / 3) + 1;
      const col = (i % 3) - 1;
      const tx = pX + col * 0.7 + Math.sin(t * 2 + f.phase) * 0.12;
      f.x += (tx - f.x) * Math.min(1, dt * 6);
      const bob = Math.abs(Math.sin(t * 9 + f.phase)) * 0.07;
      f.obj.position.set(f.x, bob + hop * 0.6, pZ + 0.9 + row * 1.05);
    });
    for (const r of [...this.runaways]) {
      r.ttl -= dt;
      r.obj.position.x += r.vx * dt;
      r.obj.rotation.y += dt * 4;
      r.obj.scale.setScalar(Math.max(0.01, r.ttl / 1.2));
      if (r.ttl <= 0) {
        this.scene.remove(r.obj);
        this.runaways.splice(this.runaways.indexOf(r), 1);
      }
    }

    // speed-streak juice at high momentum (skipped under reduce-motion / data-saver)
    if (speed01 > 0.62 && !this.opts.reduceMotion && !this.opts.dataSaver) {
      this.streakCd -= dt;
      if (this.streakCd <= 0) {
        this.streakCd = 0.1 - speed01 * 0.045;
        this.spawnStreak(pX, pZ);
      }
    }
    for (const s of [...this.streaks]) {
      s.ttl -= dt;
      s.obj.position.z += dt * 9;
      s.mat.opacity = Math.max(0, s.ttl / 0.22) * 0.3;
      if (s.ttl <= 0) {
        this.scene.remove(s.obj);
        s.obj.geometry.dispose();
        s.mat.dispose();
        this.streaks.splice(this.streaks.indexOf(s), 1);
      }
    }

    // camera chase: eased follow (lag, not a hard snap) + FOV kick + lane-change lean + landing dip
    const rig = cameraFor(this.camera.aspect, pX, pZ, speed01, this.opts.reduceMotion);
    this.camera.fov += (rig.fov - this.camera.fov) * Math.min(1, dt * 7);
    this.camera.updateProjectionMatrix();

    let sx = 0;
    let sy = 0;
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const mag = Math.max(0, this.shakeT) * 0.4;
      sx = Math.sin(this.shakeT * 53) * mag;
      sy = Math.cos(this.shakeT * 67) * mag * 0.7;
    }
    const camLerp = Math.min(1, dt * 9);
    const dip = this.squashT > 0 ? (this.squashT / 0.16) ** 2 * 0.12 : 0;
    this.camX += (rig.x - this.camX) * Math.min(1, dt * rig.followRate);
    this.camY += (rig.y - dip - this.camY) * camLerp;
    this.camZ += (pZ + rig.back - this.camZ) * camLerp;
    this.camera.position.set(this.camX + sx, this.camY + sy, this.camZ);
    // Framing (portrait follows the player fully; the road-bend sway is bounded) lives in camera.ts
    this.camera.lookAt(rig.lookX, rig.lookY, pZ - rig.ahead);
    const leanTarget = -(curr.targetLane - 1) * (this.opts.reduceMotion ? 0.006 : 0.03);
    this.camLean += (leanTarget - this.camLean) * Math.min(1, dt * 6);
    this.camera.rotateZ(this.camLean);
    if (this.debugEl) {
      // ?debug only: where the rider lands on screen (NDC, -1..1), for the mobile framing e2e.
      this.camera.updateMatrixWorld();
      const ndc = PLAYER_PROBE.set(pX, 0.9, pZ).project(this.camera);
      (window as unknown as { __crPlayerNdc?: unknown }).__crPlayerNdc = { x: ndc.x, y: ndc.y, lane: curr.targetLane, speed: curr.speed };
    }

    this.syncEntities(curr, zMm, t, dt, alpha);

    AMBER().color.copy(AMBER_OFF).lerp(AMBER_ON, 0.5 + 0.5 * Math.sin(t * 9));

    if (this.debugEl) {
      const info = this.renderer.info;
      const avg = this.frameTimes.reduce((a, b) => a + b, 0) / Math.max(1, this.frameTimes.length);
      this.debugEl.textContent = `${Math.round(1 / Math.max(0.001, avg))} fps · draws ${info.render.calls} · tris ${info.render.triangles} · dpr ${this.renderer.getPixelRatio().toFixed(2)}`;
    }
    this.renderer.render(this.scene, this.camera);
  }

  private syncEntities(curr: SimState, zMm: number, t: number, dt: number, alpha: number) {
    const seen = new Set<number>();
    const cfg = this.opts.config;
    const newTick = curr.tick !== this.xTick;
    this.xTick = curr.tick;
    for (const ent of curr.entities) {
      if (!ent.active && !ent.isZone) continue;
      // Dormant movers have not started moving yet: drawing them would show traffic frozen in the road.
      if (ent.mover && ent.awake === false) continue;
      const vz = ent.mover ? (ent.vz ?? 0) : 0;
      // Movers advanced a whole tick since the previous sim state; draw them part-way along it.
      const zRender = ent.z - vz * (1 - alpha);
      const rel = zRender - zMm;
      if (rel < -30000 || rel > 150000) continue;
      seen.add(ent.id);
      let obj = this.entityMeshes.get(ent.id);
      if (!obj) {
        obj = this.makeEntity(ent);
        this.scene.add(obj);
        this.entityMeshes.set(ent.id, obj);
      }

      const targetX = ent.xMm ?? laneCenterMm(ent.lane, cfg);
      let tr = this.xTrack.get(ent.id);
      if (!tr) {
        tr = { x: targetX, px: targetX };
        this.xTrack.set(ent.id, tr);
      } else if (newTick) {
        tr.px = tr.x;
        tr.x = targetX;
      }
      const xMm = tr.px + (tr.x - tr.px) * alpha;
      obj.position.set(xMm * MM_TO_UNITS, 0, -zRender * MM_TO_UNITS);

      if (ent.isZone && ent.consumed) {
        const fx = obj.getObjectByName('zonefx');
        if (fx) fx.visible = false;
      }
      if (ent.isPickup) obj.rotation.y = Math.sin(t * 2 + ent.id) * 0.1;

      const rig = this.rigs.get(ent.id);
      if (rig) setVehicleNear(rig, rel < NEAR_DETAIL_MM);
      if (rig && ent.mover) {
        const vxMps = (tr.x - tr.px) * MM_TO_UNITS * 60;
        let indicator: -1 | 0 | 1 = 0;
        if (ent.weaveState === 1 || ent.weaveState === 2) {
          indicator = laneCenterMm(ent.weaveTo ?? ent.lane, cfg) >= xMm ? 1 : -1;
        }
        animateVehicle(rig, {
          dt,
          t,
          speedMps: Math.abs(vz) * MM_TO_UNITS * 60,
          vxMps,
          indicator,
          reduceMotion: this.opts.reduceMotion,
        });
      } else if (ent.mover === 'walker') {
        // A hostile on foot: faces the way they are walking, bobbing; square to camera when still.
        const vx = (tr.x - tr.px) * MM_TO_UNITS * 60;
        const face = Math.abs(vx) > 0.2 ? Math.sign(vx) * (Math.PI / 2) : 0;
        obj.rotation.y += (face - obj.rotation.y) * Math.min(1, dt * 10);
        obj.position.y = Math.abs(vx) > 0.2 && !this.opts.reduceMotion ? Math.abs(Math.sin(t * 9 + ent.id)) * 0.08 : 0;
      }
    }
    for (const [id, mesh] of this.entityMeshes) {
      if (!seen.has(id)) {
        this.scene.remove(mesh);
        this.entityMeshes.delete(id);
        this.rigs.delete(id);
        this.xTrack.delete(id);
      }
    }
  }

  private vehicleFor(ent: SimState['entities'][number], kind: VehicleKind): THREE.Object3D {
    const night = !!(this.opts.weather?.isNight || this.opts.weather?.isNepaOut);
    const rig = buildVehicle(kind, ent.id, {
      oncoming: (ent.vz ?? 0) < 0,
      night,
      dataSaver: this.opts.dataSaver,
    });
    this.rigs.set(ent.id, rig);
    return rig.root;
  }

  /**
   * The stage says the state's name, not Lagos', and the landmark the segment carries
   * decides what stands behind it (a market, a stadium, a bridge rail...).
   */
  private venueDress(ent: SimState['entities'][number]): VenueDress | undefined {
    const name = this.opts.stateName;
    if (!name || !this.opts.world || this.opts.world.stateId === null) return undefined;
    const c = this.opts.config.course;
    const seg = Math.floor((ent.z - c.borderGateMm) / c.segmentLengthMm);
    const type = this.opts.venueTypes?.[Math.max(0, Math.min(seg, 4))];
    return { stateName: name, backdrop: type ? venueBackdrop(type, this.opts.world, ent.id) : null };
  }

  private makeEntity(ent: SimState['entities'][number]): THREE.Object3D {
    if (ent.isZone) {
      switch (ent.zoneKind) {
        case 'pickup':
          return tagFx(buildPickupZone(ent.groupSize ?? ent.value ?? 4, ent.id));
        case 'venue':
          return tagFx(buildVenue(false, ent.id, this.venueDress(ent)));
        case 'grand':
          return tagFx(buildVenue(true, ent.id, this.venueDress(ent)));
        case 'finish':
          return buildFinish(this.opts.finish.label, this.opts.finish.sub);
        default:
          return buildGate(this.opts.gate.label, this.opts.gate.sub);
      }
    }
    if (ent.isRivalConvoy) {
      // C28: a rival is another campaign vehicle on the road, now one that really drives.
      const kinds: VehicleKind[] = ['okada', 'keke', 'car', 'danfo'];
      const kind = kinds[(ent.value ?? 0) % kinds.length]!;
      const root = this.vehicleFor(ent, kind);
      root.add(rivalFlag(kind, this.opts.palette?.accent ?? '#c8e84a'));
      return root;
    }
    if (ent.isPickup) return buildSupporterGroup(ent.value ?? 1, ent.id);
    if (typeof ent.kind === 'string' && isVehicleKind(ent.kind)) return this.vehicleFor(ent, ent.kind);
    return buildObstacle(ent.kind, ent.id);
  }

  private qualityGovernor() {
    if (this.frameTimes.length < 90) return;
    const recent = this.frameTimes.slice(-90);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    if (avg > 0.026 && this.dprCap > 1.0) {
      this.dprCap = Math.max(1.0, this.dprCap - 0.1);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.dprCap));
      this.resize();
      this.frameTimes.length = 0;
    }
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
    window.visualViewport?.removeEventListener('resize', this.onResize);
    this.resizeObs?.disconnect();
    if (this.rig) disposeRig(this.rig);
    if (this.ghostMesh) this.scene.remove(this.ghostMesh); // geometry/material are cached singletons — not owned here
    this.world.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.debugEl?.remove();
    this.canvas.remove();
  }
}

const flagGeos = new Map<string, THREE.BufferGeometry>();
const FLAG_BASE: Record<string, number> = { okada: 1.5, keke: 1.8, car: 1.5, danfo: 2.8 };
/** A pennant on a pole: what tells a rival's convoy vehicle apart from ordinary traffic. */
function rivalFlag(kind: string, color: string): THREE.Mesh {
  let geo = flagGeos.get(color);
  if (!geo) {
    const b = new GeoBuilder();
    b.cyl(0.02, 0.02, 1.0, '#2a2a2c', { y: 0.5 }, 5);
    b.box(0.5, 0.3, 0.02, color, { x: 0.25, y: 0.85 });
    geo = b.build()!;
    flagGeos.set(color, geo);
  }
  const m = new THREE.Mesh(geo, vcMat());
  m.position.set(0, FLAG_BASE[kind] ?? 1.6, 0.2);
  return m;
}

/** Mark the painted road box (last plane child) so it can be hidden once used. */
function tagFx(g: THREE.Group): THREE.Group {
  for (const c of g.children) {
    if (c instanceof THREE.Mesh && c.rotation.x === -Math.PI / 2) c.name = 'zonefx';
  }
  return g;
}
