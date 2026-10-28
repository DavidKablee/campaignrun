import { create } from 'zustand';
import { legal, limits } from '@cr/content';
import { ApiError, apiDelete, apiGet, apiPost } from './api/client';
import { clearDeviceKey, deviceKeySupported, readDeviceKey, writeDeviceKey } from './deviceKey';

export interface OnlineUser {
  id: string;
  /** C42: null on a name-only account — there is no address on it yet. */
  email: string | null;
  username: string;
  shareContender: boolean;
  /** C41: unverified accounts play normally but stay off the public boards. */
  emailVerified: boolean;
  /** C42: false only on a name-only account, which has no password to change. */
  hasPassword: boolean;
  /** C42: ISO date the email prompt may next appear, or null for "any time". */
  emailPromptAfter: string | null;
}

export type OnlineStatus = 'unknown' | 'signed-out' | 'signed-in' | 'offline';

interface OnlineState {
  status: OnlineStatus;
  user: OnlineUser | null;
  /** Server-held personal bests, keyed by state id. */
  best: Record<string, { crowd: number; runs: number }>;
  busy: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  /** C42 — a name-only account, held by a key on this device alone. */
  continueAsName: (username: string) => Promise<boolean>;
  attachEmail: (email: string, password: string) => Promise<boolean>;
  snoozeEmailPrompt: () => Promise<void>;
  logout: () => Promise<void>;
  setShareContender: (share: boolean) => Promise<void>;
  submitScore: (score: {
    stateId: string;
    crowd: number;
    delivered: number;
    dents: number;
    integrity: number;
    capacity: number;
    rideId: string;
    contenderId: string | null;
    /** Lets the server play the run again and confirm the score. */
    replay?: { seed: number; log: string; upgrades: Record<string, number>; rallySaturday: boolean };
  }) => Promise<boolean>;
  loadBest: () => Promise<void>;
  clearError: () => void;
  /** C41 — the account-recovery paths. */
  notice: string | null;
  pendingReset: string | null;
  clearNotice: () => void;
  openReset: (token: string) => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<boolean>;
}

/**
 * Deliberately not persisted. The session lives in an httpOnly cookie and the
 * scores live on the server; keeping a copy here in localStorage would just be
 * a second source of truth to go stale.
 */
export const useOnlineStore = create<OnlineState>()((set, get) => ({
  status: 'unknown',
  user: null,
  best: {},
  busy: false,
  error: null,
  notice: null,
  pendingReset: null,

  clearError: () => set({ error: null }),
  clearNotice: () => set({ notice: null }),
  openReset: (token) => set({ pendingReset: token, error: null, notice: null }),

  refresh: async () => {
    try {
      const { user } = await apiGet<{ user: OnlineUser }>('/api/auth/me');
      set({ user, status: 'signed-in', error: null });
      await get().loadBest();
      return;
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        set({ status: 'offline', user: null });
        return;
      }
    }
    // No session. A name-only account has no credentials to prompt for, so the
    // stored device key is the only thing that can get back in — and it has to
    // happen here, before the UI decides the player is a stranger.
    const key = readDeviceKey();
    if (!key) {
      set({ status: 'signed-out', user: null, best: {} });
      return;
    }
    try {
      const { user } = await apiPost<{ user: OnlineUser }>('/api/auth/device', { deviceKey: key });
      set({ user, status: 'signed-in', error: null });
      await get().loadBest();
    } catch (err) {
      // 401 means the account is gone (deleted, or this is a key from another
      // server). Keeping it would retry on every boot forever.
      if (err instanceof ApiError && err.status === 401) clearDeviceKey();
      set({
        status: err instanceof ApiError && err.status === 0 ? 'offline' : 'signed-out',
        user: null,
        best: {},
      });
    }
  },

  signup: async (email, password, username) => {
    set({ busy: true, error: null });
    try {
      const { user } = await apiPost<{ user: OnlineUser }>('/api/auth/signup', { email, password, username });
      set({ user, status: 'signed-in', busy: false });
      return true;
    } catch (err) {
      set({ busy: false, error: signupMessage(err) });
      return false;
    }
  },

  login: async (email, password) => {
    set({ busy: true, error: null });
    try {
      const { user } = await apiPost<{ user: OnlineUser }>('/api/auth/login', { email, password });
      set({ user, status: 'signed-in', busy: false });
      await get().loadBest();
      return true;
    } catch (err) {
      set({ busy: false, error: loginMessage(err) });
      return false;
    }
  },

  continueAsName: async (username) => {
    if (!deviceKeySupported()) {
      set({ error: 'This browser will not let the game store anything, so a name-only account cannot be kept. Use an email address instead.' });
      return false;
    }
    set({ busy: true, error: null, notice: null });
    try {
      const { user, deviceKey } = await apiPost<{ user: OnlineUser; deviceKey: string }>('/api/auth/guest', {
        username,
      });
      // The key is shown once and never again. If it cannot be stored the
      // account is unreachable from the next boot, so that is a failure, not a
      // warning — the account is abandoned rather than silently lost later.
      if (!writeDeviceKey(deviceKey)) {
        set({
          busy: false,
          error: 'Could not save anything on this device, so this account could not be kept. Check your browser’s storage settings, or use an email address.',
        });
        return false;
      }
      set({ user, status: 'signed-in', busy: false });
      return true;
    } catch (err) {
      set({ busy: false, error: nameMessage(err) });
      return false;
    }
  },

  attachEmail: async (email, password) => {
    set({ busy: true, error: null, notice: null });
    try {
      const { user } = await apiPost<{ user: OnlineUser }>('/api/auth/email/attach', { email, password });
      set({
        user,
        busy: false,
        notice: 'Email added. Confirm the link we just sent, and you can sign in on any device.',
      });
      return true;
    } catch (err) {
      set({ busy: false, error: attachMessage(err) });
      return false;
    }
  },

  snoozeEmailPrompt: async () => {
    const user = get().user;
    if (!user) return;
    try {
      const { emailPromptAfter } = await apiPost<{ emailPromptAfter: string }>('/api/auth/email/snooze');
      set({ user: { ...user, emailPromptAfter } });
    } catch {
      // Offline. Hide it for this session so the card is not stuck on screen;
      // the server has not been told, so the ask comes back on the next boot.
      set({ user: { ...user, emailPromptAfter: new Date(Date.now() + 3600_000).toISOString() } });
    }
  },

  logout: async () => {
    await apiPost('/api/auth/logout').catch(() => undefined);
    // The device key is deliberately kept: signing out of a name-only account
    // is not deleting it, and the key is the only way back.
    set({ user: null, status: 'signed-out', best: {} });
  },

  setShareContender: async (share) => {
    const user = get().user;
    if (!user) return;
    await apiPost('/api/auth/consent', { shareContender: share, legalVersion: legal.version });
    set({ user: { ...user, shareContender: share } });
  },

  submitScore: async (score) => {
    const user = get().user;
    if (!user) return false;
    try {
      // Guardrail 10: the Contender only travels when the player said it may.
      // The server drops it regardless, but it should not be on the wire.
      await apiPost('/api/scores', { ...score, contenderId: user.shareContender ? score.contenderId : null });
      await get().loadBest();
      return true;
    } catch {
      return false;
    }
  },

  loadBest: async () => {
    try {
      const { best } = await apiGet<{ best: Record<string, { crowd: number; runs: number }> }>('/api/scores/mine');
      set({ best });
    } catch {
      /* the board simply stays as it was */
    }
  },

  // -- C41: recovery -------------------------------------------------------

  forgotPassword: async (email) => {
    set({ busy: true, error: null, notice: null });
    try {
      await apiPost('/api/auth/password/forgot', { email });
      // The server answers the same way whether or not the address has an
      // account, and so does this — saying "no such account" here would undo
      // the server's work.
      set({
        busy: false,
        notice: `If that address has an account, a reset link is on its way. It lasts ${limits.auth.resetTokenMinutes} minutes.`,
      });
      return true;
    } catch (err) {
      set({ busy: false, error: recoveryMessage(err, 'Could not send the reset link.') });
      return false;
    }
  },

  resetPassword: async (token, password) => {
    set({ busy: true, error: null });
    try {
      const { user } = await apiPost<{ user: OnlineUser }>('/api/auth/password/reset', { token, password });
      set({
        user,
        status: 'signed-in',
        busy: false,
        pendingReset: null,
        notice: 'Password changed. Every other device has been signed out.',
      });
      await get().loadBest();
      return true;
    } catch (err) {
      set({ busy: false, error: resetMessage(err) });
      return false;
    }
  },

  verifyEmail: async (token) => {
    try {
      await apiPost('/api/auth/verify', { token });
      const user = get().user;
      if (user) set({ user: { ...user, emailVerified: true } });
      set({ notice: 'Address confirmed. Your runs can reach the public boards now.' });
      await get().refresh();
    } catch {
      set({ error: 'That confirmation link has expired or was already used. Ask for a new one in Account.' });
    }
  },

  resendVerification: async () => {
    set({ busy: true, error: null, notice: null });
    try {
      await apiPost('/api/auth/verify/request');
      set({ busy: false, notice: 'Confirmation link sent. Check your email.' });
    } catch (err) {
      set({ busy: false, error: recoveryMessage(err, 'Could not send the link.') });
    }
  },

  changePassword: async (current, next) => {
    set({ busy: true, error: null, notice: null });
    try {
      await apiPost('/api/auth/password/change', { current, next });
      set({ busy: false, notice: 'Password changed. Every other device has been signed out.' });
      return true;
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 401
          ? 'That is not your current password.'
          : err instanceof ApiError && err.status === 400
            ? `Use at least ${limits.auth.minPasswordLength} characters.`
            : recoveryMessage(err, 'Could not change the password.');
      set({ busy: false, error: msg });
      return false;
    }
  },
}));

function recoveryMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  if (err.status === 0) return 'Cannot reach the server.';
  if (err.status === 429) return tooMany(err);
  return fallback;
}

function resetMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Could not set the password.';
  if (err.status === 0) return 'Cannot reach the server.';
  if (err.code === 'bad-token') {
    return `That link has expired or was already used. Reset links last ${limits.auth.resetTokenMinutes} minutes — ask for a new one.`;
  }
  if (err.status === 400) return `Use at least ${limits.auth.minPasswordLength} characters.`;
  if (err.status === 429) return tooMany(err);
  return 'Could not set the password.';
}

/** Minutes, rounded up, so "0 minutes" is never shown to someone who must wait. */
function tooMany(err: ApiError): string {
  const mins = Math.max(1, Math.ceil((err.retryAfter ?? 60) / 60));
  return `Too many attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`;
}

function signupMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Could not sign up.';
  if (err.status === 0) return 'Cannot reach the server.';
  if (err.code === 'taken') return err.field === 'username' ? 'That name is taken.' : 'That email already has an account.';
  if (err.status === 429) return tooMany(err);
  if (err.status === 400) {
    return `Check the email, a password of ${limits.auth.minPasswordLength}+ characters, and a name of 3-16 letters or numbers.`;
  }
  return 'Could not sign up.';
}

function nameMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Could not start.';
  if (err.status === 0) return 'Cannot reach the server. You can still play — runs stay on this phone.';
  if (err.code === 'taken') return 'That name is taken. Try another.';
  if (err.status === 429) return tooMany(err);
  if (err.status === 400) return 'Use 3–16 letters, numbers or underscore.';
  return 'Could not start.';
}

function attachMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Could not add the email.';
  if (err.status === 0) return 'Cannot reach the server.';
  if (err.code === 'taken') return 'That email already has an account. Sign in to it instead.';
  if (err.code === 'has-email') return 'This account already has an email address.';
  if (err.status === 429) return tooMany(err);
  if (err.status === 400) {
    return `Check the email and a password of ${limits.auth.minPasswordLength}+ characters.`;
  }
  return 'Could not add the email.';
}

function loginMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Could not sign in.';
  if (err.status === 0) return 'Cannot reach the server.';
  if (err.status === 401) return 'Email or password is wrong.';
  if (err.code === 'locked-out') {
    return `Too many failed attempts on this address. It is locked for ${limits.auth.lockoutMinutes} minutes — or reset your password to get straight back in.`;
  }
  if (err.status === 429) return tooMany(err);
  return 'Could not sign in.';
}

export async function deleteOnlineAccount(): Promise<boolean> {
  try {
    await apiDelete('/api/account');
    // Unlike signing out, this really is the end of the account, so the device
    // key goes too — otherwise the next boot spends a request on a dead key.
    clearDeviceKey();
    useOnlineStore.setState({ user: null, status: 'signed-out', best: {} });
    return true;
  } catch {
    return false;
  }
}
