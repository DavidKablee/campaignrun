import { stateSchema, type StateDef } from './schemas';

/**
 * Runtime boundary for playable-state content. Drop a JSON file under
 * `data/states/` and it becomes loadable with no game-code change (Vite/Vitest
 * resolve `import.meta.glob`). Schema stays the same for landmarks, scenery,
 * hazards, and palette.
 *
 * `dummy` is a CI fixture and is never treated as a campaign state.
 */
/**
 * `import.meta.glob` is a Vite/Vitest feature. The API bundles this package too
 * (for the state and ride ids it validates against) and would crash on import
 * under plain Node, so the call is guarded and there are simply no lazy packs
 * on a server — `loadStatePack` is never called there.
 *
 * The guard tests `import.meta.env`, not `import.meta.glob`. Vite replaces the
 * glob *call* at build time but leaves `import.meta.glob` itself undefined at
 * runtime, so guarding on the function emptied the pack list in the browser
 * while still passing under Vitest.
 */
const packModules: Record<string, () => Promise<{ default: unknown }>> = import.meta.env
  ? import.meta.glob<{ default: unknown }>('../data/states/*.json')
  : {};

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
