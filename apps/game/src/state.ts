import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isRidePlayable, metaConfig, rides, type UpgradeId } from '@cr/content';
import { useContenderStore } from './contenderStore';
import { challengeMet, todaysChallenge } from './daily';
import { submitLocalBoard, type LocalBoardEntry } from './localBoard';
import { emptyUpgrades, missionDelta, type MissionProgress, runPayout, type StartId, type UpgradeLevels, upgradeCost, watDay, watWeek } from './meta';
import { canTravel, emptyTravel, noteTravel, type TravelProgress } from './travel';
import { validateUsername } from './username';

export type Screen =
  | 'splash'
  | 'roster'
  | 'studio'
  | 'briefing'
  | 'game'
  | 'summary'
  | 'settings'
  | 'about'
  | 'account'
  | 'map'
  | 'auth'
  | 'paused'
  | 'yard';

const STORE_VERSION = 11;

interface GameState {
  screen: Screen;
  setScreen: (s: Screen) => void;
  /** Where Settings returns when closed (not persisted). */
  settingsBack: Screen;
  openSettings: () => void;

  coins: number;
  addCoins: (amount: number) => void;
  /** Lifetime supporters delivered. Unlocks rides. Stays on this device. */
  following: number;
  addFollowing: (amount: number) => void;
  bestByState: Record<string, { crowd: number; runs: number }>;
  noteRun: (stateId: string, crowd: number) => void;
  radioOn: boolean;
  setRadioOn: (on: boolean) => void;
  activeRideId: string;
  setActiveRide: (id: string) => void;
  activeStateId: string;
  setActiveState: (id: string) => void;

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
  lastRunIntegrity: number;
  lastRunCapacity: number;
  lastRunPhase: 'finished' | 'breakdown';
  setRunResult: (r: {
    skillCrowd: number;
    displayCrowd: number;
    delivered: number;
    dents: number;
    integrity: number;
    capacity: number;
    phase: 'finished' | 'breakdown';
  }) => void;
  startingStory: StartId | null;
  chooseStartingStory: (id: StartId) => void;
  upgrades: UpgradeLevels;
  buyUpgrade: (id: UpgradeId) => boolean;
  dailyKey: string;
  weeklyKey: string;
  missionProgress: MissionProgress;
  completedMissions: string[];
  streak: number;
  freezeWeek: string | null;
  useFreeze: () => boolean;
  donationDay: string | null;
  claimDonation: () => boolean;
  lastMetaReward: number;
  recordMetaRun: (r: { delivered: number; crowd: number; finished: boolean }) => void;
  /** Claimed daily-challenge id (WAT day + kind). */
  dailyChallengeClaimed: string | null;
  lastDailyReward: number;
  claimDailyIfMet: (r: {
    finished: boolean;
    dents: number;
    delivered: number;
    crowd: number;
    integrity: number;
    star: string;
  }) => number;
  username: string;
  setUsername: (raw: string) => { ok: true; name: string } | { ok: false; reason: string };
  localBoard: LocalBoardEntry[];
  submitLastRunToBoard: (stateId?: string) => { ok: true } | { ok: false; reason: string };
  travel: TravelProgress;
  travelGate: (stateId?: string) => { ok: true } | { ok: false; reason: string };
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      screen: 'splash',
      setScreen: (s) => set({ screen: s }),
      settingsBack: 'splash',
      openSettings: () => set((st) => ({ settingsBack: st.screen === 'settings' ? st.settingsBack : st.screen, screen: 'settings' })),

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
      activeRideId: 'trek',
      setActiveRide: (id) =>
        set((st) => {
          const ride = rides.find((r) => r.id === id);
          if (!ride || !isRidePlayable(ride, st.following)) return st;
          return { activeRideId: id };
        }),
      activeStateId: 'lagos',
      setActiveState: (id) => set({ activeStateId: id }),

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
      lastRunIntegrity: 100,
      lastRunCapacity: 8,
      lastRunPhase: 'finished',
      setRunResult: (r) =>
        set({
          lastRunSkillCrowd: r.skillCrowd,
          lastRunDisplayCrowd: r.displayCrowd,
          lastRunDelivered: r.delivered,
          lastRunDents: r.dents,
          lastRunIntegrity: r.integrity,
          lastRunCapacity: r.capacity,
          lastRunPhase: r.phase,
        }),
      startingStory: null,
      chooseStartingStory: (id) => set((st) => {
        if (st.startingStory) return st;
        const start = metaConfig.starts.find((item) => item.id === id)!;
        return { startingStory: id, coins: st.coins + start.coins, following: st.following + start.following, activeRideId: 'trek' };
      }),
      upgrades: emptyUpgrades(),
      buyUpgrade: (id) => {
        let bought = false;
        set((st) => {
          const level = st.upgrades[id];
          const cost = upgradeCost(id, level);
          if (cost === null || st.coins < cost) return st;
          bought = true;
          return { coins: st.coins - cost, upgrades: { ...st.upgrades, [id]: level + 1 } };
        });
        return bought;
      },
      dailyKey: watDay(),
      weeklyKey: watWeek(),
      missionProgress: {},
      completedMissions: [],
      streak: 0,
      freezeWeek: null,
      useFreeze: () => {
        let used = false;
        set((st) => {
          const week = watWeek();
          if (st.freezeWeek === week) return st;
          used = true;
          return { freezeWeek: week };
        });
        return used;
      },
      donationDay: null,
      claimDonation: () => {
        let claimed = false;
        set((st) => {
          const day = watDay();
          if (st.donationDay === day) return st;
          claimed = true;
          return { donationDay: day, coins: st.coins + metaConfig.rewards.donation };
        });
        return claimed;
      },
      lastMetaReward: 0,
      recordMetaRun: (r) => set((st) => {
        const day = watDay();
        const week = watWeek();
        const freshDay = st.dailyKey !== day;
        const freshWeek = st.weeklyKey !== week;
        const baseProgress = freshDay
          ? freshWeek
            ? {}
            : Object.fromEntries(Object.entries(st.missionProgress).filter(([id]) => id === 'weekly-runs'))
          : st.missionProgress;
        const baseCompleted = freshDay
          ? freshWeek
            ? []
            : st.completedMissions.filter((id) => id === 'weekly-runs')
          : freshWeek
            ? st.completedMissions.filter((id) => id !== 'weekly-runs')
            : st.completedMissions;
        const delta = missionDelta(baseProgress, baseCompleted, r.delivered, r.crowd, r.finished);
        const newlyDone = delta.completed.filter((id) => !baseCompleted.includes(id));
        const missionReward = newlyDone.reduce((sum, id) => sum + (id === 'weekly-runs' ? metaConfig.rewards.weeklyMission : metaConfig.rewards.dailyMission), 0);
        // C48: the payout formula lives in content beside the number the Yard
        // prints for the Fundraising Desk. The `* 50` that used to sit here was
        // a third copy of that upgrade's step.
        const reward = runPayout(r.delivered, st.upgrades) + missionReward;
        const travel = r.finished ? noteTravel(st.travel, st.activeStateId) : st.travel;
        if (r.finished) useContenderStore.getState().lockAfterFinish();
        return {
          coins: st.coins + reward,
          dailyKey: day,
          weeklyKey: week,
          missionProgress: delta.progress,
          completedMissions: delta.completed,
          streak: r.finished ? st.streak + 1 : st.streak,
          lastMetaReward: reward,
          dailyChallengeClaimed: freshDay ? null : st.dailyChallengeClaimed,
          travel,
        };
      }),
      dailyChallengeClaimed: null,
      lastDailyReward: 0,
      claimDailyIfMet: (r) => {
        let reward = 0;
        set((st) => {
          const ch = todaysChallenge();
          if (st.dailyChallengeClaimed === ch.id) return st;
          if (!challengeMet(ch, r)) return st;
          reward = ch.reward;
          return {
            dailyChallengeClaimed: ch.id,
            coins: st.coins + ch.reward,
            lastDailyReward: ch.reward,
          };
        });
        return reward;
      },
      username: '',
      setUsername: (raw) => {
        const checked = validateUsername(raw);
        if (checked.ok) set({ username: checked.name });
        return checked;
      },
      localBoard: [],
      submitLastRunToBoard: (stateId) => {
        let result: { ok: true } | { ok: false; reason: string } = { ok: false, reason: 'unknown' };
        set((st) => {
          const submitted = submitLocalBoard(
            st.localBoard,
            st.username,
            {
              skillCrowd: st.lastRunSkillCrowd,
              displayCrowd: st.lastRunDisplayCrowd,
              delivered: st.lastRunDelivered,
              dents: st.lastRunDents,
              capacity: st.lastRunCapacity,
              integrity: st.lastRunIntegrity,
              finished: st.lastRunPhase === 'finished',
            },
            stateId ?? st.activeStateId,
          );
          if (!submitted.ok) {
            result = { ok: false, reason: submitted.reason };
            return st;
          }
          result = { ok: true };
          return { localBoard: submitted.board, username: submitted.name };
        });
        return result;
      },
      travel: emptyTravel(),
      travelGate: (stateId) => {
        const st = useGameStore.getState();
        const gate = canTravel(st.travel, stateId ?? st.activeStateId);
        return gate.ok ? { ok: true } : { ok: false, reason: gate.reason };
      },
    }),
    {
      name: 'cr-storage',
      version: STORE_VERSION,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameState>;
        return {
          ...current,
          ...p,
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
          out = { ...out, sfxVolume: 0.8, musicVolume: 0.35 };
        }
        if (version < 4) {
          out = { ...out, following: 0 };
        }
        if (version < 5) {
          out = { ...out, bestByState: {}, radioOn: true };
        }
        if (version < 7) {
          out = { ...out, startingStory: null, upgrades: emptyUpgrades(), dailyKey: watDay(), weeklyKey: watWeek(), missionProgress: {}, completedMissions: [], streak: 0, freezeWeek: null, donationDay: null, lastMetaReward: 0 };
        }
        if (version < 9) {
          out = { ...out, dailyChallengeClaimed: null, lastDailyReward: 0, username: '', localBoard: [], lastRunIntegrity: 100, lastRunCapacity: 8 };
        }
        if (version < 10) {
          out = { ...out, activeStateId: 'lagos', travel: emptyTravel() };
        }
        if (version < 11) {
          // Contender fields live in `cr-contender` after migrateContenderFromGameStorage().
          delete out.activeContenderId;
          delete out.contenderLocked;
          delete out.contenderGraceUsed;
          delete out.outfits;
        }
        return out as unknown as GameState;
      },
      partialize: (state) => ({
        coins: state.coins,
        following: state.following,
        bestByState: state.bestByState,
        radioOn: state.radioOn,
        activeRideId: state.activeRideId,
        activeStateId: state.activeStateId,
        sfxVolume: state.sfxVolume,
        musicVolume: state.musicVolume,
        haptics: state.haptics,
        dataSaver: state.dataSaver,
        reduceMotion: state.reduceMotion,
        seenTutorial: state.seenTutorial,
        startingStory: state.startingStory,
        upgrades: state.upgrades,
        dailyKey: state.dailyKey,
        weeklyKey: state.weeklyKey,
        missionProgress: state.missionProgress,
        completedMissions: state.completedMissions,
        streak: state.streak,
        freezeWeek: state.freezeWeek,
        donationDay: state.donationDay,
        dailyChallengeClaimed: state.dailyChallengeClaimed,
        username: state.username,
        localBoard: state.localBoard,
        travel: state.travel,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
