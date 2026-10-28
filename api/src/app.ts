import { Hono, type MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { limits, rides, simConfig } from '@cr/content';
import { isPlausibleRun, verifyReplay } from '@cr/sim';
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  clearLoginFailures,
  consumeEmailToken,
  createDeviceKey,
  createEmailToken,
  createSession,
  destroyAllSessions,
  destroySession,
  hashPassword,
  lockoutSeconds,
  noteLoginFailure,
  userForToken,
  userIdForDeviceKey,
  verifyPassword,
  type SessionUser,
} from './auth.ts';
import type { Db } from './db.ts';
import { snoozeUntil } from './emailPrompt.ts';
import { LIMITS } from './limits.ts';
import { log, requestLogger } from './log.ts';
import { createMailer, resetLink, verifyLink, type Mailer } from './mailer.ts';
import { hit, rateLimit } from './rateLimit.ts';
import { decodeReplayLog, rallySaturdayPlausible } from './replayGate.ts';
import { liveStandings, regionBoard, MIN_PLAYERS_PER_REGION } from './standings.ts';
import {
  attachEmailSchema,
  consentSchema,
  deviceSchema,
  eventsSchema,
  feedbackSchema,
  forgotSchema,
  guestSchema,
  loginSchema,
  passwordChangeSchema,
  resetSchema,
  scoreSchema,
  signupSchema,
  verifySchema,
} from './validate.ts';

type Env = { Variables: { user: SessionUser; requestId: string } };

const SECURE = process.env.NODE_ENV === 'production' || process.env.CR_COOKIE_SECURE === 'true';

/**
 * Cookie scope, which depends on where the two halves end up.
 *
 * The default `Lax` is correct when the game and the API share a registrable
 * domain (`campaignrun.com` and `api.campaignrun.com`). Put them on genuinely
 * different domains and the browser stops sending the session on fetch at all,
 * which from the client is indistinguishable from the server being down — so
 * that case has to be a deliberate `CR_COOKIE_SAMESITE=None`, which browsers
 * only honour over HTTPS. Checked at boot rather than discovered in support.
 */
const SAME_SITE = (process.env.CR_COOKIE_SAMESITE ?? 'Lax') as 'Lax' | 'Strict' | 'None';
const COOKIE_DOMAIN = process.env.CR_COOKIE_DOMAIN;

export function assertCookieConfig(sameSite = SAME_SITE, secure = SECURE): void {
  if (!['Lax', 'Strict', 'None'].includes(sameSite)) {
    throw new Error(`CR_COOKIE_SAMESITE must be Lax, Strict or None (got ${sameSite})`);
  }
  if (sameSite === 'None' && !secure) {
    throw new Error('CR_COOKIE_SAMESITE=None requires a secure cookie: serve over HTTPS or set CR_COOKIE_SECURE=true.');
  }
}

function cookieOpts(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: SAME_SITE,
    secure: SECURE,
    path: '/',
    maxAge: maxAgeSeconds,
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  } as const;
}

const MINUTE = 60_000;

/**
 * The account as the client sees it. One function because seven routes answer
 * with it, and a field added to six of them is a field the seventh silently
 * drops — which is how a name-only account would end up looking like a full
 * one on exactly one code path.
 */
function userPayload(row: {
  id: string;
  email: string | null;
  username: string;
  contender_consent_at?: Date | null;
  email_verified_at?: Date | null;
  email_prompt_after?: Date | null;
  has_password?: boolean;
}) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    shareContender: row.contender_consent_at != null,
    emailVerified: row.email_verified_at != null,
    // Only a name-only account has neither, and the client needs to know which
    // of the two it is looking at: one gets asked for an email, the other gets
    // a change-password form.
    hasPassword: row.has_password ?? row.email != null,
    emailPromptAfter: row.email_prompt_after?.toISOString() ?? null,
  };
}

const USER_COLUMNS =
  'id, email, username, contender_consent_at, email_verified_at, email_prompt_after, password_hash is not null as has_password';

interface UserRow {
  id: string;
  email: string | null;
  username: string;
  contender_consent_at: Date | null;
  email_verified_at: Date | null;
  email_prompt_after: Date | null;
  has_password: boolean;
}

/** Built around an injected `Db` so the routes are testable without a live server. */
export interface AppOptions {
  /**
   * Refuse a score that arrives without a replay. On by default: a board that
   * accepts unreplayed scores is forgeable by anyone who can call the API. The
   * escape hatch (`CR_REQUIRE_REPLAY=false`) is for a local demo only.
   */
  requireReplay?: boolean;
  /** Injected so a test can pin Rally Saturday; real time otherwise. */
  now?: () => number;
}

export function createApp(database: Db, mailer: Mailer = createMailer(), options: AppOptions = {}) {
  const log_replay = (userId: string, stateId: string, reason: string) =>
    log('warn', 'score.replay-rejected', { userId, stateId, reason });
  const requireReplay = options.requireReplay ?? process.env.CR_REQUIRE_REPLAY !== 'false';
  const now = options.now ?? Date.now;
  assertCookieConfig();
  const app = new Hono<Env>();

  app.use('*', requestLogger);

  // Both spellings of the dev host: a browser on 127.0.0.1 and a browser on
  // localhost are different origins, and only one of them being listed looks
  // exactly like "the server is down" from the client.
  const origins = (process.env.CR_ALLOWED_ORIGINS ??
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5180,http://127.0.0.1:5180')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // Credentials are cookies, so the allowed origins must be an explicit list.
  // Development only: a phone loading the dev server over the LAN is a private-network origin that
  // cannot be listed in advance. Production keeps the explicit list and nothing else.
  const lanOrigin = /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):\d{2,5}$/;
  const allowLan = process.env.NODE_ENV !== 'production';
  app.use(
    '/api/*',
    cors({
      origin: (origin) => (origins.includes(origin) || (allowLan && lanOrigin.test(origin)) ? origin : null),
      credentials: true,
    }),
  );

  app.get('/api/health', (c) => c.json({ ok: true }));

  /** Issues a session and puts it in the cookie. Six routes end this way. */
  async function startSession(c: Parameters<MiddlewareHandler<Env>>[0], userId: string): Promise<void> {
    const { token } = await createSession(database, userId);
    setCookie(c, SESSION_COOKIE, token, cookieOpts(SESSION_DAYS * 86400));
  }

  /** Reads an account back in the shape every route answers with. */
  async function loadUser(userId: string): Promise<UserRow> {
    const { rows } = await database.query<UserRow>(`select ${USER_COLUMNS} from users where id = $1`, [userId]);
    return rows[0]!;
  }

  /**
   * Mails a fresh verification link. Failures are logged, never raised: a mail
   * provider having a bad minute must not turn a signup into a 500 and lose
   * the account that was already created.
   */
  async function sendVerification(userId: string, email: string): Promise<void> {
    try {
      const token = await createEmailToken(database, userId, 'verify', LIMITS.verifyTokenHours * 3600_000);
      await mailer.send({
        to: email,
        subject: 'Confirm your Campaign Run address',
        text:
          `Confirm this address to appear on the public boards:\n\n${verifyLink(token)}\n\n` +
          `The link lasts ${LIMITS.verifyTokenHours} hours. If you did not sign up, ignore this message.`,
      });
    } catch (err) {
      log('error', 'mail.verify.failed', { userId, reason: (err as Error).message });
    }
  }

  // -- auth ---------------------------------------------------------------

  app.post('/api/auth/signup', rateLimit('signup', LIMITS.signupPerDayPerIp, 24 * 60 * MINUTE), async (c) => {
    const body = signupSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'invalid', details: body.error.flatten() }, 400);
    const { email, password, username } = body.data;

    const { hash, salt } = await hashPassword(password);
    try {
      const { rows } = await database.query<{ id: string }>(
        `insert into users (email, username, password_hash, password_salt)
         values ($1, $2, $3, $4) returning id`,
        [email, username, hash, salt],
      );
      const userId = rows[0]!.id;
      await startSession(c, userId);
      await sendVerification(userId, email);
      // Signed in immediately: verification gates the public boards, not play.
      return c.json({ user: userPayload({ id: userId, email, username }) }, 201);
    } catch (err) {
      // 23505 = unique_violation. Which field collided is safe to say at signup;
      // the login route stays deliberately vague.
      if ((err as { code?: string }).code === '23505') {
        const detail = String((err as { detail?: string }).detail ?? '');
        const field = detail.includes('username') ? 'username' : 'email';
        return c.json({ error: 'taken', field }, 409);
      }
      throw err;
    }
  });

  app.post('/api/auth/login', rateLimit('login', LIMITS.loginPerMinutePerIp, MINUTE), async (c) => {
    const body = loginSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'invalid' }, 400);

    // The per-address lockout, checked before the password is even hashed. The
    // IP limiter above is the cheap half; this is the half an attacker cannot
    // escape by changing address.
    const locked = await lockoutSeconds(database, body.data.email);
    if (locked > 0) {
      c.header('retry-after', String(locked));
      return c.json({ error: 'locked-out', retryAfter: locked }, 429);
    }

    const { rows } = await database.query<UserRow & { password_hash: string | null; password_salt: string | null }>(
      `select ${USER_COLUMNS}, password_hash, password_salt from users where email = $1`,
      [body.data.email],
    );
    const row = rows[0];
    // Same message and a real hash comparison either way, so the response does
    // not say whether the address has an account. A null hash cannot be reached
    // from here — a name-only account has no address to look up — but it is
    // nullable in the schema now, so it is handled rather than assumed.
    const ok =
      row?.password_hash && row.password_salt
        ? await verifyPassword(body.data.password, row.password_hash, row.password_salt)
        : await verifyPassword(body.data.password, '00', 'decoy').then(() => false);
    if (!row || !ok) {
      await noteLoginFailure(database, body.data.email, LIMITS.loginFailuresBeforeLockout, LIMITS.lockoutMinutes);
      return c.json({ error: 'bad-credentials' }, 401);
    }

    await clearLoginFailures(database, body.data.email);
    await startSession(c, row.id);
    await database.query('update users set last_seen_at = now() where id = $1', [row.id]);
    return c.json({ user: userPayload(row) });
  });

  // -- name-only accounts (C42) -------------------------------------------

  /**
   * An account with a board name and nothing else.
   *
   * The device key in the response is the only way back into it, so it goes to
   * the client once and is never recoverable from the server. Rate-limited on
   * its own counter: this is the cheapest row in the database to create, and
   * the username namespace is shared with real signups.
   */
  app.post('/api/auth/guest', rateLimit('guest', LIMITS.guestPerDayPerIp, 24 * 60 * MINUTE), async (c) => {
    const body = guestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'invalid', details: body.error.flatten() }, 400);
    const { username } = body.data;
    try {
      const { rows } = await database.query<{ id: string }>(
        'insert into users (username) values ($1) returning id',
        [username],
      );
      const userId = rows[0]!.id;
      const deviceKey = await createDeviceKey(database, userId);
      await startSession(c, userId);
      log('info', 'auth.guest.created', { userId });
      return c.json({ user: userPayload({ id: userId, email: null, username }), deviceKey }, 201);
    } catch (err) {
      if ((err as { code?: string }).code === '23505') return c.json({ error: 'taken', field: 'username' }, 409);
      throw err;
    }
  });

  /**
   * Trades a stored device key for a session.
   *
   * The session cookie lasts 30 days and the key does not, so this is what a
   * returning name-only player hits — not a login, which they have no
   * credentials for.
   */
  app.post('/api/auth/device', rateLimit('device', LIMITS.devicePerMinutePerIp, MINUTE), async (c) => {
    const body = deviceSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'invalid' }, 400);
    const userId = await userIdForDeviceKey(database, body.data.deviceKey);
    // The client clears a key that gets this, so a deleted account does not
    // leave a device retrying forever.
    if (!userId) return c.json({ error: 'bad-device-key' }, 401);
    await startSession(c, userId);
    await database.query('update users set last_seen_at = now() where id = $1', [userId]);
    return c.json({ user: userPayload(await loadUser(userId)) });
  });

  app.post('/api/auth/logout', async (c) => {
    await destroySession(database, getCookie(c, SESSION_COOKIE));
    deleteCookie(c, SESSION_COOKIE, { path: '/' });
    return c.json({ ok: true });
  });

  // -- everything below needs a session ------------------------------------

  const requireUser: MiddlewareHandler<Env> = async (c, next) => {
    const user = await userForToken(database, getCookie(c, SESSION_COOKIE));
    if (!user) return c.json({ error: 'unauthenticated' }, 401);
    c.set('user', user);
    await next();
    return undefined;
  };

  app.get('/api/auth/me', requireUser, async (c) => {
    return c.json({ user: userPayload(await loadUser(c.get('user').id)) });
  });

  // -- email verification --------------------------------------------------

  app.post('/api/auth/verify/request', requireUser, rateLimit('verify-req', 5, 60 * MINUTE), async (c) => {
    const user = c.get('user');
    if (!user.email) return c.json({ error: 'no-email' }, 409);
    if (user.emailVerifiedAt) return c.json({ emailVerified: true });
    await sendVerification(user.id, user.email);
    return c.json({ sent: true }, 202);
  });

  app.post('/api/auth/verify', rateLimit('verify', 20, 60 * MINUTE), async (c) => {
    const body = verifySchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'invalid' }, 400);
    const userId = await consumeEmailToken(database, body.data.token, 'verify');
    // One message for expired, already-spent and never-existed: a link that
    // reports which it is tells an attacker what they are holding.
    if (!userId) return c.json({ error: 'bad-token' }, 400);
    await database.query('update users set email_verified_at = now() where id = $1 and email_verified_at is null', [
      userId,
    ]);
    return c.json({ emailVerified: true });
  });

  /**
   * Puts an address and a password on a name-only account.
   *
   * This is the whole point of the prompt: it is what makes the account
   * reachable from a second device and recoverable at all. The address starts
   * unverified like any other, so the public boards still wait for the link.
   */
  app.post('/api/auth/email/attach', requireUser, rateLimit('attach', 10, 60 * MINUTE), async (c) => {
    const body = attachEmailSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'invalid', details: body.error.flatten() }, 400);
    const user = c.get('user');
    // Changing an address is a different operation — it has to prove control of
    // the old one first — and this route does not ask for a password. Letting it
    // overwrite would make a stolen session enough to take an account over.
    if (user.email) return c.json({ error: 'has-email' }, 409);

    const { hash, salt } = await hashPassword(body.data.password);
    try {
      await database.query(
        `update users set email = $2, password_hash = $3, password_salt = $4,
                          email_prompt_after = null, email_prompt_dismissals = 0
          where id = $1 and email is null`,
        [user.id, body.data.email, hash, salt],
      );
    } catch (err) {
      if ((err as { code?: string }).code === '23505') return c.json({ error: 'taken', field: 'email' }, 409);
      throw err;
    }
    await sendVerification(user.id, body.data.email);
    log('info', 'auth.email.attached', { userId: user.id });
    return c.json({ user: userPayload(await loadUser(user.id)) });
  });

  /** "Not now." Pushes the next ask out by one rung of the ladder. */
  app.post('/api/auth/email/snooze', requireUser, async (c) => {
    const user = c.get('user');
    if (user.email) return c.json({ error: 'has-email' }, 409);
    const { rows } = await database.query<{ email_prompt_after: Date }>(
      `update users
          set email_prompt_dismissals = email_prompt_dismissals + 1,
              email_prompt_after = $2
        where id = $1
        returning email_prompt_after`,
      [user.id, snoozeUntil(await dismissals(user.id))],
    );
    return c.json({ emailPromptAfter: rows[0]!.email_prompt_after.toISOString() });
  });

  async function dismissals(userId: string): Promise<number> {
    const { rows } = await database.query<{ n: number }>(
      'select email_prompt_dismissals as n from users where id = $1',
      [userId],
    );
    return rows[0]?.n ?? 0;
  }

  // -- password reset ------------------------------------------------------

  app.post('/api/auth/password/forgot', rateLimit('forgot', LIMITS.forgotPerHourPerIp, 60 * MINUTE), async (c) => {
    const body = forgotSchema.safeParse(await c.req.json().catch(() => null));
    // Always the same answer, whatever happens below: this endpoint takes a
    // bare address from anyone, so a 404 here would be a free account-existence
    // oracle.
    const accepted = c.json({ sent: true }, 202);
    if (!body.success) return accepted;

    const { rows } = await database.query<{ id: string }>('select id from users where email = $1', [body.data.email]);
    const row = rows[0];
    if (!row) {
      log('info', 'password.forgot.unknown', {});
      return accepted;
    }
    try {
      const token = await createEmailToken(database, row.id, 'reset', LIMITS.resetTokenMinutes * MINUTE);
      await mailer.send({
        to: body.data.email,
        subject: 'Reset your Campaign Run password',
        text:
          `Set a new password:\n\n${resetLink(token)}\n\n` +
          `The link lasts ${LIMITS.resetTokenMinutes} minutes and works once. ` +
          `If you did not ask for this, ignore it — your password has not changed.`,
      });
    } catch (err) {
      log('error', 'mail.reset.failed', { userId: row.id, reason: (err as Error).message });
    }
    return accepted;
  });

  app.post('/api/auth/password/reset', rateLimit('reset', 20, 60 * MINUTE), async (c) => {
    const body = resetSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'invalid', details: body.error.flatten() }, 400);
    const userId = await consumeEmailToken(database, body.data.token, 'reset');
    if (!userId) return c.json({ error: 'bad-token' }, 400);

    const { hash, salt } = await hashPassword(body.data.password);
    await database.query('update users set password_hash = $2, password_salt = $3 where id = $1', [userId, hash, salt]);
    // Whoever had the old password is signed out everywhere. A reset is what
    // someone does when they think the account is compromised, so leaving the
    // attacker's session alive would defeat the point.
    await destroyAllSessions(database, userId);

    const row = await loadUser(userId);
    // A reset token can only have come from an address, so this is never null.
    if (row.email) await clearLoginFailures(database, row.email);
    await startSession(c, userId);
    return c.json({ user: userPayload(row) });
  });

  app.post('/api/auth/password/change', requireUser, rateLimit('change', 10, 60 * MINUTE), async (c) => {
    const body = passwordChangeSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'invalid', details: body.error.flatten() }, 400);
    const user = c.get('user');
    const { rows } = await database.query<{ password_hash: string | null; password_salt: string | null }>(
      'select password_hash, password_salt from users where id = $1',
      [user.id],
    );
    const row = rows[0]!;
    // A name-only account has no password to change; it needs the attach route.
    if (!row.password_hash || !row.password_salt) return c.json({ error: 'no-password' }, 409);
    if (!(await verifyPassword(body.data.current, row.password_hash, row.password_salt))) {
      return c.json({ error: 'bad-credentials' }, 401);
    }
    const { hash, salt } = await hashPassword(body.data.next);
    await database.query('update users set password_hash = $2, password_salt = $3 where id = $1', [user.id, hash, salt]);
    await destroyAllSessions(database, user.id);
    // Signed out everywhere, then back in here, so changing a password on a
    // phone does not also sign that phone out.
    await startSession(c, user.id);
    return c.json({ changed: true });
  });

  app.post('/api/auth/consent', requireUser, async (c) => {
    const body = consentSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'invalid' }, 400);
    const user = c.get('user');
    await database.query('update users set contender_consent_at = $2, legal_version = $3 where id = $1', [
      user.id,
      body.data.shareContender ? new Date() : null,
      body.data.legalVersion,
    ]);
    // Withdrawing consent must also remove what was shared under it, or the
    // choice is only honoured going forward.
    if (!body.data.shareContender) {
      await database.query('update scores set contender_id = null where user_id = $1', [user.id]);
    }
    return c.json({ shareContender: body.data.shareContender });
  });

  // -- scores --------------------------------------------------------------

  app.post('/api/scores', requireUser, async (c) => {
    const body = scoreSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'invalid', details: body.error.flatten() }, 400);
    const user = c.get('user');
    const s = body.data;

    // Per account, not per address: the session is the thing being spent here,
    // and a run takes over a minute to play, so this only ever bites a script.
    const burst = hit(`scores:${user.id}`, LIMITS.scoresPerMinutePerUser, MINUTE);
    if (!burst.ok) {
      c.header('retry-after', String(burst.retryAfter));
      return c.json({ error: 'rate-limited', retryAfter: burst.retryAfter }, 429);
    }

    // The same check the client runs on its local board, now on the side that
    // matters. Until C41 the schema's ranges were the only thing between a
    // curl command and the top of a public board.
    // Capacity comes from the ride, not the request. The client sends its own
    // figure and it is stored as reported, but a claim is measured against
    // what that ride can actually carry — otherwise "capacity: 200" buys a
    // proportionally larger lie.
    const rideCapacity = rides.find((r) => r.id === s.rideId)?.capacity ?? 0;
    const plausible = isPlausibleRun(
      {
        skillCrowd: s.crowd,
        displayCrowd: s.crowd,
        delivered: s.delivered,
        dents: s.dents,
        capacity: rideCapacity,
        integrity: s.integrity,
        finished: s.dents < simConfig.hit.maxDents,
      },
      simConfig,
    );
    if (!plausible.ok) {
      log('warn', 'score.rejected', { userId: user.id, stateId: s.stateId, reason: plausible.reason });
      return c.json({ error: 'implausible', reason: plausible.reason }, 422);
    }

    // A Contender id is only ever stored for a player who has consented, even
    // if the client sends one anyway (guardrail 10).
    const contenderId = user.contenderConsentAt ? (s.contenderId ?? null) : null;

    // The plausibility bound above is a ceiling; this is the proof. Play the
    // claimed inputs on the claimed seed and the score has to come out exactly.
    // When the player has shared their Contender the replay is pinned to it, so
    // a claimed Contender is also a verified one; otherwise every Contender is
    // tried and none is recorded.
    if (!s.replay && requireReplay) {
      return c.json({ error: 'replay-required' }, 422);
    }
    if (s.replay) {
      const inputs = decodeReplayLog(s.replay.log);
      if (!inputs) return c.json({ error: 'bad-replay' }, 422);
      if (s.replay.rallySaturday && !rallySaturdayPlausible(now())) {
        log_replay(user.id, s.stateId, 'rally-clock');
        return c.json({ error: 'replay-mismatch', reason: 'rally-clock' }, 422);
      }
      const verdict = verifyReplay(
        simConfig,
        {
          seed: s.replay.seed,
          log: inputs,
          stateId: s.stateId,
          rideId: s.rideId,
          upgrades: s.replay.upgrades,
          rallySaturday: s.replay.rallySaturday,
          contenderId,
        },
        { crowd: s.crowd, delivered: s.delivered, dents: s.dents, integrity: s.integrity },
      );
      if (!verdict.ok) {
        log_replay(user.id, s.stateId, verdict.reason);
        return c.json({ error: 'replay-mismatch', reason: verdict.reason }, 422);
      }
    }

    // One row per played run: a replay is a receipt, and the same one posted
    // twice would count twice toward a Contender's standing.
    const { rows } = await database.query<{ id: string; created_at: Date }>(
      `insert into scores (user_id, state_id, crowd, delivered, dents, integrity, capacity, ride_id, contender_id, replay_seed)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       on conflict (user_id, replay_seed) where replay_seed is not null do nothing
       returning id, created_at`,
      [user.id, s.stateId, s.crowd, s.delivered, s.dents, s.integrity, s.capacity, s.rideId, contenderId, s.replay?.seed ?? null],
    );
    if (rows.length === 0) return c.json({ error: 'duplicate' }, 409);
    return c.json({ id: rows[0]!.id, storedContender: contenderId != null, verified: s.replay != null }, 201);
  });

  app.get('/api/scores/mine', requireUser, async (c) => {
    const user = c.get('user');
    const { rows } = await database.query<{ state_id: string; crowd: number; runs: string }>(
      'select state_id, max(crowd) as crowd, count(*)::bigint as runs from scores where user_id = $1 group by state_id',
      [user.id],
    );
    const best: Record<string, { crowd: number; runs: number }> = {};
    for (const r of rows) best[r.state_id] = { crowd: r.crowd, runs: Number(r.runs) };
    return c.json({ best });
  });

  // -- public boards -------------------------------------------------------

  app.get('/api/board/:stateId', async (c) => {
    const stateId = c.req.param('stateId');
    // `Number.isFinite` let `limit=1e9` through, and the clamp lived one call
    // deeper where nothing said it had to stay.
    const asked = Number(c.req.query('limit') ?? 20);
    const limit = Number.isFinite(asked) ? Math.min(Math.max(Math.trunc(asked), 1), LIMITS.boardMaxRows) : 20;
    return c.json({ stateId, rows: await regionBoard(database, stateId, limit) });
  });

  app.get('/api/standings', async (c) => {
    return c.json({ floor: MIN_PLAYERS_PER_REGION, regions: await liveStandings(database) });
  });

  // -- anonymous counters, the weekly tally and state corrections (C78) ----

  /**
   * Counters only: no cookie, no user, no body beyond event names and a state. Credentials are not
   * read, so a page on any allowed origin can send them with `credentials: 'omit'`.
   */
  app.post('/api/events', rateLimit('events', LIMITS.eventsPerMinutePerIp, MINUTE), async (c) => {
    const parsed = eventsSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const tally = new Map<string, { name: string; state: string; n: number }>();
    for (const e of parsed.data.events) {
      const key = `${e.name}|${e.state ?? ''}`;
      const row = tally.get(key) ?? { name: e.name, state: e.state ?? '', n: 0 };
      row.n += 1;
      tally.set(key, row);
    }
    for (const row of tally.values()) {
      await database.query(
        `insert into event_counts (day, name, state_id, n)
         values ((now() at time zone 'utc')::date, $1, $2, $3)
         on conflict (day, name, state_id) do update set n = event_counts.n + excluded.n`,
        [row.name, row.state, row.n],
      );
    }
    return c.body(null, 204);
  });

  /**
   * The busiest roads this week: finished rallies per state, counts only, no ranking by party and no
   * percentages. Hidden until the whole game has `minTotalRallies` in the window, so a handful of
   * test runs never reads as a result.
   */
  app.get('/api/tally', async (c) => {
    const { windowDays, minTotalRallies, topStates } = limits.tally;
    const { rows } = await database.query<{ state_id: string; n: string }>(
      `select state_id, sum(n)::bigint as n from event_counts
        where name = 'run_finish' and state_id <> '' and day > (now() at time zone 'utc')::date - $1::int
        group by state_id order by sum(n) desc, state_id`,
      [windowDays],
    );
    const total = rows.reduce((a, r) => a + Number(r.n), 0);
    c.header('cache-control', 'public, max-age=300');
    if (total < minTotalRallies) return c.json({ windowDays, hidden: true });
    return c.json({
      windowDays,
      hidden: false,
      total,
      busiest: rows.slice(0, topStates).map((r) => ({ stateId: r.state_id, rallies: Number(r.n) })),
    });
  });

  /** "Is this your state?" corrections. Anonymous: the reviewer list needs the note, not the writer. */
  app.post('/api/feedback/state', rateLimit('feedback', LIMITS.feedbackPerDayPerIp, 24 * 60 * MINUTE), async (c) => {
    const parsed = feedbackSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const f = parsed.data;
    await database.query(
      'insert into state_feedback (state_id, landmark, topic, note, from_here) values ($1, $2, $3, $4, $5)',
      [f.stateId, f.landmark, f.topic, f.note, f.fromHere],
    );
    return c.body(null, 201);
  });

  // -- account -------------------------------------------------------------

  app.get('/api/account/export', requireUser, async (c) => {
    const user = c.get('user');
    const { rows } = await database.query(
      'select state_id, crowd, delivered, dents, integrity, capacity, ride_id, contender_id, created_at from scores where user_id = $1 order by created_at',
      [user.id],
    );
    return c.json({ user: { email: user.email, username: user.username }, scores: rows });
  });

  app.delete('/api/account', requireUser, async (c) => {
    const user = c.get('user');
    // Sessions and scores cascade from users, so this is a real delete.
    await database.query('delete from users where id = $1', [user.id]);
    deleteCookie(c, SESSION_COOKIE, { path: '/' });
    return c.json({ deleted: true });
  });

  app.onError((err, c) => {
    if (err instanceof z.ZodError) return c.json({ error: 'invalid' }, 400);
    const requestId = c.get('requestId');
    log('error', 'unhandled', {
      requestId,
      path: c.req.path,
      method: c.req.method,
      message: (err as Error).message,
      stack: (err as Error).stack,
    });
    // The id goes back so a player can quote it and it can be found in the log.
    return c.json({ error: 'server', requestId }, 500);
  });

  return app;
}
