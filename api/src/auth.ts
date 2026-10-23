import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Db } from './db.ts';

const scrypt = promisify(scryptCb) as (p: string, s: string, k: number) => Promise<Buffer>;

const KEY_LEN = 64;
export const SESSION_DAYS = 30;
export const SESSION_COOKIE = 'cr_session';

/**
 * scrypt from node:crypto rather than a bcrypt/argon2 dependency: it is memory-hard,
 * it ships with the runtime, and it is one less native build in the deploy.
 */
export async function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = (await scrypt(password, salt, KEY_LEN)).toString('hex');
  return { hash, salt };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const candidate = await scrypt(password, salt, KEY_LEN);
  const known = Buffer.from(hash, 'hex');
  // Length must match before timingSafeEqual, which throws on a mismatch.
  if (known.length !== candidate.length) return false;
  return timingSafeEqual(known, candidate);
}

/** The raw token goes to the player's cookie; only this hash is ever stored. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export interface SessionUser {
  id: string;
  /** Null on a name-only account (C42): there is no address on it yet. */
  email: string | null;
  username: string;
  contenderConsentAt: Date | null;
  emailVerifiedAt: Date | null;
  /** When this account may next be asked for an email; null means "any time". */
  emailPromptAfter: Date | null;
}

export async function createSession(database: Db, userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await database.query('insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)', [
    hashToken(token),
    userId,
    expiresAt,
  ]);
  return { token, expiresAt };
}

export async function userForToken(database: Db, token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const { rows } = await database.query<{
    id: string;
    email: string | null;
    username: string;
    contender_consent_at: Date | null;
    email_verified_at: Date | null;
    email_prompt_after: Date | null;
  }>(
    `select u.id, u.email, u.username, u.contender_consent_at, u.email_verified_at, u.email_prompt_after
       from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    contenderConsentAt: row.contender_consent_at,
    emailVerifiedAt: row.email_verified_at,
    emailPromptAfter: row.email_prompt_after,
  };
}

export async function destroySession(database: Db, token: string | undefined): Promise<void> {
  if (!token) return;
  await database.query('delete from sessions where token_hash = $1', [hashToken(token)]);
}

export async function purgeExpiredSessions(database: Db): Promise<void> {
  await database.query('delete from sessions where expires_at <= now()');
}

// -- C41: email tokens, and a lockout that follows the account --------------

export type TokenKind = 'verify' | 'reset';

/**
 * Mints a one-time link token. Only the SHA-256 is stored, exactly like a
 * session token: a database dump must not hand over working reset links.
 */
export async function createEmailToken(
  database: Db,
  userId: string,
  kind: TokenKind,
  ttlMs: number,
): Promise<string> {
  const token = newSessionToken();
  // One live link per kind: asking for a second reset email invalidates the
  // first, so an old message in an inbox cannot be replayed later.
  await database.query('delete from email_tokens where user_id = $1 and kind = $2', [userId, kind]);
  await database.query(
    'insert into email_tokens (token_hash, user_id, kind, expires_at) values ($1, $2, $3, $4)',
    [hashToken(token), userId, kind, new Date(Date.now() + ttlMs)],
  );
  return token;
}

/**
 * Spends a token and returns whose it was, or null.
 *
 * The `used_at is null` test and the write are one statement so two requests
 * racing the same link cannot both win.
 */
export async function consumeEmailToken(database: Db, token: string, kind: TokenKind): Promise<string | null> {
  const { rows } = await database.query<{ user_id: string }>(
    `update email_tokens set used_at = now()
      where token_hash = $1 and kind = $2 and used_at is null and expires_at > now()
      returning user_id`,
    [hashToken(token), kind],
  );
  return rows[0]?.user_id ?? null;
}

/** Signs every device out. Used after a password change or reset. */
export async function destroyAllSessions(database: Db, userId: string): Promise<void> {
  await database.query('delete from sessions where user_id = $1', [userId]);
}

/**
 * Seconds remaining on an address's lockout, or 0.
 *
 * Keyed on the address rather than the caller's IP, because an IP is free to
 * change and the account under attack is not. Unknown addresses are counted
 * too — if they were not, a lockout response would itself say which addresses
 * have accounts.
 */
export async function lockoutSeconds(database: Db, email: string): Promise<number> {
  const { rows } = await database.query<{ secs: string }>(
    `select ceil(extract(epoch from (locked_until - now())))::bigint as secs
       from login_throttle where email = $1 and locked_until > now()`,
    [email],
  );
  return Number(rows[0]?.secs ?? 0);
}

export async function noteLoginFailure(
  database: Db,
  email: string,
  maxFailures: number,
  lockoutMinutes: number,
): Promise<void> {
  const { rows } = await database.query<{ failures: number }>(
    `insert into login_throttle (email, failures, last_failed_at) values ($1, 1, now())
     on conflict (email) do update set failures = login_throttle.failures + 1, last_failed_at = now()
     returning failures`,
    [email],
  );
  if ((rows[0]?.failures ?? 0) >= maxFailures) {
    // Counter back to zero alongside the lock, so the wait buys a fresh budget
    // rather than one attempt per lockout window forever.
    await database.query(
      'update login_throttle set locked_until = now() + make_interval(mins => $2::int), failures = 0 where email = $1',
      [email, lockoutMinutes],
    );
  }
}

export async function clearLoginFailures(database: Db, email: string): Promise<void> {
  await database.query('delete from login_throttle where email = $1', [email]);
}

// -- C42: device keys -------------------------------------------------------

/**
 * The only credential a name-only account has.
 *
 * It is a bearer token like a session, with two differences: it does not
 * expire, and it is readable by the page's own JavaScript, because the device
 * has to be able to present it after the session cookie lapses. That is a
 * weaker position than a password — which is the argument the UI makes for
 * adding an email, not something to hide. What is *not* weaker is storage:
 * only the SHA-256 is kept here, so a database dump hands over no live keys.
 */
export function newDeviceKey(): string {
  return randomBytes(32).toString('base64url');
}

export async function createDeviceKey(database: Db, userId: string): Promise<string> {
  const key = newDeviceKey();
  await database.query('insert into device_keys (key_hash, user_id) values ($1, $2)', [hashToken(key), userId]);
  return key;
}

/** Resolves a device key to its account and notes the visit, or returns null. */
export async function userIdForDeviceKey(database: Db, key: string): Promise<string | null> {
  const { rows } = await database.query<{ user_id: string }>(
    'update device_keys set last_used_at = now() where key_hash = $1 returning user_id',
    [hashToken(key)],
  );
  return rows[0]?.user_id ?? null;
}
