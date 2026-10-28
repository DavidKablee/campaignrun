import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pg from 'pg';
import { createApp } from '../src/app';
import { migrate } from '../src/migrate';
import { memoryMailer } from '../src/mailer';
import { resetRateLimits } from '../src/rateLimit';
import type { Db } from '../src/db';
import { limits, rides, simConfig } from '@cr/content';
import { maxCrowdFor } from '@cr/sim';
import { play } from './replayHarness';

const LOCKOUT_AFTER = limits.auth.loginFailuresBeforeLockout;
const SCORES_PER_MIN = limits.scores.perMinutePerUser;

/**
 * Runs against a real Postgres, because the things worth testing here are the
 * things a fake would paper over: the unique constraints, the cascade on
 * delete, and the standings aggregation. Set DATABASE_URL to run it; `pnpm
 * verify` skips it otherwise so the suite does not need a database to pass.
 */
const url = process.env.DATABASE_URL;
const run = url ? describe : describe.skip;

run('api', () => {
  let pool: pg.Pool;
  let database: Db;
  let app: ReturnType<typeof createApp>;
  let mail: ReturnType<typeof memoryMailer>;

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: url });
    database = pool;
    await migrate(database);
    mail = memoryMailer();
    // These tests post hand-written scores, which have no replay to attach; the
    // replay check has its own file (replay.test.ts) with it switched on.
    app = createApp(database, mail, { requireReplay: false });
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await database.query('truncate users cascade');
    // Not a child of `users`, so the cascade above does not reach it.
    await database.query('truncate login_throttle');
    // The limiter is process memory shared by every test in this file.
    resetRateLimits();
    mail.sent.length = 0;
  });

  /** The last link of a kind that was mailed, as the player would receive it. */
  function linkToken(kind: 'verify' | 'reset'): string {
    const param = kind === 'verify' ? 'verify' : 'reset';
    for (let i = mail.sent.length - 1; i >= 0; i--) {
      const found = new RegExp(`[?&]${param}=([^\\s]+)`).exec(mail.sent[i]!.text);
      if (found) return decodeURIComponent(found[1]!);
    }
    throw new Error(`no ${kind} link was sent`);
  }

  /** Walks a signed-up account through the real verification link. */
  async function verify(): Promise<void> {
    const res = await json('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token: linkToken('verify') }),
    });
    expect(res.status).toBe(200);
  }

  const json = (path: string, init: RequestInit = {}) =>
    app.request(path, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    });

  /** A name-only account, as the client makes one. */
  async function guest(username = 'namer') {
    const res = await json('/api/auth/guest', { method: 'POST', body: JSON.stringify({ username }) });
    const cookie = res.headers.get('set-cookie') ?? '';
    const body = res.status === 201 ? ((await res.clone().json()) as { deviceKey: string }) : { deviceKey: '' };
    return { res, cookie: cookie.split(';')[0]!, deviceKey: body.deviceKey };
  }

  async function signup(email = 'a@example.com', username = 'runner') {
    const res = await json('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'a-long-enough-password', username }),
    });
    const cookie = res.headers.get('set-cookie') ?? '';
    return { res, cookie: cookie.split(';')[0]! };
  }

  describe('signup and login', () => {
    it('creates an account and returns a session cookie', async () => {
      const { res, cookie } = await signup();
      expect(res.status).toBe(201);
      expect(cookie).toMatch(/^cr_session=/);
      const body = (await res.json()) as { user: { username: string; shareContender: boolean } };
      expect(body.user.username).toBe('runner');
      expect(body.user.shareContender).toBe(false);
    });

    it('sets the session cookie httpOnly', async () => {
      const { res } = await signup();
      expect(res.headers.get('set-cookie')).toMatch(/HttpOnly/i);
    });

    it('refuses a duplicate email and says which field', async () => {
      await signup('dup@example.com', 'one');
      const res = await json('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: 'dup@example.com', password: 'a-long-enough-password', username: 'two' }),
      });
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: 'taken', field: 'email' });
    });

    it('treats an email as case-insensitive', async () => {
      await signup('Mixed@Example.com', 'one');
      const res = await json('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: 'mixed@example.com', password: 'a-long-enough-password', username: 'two' }),
      });
      expect(res.status).toBe(409);
    });

    it('logs in with the right password and not the wrong one', async () => {
      await signup('log@example.com', 'loguser');
      const good = await json('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'log@example.com', password: 'a-long-enough-password' }),
      });
      expect(good.status).toBe(200);
      const bad = await json('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'log@example.com', password: 'wrong-password-here' }),
      });
      expect(bad.status).toBe(401);
    });

    it('does not reveal whether an address has an account', async () => {
      await signup('known@example.com', 'known');
      const a = await json('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'known@example.com', password: 'wrong-password-here' }),
      });
      const b = await json('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'nobody@example.com', password: 'wrong-password-here' }),
      });
      expect(a.status).toBe(b.status);
      expect(await a.json()).toEqual(await b.json());
    });

    it('rejects an unauthenticated call to a private route', async () => {
      expect((await json('/api/auth/me')).status).toBe(401);
      expect((await json('/api/scores', { method: 'POST', body: '{}' })).status).toBe(401);
    });

    it('invalidates the session on logout', async () => {
      const { cookie } = await signup();
      expect((await json('/api/auth/me', { headers: { cookie } })).status).toBe(200);
      await json('/api/auth/logout', { method: 'POST', headers: { cookie } });
      expect((await json('/api/auth/me', { headers: { cookie } })).status).toBe(401);
    });
  });

  describe('scores', () => {
    it('stores a run and reads it back as a personal best', async () => {
      const { cookie } = await signup();
      await json('/api/scores', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ stateId: 'lagos', crowd: 31, rideId: 'trek', delivered: 4 }),
      });
      await json('/api/scores', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ stateId: 'lagos', crowd: 44, rideId: 'trek' }),
      });
      const res = await json('/api/scores/mine', { headers: { cookie } });
      expect(await res.json()).toEqual({ best: { lagos: { crowd: 44, runs: 2 } } });
    });

    /** Guardrail 10, enforced by the server and not only by the client. */
    it('drops a Contender id from a player who has not consented', async () => {
      const { cookie } = await signup();
      const res = await json('/api/scores', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ stateId: 'lagos', crowd: 20, rideId: 'trek', contenderId: 'sister-beacon' }),
      });
      expect(await res.json()).toMatchObject({ storedContender: false });
      const { rows } = await database.query<{ contender_id: string | null }>('select contender_id from scores');
      expect(rows[0]!.contender_id).toBeNull();
    });

    it('keeps the Contender id once the player has consented', async () => {
      const { cookie } = await signup();
      await json('/api/auth/consent', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ shareContender: true, legalVersion: '2026-10-01' }),
      });
      const res = await json('/api/scores', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ stateId: 'lagos', crowd: 20, rideId: 'trek', contenderId: 'sister-beacon' }),
      });
      expect(await res.json()).toMatchObject({ storedContender: true });
    });

    it('erases shared Contender ids when consent is withdrawn', async () => {
      const { cookie } = await signup();
      const consent = (shareContender: boolean) =>
        json('/api/auth/consent', {
          method: 'POST',
          headers: { cookie },
          body: JSON.stringify({ shareContender, legalVersion: '2026-10-01' }),
        });
      await consent(true);
      await json('/api/scores', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ stateId: 'lagos', crowd: 20, rideId: 'trek', contenderId: 'sister-beacon' }),
      });
      await consent(false);
      const { rows } = await database.query<{ contender_id: string | null }>('select contender_id from scores');
      expect(rows.every((r) => r.contender_id === null)).toBe(true);
    });

    it('rejects a state the content pack does not define', async () => {
      const { cookie } = await signup();
      const res = await json('/api/scores', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ stateId: 'atlantis', crowd: 20, rideId: 'trek' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('boards and standings', () => {
    async function player(n: number, contenderId: string, crowd: number, stateId = 'lagos') {
      const { cookie } = await signup(`p${n}@example.com`, `player${n}`);
      await verify();
      await json('/api/auth/consent', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ shareContender: true, legalVersion: '2026-10-01' }),
      });
      await json('/api/scores', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ stateId, crowd, rideId: 'trek', contenderId }),
      });
      return cookie;
    }

    it('ranks a region board by each player best, one row per player', async () => {
      await player(1, 'sister-beacon', 10);
      await player(2, 'captain-kobo', 50);
      const c3 = await player(3, 'uncle-boombox', 20);
      await json('/api/scores', {
        method: 'POST',
        headers: { cookie: c3 },
        body: JSON.stringify({ stateId: 'lagos', crowd: 5, rideId: 'trek' }),
      });
      const body = (await (await json('/api/board/lagos')).json()) as { rows: { username: string; crowd: number }[] };
      expect(body.rows.map((r) => r.crowd)).toEqual([50, 20, 10]);
      expect(new Set(body.rows.map((r) => r.username)).size).toBe(3);
    });

    it('withholds the party breakdown while a region is under the floor', async () => {
      await player(1, 'sister-beacon', 10);
      await player(2, 'captain-kobo', 50);
      const body = (await (await json('/api/standings')).json()) as {
        floor: number;
        regions: { stateId: string; players: number; published: boolean; tallies: unknown[] }[];
      };
      const lagos = body.regions.find((r) => r.stateId === 'lagos')!;
      expect(lagos.players).toBe(2);
      expect(lagos.published).toBe(false);
      expect(lagos.tallies).toEqual([]);
    });
  });

  describe('C41: rate limits and lockout', () => {
    it('locks an address out after repeated failures, whatever the address', async () => {
      await signup('target@example.com', 'target');
      const attempt = (email: string) =>
        json('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password: 'not-the-password' }) });

      let last = await attempt('target@example.com');
      for (let i = 1; i < LOCKOUT_AFTER; i++) last = await attempt('target@example.com');
      expect(last.status).toBe(401);

      // The next one is refused before the password is even looked at.
      const locked = await attempt('target@example.com');
      expect(locked.status).toBe(429);
      expect(await locked.json()).toMatchObject({ error: 'locked-out' });
      expect(Number(locked.headers.get('retry-after'))).toBeGreaterThan(0);

      // And the right password does not get through while it holds: a lockout
      // that an attacker can end by guessing correctly is not a lockout.
      const good = await json('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'target@example.com', password: 'a-long-enough-password' }),
      });
      expect(good.status).toBe(429);
    });

    it('locks out an address that has no account, so the response is not an oracle', async () => {
      const attempt = () =>
        json('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'ghost@example.com', password: 'not-the-password' }),
        });
      for (let i = 0; i < LOCKOUT_AFTER; i++) await attempt();
      expect((await attempt()).status).toBe(429);
    });

    it('clears the failure count on a successful login', async () => {
      await signup('clears@example.com', 'clears');
      for (let i = 0; i < LOCKOUT_AFTER - 1; i++) {
        await json('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'clears@example.com', password: 'wrong-password-here' }),
        });
      }
      const good = await json('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'clears@example.com', password: 'a-long-enough-password' }),
      });
      expect(good.status).toBe(200);
      const { rows } = await database.query('select * from login_throttle');
      expect(rows).toHaveLength(0);
    });

    it('caps score posts per account', async () => {
      const { cookie } = await signup();
      const post = () =>
        json('/api/scores', {
          method: 'POST',
          headers: { cookie },
          body: JSON.stringify({ stateId: 'lagos', crowd: 10, delivered: 4, capacity: 8, rideId: 'trek' }),
        });
      for (let i = 0; i < SCORES_PER_MIN; i++) expect((await post()).status).toBe(201);
      const over = await post();
      expect(over.status).toBe(429);
      expect(over.headers.get('retry-after')).toBeTruthy();
    });
  });

  describe('C41: email verification', () => {
    it('signs a player in unverified and mails them a link', async () => {
      const { res } = await signup('new@example.com', 'newbie');
      const body = (await res.json()) as { user: { emailVerified: boolean } };
      expect(body.user.emailVerified).toBe(false);
      expect(mail.sent.at(-1)!.to).toBe('new@example.com');
      expect(mail.sent.at(-1)!.text).toContain('verify=');
    });

    it('verifies once and only once', async () => {
      const { cookie } = await signup();
      const token = linkToken('verify');
      const first = await json('/api/auth/verify', { method: 'POST', body: JSON.stringify({ token }) });
      expect(first.status).toBe(200);
      const me = (await (await json('/api/auth/me', { headers: { cookie } })).json()) as {
        user: { emailVerified: boolean };
      };
      expect(me.user.emailVerified).toBe(true);

      const replay = await json('/api/auth/verify', { method: 'POST', body: JSON.stringify({ token }) });
      expect(replay.status).toBe(400);
    });

    it('refuses an expired link', async () => {
      await signup();
      const token = linkToken('verify');
      await database.query("update email_tokens set expires_at = now() - interval '1 minute'");
      expect((await json('/api/auth/verify', { method: 'POST', body: JSON.stringify({ token }) })).status).toBe(400);
    });

    it('keeps unverified players off the public board and out of the standings', async () => {
      // The privacy floor is counted in players; if unverified accounts counted,
      // scripting past it would publish other people's Contender choices.
      const { cookie } = await signup('unver@example.com', 'unver');
      await json('/api/auth/consent', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ shareContender: true, legalVersion: '2026-10-01' }),
      });
      await json('/api/scores', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ stateId: 'lagos', crowd: 40, delivered: 10, capacity: 8, rideId: 'trek', contenderId: 'sister-beacon' }),
      });

      const board = (await (await json('/api/board/lagos')).json()) as { rows: unknown[] };
      expect(board.rows).toEqual([]);
      const standings = (await (await json('/api/standings')).json()) as {
        regions: { stateId: string; players: number }[];
      };
      expect(standings.regions.find((r) => r.stateId === 'lagos')).toBeUndefined();

      // Same player, same score, after confirming the address.
      await verify();
      const after = (await (await json('/api/board/lagos')).json()) as { rows: { username: string }[] };
      expect(after.rows.map((r) => r.username)).toEqual(['unver']);
    });
  });

  describe('C41: password reset', () => {
    it('answers the same way whether or not the address has an account', async () => {
      await signup('real@example.com', 'realone');
      const known = await json('/api/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: 'real@example.com' }),
      });
      const unknown = await json('/api/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: 'nobody@example.com' }),
      });
      expect(known.status).toBe(unknown.status);
      expect(await known.json()).toEqual(await unknown.json());
      // Only the real address was mailed, though.
      expect(mail.sent.map((m) => m.to)).toEqual(['real@example.com', 'real@example.com']);
    });

    it('resets the password, signs every other device out, and works once', async () => {
      const { cookie: oldCookie } = await signup('reset@example.com', 'resetter');
      expect((await json('/api/auth/me', { headers: { cookie: oldCookie } })).status).toBe(200);

      await json('/api/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: 'reset@example.com' }),
      });
      const token = linkToken('reset');
      const res = await json('/api/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token, password: 'a-brand-new-password' }),
      });
      expect(res.status).toBe(200);

      // The session that existed before the reset is gone — that is the point
      // of a reset when someone else may be holding the old password.
      expect((await json('/api/auth/me', { headers: { cookie: oldCookie } })).status).toBe(401);

      const old = await json('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'reset@example.com', password: 'a-long-enough-password' }),
      });
      expect(old.status).toBe(401);
      const fresh = await json('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'reset@example.com', password: 'a-brand-new-password' }),
      });
      expect(fresh.status).toBe(200);

      const replay = await json('/api/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token, password: 'a-third-password-here' }),
      });
      expect(replay.status).toBe(400);
    });

    it('lets a locked-out player back in by resetting', async () => {
      await signup('stuck@example.com', 'stuck');
      for (let i = 0; i <= LOCKOUT_AFTER; i++) {
        await json('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'stuck@example.com', password: 'wrong-password-here' }),
        });
      }
      await json('/api/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email: 'stuck@example.com' }) });
      await json('/api/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token: linkToken('reset'), password: 'a-brand-new-password' }),
      });
      const login = await json('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'stuck@example.com', password: 'a-brand-new-password' }),
      });
      expect(login.status).toBe(200);
    });

    it('asking again invalidates the earlier link', async () => {
      await signup('two@example.com', 'twolinks');
      const forgot = () =>
        json('/api/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email: 'two@example.com' }) });
      await forgot();
      const first = linkToken('reset');
      await forgot();
      const second = linkToken('reset');
      expect(second).not.toBe(first);
      expect(
        (
          await json('/api/auth/password/reset', {
            method: 'POST',
            body: JSON.stringify({ token: first, password: 'a-brand-new-password' }),
          })
        ).status,
      ).toBe(400);
    });

    it('changes a password with the current one, and refuses without it', async () => {
      const { cookie } = await signup('chg@example.com', 'changer');
      const bad = await json('/api/auth/password/change', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ current: 'wrong-password-here', next: 'a-brand-new-password' }),
      });
      expect(bad.status).toBe(401);
      const good = await json('/api/auth/password/change', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ current: 'a-long-enough-password', next: 'a-brand-new-password' }),
      });
      expect(good.status).toBe(200);
      expect(
        (
          await json('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'chg@example.com', password: 'a-brand-new-password' }),
          })
        ).status,
      ).toBe(200);
    });
  });

  describe('C41: a score has to be one the game could produce', () => {
    const run = (cookie: string, body: Record<string, unknown>) =>
      json('/api/scores', { method: 'POST', headers: { cookie }, body: JSON.stringify(body) });

    it('rejects a Crowd no number of deliveries could earn', async () => {
      const { cookie } = await signup();
      const res = await run(cookie, { stateId: 'lagos', crowd: 99_000, delivered: 4, capacity: 8, rideId: 'trek' });
      expect(res.status).toBe(422);
      expect(await res.json()).toMatchObject({ error: 'implausible', reason: 'crowd' });
      const { rows } = await database.query('select * from scores');
      expect(rows).toHaveLength(0);
    });

    it('rejects more deliveries than the ride could carry', async () => {
      const { cookie } = await signup();
      const res = await run(cookie, { stateId: 'lagos', crowd: 10, delivered: 9_000, capacity: 8, rideId: 'trek' });
      expect(res.status).toBe(422);
    });

    it('ignores a capacity the request made up', async () => {
      // Trek carries 4. Claiming 200 used to buy a proportionally larger
      // delivered/crowd allowance, because the bound read the request.
      const { cookie } = await signup();
      const res = await run(cookie, { stateId: 'lagos', crowd: 10, delivered: 500, capacity: 200, rideId: 'trek' });
      expect(res.status).toBe(422);
    });

    it('accepts the best run the simulation can actually produce', async () => {
      // Every multiplier at once: momentum, Full House, On Beat, PVC, Rally
      // Saturday and the signature-ride bonus. The pre-C41 bound knew about the
      // first three only, so this run would have been refused.
      const { cookie } = await signup();
      const coaster = rides.find((r) => r.id === 'coaster')!;
      const delivered = coaster.capacity * (simConfig.course.segmentCount + 2);
      const res = await run(cookie, {
        stateId: 'lagos',
        crowd: Math.floor(maxCrowdFor(delivered, simConfig) * 0.95),
        delivered,
        capacity: coaster.capacity,
        rideId: 'coaster',
      });
      expect(res.status).toBe(201);
    });
  });

  describe('C41: public board limits', () => {
    it('clamps an absurd limit instead of handing over the table', async () => {
      const res = await json('/api/board/lagos?limit=1000000');
      expect(res.status).toBe(200);
      expect(((await res.json()) as { rows: unknown[] }).rows.length).toBeLessThanOrEqual(limits.board.maxRows);
    });

    it('survives a limit that is not a number', async () => {
      expect((await json('/api/board/lagos?limit=drop-table')).status).toBe(200);
    });
  });

  describe('account', () => {
    it('exports a player own scores', async () => {
      const { cookie } = await signup();
      await json('/api/scores', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ stateId: 'kano', crowd: 12, rideId: 'trek' }),
      });
      const body = (await (await json('/api/account/export', { headers: { cookie } })).json()) as {
        user: { email: string };
        scores: unknown[];
      };
      expect(body.user.email).toBe('a@example.com');
      expect(body.scores).toHaveLength(1);
    });

    it('deletes the account and every score and session with it', async () => {
      const { cookie } = await signup();
      await json('/api/scores', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ stateId: 'kano', crowd: 12, rideId: 'trek' }),
      });
      const res = await json('/api/account', { method: 'DELETE', headers: { cookie } });
      expect(res.status).toBe(200);
      for (const table of ['users', 'scores', 'sessions']) {
        const { rows } = await database.query<{ n: string }>(`select count(*)::bigint as n from ${table}`);
        expect(Number(rows[0]!.n), table).toBe(0);
      }
      expect((await json('/api/auth/me', { headers: { cookie } })).status).toBe(401);
    });
  });
  // -- C42 -----------------------------------------------------------------

  describe('name-only accounts', () => {
    it('creates an account from a name alone and signs it in', async () => {
      const { res, cookie, deviceKey } = await guest();
      expect(res.status).toBe(201);
      expect(cookie).toMatch(/^cr_session=/);
      expect(deviceKey.length).toBeGreaterThan(20);
      const body = (await res.json()) as { user: { email: string | null; hasPassword: boolean; username: string } };
      expect(body.user.email).toBeNull();
      expect(body.user.hasPassword).toBe(false);
      expect(body.user.username).toBe('namer');
      expect((await json('/api/auth/me', { headers: { cookie } })).status).toBe(200);
    });

    it('shares the board-name namespace with real signups', async () => {
      await signup('taken@example.com', 'samename');
      const { res } = await guest('samename');
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: 'taken', field: 'username' });
    });

    it('trades a device key for a new session once the cookie is gone', async () => {
      const { deviceKey } = await guest();
      // No cookie at all, which is a returning player on day 31.
      const res = await json('/api/auth/device', { method: 'POST', body: JSON.stringify({ deviceKey }) });
      expect(res.status).toBe(200);
      expect(res.headers.get('set-cookie')).toMatch(/^cr_session=/);
      const body = (await res.json()) as { user: { username: string } };
      expect(body.user.username).toBe('namer');
    });

    it('refuses an unknown device key', async () => {
      const res = await json('/api/auth/device', {
        method: 'POST',
        body: JSON.stringify({ deviceKey: 'x'.repeat(43) }),
      });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'bad-device-key' });
    });

    it('keeps the key working across the same account, and drops it with the account', async () => {
      const { cookie, deviceKey } = await guest();
      await json('/api/account', { method: 'DELETE', headers: { cookie } });
      const res = await json('/api/auth/device', { method: 'POST', body: JSON.stringify({ deviceKey }) });
      expect(res.status).toBe(401);
      const { rows } = await database.query<{ n: string }>('select count(*)::bigint as n from device_keys');
      expect(Number(rows[0]!.n)).toBe(0);
    });

    it('saves runs for a name-only account but keeps them off the public board', async () => {
      const { cookie } = await guest();
      const post = await json('/api/scores', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ stateId: 'lagos', crowd: 500, rideId: 'trek' }),
      });
      expect(post.status).toBe(201);
      const mine = (await (await json('/api/scores/mine', { headers: { cookie } })).json()) as {
        best: Record<string, { crowd: number }>;
      };
      expect(mine.best.lagos!.crowd).toBe(500);
      // No confirmed address, so nothing public: the privacy floor would be a
      // formality if an account this cheap counted towards it.
      const board = (await (await json('/api/board/lagos')).json()) as { rows: unknown[] };
      expect(board.rows).toEqual([]);
    });

    it('has no password to change and no address to confirm', async () => {
      const { cookie } = await guest();
      const change = await json('/api/auth/password/change', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ current: 'whatever-it-is', next: 'a-long-enough-password' }),
      });
      expect(change.status).toBe(409);
      expect(await change.json()).toEqual({ error: 'no-password' });
      const resend = await json('/api/auth/verify/request', { method: 'POST', headers: { cookie } });
      expect(resend.status).toBe(409);
      expect(await resend.json()).toEqual({ error: 'no-email' });
    });
  });

  describe('attaching an email', () => {
    it('adds an address and a password, mails the link, and allows a real login', async () => {
      const { cookie } = await guest();
      const res = await json('/api/auth/email/attach', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ email: 'Grew@Example.com', password: 'a-long-enough-password' }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { user: { email: string; hasPassword: boolean; emailVerified: boolean } };
      expect(body.user.email).toBe('grew@example.com');
      expect(body.user.hasPassword).toBe(true);
      // Unverified like any other new address, so the boards still wait.
      expect(body.user.emailVerified).toBe(false);
      expect(mail.sent.at(-1)!.to).toBe('grew@example.com');

      // The whole point: this account can now be reached from another device.
      const login = await json('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'grew@example.com', password: 'a-long-enough-password' }),
      });
      expect(login.status).toBe(200);
    });

    it('puts the attached account on the public board once confirmed', async () => {
      const { cookie } = await guest();
      // Within the plausibility ceiling for a run that delivered nothing, which
      // is what the server measures the claim against.
      const post = await json('/api/scores', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ stateId: 'lagos', crowd: 500, rideId: 'trek' }),
      });
      expect(post.status).toBe(201);
      await json('/api/auth/email/attach', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ email: 'later@example.com', password: 'a-long-enough-password' }),
      });
      await verify();
      const board = (await (await json('/api/board/lagos')).json()) as { rows: { crowd: number }[] };
      expect(board.rows.map((r) => r.crowd)).toEqual([500]);
    });

    it('refuses an address that already has an account', async () => {
      await signup('mine@example.com', 'owner');
      const { cookie } = await guest();
      const res = await json('/api/auth/email/attach', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ email: 'mine@example.com', password: 'a-long-enough-password' }),
      });
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: 'taken', field: 'email' });
    });

    it('refuses to overwrite an address that is already there', async () => {
      const { cookie } = await signup('has@example.com', 'hasone');
      const res = await json('/api/auth/email/attach', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ email: 'other@example.com', password: 'a-long-enough-password' }),
      });
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: 'has-email' });
    });

    it('rejects a password under the minimum', async () => {
      const { cookie } = await guest();
      const res = await json('/api/auth/email/attach', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ email: 'short@example.com', password: 'short' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('the email prompt', () => {
    it('walks up the snooze ladder and clears when an email arrives', async () => {
      const { cookie } = await guest();
      const first = (await (
        await json('/api/auth/email/snooze', { method: 'POST', headers: { cookie } })
      ).json()) as { emailPromptAfter: string };
      const second = (await (
        await json('/api/auth/email/snooze', { method: 'POST', headers: { cookie } })
      ).json()) as { emailPromptAfter: string };
      // Each "not now" waits longer than the last.
      expect(Date.parse(second.emailPromptAfter)).toBeGreaterThan(Date.parse(first.emailPromptAfter));

      await json('/api/auth/email/attach', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ email: 'done@example.com', password: 'a-long-enough-password' }),
      });
      const me = (await (await json('/api/auth/me', { headers: { cookie } })).json()) as {
        user: { emailPromptAfter: string | null };
      };
      expect(me.user.emailPromptAfter).toBeNull();
    });

    it('is not offered to an account that already has an email', async () => {
      const { cookie } = await signup('full@example.com', 'fulluser');
      const res = await json('/api/auth/email/snooze', { method: 'POST', headers: { cookie } });
      expect(res.status).toBe(409);
    });
  });

  describe('replay verification on POST /api/scores', () => {
    let strict: ReturnType<typeof createApp>;

    beforeAll(() => {
      // The default: replays are required.
      strict = createApp(database, memoryMailer());
    });

    const post = (body: unknown, cookie: string) =>
      strict.request('/api/scores', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify(body),
      });

    async function player(username = 'runner') {
      const res = await strict.request('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: `${username}@example.com`, password: 'a-long-enough-password', username }),
      });
      return (res.headers.get('set-cookie') ?? '').split(';')[0]!;
    }

    it('stores a run that really happened', async () => {
      const cookie = await player();
      const body = play(4321);
      expect(body.crowd).toBeGreaterThan(0);
      const res = await post(body, cookie);
      expect(res.status).toBe(201);
      expect(await res.json()).toMatchObject({ verified: true });
    });

    it('refuses a score with no replay', async () => {
      const cookie = await player();
      const { replay: _drop, ...bare } = play(4321);
      const res = await post(bare, cookie);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual({ error: 'replay-required' });
    });

    it('refuses a score the replay does not produce, even one the plausibility bound would allow', async () => {
      const cookie = await player();
      const body = play(4321);
      const res = await post({ ...body, crowd: body.crowd + 1 }, cookie);
      expect(res.status).toBe(422);
      expect(await res.json()).toMatchObject({ error: 'replay-mismatch', reason: 'mismatch' });
      const { rows } = await database.query('select 1 from scores');
      expect(rows).toHaveLength(0);
    });

    it('refuses a replay played on a different ride', async () => {
      const cookie = await player();
      const body = play(4321, 'danfo');
      expect((await post({ ...body, rideId: 'keke' }, cookie)).status).toBe(422);
    });

    it('refuses a log that is not a log', async () => {
      const cookie = await player();
      const body = play(4321);
      const res = await post({ ...body, replay: { ...body.replay, log: Buffer.from([0x80]).toString('base64') } }, cookie);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual({ error: 'bad-replay' });
    });

    it('refuses a Rally Saturday claim outside the window', async () => {
      const cookie = await player();
      const body = play(4321);
      const res = await post({ ...body, replay: { ...body.replay, rallySaturday: true } }, cookie);
      expect(res.status).toBe(422);
      expect(await res.json()).toMatchObject({ reason: 'rally-clock' });
    });

    it('takes one receipt once', async () => {
      const cookie = await player();
      const body = play(999);
      expect((await post(body, cookie)).status).toBe(201);
      expect((await post(body, cookie)).status).toBe(409);
      const { rows } = await database.query('select 1 from scores');
      expect(rows).toHaveLength(1);
    });

    it('keeps the Contender private without consent, and holds a shared one to the replay', async () => {
      const cookie = await player();
      const body = play(2024, 'danfo', 'captain-kobo');
      // No consent: the server finds the Contender by trying them all and stores nothing.
      const quiet = await post({ ...body, contenderId: 'captain-kobo' }, cookie);
      expect(await quiet.json()).toMatchObject({ storedContender: false, verified: true });

      await strict.request('/api/auth/consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ shareContender: true, legalVersion: 'test' }),
      });
      // Consented: a claimed Contender is checked, so naming someone else fails.
      const other = play(2025, 'danfo', 'captain-kobo');
      expect((await post({ ...other, contenderId: 'mama-ankara' }, cookie)).status).toBe(422);
      expect((await post({ ...other, contenderId: 'captain-kobo' }, cookie)).status).toBe(201);
    });
  });
});
