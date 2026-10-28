import type { StateStorage } from 'zustand/middleware';

/**
 * localStorage that cannot throw. A full phone or a private-mode Safari rejects writes with
 * QuotaExceededError, and zustand's persist writes synchronously inside set() — which used to
 * throw out of the run-end handler and leave the game frozen on its last frame. Writes that fail
 * stay in memory for the session instead.
 */
const mem = new Map<string, string>();

export const safeStorage: StateStorage = {
  getItem(key) {
    try {
      const v = localStorage.getItem(key);
      return v ?? mem.get(key) ?? null;
    } catch {
      return mem.get(key) ?? null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      mem.delete(key);
    } catch {
      mem.set(key, value);
    }
  },
  removeItem(key) {
    mem.delete(key);
    try {
      localStorage.removeItem(key);
    } catch {
      /* nothing to remove */
    }
  },
};
