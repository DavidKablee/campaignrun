import { worldLibrarySchema, type WorldLibrary } from './world';

/**
 * Shared per-biome world libraries, lazy like the state packs: `data/world/<name>.json`
 * becomes a chunk fetched only when a state that names it is played. Same
 * `import.meta.env` guard as `state-packs.ts` (the API bundles this package too
 * and has no `import.meta.glob`). A dev server only sees new files in this folder
 * because `apps/game/vite.config.ts` watches it (`cr-watch-content-data`).
 */
const libraryModules: Record<string, () => Promise<{ default: unknown }>> = import.meta.env
  ? import.meta.glob<{ default: unknown }>('../data/world/*.json')
  : {};

const libraryLoaders: Record<string, () => Promise<{ default: unknown }>> = Object.fromEntries(
  Object.entries(libraryModules).map(([path, load]) => {
    const name = path.match(/\/([a-z0-9-]+)\.json$/)?.[1];
    if (!name) throw new Error(`Bad world library path: ${path}`);
    return [name, load];
  }),
);

export async function loadWorldLibrary(name: string): Promise<WorldLibrary> {
  const load = libraryLoaders[name];
  if (!load) throw new Error(`Unknown world library: ${name}`);
  return worldLibrarySchema.parse((await load()).default);
}

export function availableWorldLibraries(): string[] {
  return Object.keys(libraryLoaders).sort();
}
