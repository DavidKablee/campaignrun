import { create } from 'zustand';
import { places, type PlaceAction } from '@cr/content';
import { ApiError, API_BASE, apiGet, apiPost } from '../api/client';
import { track } from '../analytics';
import { useGameStore } from '../state';
import { applyPlaceEvent, rewardLine, type Members, type PlaceEvent, type PlaceMember } from './placesModel';

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
  you: string;
  members: PlaceMember[];
  today: Today;
  identity: Identity;
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
  muted: string[];
  lang: 'en' | 'pcm';
  identity: Identity | null;
  loadIdentity: () => Promise<void>;
  /** Show this Contender in places, or null to be a plain citizen. Saves to the account. */
  setIdentity: (contenderId: string | null) => Promise<boolean>;
  probe: (stateId: string) => Promise<void>;
  join: (stateId: string, kind: string) => Promise<void>;
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
    set((s) => ({ members: applyPlaceEvent(s.members, e) }));
    for (const fn of listeners) fn(e);
  };

  function open(roomId: string) {
    closeStream();
    const es = new EventSource(`${API_BASE}/api/places/rooms/${encodeURIComponent(roomId)}/stream`, { withCredentials: true });
    source = es;
    for (const type of ['join', 'leave', 'move', 'act', 'say'] as const) {
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
    muted: [],
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

    async join(stateId, kind) {
      closeStream();
      set({ phase: 'joining', error: null, stateId, kind });
      try {
        const res = await apiPost<JoinResponse>('/api/places/join', { stateId, kind });
        const members: Members = {};
        for (const m of res.members) members[m.id] = m;
        set({ phase: 'in', roomId: res.roomId, you: res.you, members, today: res.today, identity: res.identity, availability: 'up' });
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
      set({ phase: 'idle', roomId: null, you: null, members: {}, toast: null, ready: {} });
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
        const res = await apiPost<{ reward: { coins: number; supporters: number; capped: boolean; today: Today } }>(
          `/api/places/rooms/${encodeURIComponent(roomId)}/act`,
          { action: action.id },
        );
        const game = useGameStore.getState();
        if (res.reward.coins > 0) game.addCoins(res.reward.coins);
        if (res.reward.supporters > 0) game.addFollowing(res.reward.supporters);
        set({ today: res.reward.today, toast: rewardLine(res.reward) || null });
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
        await apiPost(`/api/places/rooms/${encodeURIComponent(roomId)}/say`, what);
        track('place_say', get().stateId);
      } catch {
        /* a dropped phrase is not worth a message */
      }
    },

    mute: (id) => set((s) => ({ muted: s.muted.includes(id) ? s.muted : [...s.muted, id] })),

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

    setLang: (lang) => set({ lang }),
    clearToast: () => set({ toast: null }),

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
});

