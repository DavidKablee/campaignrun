import { describe, expect, it } from 'vitest';
import { hashPassword, hashToken, newSessionToken, verifyPassword } from '../src/auth';
import { liveStandings, type LiveRegion } from '../src/standings';
import { consentSchema, loginSchema, scoreSchema, signupSchema } from '../src/validate';
import type { Db } from '../src/db';

describe('passwords', () => {
  it('verifies a correct password and rejects a wrong one', async () => {
    const { hash, salt } = await hashPassword('correct horse battery');
    expect(await verifyPassword('correct horse battery', hash, salt)).toBe(true);
    expect(await verifyPassword('correct horse batterx', hash, salt)).toBe(false);
  });

  it('salts, so the same password hashes differently for two users', async () => {
    const a = await hashPassword('same password here');
    const b = await hashPassword('same password here');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it('does not throw on a malformed stored hash', async () => {
    expect(await verifyPassword('whatever', 'not-hex', 'salt')).toBe(false);
  });
});

describe('session tokens', () => {
  it('never stores the raw token', () => {
    const token = newSessionToken();
    expect(hashToken(token)).not.toBe(token);
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('issues a different token every time', () => {
    expect(new Set(Array.from({ length: 50 }, newSessionToken)).size).toBe(50);
  });
});

describe('payload validation', () => {
  it('rejects a state or ride the content pack does not define', () => {
    expect(scoreSchema.safeParse({ stateId: 'atlantis', crowd: 10, rideId: 'trek' }).success).toBe(false);
    expect(scoreSchema.safeParse({ stateId: 'lagos', crowd: 10, rideId: 'rocket' }).success).toBe(false);
    expect(scoreSchema.safeParse({ stateId: 'lagos', crowd: 10, rideId: 'trek' }).success).toBe(true);
  });

  it('rejects an impossible Crowd', () => {
    expect(scoreSchema.safeParse({ stateId: 'lagos', crowd: -1, rideId: 'trek' }).success).toBe(false);
    expect(scoreSchema.safeParse({ stateId: 'lagos', crowd: 1e9, rideId: 'trek' }).success).toBe(false);
    expect(scoreSchema.safeParse({ stateId: 'lagos', crowd: 1.5, rideId: 'trek' }).success).toBe(false);
  });

  it('allows a score with no Contender attached', () => {
    const r = scoreSchema.safeParse({ stateId: 'lagos', crowd: 10, rideId: 'trek', contenderId: null });
    expect(r.success).toBe(true);
  });

  it('lower-cases and trims an email so one address is one account', () => {
    const r = signupSchema.safeParse({ email: '  Person@Example.COM ', password: 'a-long-password', username: 'runner' });
    expect(r.success && r.data.email).toBe('person@example.com');
  });

  it('holds a password length floor', () => {
    expect(signupSchema.safeParse({ email: 'a@b.co', password: 'short', username: 'runner' }).success).toBe(false);
  });

  it('keeps usernames to a safe character set', () => {
    for (const username of ['ok_name1', 'Runner']) {
      expect(signupSchema.safeParse({ email: 'a@b.co', password: 'a-long-password', username }).success, username).toBe(true);
    }
    for (const username of ['has space', 'drop;table', 'ab', '<script>']) {
      expect(signupSchema.safeParse({ email: 'a@b.co', password: 'a-long-password', username }).success, username).toBe(false);
    }
  });

  it('accepts a login without re-imposing the signup password rules', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'old' }).success).toBe(true);
  });

  it('requires a legal version with a consent change', () => {
    expect(consentSchema.safeParse({ shareContender: true }).success).toBe(false);
    expect(consentSchema.safeParse({ shareContender: true, legalVersion: '2026-10-01' }).success).toBe(true);
  });
});

/** A region's party tallies are built from Contender choices (guardrail 10). */
describe('the standings privacy floor', () => {
  function fakeDb(playersPerRegion: number): Db {
    return {
      async query<R>(text: string): Promise<{ rows: R[] }> {
        // C41 qualified the column when the query gained a join to `users`.
        if (text.includes('count(distinct s.user_id)::bigint as n')) {
          return { rows: [{ n: String(playersPerRegion) }] as R[] };
        }
        return {
          rows: [
            { state_id: 'lagos', contender_id: 'sister-beacon', crowd: '900', players: String(playersPerRegion) },
            { state_id: 'lagos', contender_id: 'captain-kobo', crowd: '400', players: String(playersPerRegion) },
          ] as R[],
        };
      },
    };
  }

  it('publishes nothing at all for a region under the floor', async () => {
    const regions: LiveRegion[] = await liveStandings(fakeDb(3), 200);
    expect(regions).toHaveLength(1);
    expect(regions[0]!.published).toBe(false);
    // not zeroes, not a leader — nothing to reconstruct a player's choice from
    expect(regions[0]!.tallies).toEqual([]);
  });

  it('publishes the breakdown once the region clears the floor', async () => {
    const regions = await liveStandings(fakeDb(200), 200);
    expect(regions[0]!.published).toBe(true);
    expect(regions[0]!.tallies.map((t) => t.contenderId)).toEqual(['sister-beacon', 'captain-kobo']);
    expect(regions[0]!.tallies[0]!.crowd).toBe(900);
  });

  it('reports the player count either way, since a count names nobody', async () => {
    expect((await liveStandings(fakeDb(7), 200))[0]!.players).toBe(7);
  });
});
