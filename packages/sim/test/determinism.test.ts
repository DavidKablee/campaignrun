import { describe, it, expect } from 'vitest';
import { initState, step } from '../src/step';
import { seedRng } from '../src/rng';
import type { SimConfig } from '@cr/content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// Load config dynamically for test
const simConfig = JSON.parse(readFileSync(join(__dirname, '../../content/data/sim.json'), 'utf8')) as SimConfig;

describe('Determinism', () => {
  it('identical seeds and inputs produce identical final states over 10000 ticks', () => {
    
    const runSim = (seedVal: number) => {
      const state = initState(simConfig, seedRng(seedVal));
      for (let t = 0; t < 10000; t++) {
        // Pseudo-random but deterministic input based on tick
        let input: number;
        if (t % 100 === 0) input = 1; // Left
        else if (t % 150 === 0) input = 2; // Right
        else if (t % 80 === 0) input = 4; // Up
        else input = 8; // Gas
        step(state, input, simConfig);
        if (state.dents >= simConfig.hit.maxDents) {
          state.dents = 0; // prevent early breakdown so we test full 10k ticks
        }
      }
      return state;
    };

    const seeds = [42, 1337, 99999];
    
    for (const seed of seeds) {
      const stateA = runSim(seed);
      const stateB = runSim(seed);
      
      // Serialize ignoring events which are cleared every tick
      const hashA = createHash('sha256').update(JSON.stringify({...stateA, events: []})).digest('hex');
      const hashB = createHash('sha256').update(JSON.stringify({...stateB, events: []})).digest('hex');
      
      expect(hashA).toBe(hashB);
      expect(stateA.z).toBe(stateB.z);
      expect(stateA.entities.length).toBe(stateB.entities.length);
      expect(stateA.tick).toBe(10000);
    }
  });
});
