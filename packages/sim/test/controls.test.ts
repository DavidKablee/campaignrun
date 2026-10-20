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

describe('Controls', () => {
  it('handles lane changes with edge trigger', () => {
    const state = initState(simConfig, seedRng(123), { contenderId: 'madam-metronome' });
    expect(state.laneX).toBe(1000);
    expect(state.targetLane).toBe(1);

    step(state, Btn.Left, simConfig);
    expect(state.targetLane).toBe(0);
    expect(state.laneX).toBe(1000 - simConfig.laneChangeMmPerTick);

    for (let i = 0; i < 20; i++) step(state, 0, simConfig);
    expect(state.laneX).toBe(0);
  });

  it('handles hop', () => {
    const state = initState(simConfig, seedRng(123), { contenderId: 'madam-metronome' });
    step(state, Btn.Up, simConfig);
    expect(state.hopT).toBe(simConfig.hopTicks - 1);

    step(state, 0, simConfig);
    expect(state.hopT).toBe(simConfig.hopTicks - 2);
  });

  it('handles gas and brake bounds', () => {
    const state = initState(simConfig, seedRng(123), { contenderId: 'madam-metronome' });
    const initSpeed = state.speed;

    step(state, Btn.Gas, simConfig);
    expect(state.speed).toBeGreaterThan(initSpeed);

    step(state, Btn.Brake, simConfig);
    expect(state.speed).toBeLessThan(initSpeed + simConfig.accelUm);
  });
});
