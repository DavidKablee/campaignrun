import * as THREE from 'three';
import type { SimState, SimEvent } from '@cr/sim';
import { laneCenterMm } from '@cr/sim';
import type { CharacterLook, OutfitChoice, SimConfig } from '@cr/content';
import { MM_TO_UNITS, ghostMat, vcMat } from './materials';
import type { GhostFrame } from '../ghostReplay';
import { World } from './world';
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
  personGeo,
} from './props';

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
  reduceMotion: boolean;
  dataSaver: boolean;
  debug?: boolean;
  /** C29: your personal-best run for this state, precomputed into positions-per-tick. */
  ghostTrajectory?: GhostFrame[];
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

const AMBER_ON = new THREE.Color('#ffb020');
const AMBER_OFF = new THREE.Color('#5a3200');

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
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 180);

    this.world = new World(this.scene, opts.config, opts.landmarks);
    this.world.update(0, true);

    this.scene.add(this.playerRoot);
    this.scene.add(this.shadow);
    this.buildPlayer();

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
      if (e.type === 'dent' || e.type === 'hit') this.shakeT = this.opts.reduceMotion ? 0.05 : 0.28;
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
    const fovTarget = 58 + speed01 * (this.opts.reduceMotion ? 2 : 8);
    this.camera.fov += (fovTarget - this.camera.fov) * Math.min(1, dt * 7);
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
    this.camX += (pX * 0.5 - this.camX) * camLerp;
    this.camY += (3.3 - dip - this.camY) * camLerp;
    this.camZ += (pZ + 7.2 - this.camZ) * camLerp;
    this.camera.position.set(this.camX + sx, this.camY + sy, this.camZ);
    this.camera.lookAt(pX * 0.3, 1.25, pZ - 10);
    const leanTarget = -(curr.targetLane - 1) * (this.opts.reduceMotion ? 0.006 : 0.03);
    this.camLean += (leanTarget - this.camLean) * Math.min(1, dt * 6);
    this.camera.rotateZ(this.camLean);

    this.syncEntities(curr, zMm, t);

    AMBER().color.copy(AMBER_OFF).lerp(AMBER_ON, 0.5 + 0.5 * Math.sin(t * 9));

    if (this.debugEl) {
      const info = this.renderer.info;
      const avg = this.frameTimes.reduce((a, b) => a + b, 0) / Math.max(1, this.frameTimes.length);
      this.debugEl.textContent = `${Math.round(1 / Math.max(0.001, avg))} fps · draws ${info.render.calls} · tris ${info.render.triangles} · dpr ${this.renderer.getPixelRatio().toFixed(2)}`;
    }
    this.renderer.render(this.scene, this.camera);
  }

  private syncEntities(curr: SimState, zMm: number, t: number) {
    const seen = new Set<number>();
    for (const ent of curr.entities) {
      if (!ent.active && !ent.isZone) continue;
      const rel = ent.z - zMm;
      if (rel < -30000 || rel > 150000) continue;
      seen.add(ent.id);
      let obj = this.entityMeshes.get(ent.id);
      if (!obj) {
        obj = this.makeEntity(ent);
        this.scene.add(obj);
        this.entityMeshes.set(ent.id, obj);
      }
      const x = laneCenterMm(ent.lane, this.opts.config) * MM_TO_UNITS;
      obj.position.set(x, 0, -ent.z * MM_TO_UNITS);
      if (ent.isZone && ent.consumed) {
        const fx = obj.getObjectByName('zonefx');
        if (fx) fx.visible = false;
      }
      if (ent.isPickup) obj.rotation.y = Math.sin(t * 2 + ent.id) * 0.1;
    }
    for (const [id, mesh] of this.entityMeshes) {
      if (!seen.has(id)) {
        this.scene.remove(mesh);
        this.entityMeshes.delete(id);
      }
    }
  }

  private makeEntity(ent: SimState['entities'][number]): THREE.Object3D {
    if (ent.isZone) {
      switch (ent.zoneKind) {
        case 'pickup':
          return tagFx(buildPickupZone(ent.groupSize ?? ent.value ?? 4, ent.id));
        case 'venue':
          return tagFx(buildVenue(false, ent.id));
        case 'grand':
          return tagFx(buildVenue(true, ent.id));
        case 'finish':
          return buildFinish();
        default:
          return buildGate('WELCOME TO LAGOS', 'Ẹ káàbọ̀ sí Èkó');
      }
    }
    if (ent.isRivalConvoy) {
      // C28: reuse the C26 ride models for visual variety — a rival is just another campaign vehicle.
      const models = [buildOkada, buildKeke, buildHilux, buildDanfo];
      const build = models[(ent.value ?? 0) % models.length]!;
      const g = build();
      g.scale.setScalar(1.15); // read clearly as "another convoy", not the player's own ride
      return g;
    }
    if (ent.isPickup) return buildSupporterGroup(ent.value ?? 1, ent.id);
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
    if (this.rig) disposeRig(this.rig);
    if (this.ghostMesh) this.scene.remove(this.ghostMesh); // geometry/material are cached singletons — not owned here
    this.world.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.debugEl?.remove();
    this.canvas.remove();
  }
}

/** Mark the painted road box (last plane child) so it can be hidden once used. */
function tagFx(g: THREE.Group): THREE.Group {
  for (const c of g.children) {
    if (c instanceof THREE.Mesh && c.rotation.x === -Math.PI / 2) c.name = 'zonefx';
  }
  return g;
}
