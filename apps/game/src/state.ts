import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './safeStorage';
import { isRidePlayable, metaConfig, places, rides, simConfig, streakBonusPermille, type UpgradeId } from '@cr/content';
import { useContenderStore } from './contenderStore';
import type { Challenge } from './challenge';
import { prefersDataSaver } from './deviceTier';
import { challengeMet, todaysChallenge } from './daily';
import { submitLocalBoard, type LocalBoardEntry } from './localBoard';
import { emptyUpgrades, missionDelta, type MissionProgress, runPayout, type StartId, type UpgradeLevels, upgradeCost, watDay, watWeek } from './meta';
import { tourBonusFor } from './liveEvents';
import type { PlaceTarget } from './places/placesModel';
import { canTravel, emptyTravel, noteTravel, type TravelProgress } from './travel';
import { validateUsername } from './username';

/** base64 input log + the setup around it; the server replays it to confirm a score. */
export interface RunReplay {
  log: string;
  upgrades: UpgradeLevels;
  rallySaturday: boolean;
}

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
  | 'yard'
  | 'places';

const STORE_VERSION = 12;

interface GameState {
  screen: Screen;
  setScreen: (s: Screen) => void;
  /** The screen before the current one, so Back from a shared screen (the Board) returns to where the player was. */
  previousScreen: Screen | null;
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
  /** Percent of the road covered, so a run that broke down still has a number. */
  lastRunProgress: number;
  /** The last landmark passed before the run ended. */
  lastRunReached: string;
  /** The seed the run was played on, so the result can be turned into a challenge link. */
  lastRunSeed: number;
  /** The run was a quick rally: shorter, and kept out of boards, ghosts, streaks and missions. */
  lastRunQuick: boolean;
  /** Next run is a quick rally. Set by whatever starts it; read once when the run begins. */
  quickRun: boolean;
  setQuickRun: (v: boolean) => void;
  /** A challenge that arrived in the address bar and has not been taken yet. */
  /** Where to go once the player has signed in (not persisted): Mobilise needs an account. */
  authReturn: Screen | null;
  /** Where Back goes from Mobilise: it opens from the splash, the planning page and the result screen (not persisted). */
  placesBack: Screen;
  openPlaces: (from: Screen) => void;
  /** A place a friend invited the player to (not persisted); Mobilise opens here instead of the active state. */
  placesTarget: PlaceTarget | null;
  setPlacesTarget: (t: PlaceTarget | null) => void;
  /** An invite that arrived before the 1,000 Following gate: kept for this session and used once Mobilise opens. */
  lockedInvite: PlaceTarget | null;
  setLockedInvite: (t: PlaceTarget | null) => void;
  setAuthReturn: (s: Screen | null) => void;
  incomingChallenge: Challenge | null;
  setIncomingChallenge: (c: Challenge | null) => void;
  /** The challenge being played: it decides the seed, state, ride and course length. */
  challenge: Challenge | null;
  setChallenge: (c: Challenge | null) => void;
  setRunResult: (r: {
    skillCrowd: number;
    displayCrowd: number;
    delivered: number;
    dents: number;
    integrity: number;
    capacity: number;
    phase: 'finished' | 'breakdown';
    progress?: number;
    reached?: string;
    seed?: number;
    quick?: boolean;
    /** What the server needs to play this run again: the input log and the convoy it was played with. */
    replay?: RunReplay;
  }) => void;
  lastRunReplay: RunReplay | null;
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
  /** The tour bonus period last paid (week, or day in the Final Week), so it pays once. */
  tourClaimedKey: string | null;
  /** What the live events added to the last payout, for the result screen. Not persisted. */
  lastEventCoins: number;
  lastEventNote: string;
  recordMetaRun: (r: { delivered: number; crowd: number; finished: boolean; broke?: boolean; quick?: boolean; stateId?: string }) => void;
  /** Permille the rally streak lifted the last payout by. */
  lastStreakBonus: number;
  /** What the last run did to the streak when it did not grow it. */
  lastStreakNote: '' | 'frozen' | 'lost';
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
      setScreen: (s) => set((st) => (st.screen === s ? {} : { screen: s, previousScreen: st.screen })),
      previousScreen: null,
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
      dataSaver: prefersDataSaver(),
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
      lastRunProgress: 100,
      lastRunReached: '',
      lastRunSeed: 0,
      lastRunReplay: null,
      lastRunQuick: false,
      quickRun: false,
      setQuickRun: (v) => set({ quickRun: v }),
      authReturn: null,
      placesBack: 'briefing',
      openPlaces: (from) =>
        set((s) =>
          s.following < places.followingGate
            ? {}
            : { placesBack: from, screen: 'places', placesTarget: s.placesTarget ?? s.lockedInvite, lockedInvite: null },
        ),
      placesTarget: null,
      setPlacesTarget: (t) => set({ placesTarget: t }),
      lockedInvite: null,
      setLockedInvite: (t) => set({ lockedInvite: t }),
      setAuthReturn: (s) => set({ authReturn: s }),
      incomingChallenge: null,
      setIncomingChallenge: (c) => set({ incomingChallenge: c }),
      challenge: null,
      setChallenge: (c) => set({ challenge: c }),
      setRunResult: (r) =>
        set({
          lastRunSeed: r.seed ?? 0,
          lastRunReplay: r.replay ?? null,
          lastRunQuick: r.quick ?? false,
          lastRunProgress: r.progress ?? (r.phase === 'finished' ? 100 : 0),
          lastRunReached: r.reached ?? '',
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
      tourClaimedKey: null,
      lastEventCoins: 0,
      lastEventNote: '',
      lastStreakBonus: 0,
      lastStreakNote: '',
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
        const basePayout = runPayout(r.delivered, st.upgrades, {
          streak: st.streak,
          // A quick rally pays the finishing money for the share of the road it covered.
          baseSharePermille: r.quick
            ? Math.floor((simConfig.course.quickSegmentCount * 1000) / simConfig.course.segmentCount)
            : 1000,
        });
        // C81: the tour pays extra coins for a finished rally; it never touches the run itself.
        const tour = tourBonusFor({ finished: r.finished, stateId: r.stateId ?? st.activeStateId }, st.tourClaimedKey);
        const eventCoins = tour?.coins ?? 0;
        const eventNote = tour ? `${tour.kind === 'final' ? 'Final week' : 'Weekly Tour'} · ${tour.stateName} +₦${tour.coins}` : '';
        const reward = basePayout + missionReward + eventCoins;
        // Finished rallies in a row. A breakdown ends the run of them, unless
        // this week's freeze is still unspent, which absorbs exactly one.
        let streak = st.streak;
        let freezeWeek = st.freezeWeek;
        let streakNote: GameState['lastStreakNote'] = '';
        if (r.finished) streak += 1;
        else if (r.broke && streak > 0) {
          if (freezeWeek !== week) {
            freezeWeek = week;
            streakNote = 'frozen';
          } else {
            streak = 0;
            streakNote = 'lost';
          }
        }
        const travel = r.finished ? noteTravel(st.travel, st.activeStateId) : st.travel;
        // A trial run (no Contender picked yet) must not lock anyone: the lock
        // would spend the one free switch on their first real pick.
        if (r.finished && useContenderStore.getState().activeContenderId !== null) {
          useContenderStore.getState().lockAfterFinish();
        }
        return {
          coins: st.coins + reward,
          dailyKey: day,
          weeklyKey: week,
          missionProgress: delta.progress,
          completedMissions: delta.completed,
          streak,
          freezeWeek,
          lastStreakBonus: streakBonusPermille(st.streak),
          lastStreakNote: streakNote,
          lastMetaReward: reward,
          tourClaimedKey: tour ? tour.periodKey : st.tourClaimedKey,
          lastEventCoins: eventCoins,
          lastEventNote: eventNote,
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
        if (version < 12) {
          out = { ...out, tourClaimedKey: null };
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
        tourClaimedKey: state.tourClaimedKey,
        username: state.username,
        localBoard: state.localBoard,
        travel: state.travel,
      }),
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
