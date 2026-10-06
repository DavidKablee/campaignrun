import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Screen = 'splash' | 'roster' | 'game' | 'summary';

interface GameState {
  screen: Screen;
  setScreen: (s: Screen) => void;
  
  // Persisted state
  coins: number;
  addCoins: (amount: number) => void;
  activeContenderId: string | null;
  setActiveContender: (id: string) => void;
  sfxVolume: number;
  musicVolume: number;
  setVolumes: (sfx: number, music: number) => void;

  // Transient state
  lastRunDistance: number;
  lastRunSupporters: number;
  setRunResult: (distance: number, supporters: number) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      screen: 'splash',
      setScreen: (s) => set({ screen: s }),

      coins: 0,
      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      activeContenderId: null,
      setActiveContender: (id) => set({ activeContenderId: id }),
      
      sfxVolume: 1.0,
      musicVolume: 0.5,
      setVolumes: (sfx, music) => set({ sfxVolume: sfx, musicVolume: music }),

      lastRunDistance: 0,
      lastRunSupporters: 0,
      setRunResult: (distance, supporters) => set({ lastRunDistance: distance, lastRunSupporters: supporters }),
    }),
    {
      name: 'cr-storage',
      partialize: (state) => ({
        coins: state.coins,
        activeContenderId: state.activeContenderId,
        sfxVolume: state.sfxVolume,
        musicVolume: state.musicVolume,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
