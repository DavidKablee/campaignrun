import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isRidePlayable, rides, type OutfitChoice } from '@cr/content';

export type Screen =
  | 'splash'
  | 'roster'
  | 'studio'
  | 'briefing'
  | 'game'
  | 'summary'
  | 'settings'
  | 'about'
  | 'map'
  | 'paused';

const STORE_VERSION = 6;

const PREVIOUS_IDS: Record<string, string> = {
  'mama-ankara': 'baba-bullabaa',
  'engineer-spark': 'mr-tiko',
  'captain-kobo': 'mr-obiliki',
  'sister-beacon': 'comrade-yale',
  'uncle-boombox': 'mr-don',
  'madam-metronome': 'prof-sarah',
};

interface GameState {
  screen: Screen;
  setScreen: (s: Screen) => void;

  coins: number;
  addCoins: (amount: number) => void;
  /** Lifetime supporters delivered. Unlocks rides. Stays on this device. */
  following: number;
  addFollowing: (amount: number) => void;
  bestByState: Record<string, { crowd: number; runs: number }>;
  noteRun: (stateId: string, crowd: number) => void;
  radioOn: boolean;
  setRadioOn: (on: boolean) => void;
  activeContenderId: string | null;
  setActiveContender: (id: string) => void;
  activeRideId: string;
  setActiveRide: (id: string) => void;
  /** Player edits to each Contender's outfit (cosmetic, local only). */
  outfits: Record<string, Partial<OutfitChoice>>;
  setOutfit: (contenderId: string, patch: Partial<OutfitChoice>) => void;
  resetOutfit: (contenderId: string) => void;

  sfxVolume: number;
  musicVolume: number;
  haptics: boolean;
  dataSaver: boolean;
  reduceMotion: boolean;
  setVolumes: (sfx: number, music: number) => void;
  setFlags: (f: Partial<Pick<GameState, 'haptics' | 'dataSaver' | 'reduceMotion'>>) => void;

  seenTutorial: boolean;
  setSeenTutorial: (v: boolean) => void;

  lastRunSkillCrowd: number;
  lastRunDisplayCrowd: number;
  lastRunDelivered: number;
  lastRunDents: number;
  lastRunPhase: 'finished' | 'breakdown';
  setRunResult: (r: {
    skillCrowd: number;
    displayCrowd: number;
    delivered: number;
    dents: number;
    phase: 'finished' | 'breakdown';
  }) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      screen: 'splash',
      setScreen: (s) => set({ screen: s }),

      coins: 0,
      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      following: 0,
      addFollowing: (amount) => set((state) => ({ following: state.following + amount })),
      bestByState: {},
      noteRun: (stateId, crowd) =>
        set((st) => {
          const prev = st.bestByState[stateId];
          return {
            bestByState: {
              ...st.bestByState,
              [stateId]: { crowd: Math.max(prev?.crowd ?? 0, crowd), runs: (prev?.runs ?? 0) + 1 },
            },
          };
        }),
      radioOn: true,
      setRadioOn: (on) => set({ radioOn: on }),
      activeContenderId: null,
      setActiveContender: (id) => set({ activeContenderId: id }),
      activeRideId: 'trek',
      setActiveRide: (id) =>
        set((st) => {
          const ride = rides.find((r) => r.id === id);
          if (!ride || !isRidePlayable(ride, st.following)) return st;
          return { activeRideId: id };
        }),
      outfits: {},
      setOutfit: (id, patch) => set((st) => ({ outfits: { ...st.outfits, [id]: { ...st.outfits[id], ...patch } } })),
      resetOutfit: (id) =>
        set((st) => {
          const next = { ...st.outfits };
          delete next[id];
          return { outfits: next };
        }),

      sfxVolume: 0.8,
      musicVolume: 0.35,
      haptics: true,
      dataSaver: false,
      reduceMotion: false,
      setVolumes: (sfx, music) => set({ sfxVolume: sfx, musicVolume: music }),
      setFlags: (f) => set(f),

      seenTutorial: false,
      setSeenTutorial: (v) => set({ seenTutorial: v }),

      lastRunSkillCrowd: 0,
      lastRunDisplayCrowd: 0,
      lastRunDelivered: 0,
      lastRunDents: 0,
      lastRunPhase: 'finished',
      setRunResult: (r) =>
        set({
          lastRunSkillCrowd: r.skillCrowd,
          lastRunDisplayCrowd: r.displayCrowd,
          lastRunDelivered: r.delivered,
          lastRunDents: r.dents,
          lastRunPhase: r.phase,
        }),
    }),
    {
      name: 'cr-storage',
      version: STORE_VERSION,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameState>;
        return {
          ...current,
          ...p,
          outfits: p.outfits ?? {},
          following: p.following ?? 0,
          bestByState: p.bestByState ?? {},
          radioOn: p.radioOn ?? true,
        };
      },
      migrate: (persisted, version) => {
        let out = { ...((persisted ?? {}) as Record<string, unknown>) };
        if (version < 2) {
          out = { ...out, activeRideId: 'trek', haptics: true, dataSaver: false, reduceMotion: false, seenTutorial: false };
        }
        if (version < 3) {
          out = { ...out, outfits: {}, sfxVolume: 0.8, musicVolume: 0.35 };
        }
        if (version < 4) {
          out = { ...out, following: 0 };
        }
        if (version < 5) {
          out = { ...out, bestByState: {}, radioOn: true };
        }
        if (version < 6) {
          const id = out.activeContenderId;
          const outfits = { ...((out.outfits ?? {}) as Record<string, unknown>) };
          if (typeof id === 'string' && PREVIOUS_IDS[id]) out.activeContenderId = PREVIOUS_IDS[id];
          for (const [oldId, nextId] of Object.entries(PREVIOUS_IDS)) {
            if (outfits[oldId] && !outfits[nextId]) outfits[nextId] = outfits[oldId];
            delete outfits[oldId];
          }
          out = { ...out, outfits };
        }
        return out as unknown as GameState;
      },
      partialize: (state) => ({
        coins: state.coins,
        following: state.following,
        bestByState: state.bestByState,
        radioOn: state.radioOn,
        activeContenderId: state.activeContenderId,
        activeRideId: state.activeRideId,
        outfits: state.outfits,
        sfxVolume: state.sfxVolume,
        musicVolume: state.musicVolume,
        haptics: state.haptics,
        dataSaver: state.dataSaver,
        reduceMotion: state.reduceMotion,
        seenTutorial: state.seenTutorial,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
