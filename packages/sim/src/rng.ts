import type { RngState } from './types';

// sfc32 (Small Fast Counting) PRNG
// Pure 32-bit integer arithmetic.
export function nextRng(state: RngState): number {
  state.a >>>= 0; state.b >>>= 0; state.c >>>= 0; state.d >>>= 0; 
  let t = (state.a + state.b) | 0;
  state.a = state.b ^ (state.b >>> 9);
  state.b = (state.c + (state.c << 3)) | 0;
  state.c = (state.c << 21) | (state.c >>> 11);
  state.d = (state.d + 1) | 0;
  t = (t + state.d) | 0;
  state.c = (state.c + t) | 0;
  return (t >>> 0);
}

export function rngFloat(state: RngState): number {
  return nextRng(state) / 4294967296;
}

export function rngIntRange(state: RngState, min: number, max: number): number {
  const range = max - min + 1;
  return min + (nextRng(state) % range);
}

export function seedRng(seed: number): RngState {
  // Mulberry32 used to seed sfc32
  let t = seed >>> 0;
  const nextMulberry = () => {
    t = (t + 0x6D2B79F5) | 0;
    let z = t;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return (z ^ (z >>> 14)) >>> 0;
  };
  return {
    a: nextMulberry(),
    b: nextMulberry(),
    c: nextMulberry(),
    d: nextMulberry(),
  };
}
