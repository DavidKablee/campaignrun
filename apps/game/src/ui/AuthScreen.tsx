import { useState } from 'react';
import { legal, limits } from '@cr/content';
import { useGameStore } from '../state';
import { useOnlineStore } from '../onlineStore';

/**
 * Sign up / sign in. Campaign Run keeps scores on the server, so this is where
 * a player's board stops being this-device-only.
 *
 * Since C42 there are three ways in, not two. The third — a board name and
 * nothing else — exists because asking for an address before the player has
 * played anything is the single biggest thing between them and the first run.
 * It is offered as plainly as the others and described honestly: the account is
 * real and its runs are saved, but it lives on this device only, and the game
 * will ask for an email later rather than pretend otherwise.
 *
 * Nothing here asks for a Contender. That choice is sensitive (guardrail 10)
 * and is consented to separately in Account, after sign-in — tying it to the
 * sign-up form would make it look like a condition of having an account.
 */
type Mode = 'signup' | 'login' | 'forgot' | 'name';

export function AuthScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const { signup, login, busy, error, notice, clearError, clearNotice } = useOnlineStore();
  const forgotPassword = useOnlineStore((s) => s.forgotPassword);
  const resetPassword = useOnlineStore((s) => s.resetPassword);
  const continueAsName = useOnlineStore((s) => s.continueAsName);
  const pendingReset = useOnlineStore((s) => s.pendingReset);
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [accepted, setAccepted] = useState(false);

  // A reset link overrides whatever tab was open: the player followed it from
  // their email to do one specific thing.
  const screen: Mode | 'reset' = pendingReset ? 'reset' : mode;
  const minPassword = limits.auth.minPasswordLength;

  const canSubmit = !busy && (
    screen === 'forgot'
      ? email.trim().length > 3
      : screen === 'reset'
        ? password.length >= minPassword
        : screen === 'name'
          ? username.trim().length >= 3 && accepted
          : email.trim().length > 3 &&
            password.length >= (screen === 'signup' ? minPassword : 1) &&
            (screen === 'login' || (username.trim().length >= 3 && accepted))
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (screen === 'forgot') {
      await forgotPassword(email);
      return;
    }
    if (screen === 'reset') {
      if (await resetPassword(pendingReset!, password)) setScreen('map');
      return;
    }
    const ok =
      screen === 'name'
        ? await continueAsName(username)
        : screen === 'signup'
          ? await signup(email, password, username)
          : await login(email, password);
    if (ok) setScreen('map');
  }

  const switchTo = (m: Mode) => {
    setMode(m);
    clearError();
    clearNotice();
  };

  return (
    <div className="cr-screen cr-screen--auth">
      <header className="cr-board-ticker">
        <button type="button" className="cr-link" onClick={() => setScreen('splash')}>
          ← Back
        </button>
        <span className="cr-board-ticker-msg">Your board, on every device</span>
      </header>

      <form className="cr-panel cr-auth" onSubmit={submit}>
        {screen === 'signup' || screen === 'login' ? (
          <div className="cr-tabs" role="tablist">
            {(['signup', 'login'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={screen === m}
                className={`cr-tab${screen === m ? ' is-active' : ''}`}
                onClick={() => switchTo(m)}
              >
                {m === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            ))}
          </div>
        ) : (
          <h2 className="cr-auth-title">
            {screen === 'reset'
              ? 'Set a new password'
              : screen === 'name'
                ? 'Play with just a name'
                : 'Reset your password'}
          </h2>
        )}

        {screen === 'reset' ? (
          <p className="cr-fineprint">
            You followed a reset link. Choosing a new password here signs out every other device on the account.
          </p>
        ) : null}
        {screen === 'forgot' ? (
          <p className="cr-fineprint">
            We will email a link that lasts {limits.auth.resetTokenMinutes} minutes and works once.
          </p>
        ) : null}
        {screen === 'name' ? (
          <p className="cr-fineprint">
            No email, no password. Your runs are saved to an account that lives on this phone only — clearing your
            browser data ends it, and you cannot sign in to it anywhere else. We will ask for an email later so you
            can.
          </p>
        ) : null}

        {screen === 'reset' || screen === 'name' ? null : (
          <label className="cr-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        )}

        {screen === 'signup' || screen === 'name' ? (
          <label className="cr-field">
            <span>Board name</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              minLength={3}
              maxLength={16}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <small>3–16 letters, numbers or underscore. This is what the boards show.</small>
          </label>
        ) : null}

        {screen === 'forgot' || screen === 'name' ? null : (
          <label className="cr-field">
            <span>{screen === 'reset' ? 'New password' : 'Password'}</span>
            <input
              type="password"
              autoComplete={screen === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {screen === 'signup' || screen === 'reset' ? (
              <small>At least {minPassword} characters. Length beats symbols.</small>
            ) : null}
          </label>
        )}

        {screen === 'signup' || screen === 'name' ? (
          <label className="cr-check">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>
              I am 18+ and accept the terms and privacy notice ({legal.version}).
            </span>
          </label>
        ) : null}

        {error ? (
          <p className="cr-auth-error" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="cr-auth-notice" role="status">
            {notice}
          </p>
        ) : null}

        <button className="cr-btn" type="submit" disabled={!canSubmit}>
          {busy
            ? 'Working…'
            : screen === 'signup'
              ? 'Create account'
              : screen === 'login'
                ? 'Sign in'
                : screen === 'forgot'
                  ? 'Email me a link'
                  : screen === 'name'
                    ? 'Start playing'
                    : 'Set password'}
        </button>

        {screen === 'login' ? (
          <button className="cr-link cr-auth-alt" type="button" onClick={() => switchTo('forgot')}>
            Forgot your password?
          </button>
        ) : null}
        {screen === 'forgot' ? (
          <button className="cr-link cr-auth-alt" type="button" onClick={() => switchTo('login')}>
            ← Back to sign in
          </button>
        ) : null}
        {screen === 'signup' || screen === 'login' ? (
          <button className="cr-link cr-auth-alt" type="button" onClick={() => switchTo('name')}>
            No email? Play with just a name
          </button>
        ) : null}
        {screen === 'name' ? (
          <button className="cr-link cr-auth-alt" type="button" onClick={() => switchTo('signup')}>
            ← Use an email instead
          </button>
        ) : null}

        {screen === 'name' ? (
          <p className="cr-fineprint">
            We store your board name and your scores, and nothing else. Your Contender is never sent unless you turn
            that on in Account. Until an email is confirmed on this account, your runs stay off the public boards.
          </p>
        ) : null}
        {screen === 'signup' ? (
          <p className="cr-fineprint">
            We store your email, your board name and your scores. Your Contender is never sent unless you turn that on
            in Account, and you can export or delete everything at any time. We email you once to confirm the address —
            until you do, your runs stay off the public boards.
          </p>
        ) : null}
      </form>
    </div>
  );
}
