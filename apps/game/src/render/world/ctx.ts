import type * as THREE from 'three';
import type { District, ResolvedWorld } from '@cr/content';
import type { GeoBuilder, Rng, TexBuckets } from '../geo';
import { facadeTexture, shopTexture } from '../textures';

/** Metres of road in one built chunk. */
export const CHUNK = 40;

/** Everything a builder needs to put things into the chunk being made. */
export interface Ctx {
  vc: GeoBuilder;
  tb: TexBuckets;
  signs: THREE.Mesh[];
  /** Legacy stream. Lagos' own builders only: touching it for a regional op would move Lagos. */
  r: Rng;
  /** Regional stream, decorrelated per state by the world's salt. */
  rx: Rng;
  zStart: number;
  zEnd: number;
  zMid: number;
  k: number;
  district: District;
  slot: THREE.Group;
  world: ResolvedWorld;
  dataSaver: boolean;
}

/**
 * Keys for the textured-box buckets. Lagos keeps the keys it has always had
 * (`facade3`, `shop2`) so its materials are untouched; other sets are namespaced.
 */
export function facadeKey(set: string, variant: number): string {
  return set === 'lagos' ? `facade${variant}` : `facade:${set}:${variant}`;
}
export function shopKey(set: string, variant: number): string {
  return set === 'lagos' ? `shop${variant}` : `shop:${set}:${variant}`;
}

/** The texture a bucket key stands for. */
export function bucketTexture(key: string): THREE.Texture {
  const parts = key.split(':');
  if (parts[0] === 'facade:' || parts[0] === 'facade' || parts[0] === 'shop') {
    // `facade:<set>:<v>` and `shop:<set>:<v>`
    const set = parts[1]!;
    const v = Number(parts[2]);
    return parts[0] === 'shop' ? shopTexture(v, set) : facadeTexture(v, set);
  }
  if (key.startsWith('facade')) return facadeTexture(Number(key.slice(6)));
  return shopTexture(Number(key.slice(4)));
}
