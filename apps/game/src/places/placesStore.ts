import { create } from 'zustand';
import { places, type PlaceAction } from '@cr/content';
import { ApiError, API_BASE, apiGet, apiPost } from '../api/client';
import { track } from '../analytics';
import { useGameStore } from '../state';
import { applyPlaceEvent, applyPollEvent, pollFromView, rewardLine, type ActivePoll, type PollView, type Members, type PlaceEvent, type PlaceMember } from './placesModel';

/**
 * Mobilise (C82): the client half of a campaign place. The server owns who is where and what an
 * action pays; this store joins, listens on a server-sent-events stream, sends moves, actions and
 * preset phrases, and applies the coins the server says were earned.
 */

type Availability = 'unknown' | 'up' | 'down';
type Phase = 'idle' | 'joining' | 'in' | 'error';

type Listener = (e: PlaceEvent) => void;

export interface Identity {
  /** The one-time "show your Contender here?" question has been answered. */
  asked: boolean;
  contenderId: string | null;
}

interface JoinResponse {
  roomId: string;
  /** 'assigned' when the room that was asked for was full or gone. */
  landed: 'requested' | 'assigned';
  requested: string | null;
  you: string;
  members: PlaceMember[];
  today: Today;
  identity: Identity;
  progress: JobsProgress | null;
  poll: { poll: PollView; voted: string | null } | null;
  chat: ChatStatus;
  chatCopy: ChatCopy;
}

/** C93: whether this player can type to the room, and why not. Ships dark: `enabled` is false until the owner turns it on. */
export interface ChatStatus {
  enabled: boolean;
  canType: boolean;
  lock: 'off' | 'age' | 'job' | null;
  maxChars: number;
  gapSeconds: number;
}

interface ChatCopy {
  reasons: Record<string, { en: string; pcm: string }>;
  locks: Record<string, { en: string; pcm: string }>;
}

/** A row of the room browser: where, how many, and how many of them are the player's friends. */
export interface RoomRow {
  roomId: string;
  key: string;
  stateId: string;
  kind: string;
  count: number;
  capacity: number;
  friends: number;
}

export interface FriendsState {
  friends: { name: string; online: boolean; roomId: string | null }[];
  incoming: { name: string }[];
  outgoing: { name: string }[];
  max: number;
}

export interface JobsSnapshot {
  day: string;
  jobs: { id: string; label: string; progress: number; target: number; done: boolean; coins: number; supporters: number }[];
  allDone: { coins: number; supporters: number; paid: boolean };
  streak: { count: number; best: number; doneToday: boolean; next: { days: number; title: string } | null };
  titles: { id: string; label: string; earned: boolean }[];
  wearing: string | null;
}

/** What the server says a job-counting call changed. */
export interface JobsProgress {
  snapshot: JobsSnapshot;
  completed: string[];
  reward: { coins: number; supporters: number; capped: boolean } | null;
  newTitle: string | null;
}

const MUTED_KEY = 'cr-places-muted';
const MUTED_MAX = 200;

/** Mutes are kept by board name, so they hold when the player moves rooms or comes back another day. */
function loadMuted(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(MUTED_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, MUTED_MAX) : [];
  } catch {
    return [];
  }
}

function saveMuted(names: string[]) {
  try {
    localStorage.setItem(MUTED_KEY, JSON.stringify(names.slice(-MUTED_MAX)));
  } catch {
    /* private mode: the mute holds for this visit only */
  }
}

export interface Today {
  coins: number;
  supporters: number;
  actions: number;
}

interface PlacesState {
  availability: Availability;
  /** People out in the active state right now (all its places), or null when unknown. */
  online: number | null;
  phase: Phase;
  error: string | null;
  stateId: string;
  kind: string;
  roomId: string | null;
  you: string | null;
  members: Members;
  today: Today;
  toast: string | null;
  /** Action id -> when it can be used again (ms epoch), for the cooldown rings. */
  ready: Record<string, number>;
  /** Board names this player muted. Kept on the device. */
  mutedNames: string[];
  isMuted: (memberId: string) => boolean;
  poll: ActivePoll | null;
  chat: ChatStatus | null;
  chatCopy: ChatCopy | null;
  loadChat: () => Promise<void>;
  /** Send typed text. Resolves to a reason to show the sender, or null when it went through. */
  type: (text: string) => Promise<string | null>;
  /** Start one of the preset polls for the room. */
  startPoll: (pollId: string) => Promise<void>;
  vote: (option: string) => Promise<void>;
  dismissPoll: () => void;
  jobs: JobsSnapshot | null;
  loadJobs: () => Promise<void>;
  /** Wear an earned title on the name tag, or none. */
  wearTitle: (titleId: string | null) => Promise<void>;
  unmute: (name: string) => void;
  rooms: RoomRow[];
  roomsBusyAt: number;
  loadRooms: () => Promise<void>;
  friends: FriendsState | null;
  loadFriends: () => Promise<void>;
  /** Ask the person you tapped to be friends. Returns what came of it. */
  befriend: (memberId: string) => Promise<'pending' | 'accepted' | 'failed'>;
  acceptFriend: (name: string) => Promise<void>;
  /** Decline, cancel, unfriend or unblock: remove the link. */
  removeFriend: (name: string) => Promise<void>;
  blockPlayer: (memberId: string) => Promise<void>;
  lang: 'en' | 'pcm';
  identity: Identity | null;
  loadIdentity: () => Promise<void>;
  /** Show this Contender in places, or null to be a plain citizen. Saves to the account. */
  setIdentity: (contenderId: string | null) => Promise<boolean>;
  probe: (stateId: string) => Promise<void>;
  join: (stateId: string, kind: string, roomId?: string | null) => Promise<void>;
  leave: () => Promise<void>;
  moveTo: (x: number, z: number) => void;
  act: (action: PlaceAction) => Promise<void>;
  say: (what: { phrase?: string; emoji?: string }) => Promise<void>;
  mute: (id: string) => void;
  report: (id: string, reason: string) => Promise<boolean>;
  setLang: (lang: 'en' | 'pcm') => void;
  clearToast: () => void;
  subscribe: (fn: Listener) => () => void;
}

let source: EventSource | null = null;
const listeners = new Set<Listener>();
let retries = 0;
let probeAt = 0;

function closeStream() {
  source?.close();
  source = null;
}

/** The server restarts, a phone sleeps: rejoin quietly a few times before giving up. */
const MAX_RETRIES = 3;

export const usePlacesStore = create<PlacesState>()((set, get) => {
  const emit = (e: PlaceEvent) => {
    set((s) => ({ members: applyPlaceEvent(s.members, e), poll: applyPollEvent(s.poll, e, Date.now()) }));
    for (const fn of listeners) fn(e);
  };

  /** Takes what the server counted: the fresh jobs, any reward (the server already capped it) and a toast. */
  function applyProgress(p: JobsProgress | null | undefined, lead = ''): void {
    if (!p) return;
    const game = useGameStore.getState();
    if (p.reward) {
      if (p.reward.coins > 0) game.addCoins(p.reward.coins);
      if (p.reward.supporters > 0) game.addFollowing(p.reward.supporters);
    }
    const bits: string[] = [];
    for (const id of p.completed) {
      const job = p.snapshot.jobs.find((j) => j.id === id);
      if (job) bits.push(`Job done: ${job.label}`);
    }
    if (p.snapshot.allDone.paid && p.completed.length && p.snapshot.jobs.every((j) => j.done)) bits.push('All jobs done');
    if (p.newTitle) bits.push(`New title: ${p.newTitle}`);
    if (p.reward) bits.push(rewardLine(p.reward));
    const line = bits.filter(Boolean).join(' · ');
    // What a job paid counts toward today's totals, which the server grew after the action's own reply.
    const today = get().today;
    set({
      jobs: p.snapshot,
      ...(p.reward ? { today: { ...today, coins: today.coins + p.reward.coins, supporters: today.supporters + p.reward.supporters } } : {}),
      ...(line || lead ? { toast: [lead, line].filter(Boolean).join(' · ') } : {}),
    });
  }

  function open(roomId: string) {
    closeStream();
    const es = new EventSource(`${API_BASE}/api/places/rooms/${encodeURIComponent(roomId)}/stream`, { withCredentials: true });
    source = es;
    for (const type of ['join', 'leave', 'move', 'act', 'say', 'poll', 'vote', 'pollend'] as const) {
      es.addEventListener(type, (ev) => {
        try {
          emit(JSON.parse((ev as MessageEvent<string>).data) as PlaceEvent);
        } catch {
          /* a malformed frame is dropped, not fatal */
        }
      });
    }
    es.addEventListener('hello', () => {
      retries = 0;
    });
    es.onerror = () => {
      // 404 (room gone) and network loss both end here. EventSource retries by itself while the
      // connection is merely down; once it is CLOSED the room is gone, so join again.
      if (es.readyState !== EventSource.CLOSED || get().phase !== 'in') return;
      if (retries >= MAX_RETRIES) {
        set({ phase: 'error', error: 'offline' });
        return;
      }
      retries += 1;
      void get().join(get().stateId, get().kind);
    };
  }

  return {
    availability: 'unknown',
    online: null,
    phase: 'idle',
    error: null,
    stateId: 'lagos',
    kind: places.kinds[0]!.id,
    roomId: null,
    you: null,
    members: {},
    today: { coins: 0, supporters: 0, actions: 0 },
    toast: null,
    ready: {},
    mutedNames: loadMuted(),
    isMuted: (memberId) => {
      const m = get().members[memberId];
      return !!m && get().mutedNames.includes(m.name);
    },
    poll: null,
    chat: null,
    chatCopy: null,
    jobs: null,
    rooms: [],
    roomsBusyAt: 10,
    friends: null,
    lang: 'en',
    identity: null,

    async loadIdentity() {
      try {
        set({ identity: await apiGet<Identity>('/api/places/identity') });
      } catch {
        /* not signed in or offline: the toggle just stays hidden */
      }
    },

    async setIdentity(contenderId) {
      try {
        set({ identity: await apiPost<Identity>('/api/places/identity', { contenderId }) });
        return true;
      } catch {
        set({ toast: 'Could not save that. Try again.' });
        return false;
      }
    },

    async probe(stateId) {
      // Cheap and cached: the Briefing screen asks every time it opens.
      if (Date.now() - probeAt < 15_000 && get().availability !== 'unknown') return;
      probeAt = Date.now();
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 3500);
        const res = await fetch(`${API_BASE}/api/places/online?state=${encodeURIComponent(stateId)}`, { signal: ctl.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error('down');
        const body = (await res.json()) as { online: Record<string, number> };
        set({ availability: 'up', online: Object.values(body.online).reduce((a, b) => a + b, 0) });
      } catch {
        set({ availability: 'down', online: null });
      }
    },

    async join(stateId, kind, roomId) {
      closeStream();
      set({ phase: 'joining', error: null, stateId, kind });
      try {
        const res = await apiPost<JoinResponse>('/api/places/join', roomId ? { stateId, kind, roomId } : { stateId, kind });
        const members: Members = {};
        for (const m of res.members) members[m.id] = m;
        set({
          phase: 'in',
          roomId: res.roomId,
          you: res.you,
          members,
          today: res.today,
          identity: res.identity,
          availability: 'up',
          poll: res.poll ? pollFromView(res.poll.poll, Date.now(), res.poll.voted) : null,
          chat: res.chat,
          chatCopy: res.chatCopy,
          toast: res.requested && res.landed === 'assigned' ? 'That room was full, so you are in another one.' : null,
        });
        applyProgress(res.progress);
        track('place_join', stateId);
        open(res.roomId);
      } catch (err) {
        const code = err instanceof ApiError ? err.code : 'offline';
        set({ phase: 'error', error: code, availability: code === 'offline' ? 'down' : get().availability });
      }
    },

    async leave() {
      closeStream();
      const wasIn = get().phase === 'in';
      set({ phase: 'idle', roomId: null, you: null, members: {}, toast: null, ready: {}, poll: null });
      if (wasIn) await apiPost('/api/places/leave').catch(() => undefined);
    },

    moveTo(x, z) {
      const { roomId, you, members } = get();
      if (!roomId || !you || !members[you]) return;
      const me = members[you]!;
      // Optimistic: start walking now; the server's own echo for you is ignored by the screen.
      set({ members: { ...members, [you]: { ...me, tx: x, tz: z } } });
      for (const fn of listeners) fn({ type: 'move', id: you, x: me.x, z: me.z, tx: x, tz: z });
      void apiPost(`/api/places/rooms/${encodeURIComponent(roomId)}/move`, { x, z }).catch(() => undefined);
    },

    async act(action) {
      const { roomId, you, stateId, ready } = get();
      if (!roomId || !you) return;
      if ((ready[action.id] ?? 0) > Date.now()) return;
      set({ ready: { ...ready, [action.id]: Date.now() + action.cooldownSeconds * 1000 } });
      try {
        const res = await apiPost<{ reward: { coins: number; supporters: number; capped: boolean; today: Today }; progress: JobsProgress | null }>(
          `/api/places/rooms/${encodeURIComponent(roomId)}/act`,
          { action: action.id },
        );
        const game = useGameStore.getState();
        if (res.reward.coins > 0) game.addCoins(res.reward.coins);
        if (res.reward.supporters > 0) game.addFollowing(res.reward.supporters);
        set({ today: res.reward.today, toast: rewardLine(res.reward) || null });
        applyProgress(res.progress, rewardLine(res.reward));
        track('place_action', stateId);
      } catch (err) {
        // Roll the ring back so the player is not locked out by a refused call.
        const next = { ...get().ready };
        delete next[action.id];
        if (err instanceof ApiError && err.code === 'company') set({ ready: next, toast: 'Rally the crowd needs someone close by.' });
        else if (err instanceof ApiError && err.code === 'cooldown') set({ ready: { ...next, [action.id]: Date.now() + (err.retryAfter ?? 5) * 1000 } });
        else set({ ready: next, toast: 'Could not reach the field. Try again.' });
      }
    },

    async say(what) {
      const { roomId } = get();
      if (!roomId) return;
      try {
        const res = await apiPost<{ progress: JobsProgress | null }>(`/api/places/rooms/${encodeURIComponent(roomId)}/say`, what);
        applyProgress(res.progress);
        track('place_say', get().stateId);
      } catch {
        /* a dropped phrase is not worth a message */
      }
    },

    async loadChat() {
      try {
        set({ chat: await apiGet<ChatStatus>('/api/places/chat') });
      } catch {
        /* keep what the join said */
      }
    },

    async type(text) {
      const { roomId, chatCopy, lang } = get();
      if (!roomId) return null;
      const say = (group: 'reasons' | 'locks', key: string, fallback: string) => chatCopy?.[group][key]?.[lang] ?? fallback;
      try {
        const res = await apiPost<{ progress: JobsProgress | null }>(`/api/places/rooms/${encodeURIComponent(roomId)}/chat`, { text });
        applyProgress(res.progress);
        track('place_chat', get().stateId);
        return null;
      } catch (err) {
        if (!(err instanceof ApiError)) return 'Could not reach the field. Try again.';
        if (err.code === 'rate-limited') return `Slow down a little${err.retryAfter ? `, try again in ${err.retryAfter}s` : ''}.`;
        if (err.code === 'chat-locked') {
          await get().loadChat();
          return say('locks', get().chat?.lock ?? 'off', 'Typed chat is not open for you yet.');
        }
        if (err.code === 'refused') return say('reasons', err.field ?? 'blocked', 'That message cannot be sent.');
        return 'That message cannot be sent.';
      }
    },

    mute(id) {
      const m = get().members[id];
      if (!m || get().mutedNames.includes(m.name)) return;
      const next = [...get().mutedNames, m.name];
      saveMuted(next);
      set({ mutedNames: next });
    },

    async report(id, reason) {
      const { roomId } = get();
      if (!roomId) return false;
      try {
        await apiPost(`/api/places/rooms/${encodeURIComponent(roomId)}/report`, { memberId: id, reason });
        get().mute(id);
        return true;
      } catch {
        return false;
      }
    },

    async loadRooms() {
      try {
        const res = await apiGet<{ rooms: RoomRow[]; busyAt: number }>(`/api/places/rooms?state=${encodeURIComponent(get().stateId)}`);
        set({ rooms: res.rooms, roomsBusyAt: res.busyAt });
      } catch {
        /* the sheet shows what it had */
      }
    },

    async loadFriends() {
      try {
        set({ friends: await apiGet<FriendsState>('/api/places/friends') });
      } catch {
        /* the sheet shows what it had */
      }
    },

    async befriend(memberId) {
      const { roomId } = get();
      if (!roomId) return 'failed';
      try {
        const res = await apiPost<{ status: 'pending' | 'accepted'; progress: JobsProgress | null }>(
          `/api/places/rooms/${encodeURIComponent(roomId)}/friend`,
          { memberId },
        );
        set({ toast: res.status === 'accepted' ? 'You are friends now.' : 'Friend request sent.' });
        applyProgress(res.progress, res.status === 'accepted' ? 'You are friends now.' : 'Friend request sent.');
        void get().loadFriends();
        return res.status;
      } catch (err) {
        const text =
          err instanceof ApiError && err.code === 'friends-full'
            ? 'Your friends list is full.'
            : err instanceof ApiError && err.code === 'blocked'
              ? 'You blocked this player. Unblock them from Friends first.'
              : 'Could not send that. Try again.';
        set({ toast: text });
        return 'failed';
      }
    },

    async acceptFriend(name) {
      try {
        const res = await apiPost<{ progress: JobsProgress | null }>('/api/places/friends/accept', { name });
        set({ toast: `You and ${name} are friends.` });
        applyProgress(res.progress, `You and ${name} are friends.`);
      } catch (err) {
        set({ toast: err instanceof ApiError && err.code === 'friends-full' ? 'Your friends list is full.' : 'Could not accept that.' });
      }
      await get().loadFriends();
    },

    async removeFriend(name) {
      await apiPost('/api/places/friends/remove', { name }).catch(() => undefined);
      await get().loadFriends();
    },

    async blockPlayer(memberId) {
      const m = get().members[memberId];
      if (!m) return;
      get().mute(memberId);
      await apiPost('/api/places/friends/block', { name: m.name }).catch(() => undefined);
      set({ toast: `${m.name} is blocked and muted.` });
      await get().loadFriends();
    },

    async startPoll(pollId) {
      const { roomId } = get();
      if (!roomId) return;
      try {
        const res = await apiPost<{ poll: PollView; progress: JobsProgress | null }>(`/api/places/rooms/${encodeURIComponent(roomId)}/poll`, { pollId });
        // The room's own 'poll' event also arrives; this makes the starter's card appear without waiting.
        set({ poll: pollFromView(res.poll, Date.now()) });
        applyProgress(res.progress);
      } catch (err) {
        const code = err instanceof ApiError ? err.code : '';
        set({
          toast:
            code === 'busy'
              ? 'A poll is already open in this room.'
              : code === 'cooldown'
                ? 'You started one a moment ago. Try again soon.'
                : 'Could not start that poll.',
        });
      }
    },

    async vote(option) {
      const { roomId, poll } = get();
      if (!roomId || !poll || poll.voted || poll.closed) return;
      set({ poll: { ...poll, voted: option } });
      try {
        const res = await apiPost<{ poll: PollView }>(`/api/places/rooms/${encodeURIComponent(roomId)}/vote`, { option });
        const now = get().poll;
        if (now && now.pollId === res.poll.pollId) set({ poll: { ...now, counts: res.poll.counts } });
      } catch {
        const now = get().poll;
        if (now) set({ poll: { ...now, voted: null }, toast: 'Could not record that vote.' });
      }
    },

    dismissPoll: () => set({ poll: null }),

    async loadJobs() {
      try {
        set({ jobs: await apiGet<JobsSnapshot>('/api/places/jobs') });
      } catch {
        /* the phone shows what it had */
      }
    },

    async wearTitle(titleId) {
      try {
        set({ jobs: await apiPost<JobsSnapshot>('/api/places/title', { titleId }) });
      } catch {
        set({ toast: 'Could not change that. Try again.' });
      }
    },

    unmute(name) {
      const next = get().mutedNames.filter((n) => n !== name);
      saveMuted(next);
      set({ mutedNames: next });
    },

    setLang: (lang) => set({ lang }),
    clearToast: () => set({ toast: null }),

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
});

