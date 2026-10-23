import * as THREE from 'three';
import { regionCentre, regionPolygon } from '@cr/content';

/**
 * The campaign board: an invented continent on an open sea, one raised landmass
 * per region, coloured by who leads it.
 *
 * Outlines come from `@cr/content`'s `regionPolygon`, which walks each region's
 * hex slot and pushes every lattice point off true — so regions read as
 * coastline rather than honeycomb while still tiling without gaps. Nothing here
 * is traced from a real map (see `packages/content/data/map.json`).
 *
 * Materials are built and cached here rather than taken from `materials.ts`,
 * because those are patched with the road's shared `bend` uniform: the board
 * would pick up the road curve the moment a run set it.
 */

export interface BoardTile {
  stateId: string;
  /** Three letters for the region label. */
  abbr: string;
  /** Hex-lattice slot from map.json; the coastline is derived from it. */
  col: number;
  row: number;
  /** Fill colour: the leading Party, or a neutral for contested / not yet open. */
  color: string;
  open: boolean;
  /** The player's Party leads here. */
  mine: boolean;
  contested: boolean;
}

export interface BoardOptions {
  reduceMotion: boolean;
  dataSaver: boolean;
  onSelect: (stateId: string) => void;
}

/** Prism height by region state, in hex radii. */
const H_CLOSED = 0.34;
const H_CONTESTED = 0.6;
const H_HELD = 0.82;
const H_MINE = 1.15;

const SEA = '#0A1A24';
/** A touch lighter than the horizon, so the coast has something to sit on. */
const SEA_FLOOR = '#0E2634';
const GRATICULE = '#1C4256';
/** Bevel depth on the coast. The extrusion runs -BEVEL..1+BEVEL, so anything
 *  sitting on the top face has to clear it or the land swallows it. */
const BEVEL = 0.04;
const TOP = 1 + BEVEL;
/** Radians above the board. Shallow enough that the prism sides read. */
const TILT = 0.76;
/** How far a drag may turn the board. A map that faces away stops being a map. */
const MAX_TURN = 0.22;
/** Extra height the focused tile rises by — the fit has to leave room for it. */
const FOCUS_LIFT = 0.3;
/** Fraction of the frame the board may fill, leaving a margin at the edges. */
const EDGE = 0.96;

interface Tile {
  stateId: string;
  mesh: THREE.Mesh;
  geo: THREE.ExtrudeGeometry;
  /** The region's outline in world XZ, for camera fitting. */
  outline: { x: number; z: number }[];
  label: THREE.Mesh;
  labelTex: THREE.CanvasTexture;
  baseHeight: number;
  lift: number;
  liftTarget: number;
}

export class CampaignBoard {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private group = new THREE.Group();
  private tiles = new Map<string, Tile>();
  private labelGeo: THREE.PlaneGeometry;
  private sea: THREE.Mesh | null = null;
  private grid: THREE.LineSegments | null = null;
  private mats = new Map<string, THREE.MeshToonMaterial>();
  private ray = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private raf = 0;
  private disposers: Array<() => void> = [];
  private focusId: string | null = null;
  private hoverId: string | null = null;
  private turn = 0;
  private turnTarget = 0;
  private dragging = false;
  private dragged = false;
  private lastX = 0;
  private centre = new THREE.Vector3();
  private radius = 6;
  private last = 0;

  constructor(
    private host: HTMLElement,
    private opts: BoardOptions,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cr-board-canvas';
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !opts.dataSaver });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.dataSaver ? 1 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(new THREE.Color(SEA), 1);
    this.scene.background = new THREE.Color(SEA);
    this.scene.fog = new THREE.Fog(SEA, 14, 34);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
    this.addLights();
    this.scene.add(this.group);

    this.labelGeo = new THREE.PlaneGeometry(1.5, 0.75);
    this.labelGeo.rotateX(-Math.PI / 2);

    host.appendChild(this.canvas);
    this.resize();
    this.bindInput();

    const loop = (t: number) => {
      this.raf = requestAnimationFrame(loop);
      this.frame(t);
    };
    this.raf = requestAnimationFrame(loop);
  }

  // -- setup ---------------------------------------------------------------

  private addLights() {
    // Kept deliberately under the toon ramp's top step (see C33): a hemisphere
    // term is not ramped, so too much of it flattens every side face.
    this.scene.add(new THREE.HemisphereLight('#cfe9f5', '#2b3a45', 0.45));
    const key = new THREE.DirectionalLight('#fff3dc', 1.05);
    key.position.set(5, 9, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight('#8fd8ff', 0.4);
    rim.position.set(-6, 4, -5);
    this.scene.add(rim);
  }

  private mat(color: string): THREE.MeshToonMaterial {
    let m = this.mats.get(color);
    if (!m) {
      m = new THREE.MeshToonMaterial({ color: new THREE.Color(color) });
      this.mats.set(color, m);
    }
    return m;
  }

  private labelTexture(abbr: string): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Dark stroke under white fill, so one static texture reads on every fill
    // colour — the alternative is re-baking 37 textures whenever a region flips.
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(12,16,20,0.85)';
    ctx.strokeText(abbr, 64, 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(abbr, 64, 34);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  // -- content -------------------------------------------------------------

  /** Build or recolour the board. Meshes are keyed by state id and reused. */
  setTiles(tiles: BoardTile[]) {
    const seen = new Set<string>();
    for (const t of tiles) {
      seen.add(t.stateId);
      const height = t.open ? (t.mine ? H_MINE : t.contested ? H_CONTESTED : H_HELD) : H_CLOSED;
      let tile = this.tiles.get(t.stateId);
      if (!tile) {
        const outline = regionPolygon(t.col, t.row);
        const centre = regionCentre(t.col, t.row);
        const geo = landGeometry(outline);
        const mesh = new THREE.Mesh(geo, this.mat(t.color));
        mesh.scale.y = height;
        mesh.userData.stateId = t.stateId;
        const labelTex = this.labelTexture(t.abbr);
        const label = new THREE.Mesh(
          this.labelGeo,
          new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, depthWrite: false }),
        );
        label.position.set(centre.x, height * TOP + 0.012, centre.z);
        label.renderOrder = 2;
        this.group.add(mesh, label);
        tile = { stateId: t.stateId, mesh, geo, outline, label, labelTex, baseHeight: height, lift: 0, liftTarget: 0 };
        this.tiles.set(t.stateId, tile);
      } else {
        tile.mesh.material = this.mat(t.color);
        tile.baseHeight = height;
      }
    }
    for (const [id, tile] of this.tiles) {
      if (seen.has(id)) continue;
      this.disposeTile(tile);
      this.tiles.delete(id);
    }
    this.buildSea();
    this.frameCamera();
  }

  /** Open water under the continent, plus a faint graticule so it reads as a map. */
  private buildSea() {
    if (this.sea) {
      this.scene.remove(this.sea);
      this.sea.geometry.dispose();
      (this.sea.material as THREE.Material).dispose();
    }
    if (this.grid) {
      this.scene.remove(this.grid);
      this.grid.geometry.dispose();
      (this.grid.material as THREE.Material).dispose();
    }
    const box = new THREE.Box3();
    for (const t of this.tiles.values()) {
      for (const p of t.outline) box.expandByPoint(new THREE.Vector3(p.x, 0, p.z));
    }
    if (this.tiles.size === 0) return;
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.z) * 2.4;

    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(span, span),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(SEA_FLOOR) }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(c.x, -0.04, c.z);
    this.scene.add(sea);
    this.sea = sea;

    const pts: number[] = [];
    const step = 2;
    const half = span / 2;
    for (let g = -half; g <= half + 0.001; g += step) {
      pts.push(c.x - half, 0, c.z + g, c.x + half, 0, c.z + g);
      pts.push(c.x + g, 0, c.z - half, c.x + g, 0, c.z + half);
    }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const grid = new THREE.LineSegments(
      gg,
      new THREE.LineBasicMaterial({ color: new THREE.Color(GRATICULE), transparent: true, opacity: 0.5 }),
    );
    grid.position.y = -0.03;
    this.scene.add(grid);
    this.grid = grid;
  }

  setFocus(stateId: string | null) {
    this.focusId = stateId;
  }

  private placeCamera(radius: number, turn: number) {
    this.camera.position.set(
      this.centre.x + Math.sin(turn) * radius * Math.cos(TILT),
      Math.sin(TILT) * radius,
      this.centre.z + Math.cos(turn) * radius * Math.cos(TILT),
    );
    this.camera.lookAt(this.centre.x, 0, this.centre.z);
  }

  /**
   * Fit the camera to whatever is on the board, at the current aspect.
   *
   * Fitting the flat bounding box is not enough: the board is tilted, so the
   * near row projects larger than the far row and the corner tiles ran off the
   * stage. This measures the real thing — every tile's hex rim, at its base and
   * at its raised top — and pulls back until all of it lands inside the frame,
   * at both ends of the turn range as well as head-on.
   */
  private frameCamera() {
    if (this.tiles.size === 0) return;
    const box = new THREE.Box3();
    for (const t of this.tiles.values()) {
      for (const p of t.outline) box.expandByPoint(new THREE.Vector3(p.x, 0, p.z));
    }
    box.getCenter(this.centre);
    this.centre.y = 0;

    const pts: THREE.Vector3[] = [];
    for (const t of this.tiles.values()) {
      const top = t.baseHeight * TOP + FOCUS_LIFT;
      for (const p of t.outline) pts.push(new THREE.Vector3(p.x, 0, p.z), new THREE.Vector3(p.x, top, p.z));
    }

    const size = box.getSize(new THREE.Vector3());
    let r = Math.max(size.x, size.z) + 4;
    const v = new THREE.Vector3();
    for (let pass = 0; pass < 10; pass++) {
      // Fitted head-on, where the board sits until someone drags it. Fitting the
      // turned extremes too left the resting view small for a corner nobody
      // looks at; MAX_TURN is kept short enough that a turn stays inside.
      let worst = 0;
      this.placeCamera(r, 0);
      this.camera.updateMatrixWorld(true);
      for (const p of pts) {
        v.copy(p).project(this.camera);
        worst = Math.max(worst, Math.abs(v.x) / EDGE, Math.abs(v.y) / EDGE);
      }
      if (worst > 1.002 || worst < 0.99) r *= worst;
      else break;
    }
    this.radius = r;
  }

  // -- input ---------------------------------------------------------------

  private bindInput() {
    const toPointer = (e: PointerEvent) => {
      const b = this.canvas.getBoundingClientRect();
      this.pointer.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
    };
    const down = (e: PointerEvent) => {
      this.dragging = true;
      this.dragged = false;
      this.lastX = e.clientX;
      this.canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      toPointer(e);
      if (!this.dragging) {
        this.hoverId = this.pick();
        this.canvas.style.cursor = this.hoverId ? 'pointer' : 'grab';
        return;
      }
      const dx = e.clientX - this.lastX;
      if (Math.abs(dx) > 1) this.dragged = true;
      this.lastX = e.clientX;
      // Clamped: a map that can spin to face away stops being readable.
      this.turnTarget = clamp(this.turnTarget + dx * 0.006, -MAX_TURN, MAX_TURN);
    };
    const up = (e: PointerEvent) => {
      if (this.dragging && !this.dragged) {
        toPointer(e);
        const hit = this.pick();
        if (hit) this.opts.onSelect(hit);
      }
      this.dragging = false;
    };
    const leave = () => {
      this.hoverId = null;
    };
    this.canvas.addEventListener('pointerdown', down);
    this.canvas.addEventListener('pointermove', move);
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);
    this.canvas.addEventListener('pointerleave', leave);
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.host);
    this.disposers.push(() => {
      this.canvas.removeEventListener('pointerdown', down);
      this.canvas.removeEventListener('pointermove', move);
      this.canvas.removeEventListener('pointerup', up);
      this.canvas.removeEventListener('pointercancel', up);
      this.canvas.removeEventListener('pointerleave', leave);
      ro.disconnect();
    });
  }

  private pick(): string | null {
    this.ray.setFromCamera(this.pointer, this.camera);
    const meshes = [...this.tiles.values()].map((t) => t.mesh);
    const hit = this.ray.intersectObjects(meshes, false)[0];
    return (hit?.object.userData.stateId as string | undefined) ?? null;
  }

  private resize() {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.frameCamera();
  }

  // -- frame ---------------------------------------------------------------

  private frame(now: number) {
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
    this.last = now;
    const snap = this.opts.reduceMotion;
    const k = snap ? 1 : 1 - Math.pow(0.0015, dt);

    this.turn += (this.turnTarget - this.turn) * k;
    for (const t of this.tiles.values()) {
      t.liftTarget = t.stateId === this.focusId ? FOCUS_LIFT : t.stateId === this.hoverId ? 0.14 : 0;
      t.lift += (t.liftTarget - t.lift) * k;
      t.mesh.scale.y = t.baseHeight;
      t.mesh.position.y = t.lift;
      t.label.position.y = t.baseHeight * TOP + t.lift + 0.012;
    }

    this.placeCamera(this.radius, this.turn);
    this.renderer.render(this.scene, this.camera);
  }

  // -- teardown ------------------------------------------------------------

  private disposeTile(tile: Tile) {
    this.group.remove(tile.mesh, tile.label);
    (tile.label.material as THREE.Material).dispose();
    tile.labelTex.dispose();
    tile.geo.dispose();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    for (const d of this.disposers) d();
    for (const tile of this.tiles.values()) this.disposeTile(tile);
    this.tiles.clear();
    for (const m of this.mats.values()) m.dispose();
    this.mats.clear();
    this.labelGeo.dispose();
    if (this.sea) {
      this.sea.geometry.dispose();
      (this.sea.material as THREE.Material).dispose();
    }
    if (this.grid) {
      this.grid.geometry.dispose();
      (this.grid.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n;
}

/**
 * Extrude a region outline into land. Built one unit tall and scaled on Y, so a
 * region can change status without rebuilding its geometry.
 */
function landGeometry(outline: { x: number; z: number }[]): THREE.ExtrudeGeometry {
  // Shape space is XY and extrudes along +Z; -z keeps the map from mirroring
  // once it is laid flat.
  const pts = outline.map((p) => new THREE.Vector2(p.x, -p.z));
  if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
    depth: 1,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: 0.03,
    bevelSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}
