import { describe, it, expect } from 'vitest';
import { initState, step } from '../src/step';
import { seedRng } from '../src/rng';
import type { SimConfig } from '@cr/content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Btn } from '../src/types';

const simConfig = JSON.parse(
  readFileSync(join(__dirname, '../../content/data/sim.json'), 'utf8'),
) as SimConfig;

describe('determinism (smoke)', () => {
  it('identical twin runs match', () => {
    const run = (seed: number) => {
      const s = initState(simConfig, seedRng(seed), { capacity: 8 });
      for (let i = 0; i < 1000; i++) step(s, Btn.Gas | (i % 20 === 0 ? Btn.Left : 0), simConfig);
      return `${s.z}|${s.laneX}|${s.dents}|${s.skillCrowd}|${s.rng.a}`;
    };
    expect(run(1)).toBe(run(1));
    expect(run(2)).not.toBe(run(3));
  });
});
