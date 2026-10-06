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

let gradient: THREE.DataTexture | null = null;
function gradientMap() {
  if (!gradient) {
    gradient = new THREE.DataTexture(new Uint8Array([110, 165, 215, 255]), 4, 1, THREE.RedFormat);
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
  'baba-bullabaa': 'none',
  'mr-tiko': 'none',
  'mr-obiliki': 'pouch',
  'comrade-yale': 'none',
  'mr-don': 'none',
  'prof-sarah': 'baton',
};
