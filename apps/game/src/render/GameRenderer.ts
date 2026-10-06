import * as THREE from 'three';
import type { SimState, SimEvent } from '@cr/sim';
import { laneCenterMm } from '@cr/sim';
import type { CharacterLook, OutfitChoice, SimConfig } from '@cr/content';
import { MM_TO_UNITS, vcMat } from './materials';
import { World } from './world';
import { buildCharacter, disposeRig, poseCharacter, type CharacterRig } from './character';
import {
  AMBER,
  blobShadow,
  buildFinish,
  buildGate,
  buildObstacle,
  buildOkada,
  buildPickupZone,
  buildSupporterGroup,
  buildVenue,
  personGeo,
} from './props';

export interface RenderOpts {
  look: CharacterLook;
  outfit: OutfitChoice;
  rideId: string;
  config: SimConfig;
  landmarks: string[];
  reduceMotion: boolean;
  dataSaver: boolean;
  debug?: boolean;
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
  private entityMeshes = new Map<number, THREE.Object3D>();
  private followers: Follower[] = [];
  private runaways: Runaway[] = [];
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
    if (this.opts.rideId === 'okada') {
      this.playerRoot.add(buildOkada());
      rig.group.position.set(0, 0.8 - 0.94 * this.opts.look.height, 0.32);
    }
    this.playerRoot.add(rig.group);
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
    this.playerRoot.position.set(pX, hop, pZ);
    this.playerRoot.rotation.z = -(curr.targetLane - 1) * (this.opts.reduceMotion ? 0.02 : 0.07) * (this.opts.rideId === 'okada' ? 1.4 : 0.5);
    this.playerRoot.visible = curr.invulnTicks === 0 || ((curr.invulnTicks >> 2) & 1) === 0;
    this.shadow.position.set(pX, 0.04, pZ);
    if (this.rig) {
      const moving = curr.speed > cfg.brakeSpeedUm * 0.6;
      poseCharacter(this.rig, this.opts.rideId === 'okada' ? 'sit' : moving ? 'run' : 'stand', t, 0.5 + speed01);
      if (hop > 0.05 && this.opts.rideId !== 'okada') {
        this.rig.parts.thighL.rotation.x = -1.1;
        this.rig.parts.thighR.rotation.x = -0.6;
        this.rig.parts.shinL.rotation.x = 1.2;
        this.rig.parts.shinR.rotation.x = 1.4;
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

    // camera chase
    const fov = 58 + speed01 * (this.opts.reduceMotion ? 2 : 8);
    if (Math.abs(this.camera.fov - fov) > 0.05) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    let sx = 0;
    let sy = 0;
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const mag = this.shakeT * 0.35;
      sx = (Math.random() - 0.5) * mag;
      sy = (Math.random() - 0.5) * mag;
    }
    this.camera.position.set(pX * 0.5 + sx, 3.3 + sy, pZ + 7.2);
    this.camera.lookAt(pX * 0.3, 1.25, pZ - 10);

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
