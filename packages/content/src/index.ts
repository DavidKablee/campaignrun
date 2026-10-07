import simJson from '../data/sim.json';
import contendersJson from '../data/contenders.json';
import ridesJson from '../data/rides.json';
import calendarJson from '../data/calendar.json';
import copyJson from '../data/copy.en.json';
import launchStateJson from '../data/launch-state.json';
import outfitsJson from '../data/outfits.json';
import stationsJson from '../data/stations.json';
import statesIndexJson from '../data/states-index.json';
import {
  calendarSchema,
  contenderSchema,
  copySchema,
  launchStateSchema,
  outfitsSchema,
  rideSchema,
  simConfigSchema,
  stateIndexSchema,
  stationSchema,
} from './schemas';

export * from './schemas';
export * from './state-packs';

/** Parsed at import time: an invalid pack fails the build, not the player. */
export const simConfig = simConfigSchema.parse(simJson);
export const contenders = contenderSchema.array().parse(contendersJson);
export const rides = rideSchema.array().parse(ridesJson);
export const calendar = calendarSchema.parse(calendarJson);
export const copy = copySchema.parse(copyJson);
export const lagosLaunch = launchStateSchema.parse(launchStateJson);
export const outfits = outfitsSchema.parse(outfitsJson);
export const stations = stationSchema.array().parse(stationsJson);
export const stateIndex = stateIndexSchema.array().parse(statesIndexJson);

export const activeContenders = contenders.filter((c) => c.status === 'active');

/** A ride can be selected only when this chunk marks it playable and Following is met. */
export function isRidePlayable(ride: (typeof rides)[number], following: number): boolean {
  return ride.playable && following >= ride.followingGate;
}
