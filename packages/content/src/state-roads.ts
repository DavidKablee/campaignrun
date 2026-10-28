import stateRoadsJson from '../data/state-roads.json';
import { hazardSchema, type Hazard } from './schemas';
import { z } from 'zod';

const stateRoadSchema = z.object({ hazards: z.array(hazardSchema).min(1), signatureRide: z.string() });

/**
 * The road each state pack describes, without the pack. A replay needs only
 * these two things to rebuild a run, and a Node server cannot load the packs
 * themselves (see `state-packs.ts`). `tools/gen-state-roads.mjs` writes the
 * table and a content test keeps it honest.
 */
export const stateRoads: Record<string, { hazards: Hazard[]; signatureRide: string }> = z
  .record(z.string(), stateRoadSchema)
  .parse(stateRoadsJson);

export function stateRoad(id: string): { hazards: Hazard[]; signatureRide: string } | undefined {
  return stateRoads[id];
}
