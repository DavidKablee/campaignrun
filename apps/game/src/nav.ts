import { useContenderStore } from './contenderStore';
import { usePlacesStore } from './places/placesStore';
import { useGameStore, type Screen } from './state';

/**
 * One place that says where "back" goes. Every screen used to carry its own answer (and the Board,
 * Auth, Settings and Places each disagreed about the fallback), so the on-screen arrows, the Esc key
 * and the hardware Back button could land on three different screens.
 */
export interface NavContext {
  /** A Contender has been chosen, so the Briefing is a screen the player has been through. */
  picked: boolean;
  settingsBack: Screen;
  authReturn: Screen | null;
  placesBack: Screen;
}

/** The screen a Back press leaves for, or null when there is nowhere to go (the splash). */
export function backTarget(screen: Screen, ctx: NavContext): Screen | null {
  switch (screen) {
    case 'splash':
      return null;
    case 'studio':
      return 'roster';
    case 'game':
      return 'paused';
    case 'paused':
      return 'game';
    case 'summary':
      return ctx.picked ? 'briefing' : 'splash';
    case 'map':
      return ctx.picked ? 'roster' : 'splash';
    case 'settings':
      return ctx.settingsBack === 'settings' ? 'splash' : ctx.settingsBack;
    case 'auth':
      return ctx.authReturn === 'places' ? ctx.placesBack : 'splash';
    case 'places':
      return ctx.placesBack;
    default:
      return 'splash';
  }
}

function context(): NavContext {
  const g = useGameStore.getState();
  return {
    picked: useContenderStore.getState().activeContenderId !== null,
    settingsBack: g.settingsBack,
    authReturn: g.authReturn,
    placesBack: g.placesBack,
  };
}

/** Back out of the current screen, tidying whatever that screen was holding. */
export function goBack() {
  const g = useGameStore.getState();
  const to = backTarget(g.screen, context());
  if (!to || g.screen === 'game' || g.screen === 'paused') return;
  if (g.screen === 'places') {
    void usePlacesStore.getState().leave();
    g.setPlacesTarget(null);
  }
  if (g.screen === 'auth') g.setAuthReturn(null);
  if (g.screen === 'summary') {
    g.setChallenge(null);
    g.setQuickRun(false);
  }
  g.setScreen(to);
}

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/**
 * Esc is Back everywhere a menu is open. A sheet or field that wants Esc for itself calls
 * `preventDefault()` first (child listeners register before the App's), and the run owns Esc
 * while it is on screen because pausing has to respect the tutorial card.
 */
export function onEscape(e: KeyboardEvent) {
  if (e.key !== 'Escape' || e.defaultPrevented || e.repeat || typing(e.target)) return;
  const screen = useGameStore.getState().screen;
  if (screen === 'game' || screen === 'paused') return;
  goBack();
}

let guardUsers = 0;

function pushGuard() {
  try {
    // One entry on top of the page's own: Back pops it instead of leaving. Reuse it if it is already current.
    if (!(history.state as { crRun?: boolean } | null)?.crRun) history.pushState({ crRun: true }, '');
  } catch {
    /* history unavailable (sandboxed frame): fall back to no Back handling */
  }
}

/**
 * Catch the browser / hardware Back so it steps through the game's own screens instead of leaving
 * the page. Several screens can hold the guard across a hand-over (menu to run to result) without
 * the entry being popped between them; it is released only when nobody wants it.
 */
export function holdBackGuard(onBack: () => void): () => void {
  guardUsers++;
  pushGuard();
  const onPop = () => {
    onBack();
    pushGuard();
  };
  window.addEventListener('popstate', onPop);
  return () => {
    window.removeEventListener('popstate', onPop);
    guardUsers--;
    // Deferred: React re-runs effects straight away in development, and a real exit has nobody re-registering.
    setTimeout(() => {
      if (guardUsers !== 0) return;
      try {
        if ((history.state as { crRun?: boolean } | null)?.crRun) history.back();
      } catch {
        /* nothing to unwind */
      }
    }, 0);
  };
}
