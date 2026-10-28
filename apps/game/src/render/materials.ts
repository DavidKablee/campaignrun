import * as THREE from 'three';

export const MM_TO_UNITS = 0.001;

/** Shared uniforms: gentle road curve + crest so the road never feels like a ruler. */
export const bend = {
  uCurveX: { value: 0 },
  uCurveY: { value: 0 },
};

function patchBend<T extends THREE.Material>(mat: T): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uCurveX = bend.uCurveX;
    shader.uniforms.uCurveY = bend.uCurveY;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uCurveX;\nuniform float uCurveY;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        float crDepth = -mvPosition.z;
        mvPosition.x += uCurveX * crDepth * crDepth;
        mvPosition.y -= uCurveY * crDepth * crDepth;
        gl_Position = projectionMatrix * mvPosition;`,
      );
  };
  mat.customProgramCacheKey = () => 'bend';
  return mat;
}

/** Push vertices outward along their normal — the classic cheap toon outline (ADR-0008). Composes with patchBend. */
function patchExtrude<T extends THREE.Material>(mat: T, amount: number): T {
  const prevCompile = mat.onBeforeCompile.bind(mat);
  mat.onBeforeCompile = (shader, renderer) => {
    prevCompile(shader, renderer);
    shader.uniforms.uOutline = { value: amount };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uOutline;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n\ttransformed += normalize(normal) * uOutline;');
  };
  mat.customProgramCacheKey = () => `bend|outline:${amount}`;
  return mat;
}

/** Solid-color backface shell, slightly larger than the source mesh — a cheap, mobile-safe toon outline. */
export function outlineMat(thickness = 0.014, color = '#19120d'): THREE.MeshBasicMaterial {
  const key = `outline:${thickness}:${color}`;
  let m = cache.get(key) as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), side: THREE.BackSide });
    patchBend(m);
    patchExtrude(m, thickness);
    cache.set(key, m);
  }
  return m;
}

let gradient: THREE.DataTexture | null = null;
function gradientMap() {
  if (!gradient) {
    // 5-step toon ramp with more contrast at the shadow end (ADR-0008) — was a flat 4-value ramp.
    gradient = new THREE.DataTexture(new Uint8Array([60, 120, 175, 215, 255]), 5, 1, THREE.RedFormat);
    gradient.minFilter = THREE.NearestFilter;
    gradient.magFilter = THREE.NearestFilter;
    gradient.generateMipmaps = false;
    gradient.needsUpdate = true;
  }
  return gradient;
}

const cache = new Map<string, THREE.Material>();

/** Vertex-coloured toon material (the default for all merged models). */
export function vcMat(): THREE.MeshToonMaterial {
  let m = cache.get('vc') as THREE.MeshToonMaterial | undefined;
  if (!m) {
    m = patchBend(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradientMap() }));
    cache.set('vc', m);
  }
  return m;
}

/** C29: translucent cyan-tinted variant of vcMat for ghost replays — same geometry, see-through. */
export function ghostMat(): THREE.MeshToonMaterial {
  let m = cache.get('ghost') as THREE.MeshToonMaterial | undefined;
  if (!m) {
    m = patchBend(
      new THREE.MeshToonMaterial({
        vertexColors: true,
        gradientMap: gradientMap(),
        color: new THREE.Color('#bfe6ff'),
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    );
    cache.set('ghost', m);
  }
  return m;
}

export function texMat(key: string, map: THREE.Texture, opts: { transparent?: boolean; alphaTest?: number } = {}) {
  let m = cache.get(`tex:${key}`) as THREE.MeshToonMaterial | undefined;
  if (!m) {
    m = patchBend(
      new THREE.MeshToonMaterial({
        map,
        gradientMap: gradientMap(),
        transparent: opts.transparent ?? false,
        alphaTest: opts.alphaTest ?? 0,
      }),
    );
    cache.set(`tex:${key}`, m);
  }
  return m;
}

export function flatMat(key: string, color: string, opts: { transparent?: boolean; opacity?: number } = {}) {
  let m = cache.get(`flat:${key}`) as THREE.MeshToonMaterial | undefined;
  if (!m) {
    m = patchBend(
      new THREE.MeshToonMaterial({
        color: new THREE.Color(color),
        gradientMap: gradientMap(),
        transparent: opts.transparent ?? false,
        opacity: opts.opacity ?? 1,
      }),
    );
    cache.set(`flat:${key}`, m);
  }
  return m;
}

/** Unlit material for lamps / glow / painted road markings. */
export function glowMat(key: string, color: string, opts: { transparent?: boolean; opacity?: number } = {}) {
  let m = cache.get(`glow:${key}`) as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    m = patchBend(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: opts.transparent ?? false,
        opacity: opts.opacity ?? 1,
        fog: true,
      }),
    );
    cache.set(`glow:${key}`, m);
  }
  return m;
}

/**
 * The soft halo behind a lamp. Additive, so it brightens whatever is behind it
 * and reads as light rather than a coloured card; shared by every vehicle.
 */
export function haloMat(key: string, color: string) {
  let m = cache.get(`halo:${key}`) as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    m = patchBend(
      new THREE.MeshBasicMaterial({
        map: tex,
        color: new THREE.Color(color),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: true,
      }),
    );
    cache.set(`halo:${key}`, m);
  }
  return m;
}

export function unlitMat(key: string, map: THREE.Texture) {
  let m = cache.get(`unlit:${key}`) as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    m = patchBend(new THREE.MeshBasicMaterial({ map, fog: true }));
    cache.set(`unlit:${key}`, m);
  }
  return m;
}

export function basicTexMat(key: string, map: THREE.Texture) {
  let m = cache.get(`btex:${key}`) as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    m = patchBend(new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }));
    cache.set(`btex:${key}`, m);
  }
  return m;
}

export function disposeMaterials() {
  for (const m of cache.values()) m.dispose();
  cache.clear();
  gradient?.dispose();
  gradient = null;
}

/** @deprecated kept until the old model builders are replaced. */
export function makeToonMaterial(color: string | number, opts?: { emissive?: string }) {
  return new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    emissive: opts?.emissive ? new THREE.Color(opts.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: opts?.emissive ? 0.4 : 0,
  });
}

/** @deprecated replaced by outfits.json characters. */
export const CONTENDER_PROPS: Record<string, string> = {
  'mama-ankara': 'fan',
  'engineer-spark': 'wrench',
  'captain-kobo': 'pouch',
  'sister-beacon': 'lantern',
  'uncle-boombox': 'speaker',
  'madam-metronome': 'baton',
};
