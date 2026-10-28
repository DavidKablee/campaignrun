import { calendar } from '@cr/content';

/**
 * The campaign's dates, as the player sees them.
 *
 * The dates live in `calendar.json`, but an election date that has already moved once (20 Feb to
 * 16 Jan 2027) cannot need a redeploy to follow it. `public/flags.json` is fetched at boot and may
 * carry a `calendar` block and a `notice`; `applyRemoteConfig` validates it and, if anything in it
 * is usable, it replaces the bundled date. Anything malformed is ignored, so a bad edit to that
 * file cannot lock players out or open every state at once.
 */
export interface RemoteCalendar {
  /** ISO moment the campaign closes. */
  closeAt?: string;
  /** Per-state unlock moment, overriding the bundled week. */
  unlocks?: Record<string, string>;
}

export interface RemoteConfig {
  calendar?: RemoteCalendar;
  /** One line shown on the splash screen, e.g. when a date moves. */
  notice?: string;
}

/** Earliest and latest moment a remote date may name: the run of the game, with room either side. */
const MIN_MS = Date.UTC(2026, 9, 1);
const MAX_MS = Date.UTC(2028, 0, 1);
const NOTICE_MAX = 200;

const bundledClose = Date.parse(calendar.closeAt);
let closeMs = bundledClose;
let unlockOverrides: Record<string, number> = {};
let noticeText = '';

function saneMs(raw: unknown): number | null {
  if (typeof raw !== 'string') return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) && ms >= MIN_MS && ms <= MAX_MS ? ms : null;
}

/** Forgets any remote config. Tests, and a boot where the fetch failed, start here. */
export function resetRemoteConfig(): void {
  closeMs = bundledClose;
  unlockOverrides = {};
  noticeText = '';
}

export function applyRemoteConfig(raw: unknown): void {
  resetRemoteConfig();
  if (typeof raw !== 'object' || raw === null) return;
  const cfg = raw as RemoteConfig;

  const close = saneMs(cfg.calendar?.closeAt);
  if (close !== null) closeMs = close;

  const known = new Set(calendar.unlocks.flatMap((u) => u.states));
  const unlocks = cfg.calendar?.unlocks;
  if (unlocks && typeof unlocks === 'object') {
    for (const [id, at] of Object.entries(unlocks)) {
      const ms = saneMs(at);
      if (ms !== null && known.has(id)) unlockOverrides[id] = ms;
    }
  }

  if (typeof cfg.notice === 'string') noticeText = cfg.notice.replace(/\s+/g, ' ').trim().slice(0, NOTICE_MAX);
}

/** Days until the campaign closes. Never below 0. */
export function daysLeft(now: number = Date.now()): number {
  return Math.max(0, Math.ceil((closeMs - now) / 86_400_000));
}

/** True once the campaign has closed: every state with a pack is then open for practice. */
export function isClosed(now: number = Date.now()): boolean {
  return now >= closeMs;
}

/** The unlock moment for a state: the remote override, else the bundled week. */
export function unlockMsFor(stateId: string, bundledAt: string): number {
  return unlockOverrides[stateId] ?? Date.parse(bundledAt);
}

export function remoteNotice(): string {
  return noticeText;
}

/** The pill text for the days left, or the closed state. */
export function daysLeftLabel(now: number = Date.now(), short = false): string {
  if (isClosed(now)) return 'Closed';
  const d = daysLeft(now);
  return short ? `${d}d left` : `${d} ${d === 1 ? 'day' : 'days'} left`;
}
