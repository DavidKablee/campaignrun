import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { legal } from '@cr/content';
import { appendConsent, contenderShareAllowed, type ConsentEntry } from './consent';
import { validateUsername } from './username';

function newGuestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `guest-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

interface AccountState {
  guestId: string;
  /** Guest until the player saves a local account name. */
  mode: 'guest' | 'saved';
  displayName: string;
  consentLog: ConsentEntry[];
  termsAcceptedVersion: string | null;
  privacyAcceptedVersion: string | null;
  acceptTerms: () => void;
  acceptPrivacy: () => void;
  grantContenderShare: () => void;
  withdrawContenderShare: () => void;
  saveLocalAccount: (name: string) => { ok: true; name: string } | { ok: false; reason: string };
  contenderShareOk: () => boolean;
  clearAccount: () => void;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      guestId: newGuestId(),
      mode: 'guest',
      displayName: '',
      consentLog: [],
      termsAcceptedVersion: null,
      privacyAcceptedVersion: null,
      acceptTerms: () =>
        set((st) => ({
          termsAcceptedVersion: legal.version,
          consentLog: appendConsent(st.consentLog, 'terms', legal.version, true),
        })),
      acceptPrivacy: () =>
        set((st) => ({
          privacyAcceptedVersion: legal.version,
          consentLog: appendConsent(st.consentLog, 'privacy', legal.version, true),
        })),
      grantContenderShare: () =>
        set((st) => ({
          consentLog: appendConsent(st.consentLog, 'contender-share', legal.version, true),
        })),
      withdrawContenderShare: () =>
        set((st) => ({
          consentLog: appendConsent(st.consentLog, 'withdraw-contender', legal.version, true),
        })),
      saveLocalAccount: (name) => {
        const checked = validateUsername(name);
        if (!checked.ok) return checked;
        const st = get();
        if (st.termsAcceptedVersion !== legal.version || st.privacyAcceptedVersion !== legal.version) {
          return { ok: false, reason: 'legal' };
        }
        set({ mode: 'saved', displayName: checked.name });
        return { ok: true, name: checked.name };
      },
      contenderShareOk: () => contenderShareAllowed(get().consentLog),
      clearAccount: () =>
        set({
          guestId: newGuestId(),
          mode: 'guest',
          displayName: '',
          consentLog: [],
          termsAcceptedVersion: null,
          privacyAcceptedVersion: null,
        }),
    }),
    {
      name: 'cr-account',
      version: 1,
      partialize: (state) => ({
        guestId: state.guestId,
        mode: state.mode,
        displayName: state.displayName,
        consentLog: state.consentLog,
        termsAcceptedVersion: state.termsAcceptedVersion,
        privacyAcceptedVersion: state.privacyAcceptedVersion,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
