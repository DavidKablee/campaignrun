import { useEffect } from 'react';
import { useGameStore } from './state';

/**
 * The three comfort settings in one place. Each was honoured in a different spot (the 3D scenes read the
 * flag, the stylesheet read only the OS media query, haptics were wired inline in the run), so turning
 * one on in Settings did only part of what it said.
 */
const osReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

/** The setting or the OS preference: either one asks for less movement. */
export const motionReduced = (setting: boolean) => setting || osReducedMotion();

/** A short buzz, only when the player has haptics on and the device can do it (Android; iOS has no API). */
export function haptic(ms: number) {
  if (ms <= 0 || !useGameStore.getState().haptics) return;
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* some embedded webviews throw instead of returning false */
  }
}

/**
 * Mirrors the settings onto <html> so CSS can follow them (`data-reduce-motion`, `data-data-saver`) the same
 * way it already follows the OS media query. Re-runs when the OS preference flips mid-session.
 */
export function usePrefsOnRoot() {
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const dataSaver = useGameStore((s) => s.dataSaver);
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      root.dataset.reduceMotion = String(motionReduced(reduceMotion));
      root.dataset.dataSaver = String(dataSaver);
    };
    apply();
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    mq?.addEventListener('change', apply);
    return () => mq?.removeEventListener('change', apply);
  }, [reduceMotion, dataSaver]);
}
