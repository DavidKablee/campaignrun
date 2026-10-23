import { useEffect, useState } from 'react';
import { loadStatePack, type StateDef } from '@cr/content';

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
