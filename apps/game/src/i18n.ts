import { useSyncExternalStore } from 'react';

/**
 * Two languages for the run and the share text: English and Naija Pidgin.
 *
 * Only what a player reads while driving or sends to a friend is translated (radio lines, toasts,
 * prompts, the first-run card, the challenge message). Menus, legal copy and the disclosure stay in
 * English so the wording a lawyer reviews is the wording a player sees. The Pidgin here was written
 * without a native speaker and is on the reviewer list (docs/research/pidgin-review.md).
 *
 * The choice lives under its own key rather than in the game store: it is read by plain functions
 * (radio callouts, share text) as well as by components, and a language is not worth a persist
 * migration.
 */
export type Lang = 'en' | 'pcm';

export const LANG_KEY = 'cr-lang';
export const LANGS: readonly { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'pcm', label: 'Naija Pidgin' },
];

function readStored(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'pcm' ? 'pcm' : 'en';
  } catch {
    return 'en';
  }
}

let current: Lang = readStored();
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return current;
}

export function setLang(next: Lang): void {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    /* private mode: the choice lasts for the session */
  }
  listeners.forEach((l) => l());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getLang,
    () => 'en' as Lang,
  );
}

type Catalogue = Record<string, string>;

const en = {
  'toast.fullHouse': 'FULL HOUSE',
  'toast.onBeat': 'ON BEAT',
  'toast.clear': 'CLEAR',
  'toast.fail': 'FAIL',
  'toast.toll': 'TOLL · AGBERO',
  'toast.tollDodged': 'DODGED THE TOLL',
  'toast.stubborn': 'STUBBORN PASSENGER · HOLD',
  'toast.weaveWarn': 'SWERVING AHEAD',
  'toast.closeCall': 'CLOSE CALL',

  'prompt.pickup': 'FLICK DOWN & HOLD · LOAD',
  'prompt.venue': 'FLICK DOWN & HOLD · DOUBLE-TAP ×{beat}',
  'prompt.pickupAhead': 'PICKUP AHEAD · FLICK DOWN & HOLD TO LOAD',
  'prompt.venueAhead': 'VENUE AHEAD · FLICK DOWN & HOLD TO UNLOAD',

  'hint.gestures': '<b>Flick</b> ◀ ▶ lane · <b>up</b> hop · <b>down</b> brake · <b>double-tap</b> beat · <b>hold</b> horn',

  'tutorial.title': 'Three moves to start',
  'tutorial.lane': 'Flick left or right to change lane',
  'tutorial.hop': 'Flick up to hop a pothole',
  'tutorial.load': 'At a pickup, flick down and hold to load supporters',
  'tutorial.integrity': 'Integrity is your clean name. Shady figures on the road cut it; dodging them wins it back.',
  'tutorial.rest': 'The convoy drives itself. Load at pickups, unload at venues, and the screen tells you when.',
  'tutorial.go': 'Got it — drive',

  'challenge.text': 'Beat my {crowd} Crowd on Campaigner — same road ({state} · {ride}).',
  'challenge.whatsapp': 'Send on WhatsApp',
  'challenge.other': 'Share…',
  'challenge.copy': 'Copy link',
  'challenge.title': 'Beat my run',
  'challenge.sub': 'Sends a link to this exact road and traffic with your {crowd} to beat. No account needed.',
  'challenge.sent': 'Opened WhatsApp',
  'challenge.shared': 'Shared',
  'challenge.copied': 'Link copied',
  'challenge.failed': 'Could not share the link',
} satisfies Catalogue;

export type StrKey = keyof typeof en;

const pcm: Record<StrKey, string> = {
  'toast.fullHouse': 'E FULL!',
  'toast.onBeat': 'ON BEAT O!',
  'toast.clear': 'E CLEAR',
  'toast.fail': 'E DON FAIL',
  'toast.toll': 'AGBERO WAN COLLECT',
  'toast.tollDodged': 'YOU DODGE AM',
  'toast.stubborn': 'PASSENGER NO WAN COMOT · HOLD',
  'toast.weaveWarn': 'SOMEBODY DEY SWERVE',
  'toast.closeCall': 'E NEARLY HAPPEN',

  'prompt.pickup': 'FLICK DOWN, HOLD · LOAD AM',
  'prompt.venue': 'FLICK DOWN, HOLD · DOUBLE-TAP ×{beat}',
  'prompt.pickupAhead': 'PICKUP DEY AHEAD · FLICK DOWN, HOLD TO LOAD AM',
  'prompt.venueAhead': 'VENUE DEY AHEAD · FLICK DOWN, HOLD TO UNLOAD',

  'hint.gestures': '<b>Flick</b> ◀ ▶ change lane · <b>up</b> jump · <b>down</b> brake · <b>double-tap</b> beat · <b>hold</b> horn',

  'tutorial.title': 'Three things to start',
  'tutorial.lane': 'Flick left or right to change lane',
  'tutorial.hop': 'Flick up to jump the pothole',
  'tutorial.load': 'For pickup, flick down and hold to load people',
  'tutorial.integrity': 'Integrity na your clean name. Shady people for road go cut am; if you dodge dem, e go return.',
  'tutorial.rest': 'The convoy dey drive itself. Load for pickup, unload for venue, and the screen go tell you when.',
  'tutorial.go': 'I don understand — drive',

  'challenge.text': 'Abeg beat my {crowd} Crowd for Campaigner. Na the same road ({state} · {ride}).',
  'challenge.whatsapp': 'Send am for WhatsApp',
  'challenge.other': 'Share am…',
  'challenge.copy': 'Copy the link',
  'challenge.title': 'Beat my run',
  'challenge.sub': 'We go send link for this same road and traffic with your {crowd} to beat. You no need account.',
  'challenge.sent': 'WhatsApp don open',
  'challenge.shared': 'E don go',
  'challenge.copied': 'Link don copy',
  'challenge.failed': 'The link no gree share',
};

const CATALOGUES: Record<Lang, Record<StrKey, string>> = { en, pcm };

/** The string for a key, with `{name}` slots filled. The language defaults to the player's choice. */
export function t(key: StrKey, vars: Record<string, string | number> = {}, lang: Lang = current): string {
  let out = CATALOGUES[lang][key];
  for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}
