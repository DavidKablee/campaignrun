import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pg from 'pg';
import { places } from '@cr/content';
import { createApp } from '../src/app';
import { migrate } from '../src/migrate';
import { memoryMailer } from '../src/mailer';
import { resetRateLimits } from '../src/rateLimit';
import type { Db } from '../src/db';

const url = process.env.DATABASE_URL;
const run = url ? describe : describe.skip;

run('places api (C82)', () => {
  let pool: pg.Pool;
  let database: Db;
  let app: ReturnType<typeof createApp>;
  let clock = Date.UTC(2026, 9, 30, 12, 0, 0);

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: url });
    database = pool;
    await migrate(database);
    app = createApp(database, memoryMailer(), { requireReplay: false, now: () => clock });
  });
  afterAll(async () => {
    await pool.end();
  });
  beforeEach(async () => {
    await database.query('truncate users cascade');
    await database.query('truncate place_activity');
    resetRateLimits();
    clock = Date.UTC(2026, 9, 30, 12, 0, 0);
  });

  const json = (path: string, cookie: string, body?: unknown, method = 'POST') =>
    app.request(path, {
      method,
      headers: { 'content-type': 'application/json', cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  async function guest(username: string): Promise<string> {
    const res = await app.request('/api/auth/guest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return (res.headers.get('set-cookie') ?? '').split(';')[0]!;
  }

  async function join(cookie: string, kind = 'market', stateId = 'kano') {
    const res = await json('/api/places/join', cookie, { stateId, kind });
    return { res, body: (await res.json()) as { roomId: string; you: string; members: { id: string; name: string }[]; today: { coins: number } } };
  }

  it('needs an account to join', async () => {
    const res = await app.request('/api/places/join', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stateId: 'kano', kind: 'market' }),
    });
    expect(res.status).toBe(401);
  });

  it('puts two players in the same room and shows each the other', async () => {
    const a = await guest('alpha');
    const b = await guest('bravo');
    const first = await join(a);
    const second = await join(b);
    expect(second.body.roomId).toBe(first.body.roomId);
    expect(second.body.members.map((m) => m.name).sort()).toEqual(['alpha', 'bravo']);
  });

  it('rejects an unknown place kind and an unknown state', async () => {
    const a = await guest('alpha');
    expect((await json('/api/places/join', a, { stateId: 'kano', kind: 'casino' })).status).toBe(400);
    expect((await json('/api/places/join', a, { stateId: 'nowhere', kind: 'market' })).status).toBe(400);
  });

  it('pays a canvass once, then holds it on cooldown', async () => {
    const a = await guest('alpha');
    const { body } = await join(a);
    const ok = await json(`/api/places/rooms/${encodeURIComponent(body.roomId)}/act`, a, { action: 'canvass' });
    expect(ok.status).toBe(200);
    const reward = ((await ok.json()) as { reward: { coins: number; supporters: number } }).reward;
    expect(reward.coins).toBe(places.actions.find((x) => x.id === 'canvass')!.coins);
    const again = await json(`/api/places/rooms/${encodeURIComponent(body.roomId)}/act`, a, { action: 'canvass' });
    expect(again.status).toBe(429);
  });

  it('stops paying at the daily cap and starts again the next Lagos day', async () => {
    const a = await guest('alpha');
    const { body } = await join(a);
    const path = `/api/places/rooms/${encodeURIComponent(body.roomId)}/act`;
    const flyers = places.actions.find((x) => x.id === 'flyers')!;
    let paid = 0;
    for (let i = 0; i < places.daily.actions + 2; i++) {
      clock += flyers.cooldownSeconds * 1000 + 1;
      resetRateLimits();
      const res = await json(path, a, { action: 'flyers' });
      paid += ((await res.json()) as { reward: { coins: number } }).reward.coins;
    }
    expect(paid).toBeLessThanOrEqual(places.daily.coins);
    expect(paid).toBe(Math.min(places.daily.coins, flyers.coins * places.daily.actions));

    clock = Date.UTC(2026, 9, 31, 12, 0, 0);
    resetRateLimits();
    const next = await json(path, a, { action: 'flyers' });
    expect(((await next.json()) as { reward: { coins: number } }).reward.coins).toBe(flyers.coins);
  });

  it('holds the daily cap across two joins of the same account', async () => {
    const a = await guest('alpha');
    const first = await join(a);
    await json(`/api/places/rooms/${encodeURIComponent(first.body.roomId)}/act`, a, { action: 'canvass' });
    const second = await join(a, 'park');
    expect(second.body.today.coins).toBe(places.actions.find((x) => x.id === 'canvass')!.coins);
  });

  it('only accepts preset phrases and listed emoji, never free text', async () => {
    const a = await guest('alpha');
    const { body } = await join(a);
    const say = (b: unknown) => json(`/api/places/rooms/${encodeURIComponent(body.roomId)}/say`, a, b);
    expect((await say({ phrase: places.phrases[0]!.id })).status).toBe(204);
    expect((await say({ emoji: places.emoji[0] })).status).toBe(204);
    expect((await say({ text: 'vote for me' })).status).toBe(400);
    expect((await say({ phrase: 'vote-for-me' })).status).toBe(400);
    expect((await say({ phrase: places.phrases[0]!.id, emoji: places.emoji[0] })).status).toBe(400);
  });

  it('refuses a move or an act from someone who is not in the room', async () => {
    const a = await guest('alpha');
    const b = await guest('bravo');
    const { body } = await join(a);
    const res = await json(`/api/places/rooms/${encodeURIComponent(body.roomId)}/move`, b, { x: 1, z: 1 });
    expect(res.status).toBe(404);
  });

  it('delivers a peer\'s action over the stream', async () => {
    const a = await guest('alpha');
    const b = await guest('bravo');
    const first = await join(a);
    const second = await join(b);
    const stream = await app.request(`/api/places/rooms/${encodeURIComponent(first.body.roomId)}/stream`, { headers: { cookie: a } });
    expect(stream.status).toBe(200);
    const reader = stream.body!.getReader();
    const decoder = new TextDecoder();
    let seen = '';
    const read = async (until: RegExp) => {
      while (!until.test(seen)) {
        const { value, done } = await reader.read();
        if (done) break;
        seen += decoder.decode(value);
      }
    };
    await read(/event: hello/);
    await json(`/api/places/rooms/${encodeURIComponent(second.body.roomId)}/act`, b, { action: 'wave' });
    await read(/event: act/);
    expect(seen).toMatch(/"action":"wave"/);
    await reader.cancel();
  });

  it('counts a state\'s activity for confirmed accounts only', async () => {
    const a = await guest('alpha');
    const { body } = await join(a);
    await json(`/api/places/rooms/${encodeURIComponent(body.roomId)}/act`, a, { action: 'canvass' });
    const res = await app.request('/api/places/activity');
    const states = ((await res.json()) as { states: { stateId: string }[] }).states;
    // A name-only account has no confirmed address, so the Board does not count it (unless the demo flag is off).
    if (process.env.CR_REQUIRE_VERIFIED === 'false') expect(states.map((s) => s.stateId)).toContain('kano');
    else expect(states).toEqual([]);
  });

  it('records a report as a reason from the list and nothing else', async () => {
    const a = await guest('alpha');
    const b = await guest('bravo');
    const first = await join(a);
    const second = await join(b);
    const path = `/api/places/rooms/${encodeURIComponent(first.body.roomId)}/report`;
    expect((await json(path, a, { memberId: second.body.you, reason: 'spam' })).status).toBe(201);
    expect((await json(path, a, { memberId: second.body.you, reason: 'because I said so' })).status).toBe(400);
    const { rows } = await database.query('select reason, place_key from place_reports');
    expect(rows).toEqual([{ reason: 'spam', place_key: 'kano:market' }]);
  });
});
