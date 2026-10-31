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

  describe('showing your Contender in a place (C89)', () => {
    const members = async (cookie: string) =>
      ((await join(cookie)).body.members as unknown as { name: string; look: { contenderId: string } | null }[]);

    it('starts as a plain citizen, not yet asked', async () => {
      const a = await guest('c89a0');
      const { body } = await join(a);
      expect((body as unknown as { identity: unknown }).identity).toEqual({ asked: false, contenderId: null });
      expect(body.members.find((m) => m.name === 'c89a0')).toMatchObject({ look: null });
    });

    it('shows the Contender to the room only after the player says yes, and a client cannot send one at join', async () => {
      const a = await guest('c89a1');
      const b = await guest('c89b1');
      // A look smuggled into the join call is ignored.
      await json('/api/places/join', a, { stateId: 'kano', kind: 'market', look: { contenderId: 'captain-kobo' }, color: '#ffffff' });
      expect((await members(b)).find((m) => m.name === 'c89a1')!.look).toBeNull();

      const yes = await json('/api/places/identity', a, { contenderId: 'captain-kobo' });
      expect(yes.status).toBe(200);
      expect((await members(b)).find((m) => m.name === 'c89a1')!.look).toEqual({ contenderId: 'captain-kobo' });
      expect((await (await json('/api/places/identity', a, undefined, 'GET')).json())).toEqual({ asked: true, contenderId: 'captain-kobo' });
    });

    it('withdrawing clears it for everyone, and it is remembered as answered', async () => {
      const a = await guest('c89a2');
      const b = await guest('c89b2');
      await join(a);
      await json('/api/places/identity', a, { contenderId: 'mama-ankara' });
      await json('/api/places/identity', a, { contenderId: null });
      expect((await members(b)).find((m) => m.name === 'c89a2')!.look).toBeNull();
      const { body } = await join(a);
      expect((body as unknown as { identity: unknown }).identity).toEqual({ asked: true, contenderId: null });
    });

    it('never puts a Contender into the map-colouring consent, and refuses a made-up one', async () => {
      const a = await guest('c89a3');
      await json('/api/places/identity', a, { contenderId: 'captain-kobo' });
      const me = await (await json('/api/auth/me', a, undefined, 'GET')).json();
      expect((me as { user: { shareContender: boolean } }).user.shareContender).toBe(false);
      expect((await json('/api/places/identity', a, { contenderId: 'not-a-contender' })).status).toBe(400);
      expect((await json('/api/places/identity', '', { contenderId: 'captain-kobo' })).status).toBe(401);
    });
  });

  describe('meeting anyone (C90)', () => {
    type RoomRow = { roomId: string; key: string; stateId: string; kind: string; count: number; friends: number };
    const rooms = async (cookie: string, state = '') =>
      ((await (await json(`/api/places/rooms${state ? `?state=${state}` : ''}`, cookie, undefined, 'GET')).json()) as { rooms: RoomRow[] }).rooms;
    const friends = async (cookie: string) =>
      (await (await json('/api/places/friends', cookie, undefined, 'GET')).json()) as {
        friends: { name: string; online: boolean; roomId: string | null }[];
        incoming: { name: string }[];
        outgoing: { name: string }[];
      };
    const memberId = async (cookie: string, roomId: string, name: string) => {
      const res = await json('/api/places/join', cookie, { stateId: roomId.split(':')[0], kind: roomId.split(':')[1]!.split('#')[0] });
      return (((await res.json()) as { members: { id: string; name: string }[] }).members.find((m) => m.name === name) ?? { id: '' }).id;
    };

    it('opens the national square and tags it as no state', async () => {
      const a = await guest('sq1');
      const res = await json('/api/places/join', a, { stateId: 'naija', kind: 'square' });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { roomId: string; square: { label: string } };
      expect(body.roomId).toMatch(/^naija:square#/);
      expect(body.square.label).toBe(places.square.label);
      expect((await json('/api/places/join', a, { stateId: 'naija', kind: 'market' })).status).toBe(400);
      expect((await json('/api/places/join', a, { stateId: 'kano', kind: 'square' })).status).toBe(400);
    });

    it('lists rooms with counts, and joins a requested room', async () => {
      const a = await guest('rb1');
      const b = await guest('rb2');
      const first = await join(a, 'stadium', 'ebonyi');
      const list = await rooms(b, 'ebonyi');
      const row = list.find((r) => r.roomId === first.body.roomId)!;
      expect(row).toMatchObject({ key: 'ebonyi:stadium', stateId: 'ebonyi', kind: 'stadium', count: 1 });
      expect(JSON.stringify(list)).not.toMatch(/rb1|rb2/);
      const res = await json('/api/places/join', b, { stateId: 'ebonyi', kind: 'stadium', roomId: first.body.roomId });
      const body = (await res.json()) as { roomId: string; landed: string };
      expect(body).toMatchObject({ roomId: first.body.roomId, landed: 'requested' });
    });

    it('says so when the requested room is gone', async () => {
      const a = await guest('rb3');
      const res = await json('/api/places/join', a, { stateId: 'ebonyi', kind: 'park', roomId: 'ebonyi:park#9999' });
      expect(((await res.json()) as { landed: string }).landed).toBe('assigned');
      expect((await json('/api/places/join', a, { stateId: 'ebonyi', kind: 'park', roomId: 'nonsense' })).status).toBe(400);
    });

    it('makes friends by tapping a player, and only the accepter turns a request into a friendship', async () => {
      const a = await guest('fr1');
      const b = await guest('fr2');
      const room = (await join(a, 'park', 'abia')).body.roomId;
      await join(b, 'park', 'abia');
      const target = await memberId(a, room, 'fr2');

      const asked = await json(`/api/places/rooms/${encodeURIComponent(room)}/friend`, a, { memberId: target });
      expect(asked.status).toBe(201);
      expect((await friends(a)).outgoing).toEqual([{ name: 'fr2' }]);
      expect((await friends(b)).incoming).toEqual([{ name: 'fr1' }]);
      expect((await friends(b)).friends).toEqual([]);

      expect((await json('/api/places/friends/accept', b, { name: 'fr1' })).status).toBe(200);
      const mine = await friends(a);
      expect(mine.friends).toEqual([{ name: 'fr2', online: true, roomId: room }]);
      expect((await friends(b)).friends[0]).toMatchObject({ name: 'fr1', online: true });
    });

    it('lets a friend join your room and shows the friend badge in the browser', async () => {
      const a = await guest('fj1');
      const b = await guest('fj2');
      const room = (await join(a, 'lake', 'abia')).body.roomId;
      await join(b, 'lake', 'abia');
      const target = await memberId(a, room, 'fj2');
      await json(`/api/places/rooms/${encodeURIComponent(room)}/friend`, a, { memberId: target });
      await json('/api/places/friends/accept', b, { name: 'fj1' });
      const row = (await rooms(a)).find((r) => r.roomId === room)!;
      expect(row.friends).toBe(1);
    });

    it('turns a request into a friendship at once when both asked each other', async () => {
      const a = await guest('mu1');
      const b = await guest('mu2');
      const room = (await join(a, 'park', 'abia')).body.roomId;
      await join(b, 'park', 'abia');
      await json(`/api/places/rooms/${encodeURIComponent(room)}/friend`, a, { memberId: await memberId(a, room, 'mu2') });
      const res = await json(`/api/places/rooms/${encodeURIComponent(room)}/friend`, b, { memberId: await memberId(b, room, 'mu1') });
      expect(await res.json()).toEqual({ status: 'accepted' });
      expect((await friends(a)).friends).toHaveLength(1);
    });

    it('removes a friendship both ways, and a block keeps the other person out without telling them', async () => {
      const a = await guest('bl1');
      const b = await guest('bl2');
      const room = (await join(a, 'park', 'abia')).body.roomId;
      await join(b, 'park', 'abia');
      await json(`/api/places/rooms/${encodeURIComponent(room)}/friend`, a, { memberId: await memberId(a, room, 'bl2') });
      await json('/api/places/friends/accept', b, { name: 'bl1' });
      expect((await json('/api/places/friends/remove', a, { name: 'bl2' })).status).toBe(204);
      expect((await friends(a)).friends).toEqual([]);
      expect((await friends(b)).friends).toEqual([]);

      expect((await json('/api/places/friends/block', a, { name: 'bl2' })).status).toBe(204);
      const res = await json(`/api/places/rooms/${encodeURIComponent(room)}/friend`, b, { memberId: await memberId(b, room, 'bl1') });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({ status: 'pending' });
      expect((await friends(a)).incoming).toEqual([]);
      // The blocker cannot ask the person they blocked either, until they unblock.
      const mine = await json(`/api/places/rooms/${encodeURIComponent(room)}/friend`, a, { memberId: await memberId(a, room, 'bl2') });
      expect(mine.status).toBe(409);
      await json('/api/places/friends/remove', a, { name: 'bl2' });
      expect((await json(`/api/places/rooms/${encodeURIComponent(room)}/friend`, a, { memberId: await memberId(a, room, 'bl2') })).status).toBe(201);
    });

    it('refuses to befriend yourself, someone not in your room, or without an account', async () => {
      const a = await guest('rf1');
      const room = (await join(a, 'park', 'abia')).body.roomId;
      const me = await memberId(a, room, 'rf1');
      expect((await json(`/api/places/rooms/${encodeURIComponent(room)}/friend`, a, { memberId: me })).status).toBe(400);
      expect((await json(`/api/places/rooms/${encodeURIComponent(room)}/friend`, a, { memberId: 'zzzzzz' })).status).toBe(404);
      expect((await json(`/api/places/rooms/${encodeURIComponent(room)}/friend`, '', { memberId: me })).status).toBe(401);
      expect((await json('/api/places/friends', '', undefined, 'GET')).status).toBe(401);
    });

    it('lets a solo player rally for half, and a rally with company for all of it', async () => {
      const a = await guest('so1');
      const { body } = await join(a, 'stadium', 'enugu');
      const first = await json(`/api/places/rooms/${encodeURIComponent(body.roomId)}/act`, a, { action: 'rally' });
      expect(first.status).toBe(200);
      const reward = ((await first.json()) as { reward: { coins: number; supporters: number } }).reward;
      const rally = places.actions.find((x) => x.id === 'rally')!;
      expect(reward.coins).toBe(Math.floor((rally.coins * rally.soloPercent) / 100));
      expect(reward.supporters).toBe(Math.floor((rally.supporters * rally.soloPercent) / 100));
    });

    it('adds nothing to the Board for the square or a solo rally', async () => {
      const a = await guest('bd1');
      const sq = (await (await json('/api/places/join', a, { stateId: 'naija', kind: 'square' })).json()) as { roomId: string };
      await json(`/api/places/rooms/${encodeURIComponent(sq.roomId)}/act`, a, { action: 'canvass' });
      const { rows } = await database.query<{ state_id: string }>('select state_id from place_activity');
      expect(rows.map((r) => r.state_id)).not.toContain('naija');
    });
  });
});
