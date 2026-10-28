import { analytics } from '@cr/content';
import { API_BASE } from './api/client';

/**
 * Anonymous usage counters.
 *
 * What is sent: an event name from the closed list in `analytics.json` and, for run events, a state
 * id. What is not: no id of any kind, no cookie, no Contender, no score, no account, no text the
 * player typed. The server adds one to a (day, name, state) counter and keeps nothing else, so the
 * funnel (visit, run, finish, share, challenge opened) is a set of totals and no one can be followed
 * through it.
 *
 * It stays quiet when the player switches it off in Settings, when the browser says Do Not Track,
 * and when nothing is listening (a client-only deploy simply loses the send).
 */
export type EventName = (typeof analytics.events)[number];

export const ANALYTICS_OFF_KEY = 'cr-analytics-off';

const ENDPOINT = `${((import.meta.env.VITE_ANALYTICS_URL as string | undefined) ?? API_BASE).replace(/\/$/, '')}/api/events`;

interface Queued {
  name: EventName;
  state?: string;
}

let queue: Queued[] = [];
let sent = 0;
let runsThisSession = 0;

export function analyticsOff(): boolean {
  try {
    if (localStorage.getItem(ANALYTICS_OFF_KEY) === '1') return true;
  } catch {
    /* storage blocked: fall through to Do Not Track */
  }
  return typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || (window as { doNotTrack?: string }).doNotTrack === '1');
}

export function setAnalyticsOff(off: boolean): void {
  try {
    if (off) localStorage.setItem(ANALYTICS_OFF_KEY, '1');
    else localStorage.removeItem(ANALYTICS_OFF_KEY);
  } catch {
    /* private mode: the choice lasts only if storage works, so drop what is queued either way */
  }
  if (off) queue = [];
}

/** Queues one counter. Cheap and silent: it can never throw into the game. */
export function track(name: EventName, state?: string): void {
  try {
    if (analyticsOff() || sent + queue.length >= analytics.maxPerSession) return;
    queue.push(state ? { name, state } : { name });
    if (queue.length >= analytics.flushAt) flush();
  } catch {
    /* counters are never worth a crash */
  }
}

/** A run has started: counts it, and the second one of a visit gets its own counter. */
export function trackRunStart(state: string): void {
  runsThisSession += 1;
  track('run_start', state);
  if (runsThisSession === 2) track('run_second', state);
}

export function flush(): void {
  if (queue.length === 0 || analyticsOff()) {
    queue = [];
    return;
  }
  const batch = queue.splice(0, queue.length);
  sent += batch.length;
  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      // No cookies: this call is anonymous and must stay that way. keepalive lets it leave with the page.
      credentials: 'omit',
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* offline or blocked */
  }
}

/** Sends what is queued when the page is hidden, which is the last moment a phone gives us. */
export function installFlushOnHide(): void {
  if (typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
}

/** Test seam. */
export function resetAnalyticsForTests(): void {
  queue = [];
  sent = 0;
  runsThisSession = 0;
}
export function queuedForTests(): readonly Queued[] {
  return queue;
}
