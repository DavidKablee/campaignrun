import { stateSchema, type StateDef } from './schemas';

/**
 * Runtime boundary for playable-state content. Drop a JSON file under
 * `data/states/` and it becomes loadable with no game-code change (Vite/Vitest
 * resolve `import.meta.glob`). Schema stays the same for landmarks, scenery,
 * hazards, and palette.
 *
 * `dummy` is a CI fixture and is never treated as a campaign state.
 */
const packModules = import.meta.glob<{ default: unknown }>('../data/states/*.json');

function idFromPath(path: string): string {
  const match = path.match(/\/([a-z0-9-]+)\.json$/);
  if (!match?.[1]) throw new Error(`Bad state pack path: ${path}`);
  return match[1];
}

const packLoaders: Record<string, () => Promise<{ default: unknown }>> = Object.fromEntries(
  Object.entries(packModules).map(([path, load]) => [idFromPath(path), load]),
);

export async function loadStatePack(id: string): Promise<StateDef> {
  const load = packLoaders[id];
  if (!load) throw new Error(`Unknown state pack: ${id}`);
  return stateSchema.parse((await load()).default);
}

export function availableStatePacks(): string[] {
  return Object.keys(packLoaders).sort();
}

/** Campaign states with shipped packs (excludes the dummy fixture). */
export function shippedStatePacks(): string[] {
  return availableStatePacks().filter((id) => id !== 'dummy');
}

export function hasStatePack(id: string): boolean {
  return id !== 'dummy' && id in packLoaders;
}
