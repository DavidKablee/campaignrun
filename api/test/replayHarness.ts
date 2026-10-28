import { rideSimTraits, rides, roadProfile, runModifiers, simConfig, stateRoad } from '@cr/content';
import { botInput } from '../../packages/sim/test/helpers/dodgeBot';
import { encodeInputLog, initState, seedRng, step, type InputRecord } from '@cr/sim';

export const noUpgrades = { magnet: 0, shield: 0, horn: 0, loading: 0, value: 0 };

/** A real run, played and logged the way the client does it. */
export function play(seed: number, rideId = 'danfo', contenderId = 'mama-ankara', stateId = 'lagos') {
  const road = stateRoad(stateId)!;
  const ride = rides.find((r) => r.id === rideId)!;
  const state = initState(simConfig, seedRng(seed), {
    ...rideSimTraits(ride),
    road: roadProfile(road.hazards),
    contenderId,
    upgrades: runModifiers(noUpgrades),
    signatureRideBonusPermille: road.signatureRide === ride.id ? simConfig.bonuses.signatureRideBonusPermille : 1000,
  });
  const log: InputRecord[] = [];
  let last = -1;
  while (state.phase === 'running' && state.tick < simConfig.tickHz * 600) {
    const bits = botInput(state, simConfig);
    if (bits !== last) {
      log.push({ tick: state.tick, input: bits });
      last = bits;
    }
    step(state, bits, simConfig);
  }
  const body = {
    stateId,
    rideId,
    crowd: state.skillCrowd,
    delivered: state.delivered,
    dents: state.dents,
    integrity: state.integrity,
    capacity: state.capacity,
    replay: {
      seed,
      log: Buffer.from(encodeInputLog(log)).toString('base64'),
      upgrades: noUpgrades,
      rallySaturday: false,
    },
  };
  return body;
}

