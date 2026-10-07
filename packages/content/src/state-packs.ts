import { stateSchema, type StateDef } from './schemas';

/**
 * Runtime boundary for playable-state content. New packs are registered here
 * as a data import only; their schema remains the same and no game code needs
 * to know their landmarks, scenery, hazards, or palette.
 *
 * The first shipped Lagos pack is also available synchronously for the launch
 * shell. Every later pack remains behind a dynamic import until it is opened.
 */
const packLoaders: Record<string, () => Promise<{ default: unknown }>> = {
  lagos: () => import('../data/states/lagos.json'),
  dummy: () => import('../data/states/dummy.json'),
};

export async function loadStatePack(id: string): Promise<StateDef> {
  const load = packLoaders[id];
  if (!load) throw new Error(`Unknown state pack: ${id}`);
  return stateSchema.parse((await load()).default);
}

export function availableStatePacks(): string[] {
  return Object.keys(packLoaders);
}
