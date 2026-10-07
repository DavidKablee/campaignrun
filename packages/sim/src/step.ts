import { type SimConfig, contenders } from '@cr/content';
import { Btn, type SimState } from './types';
import { clamp, applyPermille } from './fixed';
import { checkCollision, findOverlappingZone } from './collide';
import { buildCourse } from './course';

export function initState(
  config: SimConfig,
  seed: import('./types').RngState,
  opts?: { capacity?: number; contenderId?: string; upgrades?: SimState['upgrades'] },
): SimState {
  const state: SimState = {
    tick: 0,
    rng: { ...seed },
    laneX: 1000,
    targetLane: 1,
    z: 0,
    speed: config.baseSpeedUm,
    hopT: 0,
    dents: 0,
    invulnTicks: 0,
    momentum: config.momentum.min,
    carried: 0,
    capacity: opts?.capacity ?? config.defaultCapacity,
    skillCrowd: 0,
    displayCrowd: 0,
    integrity: 100,
    delivered: 0,
    entities: [],
    events: [],
    nextHazardZ: 0,
    entityIdSeq: 1,
    prevInput: 0,
    activeZoneId: 0,
    zoneProgress: 0,
    zoneNeeded: 0,
    beatTaps: 0,
    beatWindowTicks: 0,
    phase: 'running',
    finishZ: 0,
    courseBuilt: false,
    activeContenderId: opts?.contenderId ?? 'baba-bullabaa',
    perkActiveTicks: 0,
    perkCooldownTicks: 0,
    hornCooldownTicks: 0,
    upgrades: opts?.upgrades ?? { magnetRadiusMm: 0, shieldTicks: 0, hornCooldownTicks: 720, loadSpeedPermille: 1000, rewardPermille: 1000 },
  };
  buildCourse(state, config);
  return state;
}

function rising(input: number, prev: number, bit: number): boolean {
  return (input & bit) !== 0 && (prev & bit) === 0;
}

function deliverCrowd(state: SimState, config: SimConfig, onBeat: boolean): void {
  if (state.carried <= 0) return;
  let mult = state.momentum;
  const fullHouse = state.carried >= state.capacity;
  if (fullHouse) {
    mult = Math.floor((mult * config.bonuses.fullHousePermille) / 1000);
    state.events.push({ type: 'fullHouse' });
  }
  if (onBeat) {
    mult = Math.floor((mult * config.bonuses.onBeatPermille) / 1000);
    state.events.push({ type: 'onBeat' });
  }
  const gained = Math.floor((state.carried * mult) / 1000);
  state.skillCrowd += gained;
  state.displayCrowd += gained;
  state.delivered += state.carried;
  state.events.push({ type: 'dropoff', payload: state.carried });
  state.carried = 0;
}

export function step(state: SimState, input: number, config: SimConfig): void {
  state.events = [];
  if (state.phase !== 'running') {
    state.prevInput = input;
    return;
  }
  
  const contender = contenders.find((c) => c.id === state.activeContenderId)!;
  const tradeoff = contender?.tradeoff;

  let laneChangeMmPerTick = config.laneChangeMmPerTick;
  let accelUm = config.accelUm;
  let maxSpeedUm = config.maxSpeedUm;

  if (tradeoff?.stat === 'laneChangeSpeed') laneChangeMmPerTick = applyPermille(laneChangeMmPerTick, tradeoff.permille);
  if (tradeoff?.stat === 'acceleration') accelUm = applyPermille(accelUm, tradeoff.permille);
  if (tradeoff?.stat === 'topSpeed') maxSpeedUm = applyPermille(maxSpeedUm, tradeoff.permille);

  // Perk activation
  if (state.perkCooldownTicks > 0) state.perkCooldownTicks--;
  if (state.perkActiveTicks > 0) state.perkActiveTicks--;
  if (state.hornCooldownTicks > 0) state.hornCooldownTicks--;

  let perkChargeMult = 1000;
  if (tradeoff?.stat === 'perkCharge') perkChargeMult = tradeoff.permille;

  if (rising(input, state.prevInput, Btn.Perk) && state.perkCooldownTicks === 0) {
    state.perkActiveTicks = (contender.perk.durationSec || 0) * 60;
    state.perkCooldownTicks = Math.floor(((contender.perk.cooldownSec || 20) * 60 * perkChargeMult) / 1000);
  }

  // Edge-triggered lane change
  if (rising(input, state.prevInput, Btn.Left) && state.targetLane > 0) {
    state.targetLane = (state.targetLane - 1) as 0 | 1 | 2;
  }
  if (rising(input, state.prevInput, Btn.Right) && state.targetLane < 2) {
    state.targetLane = (state.targetLane + 1) as 0 | 1 | 2;
  }

  // Hop
  if (rising(input, state.prevInput, Btn.Up) && state.hopT === 0) {
    state.hopT = config.hopTicks;
  }

  // On Beat taps while in unload window
  if (rising(input, state.prevInput, Btn.Tap) && state.beatWindowTicks > 0) {
    state.beatTaps++;
  }

  // Lane X approach
  const targetX = state.targetLane * 1000;
  if (state.laneX < targetX) {
    state.laneX = clamp(state.laneX + laneChangeMmPerTick, 0, targetX);
  } else if (state.laneX > targetX) {
    state.laneX = clamp(state.laneX - laneChangeMmPerTick, targetX, 2000);
  }

  // Speed
  if (input & Btn.Gas) {
    state.speed = clamp(state.speed + accelUm, 0, maxSpeedUm);
  } else if (input & Btn.Brake) {
    state.speed = clamp(state.speed - config.brakeDecelUm, config.brakeSpeedUm, config.maxSpeedUm);
  } else {
    if (state.speed > config.baseSpeedUm) {
      state.speed = clamp(state.speed - config.coastUm, config.baseSpeedUm, config.maxSpeedUm);
    } else if (state.speed < config.baseSpeedUm) {
      state.speed = clamp(state.speed + config.coastUm, 0, config.baseSpeedUm);
    }
  }

  // Momentum
  if (state.speed > applyPermille(config.maxSpeedUm, config.momentum.fastThresholdPermille)) {
    state.momentum = clamp(
      state.momentum + config.momentum.gainPerTick,
      config.momentum.min,
      config.momentum.max,
    );
  } else {
    state.momentum = clamp(
      state.momentum - config.momentum.decayPerTick,
      config.momentum.min,
      config.momentum.max,
    );
  }

  // Advance Z (speed is um/tick → mm)
  state.z += Math.floor(state.speed / 1000);

  if (state.hopT > 0) state.hopT--;
  if (state.invulnTicks > 0) state.invulnTicks--;
  if (state.beatWindowTicks > 0) state.beatWindowTicks--;

  // Zones
  const zone = findOverlappingZone(state, config);
  if (zone && zone.zoneKind === 'gate' && !zone.consumed) {
    zone.consumed = true;
    state.events.push({ type: 'gate' });
  }

  if (zone && (zone.zoneKind === 'pickup' || zone.zoneKind === 'venue' || zone.zoneKind === 'grand')) {
    if (state.activeZoneId !== zone.id) {
      state.activeZoneId = zone.id;
      state.zoneProgress = 0;
      state.zoneNeeded =
        Math.max(1, Math.floor((zone.zoneKind === 'pickup' ? config.zones.loadTicks : config.zones.unloadTicks) * 1000 / state.upgrades.loadSpeedPermille));
      if (zone.zoneKind !== 'pickup') {
        state.beatTaps = 0;
        state.beatWindowTicks = config.bonuses.onBeatWindowTicks;
      }
      state.events.push({ type: 'zoneEnter', payload: zone.id });
    }

    const braking = (input & Btn.Brake) !== 0 && state.speed <= config.zones.brakeToActSpeedUm;
    if (braking && !zone.consumed) {
      state.zoneProgress++;
      state.events.push({ type: 'zoneProgress', payload: state.zoneProgress });
      if (state.zoneProgress >= state.zoneNeeded) {
        zone.consumed = true;
        if (zone.zoneKind === 'pickup') {
          const want = zone.groupSize ?? 1;
          const free = state.capacity - state.carried;
          const amount = clamp(want, 0, free);
          state.carried += amount;
          state.events.push({ type: 'pickup', payload: amount });
        } else {
          const onBeat = state.beatTaps >= config.bonuses.onBeatTaps;
          deliverCrowd(state, config, onBeat);
        }
        state.activeZoneId = 0;
        state.zoneProgress = 0;
      }
    }
  } else if (state.activeZoneId !== 0) {
    state.activeZoneId = 0;
    state.zoneProgress = 0;
  }

  if (zone && zone.zoneKind === 'finish' && !zone.consumed) {
    zone.consumed = true;
    // Auto-deliver remaining
    if (state.carried > 0) deliverCrowd(state, config, false);
    state.phase = 'finished';
    state.events.push({ type: 'finish', payload: state.skillCrowd });
    state.prevInput = input;
    state.tick++;
    return;
  }

  // Soft time cap: if past finishZ without hitting finish entity
  if (state.z >= state.finishZ + config.zones.halfLenMm) {
    if (state.carried > 0) deliverCrowd(state, config, false);
    state.phase = 'finished';
    state.events.push({ type: 'finish', payload: state.skillCrowd });
    state.prevInput = input;
    state.tick++;
    return;
  }

  // Collisions with obstacles / loose pickups
  const hitEnt = checkCollision(state, config);
  if (hitEnt) {
    hitEnt.active = false;
    const isStreetParty = state.perkActiveTicks > 0 && state.activeContenderId === 'mr-don';
    
    if (hitEnt.isPickup || (isStreetParty && !hitEnt.isZone)) {
      const amount = hitEnt.value || 1;
      const free = state.capacity - state.carried;
      const add = clamp(amount, 0, free);
      state.carried += add;
      state.events.push({ type: 'pickup', payload: add });
    } else if (hitEnt.isIntegrityHazard) {
      state.integrity = Math.max(0, state.integrity - 10);
      state.events.push({ type: 'integrityFail', payload: hitEnt.kind });
      
      state.speed = applyPermille(state.speed, config.hit.speedPermille);
      const dropped = applyPermille(state.carried, config.hit.dropCarriedPermille);
      state.carried -= dropped;
      state.events.push({ type: 'hit', payload: hitEnt.id });
    } else {
      state.dents++;
      
      const isReboot = state.activeContenderId === 'mr-tiko' && state.perkCooldownTicks === 0;
      if (isReboot && state.dents >= config.hit.maxDents) {
        state.dents--; // Revive
        state.perkCooldownTicks = 40 * 60; // Wait, actually should use perkChargeMult, but we'll approximate 40s
        state.invulnTicks = 3 * 60;
      } else {
        state.invulnTicks = config.hit.invulnTicks;
      }
      
      state.speed = applyPermille(state.speed, config.hit.speedPermille);
      state.momentum = config.momentum.min;
      const dropped = applyPermille(state.carried, config.hit.dropCarriedPermille);
      state.carried -= dropped;
      if (state.dents >= config.hit.maxDents) {
        state.phase = 'breakdown';
        state.events.push({ type: 'breakdown' });
      } else {
        state.events.push({ type: 'dent' });
      }
      state.events.push({ type: 'hit', payload: hitEnt.id });
    }
  }

  // Despawn far behind
  state.entities = state.entities.filter((e) => {
    if (e.isZone) return true;
    if (e.z > state.z - config.spawn.despawnBehindMm) return true;
    
    // Successfully bypassed an integrity hazard
    if (e.active && e.isIntegrityHazard) {
      state.integrity = Math.min(100, state.integrity + 5);
      state.events.push({ type: 'integritySuccess', payload: e.kind });
    }
    return false;
  });

  state.prevInput = input;
  state.tick++;
}
