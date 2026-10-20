import * as THREE from 'three';
import type { CharacterLook, OutfitChoice } from '@cr/content';
import { buildCharacter, disposeRig, poseCharacter, type CharacterRig, type Pose } from './character';
import { GeoBuilder } from './geo';
import { outlineMat, vcMat } from './materials';

/**
 * Three-point rig for a single character on show.
 *
 * The old rig ran hemisphere 1.25 + key 2.0 + rim 1.1. Hemisphere light is not
 * put through the toon ramp, so a 1.25 floor meant every surface already sat on
 * the ramp's top step before the key was added: the whole figure resolved to one
 * tone per colour and read as a paper cut-out. Total irradiance here stays near
 * 1 on the lit side and near 0.4 on the shadow side, which is what gives the
 * ramp something to band across.
 *
 * Returns the key light so the caller can wire up shadows.
 */
function addLights(scene: THREE.Scene): THREE.DirectionalLight {
  scene.add(new THREE.HemisphereLight('#fff4de', '#4a4036', 0.42));
  const key = new THREE.DirectionalLight('#fff0d0', 1.0);
  key.position.set(1.7, 5.4, 2.3);
  scene.add(key);
  // Cool rim from behind-left: separates the silhouette from the backdrop and is
  // the cheapest cue that a shape is round rather than printed.
  const rim = new THREE.DirectionalLight('#8fd8ff', 0.55);
  rim.position.set(-3.2, 2.2, -2.6);
  scene.add(rim);
  // Front bounce. Carries more weight than a bounce light normally would because
  // the face is a flat plate facing +z: under the key alone its one normal lands
  // mid-ramp and the whole face reads as a dark smudge at chip size.
  const fill = new THREE.DirectionalLight('#ffd8b0', 0.34);
  fill.position.set(-1.5, 1.1, 3.4);
  scene.add(fill);
  return key;
}

/** Tight ortho shadow frustum around one ~2-unit-tall character. */
function enableCharacterShadows(renderer: THREE.WebGLRenderer, key: THREE.DirectionalLight, mapSize = 1024) {
  renderer.shadowMap.enabled = true;
  // PCFSoftShadowMap was removed in three 0.186 and silently falls back to this.
  renderer.shadowMap.type = THREE.PCFShadowMap;
  key.castShadow = true;
  key.shadow.mapSize.set(mapSize, mapSize);
  const c = key.shadow.camera;
  c.left = -1.4;
  c.right = 1.4;
  c.top = 2.4;
  c.bottom = -0.6;
  c.near = 0.5;
  c.far = 14;
  c.updateProjectionMatrix();
  key.shadow.bias = -0.0012;
  key.shadow.normalBias = 0.02;
}

/**
 * Opt the rig's solid meshes into shadow casting. The outline shells are
 * BackSide copies of the same geometry — letting them cast would thicken and
 * offset every shadow, so they stay out of the shadow pass.
 */
function castShadows(rig: CharacterRig) {
  const outline = outlineMat();
  rig.group.traverse((o) => {
    if (o instanceof THREE.Mesh && o.material !== outline) o.castShadow = true;
  });
}

/** Invisible ground that collects the character's contact shadow and nothing else. */
function shadowCatcher(size = 4): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.ShadowMaterial({ opacity: 0.38, transparent: true }),
  );
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

function pedestal(): THREE.Mesh | null {
  const b = new GeoBuilder();
  b.cyl(0.75, 0.82, 0.08, '#1b2a4a', { y: -0.04 }, 40);
  b.cyl(0.78, 0.78, 0.012, '#f5c518', { y: 0.004 }, 40);
  b.cyl(0.62, 0.62, 0.014, '#2a6f97', { y: 0.006 }, 40);
  const g = b.build();
  if (!g) return null;
  const m = new THREE.Mesh(g, vcMat());
  m.receiveShadow = true;
  return m;
}

/** Interactive turntable: drag to turn, auto-spin when idle. */
export class CharacterStudio {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private rig: CharacterRig | null = null;
  private turn = 0.4;
  private spinVel = 0.3;
  private dragging = false;
  private lastX = 0;
  private idleT = 0;
  private raf = 0;
  private pose: Pose = 'stand';
  private t0 = performance.now();
  private disposers: Array<() => void> = [];
  private zoom = 0;

  constructor(private host: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cr-studio-canvas';
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 30);
    const key = addLights(this.scene);
    enableCharacterShadows(this.renderer, key);
    const ped = pedestal();
    if (ped) this.scene.add(ped);
    host.appendChild(this.canvas);
    this.resize();

    const down = (e: PointerEvent) => {
      this.dragging = true;
      this.lastX = e.clientX;
      this.spinVel = 0;
      this.canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      this.lastX = e.clientX;
      this.turn += dx * 0.012;
      this.spinVel = dx * 0.012 * 60;
      this.idleT = 0;
    };
    const up = () => {
      this.dragging = false;
    };
    this.canvas.addEventListener('pointerdown', down);
    this.canvas.addEventListener('pointermove', move);
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(host);
    this.disposers.push(() => {
      this.canvas.removeEventListener('pointerdown', down);
      this.canvas.removeEventListener('pointermove', move);
      this.canvas.removeEventListener('pointerup', up);
      this.canvas.removeEventListener('pointercancel', up);
      ro.disconnect();
    });
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      this.frame();
    };
    this.raf = requestAnimationFrame(loop);
  }

  setCharacter(look: CharacterLook, outfit: OutfitChoice) {
    if (this.rig) {
      this.scene.remove(this.rig.group);
      disposeRig(this.rig);
    }
    this.rig = buildCharacter(look, outfit);
    castShadows(this.rig);
    this.scene.add(this.rig.group);
  }

  setPose(p: Pose) {
    this.pose = p;
  }

  rotateBy(rad: number) {
    this.turn += rad;
    this.spinVel = 0;
    this.idleT = 0;
  }

  setZoom(z: number) {
    this.zoom = z;
  }

  private resize() {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private frame() {
    const t = (performance.now() - this.t0) / 1000;
    if (!this.dragging) {
      this.idleT += 1 / 60;
      if (this.idleT > 2.5) this.spinVel = this.spinVel * 0.9 + 0.3 * 0.1;
      else this.spinVel *= 0.94;
      this.turn += this.spinVel / 60;
    }
    if (this.rig) {
      this.rig.group.rotation.y = this.turn;
      poseCharacter(this.rig, this.pose, t, 0.8);
    }
    const dist = 5.2 - this.zoom * 1.6;
    const camY = 1.05 + this.zoom * 0.45;
    this.camera.position.set(0, camY, dist);
    this.camera.lookAt(0, 0.92 + this.zoom * 0.5, 0);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    for (const d of this.disposers) d();
    if (this.rig) disposeRig(this.rig);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }
}

export interface PortraitOptions {
  width?: number;
  height?: number;
  /** Share of the character's full height to frame: 0.42 head-and-shoulders, ~0.95 half body. */
  frame?: number;
  /**
   * Where the framed window sits relative to the top of the head, as a share of
   * the window height. At 0.5 the window's top edge lands exactly on the crown
   * (no headroom); below 0.5 leaves space above the head.
   */
  yBias?: number;
}

/** Head-and-shoulders: big enough to read a face and headwear in a 64 px chip. */
const PORTRAIT_FRAME = 0.42;

let portraitRenderer: THREE.WebGLRenderer | null = null;
let portraitCanvas: HTMLCanvasElement | null = null;

/**
 * ONE shared offscreen context for every portrait bake, resized per call.
 *
 * The picker bakes two sets back to back (chips, then heroes). Creating and
 * immediately destroying a WebGLRenderer per set meant two context creations in
 * the same tick on top of whatever the splash and the game already hold — and
 * browsers cap live contexts (commonly 16), dropping the oldest. When that cap
 * is hit the bake silently produces nothing and the picker falls back to initial
 * letters, which is exactly the "blank cards" symptom C32 set out to fix. One
 * long-lived context cannot race itself.
 */
function portraitGL(width: number, height: number) {
  if (!portraitRenderer || !portraitCanvas) {
    portraitCanvas = document.createElement('canvas');
    portraitRenderer = new THREE.WebGLRenderer({
      canvas: portraitCanvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    // Supersample: a portrait bakes once and is then scaled down by the browser,
    // so 2x buys clean edges on the outline shell for no per-frame cost.
    portraitRenderer.setPixelRatio(2);
    portraitRenderer.setClearColor(0x000000, 0);
    portraitRenderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  portraitRenderer.setSize(width, height, false);
  return { renderer: portraitRenderer, canvas: portraitCanvas };
}

/**
 * One-off portraits (PNG data URLs) rendered from the real 3D models.
 * Default is a head-and-shoulders chip; pass a taller `frame` for a hero shot
 * that includes the character's signature prop.
 */
export function renderPortraits(
  items: Array<{ id: string; look: CharacterLook; outfit: OutfitChoice }>,
  opts: PortraitOptions = {},
): Record<string, string> {
  const width = opts.width ?? 224;
  const height = opts.height ?? 224;
  const frameShare = opts.frame ?? PORTRAIT_FRAME;
  const yBias = opts.yBias ?? 0.43;
  const { renderer, canvas } = portraitGL(width, height);
  const scene = new THREE.Scene();
  const key = addLights(scene);
  enableCharacterShadows(renderer, key, 512);
  scene.add(shadowCatcher(2));
  const camera = new THREE.PerspectiveCamera(22, width / height, 0.1, 20);
  const out: Record<string, string> = {};
  for (const it of items) {
    const rig = buildCharacter(it.look, it.outfit);
    castShadows(rig);
    rig.group.rotation.y = -0.25;
    poseCharacter(rig, 'stand', 0, 1);
    scene.add(rig.group);
    // Frame head-and-shoulders from the rig's real bounds. Hard-coded eye heights
    // drift the moment character proportions change (they did in C21, which left
    // this camera aiming above the head), so measure instead of assuming.
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(rig.group);
    const top = box.max.y;
    const frameH = Math.max(0.3, (top - box.min.y) * frameShare);
    const centreY = top - frameH * yBias;
    const dist = frameH / (2 * Math.tan((camera.fov * Math.PI) / 360));
    camera.position.set(0.15, centreY + 0.03, dist);
    camera.lookAt(0, centreY, 0);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    out[it.id] = canvas.toDataURL('image/png');
    scene.remove(rig.group);
    disposeRig(rig);
  }
  return out;
}

/** Drops the shared portrait context. Nothing in the app calls this today — the
 *  renderer is meant to outlive any one picker visit — but it keeps the module
 *  symmetrical with disposeMaterials() for tests and teardown. */
export function disposePortraitRenderer() {
  if (!portraitRenderer) return;
  portraitRenderer.dispose();
  portraitRenderer.forceContextLoss();
  portraitRenderer = null;
  portraitCanvas = null;
}
