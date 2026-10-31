import { useEffect, useState } from 'react';
import { legal, limits } from '@cr/content';
import { useGameStore } from '../state';
import { useAccountStore } from '../accountStore';
import { deleteOnlineAccount, useOnlineStore } from '../onlineStore';
import { contenderShareAllowed, shareConsentPlan } from '../consent';
import { buildExportBundle, deleteAllLocalData, downloadExport } from '../dataExport';
import { MenuHead, Row, Sheet, Toggle } from './MenuChrome';
import { useContenderStore } from '../contenderStore';
import { usePlacesStore } from '../places/placesStore';

function initial(name: string): string {
  const ch = name.trim()[0];
  return ch ? ch.toUpperCase() : '?';
}

/**
 * Account covers two different things that used to be one: the device profile
 * (a local name, the consent log, the export) and, since C37, a real server
 * account. The identity sheet at the top says which of those you are in right
 * now, because "am I signed in?" was previously unanswerable from this screen
 * — it still read "Cloud sign-in comes later".
 *
 * The Contender switch writes to both. The local consent log stays the legal
 * record; the server call is what actually erases ids already stored
 * (guardrail 10 works backwards, not just forwards).
 */
export function AccountScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const guestId = useAccountStore((s) => s.guestId);
  const mode = useAccountStore((s) => s.mode);
  const displayName = useAccountStore((s) => s.displayName);
  const consentLog = useAccountStore((s) => s.consentLog);
  const termsVersion = useAccountStore((s) => s.termsAcceptedVersion);
  const privacyVersion = useAccountStore((s) => s.privacyAcceptedVersion);
  const acceptTerms = useAccountStore((s) => s.acceptTerms);
  const acceptPrivacy = useAccountStore((s) => s.acceptPrivacy);
  const grantContenderShare = useAccountStore((s) => s.grantContenderShare);
  const withdrawContenderShare = useAccountStore((s) => s.withdrawContenderShare);
  const saveLocalAccount = useAccountStore((s) => s.saveLocalAccount);

  const status = useOnlineStore((s) => s.status);
  const user = useOnlineStore((s) => s.user);
  const logout = useOnlineStore((s) => s.logout);
  const setShareContender = useOnlineStore((s) => s.setShareContender);
  const resendVerification = useOnlineStore((s) => s.resendVerification);
  const attachEmail = useOnlineStore((s) => s.attachEmail);
  const busy = useOnlineStore((s) => s.busy);
  const notice = useOnlineStore((s) => s.notice);
  const onlineError = useOnlineStore((s) => s.error);
  const changePassword = useOnlineStore((s) => s.changePassword);

  const termsOk = termsVersion === legal.version;
  const privacyOk = privacyVersion === legal.version;
  const shareOk = contenderShareAllowed(consentLog);
  const contenderPicked = useContenderStore((s) => s.activeContenderId);
  const identity = usePlacesStore((s) => s.identity);
  const mobiliseOn = identity?.contenderId != null;
  useEffect(() => {
    if (user) void usePlacesStore.getState().loadIdentity();
  }, [user]);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [note, setNote] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [nextPw, setNextPw] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPw, setAddPw] = useState('');

  const onSave = () => {
    const res = saveLocalAccount(nameDraft);
    if (!res.ok) {
      setNote(
        res.reason === 'legal'
          ? 'Accept the terms and privacy notice first.'
          : res.reason === 'length'
            ? 'Pick a name of 3–16 characters.'
            : 'That name is not allowed.',
      );
      return;
    }
    setNote(`Saved as ${res.name}.`);
  };

  const onShare = (next: boolean) => {
    const plan = shareConsentPlan(next, !!user);
    if (plan.local === 'grant') grantContenderShare();
    else withdrawContenderShare();
    if (plan.server !== null) void setShareContender(plan.server);
  };

  const shown = user?.username ?? (mode === 'saved' ? displayName : 'Guest');

  return (
    <div className="cr-screen cr-screen--menu">
      <MenuHead title="Account" sub="Who you are, and what leaves this phone" />

      <Sheet>
        <div className="cr-identity">
          <div className="cr-avatar" aria-hidden="true">
            {initial(shown)}
          </div>
          <div className="cr-identity-text">
            <strong>{shown}</strong>
            <small>
              {user?.email ?? (user ? 'Name only · this device' : `Device id ${guestId.slice(0, 8)}`)}
            </small>
          </div>
          <span className={`cr-status cr-status--${status}`}>
            {status === 'signed-in'
              ? 'Signed in'
              : status === 'offline'
                ? 'Offline'
                : status === 'unknown'
                  ? 'Checking…'
                  : 'This device'}
          </span>
        </div>
        {user ? (
          <>
            <p className="cr-fineprint">
              {user.emailVerified
                ? 'Your runs are saved to your account and count towards the live board.'
                : user.email
                  ? 'Your runs are saved to your account. They reach the public boards once you confirm your email.'
                  : 'Your runs are saved, but only this phone can reach them. Add an email to play on another device.'}
            </p>
            {/*
              Nothing to sign back in with on a name-only account, so there is no
              Sign out: the button would read as "leave" and act as "lock myself
              out". Deleting it is below, said plainly.
            */}
            {user.hasPassword ? (
              <button className="cr-btn cr-btn--ghost" type="button" onClick={() => void logout()}>
                Sign out
              </button>
            ) : null}
          </>
        ) : (
          <>
            <p className="cr-fineprint">
              {status === 'offline'
                ? 'Cannot reach the server right now. You can keep playing — runs stay on this phone.'
                : 'Runs stay on this phone. Sign in to keep your board across devices and join the live map.'}
            </p>
            <button className="cr-btn" type="button" onClick={() => setScreen('auth')}>
              Sign in, or start with just a name
            </button>
          </>
        )}
      </Sheet>

      {user && !user.email ? (
        <Sheet tone="accent" eyebrow="This phone only" title="Add your email">
          <p>
            Your campaign is saved on the server, but a name is not something another device can present — so right
            now this phone is the only way in, and clearing your browser data ends the account. An email and a
            password fix both, and put your runs on the public boards once you confirm the address.
          </p>
          <label className="cr-field">
            <span>Email</span>
            <input type="email" autoComplete="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
          </label>
          <label className="cr-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={addPw}
              onChange={(e) => setAddPw(e.target.value)}
            />
            <small>At least {limits.auth.minPasswordLength} characters.</small>
          </label>
          <button
            className="cr-btn"
            type="button"
            disabled={busy || addEmail.trim().length < 4 || addPw.length < limits.auth.minPasswordLength}
            onClick={() => {
              void attachEmail(addEmail, addPw).then((ok) => {
                if (ok) {
                  setAddEmail('');
                  setAddPw('');
                }
              });
            }}
          >
            {busy ? 'Working…' : 'Add email and password'}
          </button>
        </Sheet>
      ) : null}

      {user && user.email && !user.emailVerified ? (
        <Sheet tone="accent" eyebrow="Unconfirmed" title="Confirm your email">
          <p>
            We sent a link to {user.email}. Confirming it is what lets your runs onto the public boards — and it is the
            only way we can help you back in if you lose your password.
          </p>
          <button className="cr-btn" type="button" disabled={busy} onClick={() => void resendVerification()}>
            {busy ? 'Sending…' : 'Send the link again'}
          </button>
        </Sheet>
      ) : null}

      {user && user.hasPassword ? (
        <Sheet eyebrow="Sign-in" title="Change password">
          <p className="cr-fineprint">
            Changing it signs out every other device on this account — which is the point if you think someone else is
            on it.
          </p>
          <label className="cr-field">
            <span>Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
            />
          </label>
          <label className="cr-field">
            <span>New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={nextPw}
              onChange={(e) => setNextPw(e.target.value)}
            />
            <small>At least {limits.auth.minPasswordLength} characters.</small>
          </label>
          <button
            className="cr-btn cr-btn--ghost"
            type="button"
            disabled={busy || currentPw.length < 1 || nextPw.length < limits.auth.minPasswordLength}
            onClick={() => {
              void changePassword(currentPw, nextPw).then((ok) => {
                if (ok) {
                  setCurrentPw('');
                  setNextPw('');
                }
              });
            }}
          >
            {busy ? 'Working…' : 'Change password'}
          </button>
        </Sheet>
      ) : null}

      {notice ? <p className="cr-auth-notice">{notice}</p> : null}
      {onlineError ? <p className="cr-auth-error">{onlineError}</p> : null}

      <Sheet eyebrow="On this device" title={legal.guestSaveTitle}>
        <p>{legal.guestSaveBody}</p>
        <label className="cr-check">
          <input type="checkbox" checked={termsOk} onChange={(e) => e.target.checked && acceptTerms()} />
          <span>
            Accept {legal.termsTitle} (v{legal.version})
          </span>
        </label>
        <label className="cr-check">
          <input type="checkbox" checked={privacyOk} onChange={(e) => e.target.checked && acceptPrivacy()} />
          <span>
            Accept {legal.privacyTitle} (v{legal.version})
          </span>
        </label>
        <div className="cr-name-save">
          <label className="cr-field">
            <span>Name on this device</span>
            <input
              type="text"
              maxLength={16}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="3–16 characters"
            />
          </label>
          <button className="cr-mini-btn" type="button" onClick={onSave}>
            Save
          </button>
        </div>
        {note ? <p className="cr-fineprint">{note}</p> : null}
      </Sheet>

      <Sheet eyebrow="Privacy" title={legal.contenderConsentTitle} flush>
        <p className="cr-sheet-body">{legal.contenderConsentBody}</p>
        <Toggle label={legal.contenderConsentAccept} checked={shareOk} onChange={onShare} />
        <p className="cr-sheet-body cr-fineprint">
          {user && user.shareContender !== shareOk
            ? `Your account currently says ${user.shareContender ? 'on' : 'off'}. Flip this switch to match it.`
            : `Consent log: ${consentLog.length} ${consentLog.length === 1 ? 'entry' : 'entries'} on this device. A lawyer review of the full notice is still required before public launch.`}
        </p>
      </Sheet>

      {user && contenderPicked ? (
        <Sheet eyebrow="Mobilise" title="Show my Contender in Mobilise" flush>
          <p className="cr-sheet-body">
            Off, you are a plain citizen in every place. On, the people in the same room can see which Contender you picked. This is separate from the
            map choice above.
          </p>
          <Toggle
            label="Show my Contender to people in my room"
            checked={mobiliseOn}
            onChange={(on) => void usePlacesStore.getState().setIdentity(on ? contenderPicked : null)}
          />
        </Sheet>
      ) : null}

      <Sheet eyebrow="Your data" flush>
        <Row
          label="Export everything"
          hint="A JSON file of your progress, settings and consent log."
          control={
            <button
              className="cr-mini-btn"
              type="button"
              onClick={() => {
                downloadExport(buildExportBundle());
                setNote('Export downloaded.');
              }}
            >
              Export
            </button>
          }
        />
        <Row
          label="Delete device data"
          hint="Clears progress, settings and the consent log from this phone."
          control={
            <button
              className="cr-mini-btn cr-mini-btn--danger"
              type="button"
              onClick={() => {
                if (window.confirm('Delete all local Campaigner data on this device?')) deleteAllLocalData();
              }}
            >
              Delete
            </button>
          }
        />
        {user ? (
          <Row
            label="Delete your account"
            hint={
              user.hasPassword
                ? 'Removes your account and every run stored on the server. This cannot be undone.'
                : 'Removes this name-only account and every run on the server. There is no other copy and no way back.'
            }
            control={
              <button
                className="cr-mini-btn cr-mini-btn--danger"
                type="button"
                onClick={() => {
                  if (!window.confirm('Delete your Campaigner account and all scores on the server?')) return;
                  void deleteOnlineAccount().then((ok) =>
                    setNote(ok ? 'Account deleted.' : 'Could not reach the server. Nothing was deleted.'),
                  );
                }}
              >
                Delete
              </button>
            }
          />
        ) : null}
      </Sheet>

      <div className="cr-row">
        <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('about')}>
          About
        </button>
        <button className="cr-btn" type="button" onClick={() => setScreen('splash')}>
          Back
        </button>
      </div>
    </div>
  );
}
