import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/**
 * Loader/cache for CC0 environment glTF assets (ADR-0009). Characters, rides and
 * gameplay props stay procedural (character.ts / props.ts) — this module is for
 * background environment dressing only: buildings, market props, foliage.
 *
 * Assets are grouped into "biome kits" that lazy-load exactly like a state JSON
 * pack (one fetch per biome, shared by every state using it, cached by the PWA
 * service worker). Nothing here is part of the first-load bundle.
 */

export type BiomeId = 'lagos';

/** assetId -> file name under /models/<biome>/. One manifest per biome kit. */
const BIOME_MANIFEST: Record<BiomeId, Record<string, string>> = {
  lagos: {
    'building-a': 'low-detail-building-a.glb',
    'building-c': 'low-detail-building-c.glb',
    'building-e': 'low-detail-building-e.glb',
    'building-g': 'low-detail-building-g.glb',
    'building-i': 'low-detail-building-i.glb',
    'building-k': 'low-detail-building-k.glb',
    'building-wide-a': 'low-detail-building-wide-a.glb',
    'building-wide-b': 'low-detail-building-wide-b.glb',
    awning: 'detail-awning.glb',
    overhang: 'detail-overhang.glb',
    'parasol-a': 'detail-parasol-a.glb',
    'parasol-b': 'detail-parasol-b.glb',
    'tree-palm': 'tree_palm.glb',
    'tree-palm-bend': 'tree_palmBend.glb',
    'tree-palm-short': 'tree_palmDetailedShort.glb',
    grass: 'grass.glb',
    'grass-large': 'grass_large.glb',
    'path-stone': 'path_stone.glb',
    'path-stone-corner': 'path_stoneCorner.glb',
  },
};

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
// Draco support is wired but unused by the current CC0 subset (none of it is
// Draco-compressed); set a decoder path here if a future asset needs it.
// loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));

const sceneCache = new Map<string, Promise<THREE.Group>>();

function assetUrl(biome: BiomeId, assetId: string): string {
  const file = BIOME_MANIFEST[biome][assetId];
  if (!file) throw new Error(`assets: unknown "${assetId}" in biome "${biome}"`);
  return `/models/${biome}/${file}`;
}

/** Load (and cache) one glTF asset as a template scene. Never mutate the result directly. */
export function loadAsset(biome: BiomeId, assetId: string): Promise<THREE.Group> {
  const key = `${biome}/${assetId}`;
  let p = sceneCache.get(key);
  if (!p) {
    p = loader.loadAsync(assetUrl(biome, assetId)).then((gltf) => gltf.scene);
    sceneCache.set(key, p);
  }
  return p;
}

/** Preload every asset in a biome kit (call when a state in that biome opens). */
export async function preloadBiome(biome: BiomeId): Promise<void> {
  await Promise.all(Object.keys(BIOME_MANIFEST[biome]).map((id) => loadAsset(biome, id)));
}

export function biomeAssetIds(biome: BiomeId): string[] {
  return Object.keys(BIOME_MANIFEST[biome]);
}

interface MeshSlot {
  mesh: THREE.InstancedMesh;
  localMatrix: THREE.Matrix4;
}

/** A rigid multi-mesh prop instanced `count` times, driven as one unit per index. */
export interface InstancedProp {
  group: THREE.Group;
  count: number;
  /** Position/orient/scale instance `i` (and tint it, if `color` is given). */
  setAt(i: number, matrix: THREE.Matrix4, color?: THREE.Color): void;
  /** Hide instance `i` (zero-scale matrix) without shrinking the pool. */
  hideAt(i: number): void;
  dispose(): void;
}

const _zero = new THREE.Matrix4().makeScale(0, 0, 0);

/**
 * Build an InstancedMesh per sub-mesh of a loaded template, so a multi-part
 * model (e.g. a building with a separate roof mesh) moves as one rigid prop
 * across `count` instances. Keeps draw calls at "one per sub-mesh", not
 * "one per placed prop" — this is what makes CC0 scenery affordable on
 * low-end Android (ADR-0009 budget: <=150 draw calls, <=120k on-screen tris).
 */
export function buildInstancedProp(template: THREE.Object3D, count: number): InstancedProp {
  const group = new THREE.Group();
  const slots: MeshSlot[] = [];
  template.updateWorldMatrix(true, true);
  template.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mesh = new THREE.InstancedMesh(obj.geometry, obj.material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = true;
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, _zero);
    group.add(mesh);
    slots.push({ mesh, localMatrix: obj.matrixWorld.clone() });
  });

  const combined = new THREE.Matrix4();
  return {
    group,
    count,
    setAt(i, matrix, color) {
      for (const slot of slots) {
        combined.multiplyMatrices(matrix, slot.localMatrix);
        slot.mesh.setMatrixAt(i, combined);
        slot.mesh.instanceMatrix.needsUpdate = true;
        if (color) {
          slot.mesh.setColorAt(i, color);
          if (slot.mesh.instanceColor) slot.mesh.instanceColor.needsUpdate = true;
        }
      }
    },
    hideAt(i) {
      for (const slot of slots) {
        slot.mesh.setMatrixAt(i, _zero);
        slot.mesh.instanceMatrix.needsUpdate = true;
      }
    },
    dispose() {
      for (const slot of slots) {
        slot.mesh.dispose();
        slot.mesh.geometry.dispose();
      }
    },
  };
}
