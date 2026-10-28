import { useEffect, useState } from 'react';
import { LAGOS_WORLD, loadStatePack, loadWorldLibrary, resolveWorld, type ResolvedWorld, type StateDef } from '@cr/content';

/** Loads a state's content pack for whichever screen needs its name and landmarks. */
export function useStatePack(id: string): StateDef | null {
  const [pack, setPack] = useState<StateDef | null>(null);
  useEffect(() => {
    let alive = true;
    setPack(null);
    void loadStatePack(id)
      .then((p) => {
        if (alive) setPack(p);
      })
      .catch(() => {
        if (alive) setPack(null);
      });
    return () => {
      alive = false;
    };
  }, [id]);
  return pack;
}

/**
 * The world a state is drawn with. A state without a `world` block resolves to the
 * stock Lagos world at once; one with a block waits for its (lazy) library and is
 * null until then, so the run never starts on the wrong look.
 */
export function useStateWorld(pack: StateDef | null): ResolvedWorld | null {
  const [world, setWorld] = useState<ResolvedWorld | null>(null);
  useEffect(() => {
    let alive = true;
    if (!pack) {
      setWorld(null);
      return;
    }
    if (!pack.world) {
      setWorld(LAGOS_WORLD);
      return;
    }
    setWorld(null);
    void loadWorldLibrary(pack.world.library)
      .then((lib) => {
        if (alive) setWorld(resolveWorld(pack, lib));
      })
      .catch((err: unknown) => {
        // A missing library falls back to Lagos rather than blocking the run, but never
        // silently: a state that draws the wrong world must be loud in the console.
        console.error(`World library "${pack.world?.library}" for ${pack.id} failed to load; drawing the Lagos world.`, err);
        if (alive) setWorld(LAGOS_WORLD);
      });
    return () => {
      alive = false;
    };
  }, [pack]);
  return world;
}
