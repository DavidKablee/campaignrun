import { type SimConfig, contenders } from '@cr/content';
import { Btn, type SimState } from './types';
import { clamp, applyPermille } from './fixed';
import { checkCollision, findOverlappingZone } from './collide';
import { buildCourse } from './course';
import { applyMarketWeave, blastHorn } from './perks';

export function initState(
  config: SimConfig,
  seed: import('./types').RngState,
  opts?: {
    capacity?: number;
    contenderId?: string;
    upgrades?: SimState['upgrades'];
    rideSize?: SimState['rideSize'];
    ridePloughsLight?: boolean;
    rideFreeHit?: boolean;
    rideMagnetBonusMm?: number;
    signatureRideBonusPermille?: number;
    /** C30: Rally Saturday — decided by the caller from a real clock, sim just applies it. */
    rallySaturdayMultiplierPermille?: number;
  },
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
    integritySpawnSeq: 0,
    rivalSpawnSeq: 0,
    pvcBuffTicks: 0,
    rallySaturdayMultiplierPermille: opts?.rallySaturdayMultiplierPermille ?? 1000,
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
    venuesUnloaded: 0,
    upgrades: opts?.upgrades ?? {
      magnetRadiusMm: 0,
      shieldTicks: 0,
      hornCooldownTicks: 720,
      loadSpeedPermille: 1000,
      rewardPermille: 1000,
    },
    rideSize: opts?.rideSize ?? 'S',
    ridePloughsLight: opts?.ridePloughsLight ?? false,
    rideFreeHit: opts?.rideFreeHit ?? false,
    freeHitUsed: false,
    rideMagnetBonusMm: opts?.rideMagnetBonusMm ?? 0,
    signatureRideBonusPermille: opts?.signatureRideBonusPermille ?? 1000,
  };
  buildCourse(state, config);
  return state;
}

function rising(input: number, prev: number, bit: number): boolean {
  return (input & bit) !== 0 && (prev & bit) === 0;
}

function deliverCrowd(state: SimState, config: SimConfig, onBeat: boolean, venueMult: number): void {
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
  let gained = Math.floor((state.carried * mult) / 1000);
  gained = applyPermille(gained, venueMult);
  gained = applyPermille(gained, state.signatureRideBonusPermille);
  if (state.pvcBuffTicks > 0) gained = applyPermille(gained, config.bonuses.pvcMultiplierPermille);
  // Rally Saturday affects display/skill Crowd alike — it's a real, map-eligible bonus window
  // (unlike the Integrity bonus, which is display-only), same treatment as Full House/On Beat.
  gained = applyPermille(gained, state.rallySaturdayMultiplierPermille);
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

  const contender = contenders.find((c) => c.id === state.activeContenderId) ?? contenders[0]!;
  const tradeoff = contender.tradeoff;
  const perkId = contender.perk.id;

  let laneChangeMmPerTick = config.laneChangeMmPerTick;
  let accelUm = config.accelUm;
  let maxSpeedUm = config.maxSpeedUm;

  if (tradeoff.stat === 'laneChangeSpeed') laneChangeMmPerTick = applyPermille(laneChangeMmPerTick, tradeoff.permille);
  if (tradeoff.stat === 'acceleration') accelUm = applyPermille(accelUm, tradeoff.permille);
  if (tradeoff.stat === 'topSpeed') maxSpeedUm = applyPermille(maxSpeedUm, tradeoff.permille);

  if (state.perkCooldownTicks > 0) state.perkCooldownTicks--;
  if (state.perkActiveTicks > 0) state.perkActiveTicks--;
  if (state.hornCooldownTicks > 0) state.hornCooldownTicks--;

  let perkChargeMult = 1000;
  if (tradeoff.stat === 'perkCharge') perkChargeMult = tradeoff.permille;

  if (rising(input, state.prevInput, Btn.Perk) && state.perkCooldownTicks === 0) {
    state.perkActiveTicks = contender.perk.durationSec * 60;
    state.perkCooldownTicks = Math.floor((contender.perk.cooldownSec * 60 * perkChargeMult) / 1000);
    state.events.push({ type: 'perk', payload: perkId });
    if (perkId === 'reboot') {
      state.invulnTicks = Math.max(state.invulnTicks, contender.perk.durationSec * 60);
    }
  }

  if (rising(input, state.prevInput, Btn.Left) && state.targetLane > 0) {
    state.targetLane = (state.targetLane - 1) as 0 | 1 | 2;
  }
  if (rising(input, state.prevInput, Btn.Right) && state.targetLane < 2) {
    state.targetLane = (state.targetLane + 1) as 0 | 1 | 2;
  }

  if (rising(input, state.prevInput, Btn.Up) && state.hopT === 0) {
    state.hopT = config.hopTicks;
  }

  if (rising(input, state.prevInput, Btn.Tap) && state.beatWindowTicks > 0) {
    state.beatTaps++;
  }

  // Horn (beacon doubles cone while perk active)
  if (rising(input, state.prevInput, Btn.Horn) && state.hornCooldownTicks === 0) {
    let hornCd = state.upgrades.hornCooldownTicks;
    if (tradeoff.stat === 'hornCooldown') hornCd = applyPermille(hornCd, tradeoff.permille);
    state.hornCooldownTicks = hornCd;
    const doubled = perkId === 'beacon-horn' && state.perkActiveTicks > 0;
    blastHorn(state, config, doubled);
  }

  if (perkId === 'market-weave' && state.perkActiveTicks > 0) {
    applyMarketWeave(state);
  }

  const targetX = state.targetLane * 1000;
  if (state.laneX < targetX) {
    state.laneX = clamp(state.laneX + laneChangeMmPerTick, 0, targetX);
  } else if (state.laneX > targetX) {
    state.laneX = clamp(state.laneX - laneChangeMmPerTick, targetX, 2000);
  }

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

  if (state.speed > applyPermille(config.maxSpeedUm, config.momentum.fastThresholdPermille)) {
    state.momentum = clamp(state.momentum + config.momentum.gainPerTick, config.momentum.min, config.momentum.max);
  } else {
    state.momentum = clamp(state.momentum - config.momentum.decayPerTick, config.momentum.min, config.momentum.max);
  }

  // Steady Beat: world advances 30% slower while active.
  let zDelta = Math.floor(state.speed / 1000);
  if (perkId === 'steady-beat' && state.perkActiveTicks > 0) {
    zDelta = applyPermille(zDelta, 700);
  }
  state.z += zDelta;

  if (state.hopT > 0) state.hopT--;
  if (state.invulnTicks > 0) state.invulnTicks--;
  if (state.beatWindowTicks > 0) state.beatWindowTicks--;

  const zone = findOverlappingZone(state, config);
  if (zone && zone.zoneKind === 'gate' && !zone.consumed) {
    zone.consumed = true;
    state.events.push({ type: 'gate' });
  }

  if (zone && (zone.zoneKind === 'pickup' || zone.zoneKind === 'venue' || zone.zoneKind === 'grand')) {
    if (state.activeZoneId !== zone.id) {
      state.activeZoneId = zone.id;
      state.zoneProgress = 0;
      state.zoneNeeded = Math.max(
        1,
        Math.floor(
          ((zone.zoneKind === 'pickup' ? config.zones.loadTicks : config.zones.unloadTicks) * 1000) /
            state.upgrades.loadSpeedPermille,
        ),
      );
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
          let venueMult = 1000;
          if (tradeoff.stat === 'firstVenueMultiplier' && state.venuesUnloaded === 0) {
            venueMult = tradeoff.permille;
          }
          deliverCrowd(state, config, onBeat, venueMult);
          state.venuesUnloaded++;
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
    if (state.carried > 0) deliverCrowd(state, config, false, 1000);
    state.phase = 'finished';
    state.events.push({ type: 'finish', payload: state.skillCrowd });
    state.prevInput = input;
    state.tick++;
    return;
  }

  if (state.z >= state.finishZ + config.zones.halfLenMm) {
    if (state.carried > 0) deliverCrowd(state, config, false, 1000);
    state.phase = 'finished';
    state.events.push({ type: 'finish', payload: state.skillCrowd });
    state.prevInput = input;
    state.tick++;
    return;
  }

  const hitEnt = checkCollision(state, config);
  if (hitEnt) {
    hitEnt.active = false;
    const isStreetParty = state.perkActiveTicks > 0 && perkId === 'street-party';

    if (hitEnt.kind === 'pvc-pickup') {
      // C28: a positive pickup, not a hazard — grants a temporary Crowd multiplier.
      state.pvcBuffTicks = config.bonuses.pvcDurationTicks;
      state.events.push({ type: 'pvcActive' });
    } else if (hitEnt.isPickup || (isStreetParty && !hitEnt.isZone)) {
      const amount = hitEnt.value || 1;
      const free = state.capacity - state.carried;
      const add = clamp(amount, 0, free);
      state.carried += add;
      state.events.push({ type: 'pickup', payload: add });
    } else if (hitEnt.isRivalConvoy) {
      // C28: rivals are traffic, never a run-ending hazard — a small speed knock only.
      state.speed = applyPermille(state.speed, config.bonuses.rivalBumpSpeedPermille);
      state.events.push({ type: 'rivalBump', payload: hitEnt.id });
    } else if (hitEnt.isIntegrityHazard) {
      const mild = hitEnt.kind === 'late-materials';
      state.integrity = Math.max(0, state.integrity - (mild ? 10 : 15));
      state.events.push({ type: 'integrityFail', payload: hitEnt.kind });
      state.momentum = config.momentum.min;
      if (hitEnt.kind === 'snatcher') {
        state.carried -= applyPermille(state.carried, 600);
        state.speed = applyPermille(state.speed, config.hit.speedPermille);
      } else if (hitEnt.kind === 'vote-buyer') {
        state.carried -= applyPermille(state.carried, 250);
        state.speed = applyPermille(state.speed, 350);
      } else if (hitEnt.kind === 'result-swapper') {
        // Upload interrupted: a delay, no crowd lost.
        state.speed = applyPermille(state.speed, 300);
      } else if (hitEnt.kind === 'network-glitch') {
        // Retry the upload: hard stall, no crowd lost.
        state.speed = config.brakeSpeedUm;
      } else if (hitEnt.kind === 'late-materials') {
        // Venue opens late: mild delay only.
        state.speed = applyPermille(state.speed, 600);
      } else if (hitEnt.kind === 'spot-the-fake') {
        // Misjudged a headline: brief jam, small crowd nibble.
        state.carried -= applyPermille(state.carried, 150);
        state.speed = applyPermille(state.speed, 400);
      } else {
        // sleepy-voter: jam the lane
        state.speed = config.brakeSpeedUm;
      }
      state.events.push({ type: 'hit', payload: hitEnt.id });
    } else if (state.rideFreeHit && !state.freeHitUsed) {
      // C26 Hilux trait: the first real hit per run is absorbed, no dent.
      state.freeHitUsed = true;
      state.speed = applyPermille(state.speed, config.hit.speedPermille);
      state.momentum = config.momentum.min;
      state.invulnTicks = config.hit.invulnTicks;
      state.events.push({ type: 'hit', payload: hitEnt.id });
    } else {
      state.dents++;
      const wouldBreak = state.dents >= config.hit.maxDents;
      const canReboot = perkId === 'reboot' && state.perkCooldownTicks === 0;
      if (wouldBreak && canReboot) {
        state.dents = config.hit.maxDents - 1;
        state.perkActiveTicks = contender.perk.durationSec * 60;
        state.perkCooldownTicks = Math.floor((contender.perk.cooldownSec * 60 * perkChargeMult) / 1000);
        state.invulnTicks = contender.perk.durationSec * 60;
        state.events.push({ type: 'perk', payload: 'reboot' });
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

  state.entities = state.entities.filter((e) => {
    if (e.isZone) return true;
    if (e.z > state.z - config.spawn.despawnBehindMm) return true;
    if (e.active && e.isIntegrityHazard) {
      state.integrity = Math.min(100, state.integrity + 8);
      state.events.push({ type: 'integritySuccess', payload: e.kind });
    } else if (e.active && e.isRivalConvoy) {
      // C28: passed a rival without a bump — the "Draft & Overtake" bonus (spec §4.6).
      state.skillCrowd += config.bonuses.rivalOutpaceCrowd;
      state.displayCrowd += config.bonuses.rivalOutpaceCrowd;
      state.events.push({ type: 'rivalOutpace', payload: e.id });
    }
    return false;
  });

  // C28 PVC pickup buff: applies to every delivery while active, independent of venue timing.
  if (state.pvcBuffTicks > 0) state.pvcBuffTicks--;

  state.prevInput = input;
  state.tick++;
}
