import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './safeStorage';
import type { OutfitChoice } from '@cr/content';

/**
 * C31: the roster reverted to the original fictional names (spec v3 section 4.2).
 * Maps a retired id to its replacement. Applied on load, so a device that picked a
 * Contender under the old ids keeps the same character, perk and outfit.
 * Ids already on the current roster are left untouched, so this is idempotent.
 */
const RENAMED_IDS: Record<string, string> = {
  'baba-bullabaa': 'mama-ankara',
  'mr-tiko': 'engineer-spark',
  'mr-obiliki': 'captain-kobo',
  'comrade-yale': 'sister-beacon',
  'mr-don': 'uncle-boombox',
  'prof-sarah': 'madam-metronome',
};

interface ContenderState {
  activeContenderId: string | null;
  contenderLocked: boolean;
  contenderGraceUsed: boolean;
  outfits: Record<string, Partial<OutfitChoice>>;
  setActiveContender: (id: string) => void;
  lockAfterFinish: () => void;
  setOutfit: (contenderId: string, patch: Partial<OutfitChoice>) => void;
  resetOutfit: (contenderId: string) => void;
  replaceAll: (data: Partial<Pick<ContenderState, 'activeContenderId' | 'contenderLocked' | 'contenderGraceUsed' | 'outfits'>>) => void;
  clear: () => void;
}

const empty = {
  activeContenderId: null as string | null,
  contenderLocked: false,
  contenderGraceUsed: false,
  outfits: {} as Record<string, Partial<OutfitChoice>>,
};

/** Contender choice lives in its own table — never mixed into public score blobs. */
export const useContenderStore = create<ContenderState>()(
  persist(
    (set) => ({
      ...empty,
      setActiveContender: (id) =>
        set((st) => {
          if (st.activeContenderId === id) return st;
          if (st.contenderLocked && st.contenderGraceUsed) return st;
          if (st.contenderLocked) return { activeContenderId: id, contenderGraceUsed: true };
          return { activeContenderId: id };
        }),
      lockAfterFinish: () => set({ contenderLocked: true }),
      setOutfit: (id, patch) => set((st) => ({ outfits: { ...st.outfits, [id]: { ...st.outfits[id], ...patch } } })),
      resetOutfit: (id) =>
        set((st) => {
          const next = { ...st.outfits };
          delete next[id];
          return { outfits: next };
        }),
      replaceAll: (data) => set((st) => ({ ...st, ...data })),
      clear: () => set(empty),
    }),
    {
      name: 'cr-contender',
      version: 2,
      migrate: (persisted) => {
        let out = { ...((persisted ?? {}) as Record<string, unknown>) };
        const id = out.activeContenderId;
        const outfits = { ...((out.outfits ?? {}) as Record<string, unknown>) };
        if (typeof id === 'string' && RENAMED_IDS[id]) out.activeContenderId = RENAMED_IDS[id];
        for (const [oldId, nextId] of Object.entries(RENAMED_IDS)) {
          if (outfits[oldId] && !outfits[nextId]) outfits[nextId] = outfits[oldId];
          delete outfits[oldId];
        }
        out = { ...out, outfits };
        return out as unknown as ContenderState;
      },
      partialize: (state) => ({
        activeContenderId: state.activeContenderId,
        contenderLocked: state.contenderLocked,
        contenderGraceUsed: state.contenderGraceUsed,
        outfits: state.outfits,
      }),
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);

/** One-time lift of Contender fields out of the old combined game save. */
export function migrateContenderFromGameStorage(): void {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem('cr-contender')) return;
  const raw = localStorage.getItem('cr-storage');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    const st = parsed.state ?? {};
    if (!('activeContenderId' in st) && !('outfits' in st)) return;
    useContenderStore.getState().replaceAll({
      activeContenderId: (st.activeContenderId as string | null) ?? null,
      contenderLocked: Boolean(st.contenderLocked),
      contenderGraceUsed: Boolean(st.contenderGraceUsed),
      outfits: (st.outfits as Record<string, Partial<OutfitChoice>>) ?? {},
    });
  } catch {
    /* ignore corrupt legacy saves */
  }
}
