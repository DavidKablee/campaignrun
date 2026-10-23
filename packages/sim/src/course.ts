import type { SimConfig } from '@cr/content';
import type { Entity, SimState } from './types';
import { rngIntRange } from './rng';
import { applyPermille } from './fixed';

function pushZone(
  state: SimState,
  config: SimConfig,
  kind: Entity['zoneKind'],
  z: number,
  groupSize?: number,
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
    } else if (isRival) {
      // C28: an NPC convoy of another Contender — round-robin so every ride model shows equally.
      const model = state.rivalSpawnSeq % 4;
      state.rivalSpawnSeq++;
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
      });
    } else {
      const obstacle = pickWeightedObstacle(state, config);
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
      if (rngIntRange(state.rng, 0, 999) < doubleChance) {
        const lane2 = ((lane + 1 + rngIntRange(state.rng, 0, 1)) % 3) as 0 | 1 | 2;
        const o2 = pickWeightedObstacle(state, config);
        state.entities.push({
          id: state.entityIdSeq++,
          kind: o2.kind,
          lane: lane2,
          z: z + 800,
          halfWidthMm: o2.halfWidthMm,
          halfLenMm: o2.halfLenMm,
          heightMm: o2.heightMm,
          active: true,
          sizeTag: o2.sizeTag,
        });
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

    pushZone(state, config, 'venue', venueZ);
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
