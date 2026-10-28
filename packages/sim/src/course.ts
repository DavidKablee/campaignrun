import type { SimConfig } from '@cr/content';
import type { Entity, SimState } from './types';
import { rngIntRange } from './rng';
import { applyPermille } from './fixed';
import { laneCenterMm } from './geometry';

function pushZone(
  state: SimState,
  config: SimConfig,
  kind: Entity['zoneKind'],
  z: number,
  groupSize?: number,
  stubborn = false,
): void {
  state.entities.push({
    id: state.entityIdSeq++,
    kind: kind === 'pickup' ? 'pickup-zone' : kind === 'finish' ? 'finish' : kind === 'gate' ? 'gate' : kind === 'grand' ? 'grand-rally' : 'venue',
    lane: 1,
    z,
    halfWidthMm: config.zones.halfWidthMm,
    halfLenMm: config.zones.halfLenMm,
    heightMm: 500,
    active: true,
    isZone: true,
    zoneKind: kind,
    groupSize,
    consumed: false,
    ...(stubborn ? { stubborn: true } : {}),
  });
}

/**
 * C45: the state's road reweights the table. This is the main thing hazards do
 * — a flood state is a table where `flood-patch` is 2.6x as likely, and C26
 * already says a flood patch blocks size L, so the road has made the Coaster
 * the wrong ride without a single new rule. Never below 1, so a hazard can
 * make a kind rare but never delete it from the road.
 */
function obstacleWeight(state: SimState, o: SimConfig['obstacles'][number]): number {
  const permille = state.road.obstacleWeightPermille[o.kind] ?? 1000;
  return Math.max(1, applyPermille(o.weight, permille));
}

function pickWeightedObstacle(state: SimState, config: SimConfig) {
  let total = 0;
  for (const o of config.obstacles) total += obstacleWeight(state, o);
  let roll = rngIntRange(state.rng, 0, total - 1);
  for (const o of config.obstacles) {
    const weight = obstacleWeight(state, o);
    if (roll < weight) return o;
    roll -= weight;
  }
  return config.obstacles[0]!;
}

/** Does the traffic table know how to move this obstacle kind? */
function trafficKind(config: SimConfig, kind: string) {
  return config.traffic.kinds.find((k) => k.kind === kind);
}

function pickTrafficKind(state: SimState, config: SimConfig) {
  const weight = (k: SimConfig['traffic']['kinds'][number]) =>
    Math.max(1, applyPermille(k.weight, state.road.obstacleWeightPermille[k.kind] ?? 1000));
  let total = 0;
  for (const k of config.traffic.kinds) total += weight(k);
  let roll = rngIntRange(state.rng, 0, total - 1);
  for (const k of config.traffic.kinds) {
    const w = weight(k);
    if (roll < w) return k;
    roll -= w;
  }
  return config.traffic.kinds[0]!;
}

/**
 * Lays down one vehicle that moves. Where it may drive depends on where it
 * sits in the window: oncoming traffic stays clear of the stop it follows
 * (`oncomingMinOffsetMm`) and slow same-direction traffic stays in the first
 * part (`slowMaxOffsetMm`) so it cannot crawl into the unload zone. Returns
 * false when this kind has nowhere legal to go here, and the caller falls back
 * to an ordinary obstacle.
 *
 * Every random draw happens whether or not it is used, so the course after
 * this slot is the same however the slot resolved.
 */
function spawnMover(
  state: SimState,
  config: SimConfig,
  kindDef: SimConfig['traffic']['kinds'][number],
  lane: 0 | 1 | 2,
  z: number,
  offsetMm: number,
): boolean {
  const t = config.traffic;
  const dims = config.obstacles.find((o) => o.kind === kindDef.kind);
  const directionRoll = rngIntRange(state.rng, 0, 1);
  const speedRoll = rngIntRange(state.rng, 0, 999);
  const weaverRoll = rngIntRange(state.rng, 0, 999);
  const sideRoll = rngIntRange(state.rng, 0, 1);
  if (!dims) return false;

  const canSlow = kindDef.slow !== undefined && offsetMm <= t.slowMaxOffsetMm;
  const canOncoming = kindDef.oncoming !== undefined && offsetMm >= t.oncomingMinOffsetMm;
  if (!canSlow && !canOncoming) return false;

  // Half of what can go either way goes oncoming; what can only go one way does.
  const oncoming = canOncoming && (!canSlow || directionRoll === 0);
  const range = (oncoming ? kindDef.oncoming : kindDef.slow)!;
  const vz = range[0] + Math.floor(((range[1] - range[0]) * speedRoll) / 999);
  const weaver = weaverRoll < (kindDef.weaverChancePermille ?? 0);

  const ent: Entity = {
    id: state.entityIdSeq++,
    kind: kindDef.kind,
    lane,
    z,
    halfWidthMm: dims.halfWidthMm,
    halfLenMm: dims.halfLenMm,
    heightMm: dims.heightMm,
    active: true,
    mover: weaver ? 'weaver' : oncoming ? 'oncoming' : 'slow',
    vz,
    xMm: laneCenterMm(lane, config),
    awake: false,
  };
  if (weaver) {
    // Edge lanes drift toward the middle, the middle one picks a side.
    ent.weaveTo = lane === 1 ? ((sideRoll === 0 ? 0 : 2) as 0 | 2) : 1;
    ent.weaveState = 0;
  }
  state.entities.push(ent);
  return true;
}

/**
 * One entry from the obstacle table. A vehicle kind drives if it has somewhere
 * legal to go at this spot; everything else (and a vehicle with nowhere to go)
 * is a prop in the road as before.
 */
function pushObstacle(
  state: SimState,
  config: SimConfig,
  obstacle: SimConfig['obstacles'][number],
  lane: 0 | 1 | 2,
  z: number,
  offsetMm: number,
): void {
  const driver = trafficKind(config, obstacle.kind);
  if (driver && spawnMover(state, config, driver, lane, z, offsetMm)) return;
  state.entities.push({
    id: state.entityIdSeq++,
    kind: obstacle.kind,
    lane,
    z,
    halfWidthMm: obstacle.halfWidthMm,
    halfLenMm: obstacle.halfLenMm,
    heightMm: obstacle.heightMm,
    active: true,
    sizeTag: obstacle.sizeTag,
  });
}

function spawnHazardCluster(state: SimState, config: SimConfig, fromZ: number, toZ: number): void {
  // C45: a busier road is a smaller gap. Both ends move together so the spread
  // stays a spread. How close a three-hazard state may stack things is decided
  // in road.json's clamp, not here; the Math.max is only so a hand-built road
  // with a zero in it cannot spin this loop forever.
  const gapMin = Math.max(1, applyPermille(config.course.hazardGapMinMm, state.road.gapPermille));
  const gapMax = Math.max(gapMin, applyPermille(config.course.hazardGapMaxMm, state.road.gapPermille));
  const doubleChance = Math.min(1000, applyPermille(config.spawn.doubleChancePermille, state.road.doubleChancePermille));
  let z = fromZ + gapMin;
  while (z < toZ - 5000) {
    const offsetMm = z - fromZ;
    const roll = rngIntRange(state.rng, 0, 999);
    const supporterCut = config.spawn.supporterChancePermille;
    const integrityCut = supporterCut + config.spawn.integrityChancePermille;
    const pvcCut = integrityCut + config.spawn.pvcChancePermille;
    // C44: a Grand Convoy is the one thing on the road worth coming out for, so
    // it meets more rival traffic. This moves one branch cut and takes no extra
    // roll to decide it — but the branches themselves draw different numbers of
    // rolls, so two rides on the same seed no longer get identical courses.
    // Determinism stays per-ride, which is all the ghost replay needs: it
    // re-simulates with the ride that recorded it.
    const rivalCut = pvcCut + applyPermille(config.spawn.rivalChancePermille, state.rideRivalDrawPermille);
    const isSupporter = roll < supporterCut;
    const isIntegrity = !isSupporter && roll < integrityCut;
    const isPvc = !isSupporter && !isIntegrity && roll < pvcCut;
    const isRival = !isSupporter && !isIntegrity && !isPvc && roll < rivalCut;
    const isTraffic = !isSupporter && !isIntegrity && !isPvc && !isRival && roll < rivalCut + config.traffic.chancePermille;
    const lane = rngIntRange(state.rng, 0, 2) as 0 | 1 | 2;

    if (isSupporter) {
      const loose = rngIntRange(state.rng, 0, 999) < config.spawn.looseSupporterChancePermille;
      if (loose) {
        state.entities.push({
          id: state.entityIdSeq++,
          kind: 'loose-supporter',
          lane,
          z,
          halfWidthMm: 400,
          halfLenMm: 400,
          heightMm: 1000,
          active: true,
          isPickup: true,
          value: 1,
        });
      } else {
        const permille = config.groupSizeMinPermille + rngIntRange(state.rng, 0, config.groupSizeSpanPermille);
        const value = Math.max(1, Math.floor((state.capacity * permille) / 1000));
        state.entities.push({
          id: state.entityIdSeq++,
          kind: 'supporter',
          lane,
          z,
          halfWidthMm: 500,
          halfLenMm: 500,
          heightMm: 1000,
          active: true,
          isPickup: true,
          value,
        });
      }
    } else if (isIntegrity) {
      // Round-robin kinds so frequencies stay equal across Contenders and seeds (C06 + C28).
      const kinds = [
        'snatcher',
        'vote-buyer',
        'sleepy-voter',
        'result-swapper',
        'network-glitch',
        'late-materials',
        'spot-the-fake',
      ] as const;
      const kind = kinds[state.integritySpawnSeq % kinds.length]!;
      // The ones that are people on their feet cross the road once the player
      // is close; a slumped voter and a crate of materials stay where they are.
      // The side comes from the spawn counter, so this costs no random draw.
      const walks = kind !== 'sleepy-voter' && kind !== 'late-materials';
      const side = state.integritySpawnSeq % 2;
      state.integritySpawnSeq++;
      state.entities.push({
        id: state.entityIdSeq++,
        kind,
        lane,
        z,
        halfWidthMm: 500,
        halfLenMm: 500,
        heightMm: 1200,
        active: true,
        isIntegrityHazard: true,
        ...(walks
          ? {
              mover: 'walker' as const,
              vz: 0,
              xMm: laneCenterMm(lane, config),
              awake: false,
              weaveTo: lane === 1 ? ((side === 0 ? 0 : 2) as 0 | 2) : (1 as const),
              weaveState: 0 as const,
            }
          : {}),
      });
    } else if (isPvc) {
      // C28: a free-standing collectible, not a pickup zone — grants a temporary Crowd buff.
      state.entities.push({
        id: state.entityIdSeq++,
        kind: 'pvc-pickup',
        lane,
        z,
        halfWidthMm: 400,
        halfLenMm: 400,
        heightMm: 900,
        active: true,
      });
    } else if (isTraffic && spawnMover(state, config, pickTrafficKind(state, config), lane, z, offsetMm)) {
      // a vehicle that drives: placed by spawnMover
    } else if (isRival) {
      // C28: an NPC convoy of another Contender — round-robin so every ride model shows equally.
      const model = state.rivalSpawnSeq % 4;
      state.rivalSpawnSeq++;
      const t = config.traffic;
      // Early in a window a rival is on the move (slower than the player, so
      // passing one is an overtake); further on it keeps its old place in the road.
      const rivalSpeedRoll = rngIntRange(state.rng, 0, 999);
      const driving = offsetMm <= t.slowMaxOffsetMm;
      state.entities.push({
        id: state.entityIdSeq++,
        kind: 'rival-convoy',
        lane,
        z,
        halfWidthMm: 700,
        halfLenMm: 1600,
        heightMm: 1700,
        active: true,
        isRivalConvoy: true,
        value: model,
        ...(driving
          ? {
              mover: 'slow' as const,
              vz: t.rivalVzMin + Math.floor(((t.rivalVzMax - t.rivalVzMin) * rivalSpeedRoll) / 999),
              xMm: laneCenterMm(lane, config),
              awake: false,
            }
          : {}),
      });
    } else {
      pushObstacle(state, config, pickWeightedObstacle(state, config), lane, z, offsetMm);
      if (rngIntRange(state.rng, 0, 999) < doubleChance) {
        const lane2 = ((lane + 1 + rngIntRange(state.rng, 0, 1)) % 3) as 0 | 1 | 2;
        pushObstacle(state, config, pickWeightedObstacle(state, config), lane2, z + 800, offsetMm + 800);
      }
    }

    const gap = rngIntRange(state.rng, gapMin, gapMax);
    z += gap;
  }
}

/** Build the full deterministic course once at run start. */
export function buildCourse(state: SimState, config: SimConfig): void {
  const c = config.course;
  pushZone(state, config, 'gate', c.borderGateMm);

  let cursor = c.borderGateMm;
  for (let s = 0; s < c.segmentCount; s++) {
    const segStart = cursor;
    const pickupZ = segStart + c.pickupOffsetMm;
    const venueZ = segStart + c.venueOffsetMm;
    const segEnd = segStart + c.segmentLengthMm;

    const permille = config.groupSizeMinPermille + rngIntRange(state.rng, 0, config.groupSizeSpanPermille);
    const groupSize = Math.max(1, Math.floor((state.capacity * permille) / 1000));
    pushZone(state, config, 'pickup', pickupZ, groupSize);

    spawnHazardCluster(state, config, pickupZ + config.zones.halfLenMm, venueZ - config.zones.halfLenMm);

    // Chaos is placed from the segment number alone: no roll, so it never moves
    // the rest of the course, and every seed meets the same number of moments.
    const chaos = config.chaos;
    if (s % chaos.agberoEverySegments === chaos.agberoEverySegments - 1) {
      state.entities.push({
        id: state.entityIdSeq++,
        kind: 'agbero',
        lane: ((s * 2 + 1) % 3) as 0 | 1 | 2,
        z: Math.floor((pickupZ + venueZ) / 2),
        halfWidthMm: 450,
        halfLenMm: 500,
        heightMm: 1700,
        active: true,
        isToll: true,
      });
    }

    pushZone(state, config, 'venue', venueZ, undefined, s % chaos.stubbornEverySegments === chaos.stubbornEverySegments - 1);
    cursor = segEnd;
  }

  const grandZ = cursor + c.grandRallyMm / 2;
  pushZone(state, config, 'grand', grandZ);
  const finishZ = cursor + c.grandRallyMm + c.finishPadMm;
  pushZone(state, config, 'finish', finishZ);
  state.finishZ = finishZ;
  state.nextHazardZ = finishZ + 100000;
  state.courseBuilt = true;
}

/** Total course length mm (for bot timing estimates). */
export function courseLengthMm(config: SimConfig): number {
  const c = config.course;
  return c.borderGateMm + c.segmentCount * c.segmentLengthMm + c.grandRallyMm + c.finishPadMm;
}
