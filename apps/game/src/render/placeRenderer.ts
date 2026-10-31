import * as THREE from 'three';
import { outfits, partyForContender, places, stepToward, type PlacePhrase } from '@cr/content';
import { getCharacter } from '../characters';
import { mulberry } from './geo';
import { buildCharacter, disposeRig, poseCharacter, randomPerson, type CharacterRig, type Pose } from './character';
import { bend, glowMat } from './materials';
import { buildPlaceScenery, disposeScenery, lookForZone } from './placeScene';

/**
 * Draws one Mobilise place (C82): the scenery, the people standing in it, and their name tags and
 * speech bubbles. It is told what happened (a member appeared, moved, acted, spoke); it never talks
 * to the network, so the same renderer works for a test or a replay of events.
 *
 * Walking is simulated here with the same `stepToward` and speed the server uses, so what you see
 * is where the server thinks each person is. Name tags and bubbles are plain DOM positioned from the
 * projected head, which keeps them sharp and keeps text out of the WebGL pass.
 */

export interface AvatarState {
  id: string;
  name: string;
  seed: number;
  look: { contenderId: string } | null;
  title?: string | null;
  x: number;
  z: number;
  tx: number;
  tz: number;
}

interface Avatar {
  state: AvatarState;
  self: boolean;
  rig: CharacterRig;
  shadow: THREE.Mesh;
  tag: HTMLDivElement;
  bubble: HTMLDivElement | null;
  bubbleUntil: number;
  poseOverride: { pose: Pose; until: number } | null;
  faceY: number;
  /** Seconds, for the idle/stride animation phase. */
  phase: number;
  /** Ambient characters wander on their own and are never players. */
  local: boolean;
  nextMoveAt: number;
}

export interface PlaceRendererOptions {
  kind: string;
  zone: string;
  seed: number;
  reduceMotion: boolean;
  dataSaver: boolean;
  /** Called with a ground point when the player taps empty ground. */
  onTap: (x: number, z: number) => void;
  /** Called with a member id when the player taps a person. */
  onTapPerson: (id: string) => void;
}

const FACE_UP = 1.5;

/** A name tag: the name, and under it a title if the player wears one (C91). Text only, from a fixed list. */
function setTagText(tag: HTMLElement, name: string, title: string | null) {
  tag.textContent = name;
  if (!title) return;
  const small = document.createElement('small');
  small.textContent = title;
  tag.append(small);
}
const sashMats = new Map<string, THREE.MeshBasicMaterial>();

export class PlaceRenderer {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(46, 1, 0.1, 160);
  private overlay: HTMLDivElement;
  private scenery: THREE.Group;
  private avatars = new Map<string, Avatar>();
  private selfId: string | null = null;
  private raf = 0;
  private last = performance.now();
  private clock = 0;
  private ro: ResizeObserver;
  private camX = 0;
  private camZ = 0;
  private ray = new THREE.Raycaster();
  private ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private downAt = { x: 0, y: 0, t: 0 };
  private phrasePhrases = new Map<string, PlacePhrase>(places.phrases.map((p) => [p.id, p]));
  private lang: 'en' | 'pcm' = 'en';
  private disposed = false;
  private markers: THREE.Mesh;
  private markerUntil = 0;

  constructor(private host: HTMLElement, private opts: PlaceRendererOptions) {
    // The bend shader is shared with the road; a place is flat.
    bend.uCurveX.value = 0;
    bend.uCurveY.value = 0;

    const look = lookForZone(opts.zone);
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cr-place-canvas';
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !opts.dataSaver, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.dataSaver ? 1 : 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.background = new THREE.Color(look.sky);
    this.scene.fog = new THREE.Fog(look.sky, 38, 90);

    this.scene.add(new THREE.HemisphereLight('#fff4de', '#6a5a46', 0.8));
    const sun = new THREE.DirectionalLight('#fff0d0', 1.1);
    sun.position.set(6, 14, 8);
    this.scene.add(sun);

    this.scenery = buildPlaceScenery(opts.kind, look, opts.seed, places.bounds.halfX, places.bounds.halfZ);
    this.scene.add(this.scenery);

    // A ring that shows where a tap sent you.
    this.markers = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.4, 20), glowMat('place-marker', '#ffffff', { transparent: true, opacity: 0.85 }));
    this.markers.rotation.x = -Math.PI / 2;
    this.markers.position.y = 0.06;
    this.markers.visible = false;
    this.scene.add(this.markers);

    this.overlay = document.createElement('div');
    this.overlay.className = 'cr-place-overlay';
    host.append(this.canvas, this.overlay);

    this.canvas.addEventListener('pointerdown', this.onDown);
    this.canvas.addEventListener('pointerup', this.onUp);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.placeCamera(0, 0, true);

    const loop = (now: number) => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.frame(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  setLanguage(lang: 'en' | 'pcm') {
    this.lang = lang;
  }

  /** Replaces everyone in the place (first snapshot, or a reconnect). */
  setMembers(members: AvatarState[], selfId: string) {
    this.selfId = selfId;
    const keep = new Set(members.map((m) => m.id));
    for (const [id, a] of [...this.avatars]) if (!a.local && !keep.has(id)) this.remove(id);
    for (const m of members) this.upsert(m);
  }

  /**
   * Ambient locals: labelled characters who wander so a quiet place is not empty. They are
   * scenery, not players: they never speak, never count as people here and cannot be tapped.
   */
  setLocals(count: number) {
    const have = [...this.avatars.values()].filter((a) => a.local).length;
    for (let i = have; i < count; i++) {
      const r = mulberry(this.opts.seed * 31 + i * 977);
      const x = r.range(-places.bounds.halfX * 0.8, places.bounds.halfX * 0.8);
      const z = r.range(-places.bounds.halfZ * 0.6, places.bounds.halfZ * 0.8);
      this.upsert({ id: `local-${i}`, name: 'Local', seed: 4000 + this.opts.seed % 997 + i * 13, look: null, x, z, tx: x, tz: z }, true);
    }
    for (let i = have - 1; i >= count; i--) this.remove(`local-${i}`);
  }

  upsert(m: AvatarState, local = false) {
    const existing = this.avatars.get(m.id);
    if (existing) {
      // Someone opted in or out while standing here: rebuild them so the room sees it at once.
      if (existing.state.look?.contenderId === m.look?.contenderId) {
        if ((existing.state.title ?? null) !== (m.title ?? null)) setTagText(existing.tag, existing.self ? `${m.name} (you)` : m.name, m.title ?? null);
        existing.state = { ...m };
        return;
      }
      this.remove(m.id);
    }
    const self = !local && m.id === this.selfId;
    // A plain citizen from the seed, unless this player chose to show their Contender (C89).
    const { look, outfit } = m.look ? getCharacter(m.look.contenderId, undefined) : randomPerson(m.seed, { colors: outfits.options.colors });
    const rig = buildCharacter(look, outfit, self ? 'hi' : 'lo');
    if (m.look) this.addSash(rig, m.look.contenderId);
    rig.group.position.set(m.x, 0, m.z);
    this.scene.add(rig.group);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 14), glowMat('blob', '#000000', { transparent: true, opacity: 0.3 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(m.x, 0.05, m.z);
    this.scene.add(shadow);
    const tag = document.createElement('div');
    tag.className = `cr-place-tag${self ? ' is-self' : ''}${local ? ' is-local' : ''}`;
    setTagText(tag, local ? 'Local' : self ? `${m.name} (you)` : m.name, local ? null : (m.title ?? null));
    this.overlay.append(tag);
    this.avatars.set(m.id, {
      state: { ...m },
      self,
      rig,
      shadow,
      tag,
      bubble: null,
      bubbleUntil: 0,
      poseOverride: null,
      faceY: FACE_UP * look.height,
      phase: Math.random() * 6,
      local,
      nextMoveAt: this.clock + 1 + Math.random() * 3,
    });
  }

  /** A plain band across the chest in the Contender's party colour. No emblem, symbol or slogan (guardrail 3). */
  private addSash(rig: CharacterRig, contenderId: string) {
    const colour = partyForContender(contenderId)?.color;
    if (!colour) return;
    const geo = new THREE.BoxGeometry(0.64, 0.1, 0.36);
    let mat = sashMats.get(colour);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colour) });
      sashMats.set(colour, mat);
    }
    const sash = new THREE.Mesh(geo, mat);
    sash.position.set(0, 1.02, 0);
    sash.rotation.z = -0.75;
    rig.group.add(sash);
    rig.geometries.push(geo);
  }

  remove(id: string) {
    const a = this.avatars.get(id);
    if (!a) return;
    this.scene.remove(a.rig.group, a.shadow);
    disposeRig(a.rig);
    a.shadow.geometry.dispose();
    a.tag.remove();
    a.bubble?.remove();
    this.avatars.delete(id);
  }

  /** The server's word on where someone is and where they are headed. */
  retarget(id: string, p: { x: number; z: number; tx: number; tz: number }) {
    const a = this.avatars.get(id);
    if (a) Object.assign(a.state, p);
  }

  /** Where this person is standing right now, for the "someone nearby" check. */
  positionOf(id: string): { x: number; z: number } | null {
    const a = this.avatars.get(id);
    return a ? { x: a.state.x, z: a.state.z } : null;
  }

  playAction(id: string, pose: Pose, seconds: number) {
    const a = this.avatars.get(id);
    if (a) a.poseOverride = { pose, until: this.clock + seconds };
  }

  say(id: string, what: { phrase?: string; emoji?: string; text?: string }) {
    const a = this.avatars.get(id);
    if (!a) return;
    const text = what.text ?? what.emoji ?? (what.phrase ? this.phrasePhrases.get(what.phrase)?.[this.lang] : undefined);
    if (!text) return;
    a.bubble?.remove();
    const el = document.createElement('div');
    el.className = `cr-place-bubble${what.emoji ? ' is-emoji' : ''}`;
    el.textContent = text;
    this.overlay.append(el);
    a.bubble = el;
    a.bubbleUntil = this.clock + (what.emoji ? 2.4 : what.text ? 6 : 4.2);
  }

  showMarker(x: number, z: number) {
    this.markers.position.set(x, 0.06, z);
    this.markers.visible = true;
    this.markerUntil = this.clock + 0.9;
  }

  get stats() {
    return { draws: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, people: [...this.avatars.values()].filter((a) => !a.local).length, locals: [...this.avatars.values()].filter((a) => a.local).length };
  }

  private onDown = (e: PointerEvent) => {
    this.downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  };

  private onUp = (e: PointerEvent) => {
    const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
    if (moved > 12 || performance.now() - this.downAt.t > 500) return;
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    // A tap near someone's body selects them. Measured on the screen, not in the world, so a
    // thumb has a generous target (at least 30 px) however far away they are.
    let best: { id: string; d: number } | null = null;
    const p = new THREE.Vector3();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    for (const a of this.avatars.values()) {
      if (a.self || a.local) continue;
      p.set(a.state.x, 0.55, a.state.z).project(this.camera);
      if (p.z > 1) continue;
      const d = Math.hypot((p.x * 0.5 + 0.5) * rect.width - px, (-p.y * 0.5 + 0.5) * rect.height - py);
      if (d < 34 && (!best || d < best.d)) best = { id: a.state.id, d };
    }
    if (best) {
      this.opts.onTapPerson(best.id);
      return;
    }
    const hit = new THREE.Vector3();
    if (this.ray.ray.intersectPlane(this.ground, hit)) this.opts.onTap(hit.x, hit.z);
  };

  private resize() {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // A tall phone sees little sideways, so widen the view to keep the whole width of the place.
    this.camera.fov = w / h < 0.8 ? 62 : 46;
    this.camera.updateProjectionMatrix();
  }

  /** Follows the player gently; the whole place stays roughly in view. */
  private placeCamera(tx: number, tz: number, snap = false) {
    const k = snap ? 1 : 0.08;
    this.camX += (tx * 0.45 - this.camX) * k;
    this.camZ += (tz * 0.3 - this.camZ) * k;
    const portrait = this.camera.aspect < 0.8;
    this.camera.position.set(this.camX, portrait ? 14 : 10.5, this.camZ + (portrait ? 14 : 11.5));
    this.camera.lookAt(this.camX, 0.4, this.camZ - 1);
  }

  private frame(dt: number) {
    this.clock += dt;
    const reduce = this.opts.reduceMotion;
    const pos = new THREE.Vector3();
    for (const a of this.avatars.values()) {
      const s = a.state;
      if (a.local && this.clock >= a.nextMoveAt && !a.poseOverride) {
        const tx = (Math.random() * 2 - 1) * places.bounds.halfX * 0.85;
        const tz = (Math.random() * 2 - 1) * places.bounds.halfZ * 0.8;
        s.tx = tx;
        s.tz = tz;
        a.nextMoveAt = this.clock + 4 + Math.random() * 7;
      }
      const next = stepToward({ x: s.x, z: s.z }, { x: s.tx, z: s.tz }, dt, places.walkSpeedMetresPerSecond * (a.local ? 0.45 : 1));
      const dx = next.x - s.x;
      const dz = next.z - s.z;
      const moving = Math.hypot(s.tx - next.x, s.tz - next.z) > 0.02;
      s.x = next.x;
      s.z = next.z;
      a.rig.group.position.set(s.x, 0, s.z);
      a.shadow.position.set(s.x, 0.05, s.z);
      if (Math.hypot(dx, dz) > 0.001) {
        const want = Math.atan2(dx, dz);
        let diff = want - a.rig.group.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        a.rig.group.rotation.y += diff * Math.min(1, dt * 10);
      }
      a.phase += dt;
      if (a.poseOverride && a.poseOverride.until < this.clock) a.poseOverride = null;
      const pose: Pose = a.poseOverride?.pose ?? (moving ? 'run' : 'stand');
      poseCharacter(a.rig, pose, reduce && !moving && !a.poseOverride ? 0 : a.phase, moving ? 0.8 : 0.1);

      pos.set(s.x, a.faceY, s.z).project(this.camera);
      const visible = pos.z < 1;
      const px = (pos.x * 0.5 + 0.5) * this.host.clientWidth;
      const py = (-pos.y * 0.5 + 0.5) * this.host.clientHeight;
      a.tag.style.transform = `translate(-50%, -100%) translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      a.tag.style.display = visible ? '' : 'none';
      if (a.bubble) {
        if (a.bubbleUntil < this.clock) {
          a.bubble.remove();
          a.bubble = null;
        } else {
          a.bubble.style.transform = `translate(-50%, -100%) translate(${px.toFixed(1)}px, ${(py - 22).toFixed(1)}px)`;
        }
      }
    }
    const me = this.selfId ? this.avatars.get(this.selfId) : undefined;
    this.placeCamera(me?.state.x ?? 0, me?.state.z ?? 0);
    if (this.markers.visible && this.markerUntil < this.clock) this.markers.visible = false;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onDown);
    this.canvas.removeEventListener('pointerup', this.onUp);
    for (const id of [...this.avatars.keys()]) this.remove(id);
    this.scene.remove(this.scenery);
    disposeScenery(this.scenery);
    this.markers.geometry.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.overlay.remove();
    this.canvas.remove();
  }
}
