import type { SimConfig } from '@cr/content';
import { Btn, type SimState } from './types';
import { clamp, applyPermille } from './fixed';
import { checkCollision } from './collide';
import { rngIntRange } from './rng';

export function initState(config: SimConfig, seed: import('./types').RngState): SimState {
  return {
    tick: 0,
    rng: { ...seed },
    laneX: 1000,
    targetLane: 1,
    z: 0,
    speed: config.baseSpeedUm,
    hopT: 0,
    dents: 0,
    invulnTicks: 0,
    momentum: 1000,
    carried: 0,
    capacity: 15, // Will be overridden by ride
    skillCrowd: 0,
    displayCrowd: 0,
    entities: [],
    events: [],
    nextEntityZ: config.spawn.firstMm,
    entityIdSeq: 1,
  };
}

export function step(state: SimState, input: number, config: SimConfig): void {
  state.events = [];
  if (state.dents >= config.hit.maxDents) return; // Breakdown state

  // Input -> target lane
  if ((input & Btn.Left) && state.targetLane > 0) state.targetLane--;
  if ((input & Btn.Right) && state.targetLane < 2) state.targetLane++;
  
  // Input -> hop
  if ((input & Btn.Up) && state.hopT === 0) {
    state.hopT = config.hopTicks;
  }

  // Update Lane X
  const targetX = state.targetLane * 1000;
  if (state.laneX < targetX) {
    state.laneX = clamp(state.laneX + config.laneChangeMmPerTick, 0, targetX);
  } else if (state.laneX > targetX) {
    state.laneX = clamp(state.laneX - config.laneChangeMmPerTick, targetX, 2000);
  }

  // Speed
  if (input & Btn.Gas) {
    state.speed = clamp(state.speed + config.accelUm, 0, config.maxSpeedUm);
  } else if (input & Btn.Brake) {
    state.speed = clamp(state.speed - config.brakeDecelUm, config.brakeSpeedUm, config.maxSpeedUm);
  } else {
    // Coasting down to base speed
    if (state.speed > config.baseSpeedUm) {
      state.speed = clamp(state.speed - config.coastUm, config.baseSpeedUm, config.maxSpeedUm);
    } else if (state.speed < config.baseSpeedUm) {
      state.speed = clamp(state.speed + config.coastUm, 0, config.baseSpeedUm);
    }
  }

  // Momentum
  if (state.speed > applyPermille(config.maxSpeedUm, config.momentum.fastThresholdPermille)) {
    state.momentum = clamp(state.momentum + config.momentum.gainPerTick, config.momentum.min, config.momentum.max);
  } else {
    state.momentum = clamp(state.momentum - config.momentum.decayPerTick, config.momentum.min, config.momentum.max);
  }

  // Advance Z
  // speed is um/tick, so z (mm) += speed / 1000
  state.z += Math.floor(state.speed / 1000);

  // Hop logic
  if (state.hopT > 0) state.hopT--;
  if (state.invulnTicks > 0) state.invulnTicks--;

  // Spawning
  while (state.z + config.spawn.aheadMm > state.nextEntityZ) {
    const obstacle = config.obstacles[rngIntRange(state.rng, 0, config.obstacles.length - 1)]!;
    const lane = rngIntRange(state.rng, 0, 2) as 0|1|2;
    state.entities.push({
      id: state.entityIdSeq++,
      kind: obstacle.kind,
      lane,
      z: state.nextEntityZ,
      halfWidthMm: obstacle.halfWidthMm,
      halfLenMm: obstacle.halfLenMm,
      heightMm: obstacle.heightMm,
      active: true,
    });
    const gap = rngIntRange(state.rng, config.spawn.gapMinMm, config.spawn.gapMaxMm);
    state.nextEntityZ += gap;
  }

  // Despawn
  state.entities = state.entities.filter(e => e.z > state.z - config.spawn.despawnBehindMm);

  // Collision
  const hitEnt = checkCollision(state, config);
  if (hitEnt) {
    hitEnt.active = false;
    state.dents++;
    state.invulnTicks = config.hit.invulnTicks;
    state.speed = applyPermille(state.speed, config.hit.speedPermille);
    state.momentum = config.momentum.min;
    
    // Drop 25% of carried
    const dropped = applyPermille(state.carried, 250);
    state.carried -= dropped;
    
    if (state.dents >= config.hit.maxDents) {
      state.events.push({ type: 'breakdown' });
    } else {
      state.events.push({ type: 'dent' });
    }
    state.events.push({ type: 'hit', payload: hitEnt.id });
  }

  state.tick++;
}
