import simJson from '../data/sim.json';
import contendersJson from '../data/contenders.json';
import ridesJson from '../data/rides.json';
import calendarJson from '../data/calendar.json';
import copyJson from '../data/copy.en.json';
import lagosJson from '../data/states/lagos.json';
import {
  calendarSchema,
  contenderSchema,
  copySchema,
  rideSchema,
  simConfigSchema,
  stateSchema,
} from './schemas';

export * from './schemas';

/** Parsed at import time: an invalid pack fails the build, not the player. */
export const simConfig = simConfigSchema.parse(simJson);
export const contenders = contenderSchema.array().parse(contendersJson);
export const rides = rideSchema.array().parse(ridesJson);
export const calendar = calendarSchema.parse(calendarJson);
export const copy = copySchema.parse(copyJson);
export const lagos = stateSchema.parse(lagosJson);

export const activeContenders = contenders.filter((c) => c.status === 'active');
