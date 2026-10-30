import simJson from '../data/sim.json';
import contendersJson from '../data/contenders.json';
import ridesJson from '../data/rides.json';
import calendarJson from '../data/calendar.json';
import copyJson from '../data/copy.en.json';
import launchStateJson from '../data/launch-state.json';
import outfitsJson from '../data/outfits.json';
import stationsJson from '../data/stations.json';
import statesIndexJson from '../data/states-index.json';
import metaJson from '../data/meta.json';
import integrityJson from '../data/integrity.json';
import travelJson from '../data/travel.json';
import legalJson from '../data/legal.json';
import limitsJson from '../data/limits.json';
import analyticsJson from '../data/analytics.json';
import liveEventsJson from '../data/live-events.json';
import placesJson from '../data/places.json';
import feedbackJson from '../data/feedback.json';
import controlsJson from '../data/controls.json';
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
  metaConfigSchema,
  integrityEventSchema,
  travelCapsSchema,
  legalSchema,
  limitsSchema,
  analyticsSchema,
  liveEventsSchema,
  placesSchema,
  feedbackTopicsSchema,
  controlsSchema,
  type SimConfig,
} from './schemas';

export * from './schemas';
export * from './state-packs';
export * from './world';
export * from './world-library';
export * from './standings';
export * from './mapgeo';
export * from './ride-feel';
export * from './road';
export * from './state-roads';
export * from './yard';
export * from './places';
import { rideRoadFit } from './road';
import type { Hazard } from './schemas';

/** Parsed at import time: an invalid pack fails the build, not the player. */
export const simConfig = simConfigSchema.parse(simJson);
/**
 * The config a run is played under. A quick rally is the same road with fewer
 * segments — everything that reads the course (sim, renderer, ghost, the
 * trail labels) has to be handed this, not the global, or it disagrees about
 * where the finish is.
 */
export function runConfig(config: SimConfig, quick: boolean): SimConfig {
  if (!quick) return config;
  const segmentCount = Math.min(config.course.segmentCount, config.course.quickSegmentCount);
  return { ...config, course: { ...config.course, segmentCount } };
}
export const contenders = contenderSchema.array().parse(contendersJson);
export const rides = rideSchema.array().parse(ridesJson);
export const calendar = calendarSchema.parse(calendarJson);
export const copy = copySchema.parse(copyJson);
export const lagosLaunch = launchStateSchema.parse(launchStateJson);
export const outfits = outfitsSchema.parse(outfitsJson);
export const stations = stationSchema.array().parse(stationsJson);
export const stateIndex = stateIndexSchema.array().parse(statesIndexJson);
export const metaConfig = metaConfigSchema.parse(metaJson);
export const integrityEvents = integrityEventSchema.array().parse(integrityJson);
export const travelCaps = travelCapsSchema.parse(travelJson);
export const legal = legalSchema.parse(legalJson);
export const limits = limitsSchema.parse(limitsJson);
export const analytics = analyticsSchema.parse(analyticsJson);
export const liveEvents = liveEventsSchema.parse(liveEventsJson);
/** C82: the Mobilise places, their actions, preset phrases and daily caps. */
export const places = placesSchema.parse(placesJson);
export const feedbackTopics = feedbackTopicsSchema.parse(feedbackJson).topics;
/** C46: gesture thresholds for the on-glass controls. */
export const controlTuning = controlsSchema.parse(controlsJson);

export const activeContenders = contenders.filter((c) => c.status === 'active');

/** Player-facing label for a party slot: the Candidate who leads it, not the group name. */
export function candidateName(party: { contenderId: string; name: string } | undefined): string {
  if (!party) return '';
  return contenders.find((c) => c.id === party.contenderId)?.name ?? party.name;
}

export function integrityEvent(id: string) {
  return integrityEvents.find((e) => e.id === id) ?? integrityEvents[0]!;
}

/** A ride can be selected only when this chunk marks it playable and Following is met. */
export function isRidePlayable(ride: (typeof rides)[number], following: number): boolean {
  return ride.playable && following >= ride.followingGate;
}

/**
 * C45: `rideRoadFit` bound to the shipped obstacle table, which is where the
 * size tags live. Callers in the game only ever want this version — the pure
 * three-argument one exists so the road layer never has to import simConfig.
 */
export function roadFit(ride: (typeof rides)[number], hazards: readonly Hazard[]) {
  return rideRoadFit(ride, hazards, { obstacles: simConfig.obstacles, hopHeightMm: simConfig.hopHeightMm });
}
