import * as THREE from 'three';
import type { CharacterLook, OutfitChoice } from '@cr/content';
import { buildCharacter, disposeRig, poseCharacter, type CharacterRig, type Pose } from './character';
import { GeoBuilder } from './geo';
import { vcMat } from './materials';

function addLights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight('#fff4de', '#6a5a4a', 1.25));
  const key = new THREE.DirectionalLight('#fff0d0', 2.0);
  key.position.set(2.5, 4, 3.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#7fd4ff', 1.1);
  rim.position.set(-3, 2.5, -3);
  scene.add(rim);
}

function pedestal(): THREE.Mesh | null {
  const b = new GeoBuilder();
  b.cyl(0.75, 0.82, 0.08, '#1b2a4a', { y: -0.04 }, 40);
  b.cyl(0.78, 0.78, 0.012, '#f5c518', { y: 0.004 }, 40);
  b.cyl(0.62, 0.62, 0.014, '#2a6f97', { y: 0.006 }, 40);
  const g = b.build();
  return g ? new THREE.Mesh(g, vcMat()) : null;
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
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 30);
    addLights(this.scene);
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

/** One-off head-and-shoulders portraits (PNG data URLs) from the real 3D models. */
export function renderPortraits(
  items: Array<{ id: string; look: CharacterLook; outfit: OutfitChoice }>,
  size = 224,
): Record<string, string> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  addLights(scene);
  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 20);
  const out: Record<string, string> = {};
  for (const it of items) {
    const rig = buildCharacter(it.look, it.outfit);
    rig.group.rotation.y = -0.25;
    poseCharacter(rig, 'stand', 0, 1);
    scene.add(rig.group);
    const s = it.look.height;
    camera.position.set(0.15, 1.58 * s, 1.95);
    camera.lookAt(0, 1.46 * s, 0);
    renderer.render(scene, camera);
    out[it.id] = canvas.toDataURL('image/png');
    scene.remove(rig.group);
    disposeRig(rig);
  }
  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}
