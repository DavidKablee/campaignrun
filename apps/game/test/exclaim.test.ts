import { describe, expect, it } from 'vitest';
import { type Outcome, resultExclaim } from '../src/exclaim';

describe('resultExclaim', () => {
  it('never calls a win "wahala": that word is trouble', () => {
    for (const outcome of ['landslide', 'majority', 'foothold'] as Outcome[]) {
      for (let score = 0; score < 40; score++) {
        expect(resultExclaim(outcome, score)).not.toMatch(/WAHALA/);
      }
    }
  });

  it('keeps "wahala" available for a breakdown', () => {
    const seen = new Set(Array.from({ length: 12 }, (_, s) => resultExclaim('breakdown', s)));
    expect(seen.has('WAHALA!')).toBe(true);
  });

  it('is stable for the same score and says nothing when there is no tier', () => {
    expect(resultExclaim('landslide', 17)).toBe(resultExclaim('landslide', 17));
    expect(resultExclaim('none', 17)).toBeNull();
  });

  it('gives a landslide more than one way to be praised', () => {
    const seen = new Set(Array.from({ length: 12 }, (_, s) => resultExclaim('landslide', s)));
    expect(seen.size).toBeGreaterThan(1);
  });
});
