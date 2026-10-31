import type { Hono, MiddlewareHandler } from 'hono';
import { streamSSE } from 'hono/streaming';
import { places, placesDay, stateIndex } from '@cr/content';
import type { Db } from './db.ts';
import { REQUIRE_VERIFIED_FOR_BOARDS, LIMITS } from './limits.ts';
import { PlaceHub, type HubEvent } from './placesHub.ts';
import { createJobs, type GrantResult } from './placeJobs.ts';
import { createChat, type Chat } from './placeChat.ts';
import { hit, rateLimit } from './rateLimit.ts';
import type { SessionUser } from './auth.ts';
import {
  placeActSchema,
  placeChatSchema,
  placeFriendRequestSchema,
  placeFriendSchema,
  placeIdentitySchema,
  placeJoinSchema,
  placeMoveSchema,
  placePollSchema,
  placeReportSchema,
  placeSaySchema,
  placeTitleSchema,
  placeVoteSchema,
} from './validate.ts';

/**
 * Mobilise (C82): the routes for the shared campaign places.
 *
 * Chat is a preset phrase id or one emoji from a closed list, validated here and relayed to the room;
 * nothing a player types ever reaches another player. The only thing a place pays out is coins and a
 * small Supporters head start, capped per Lagos day in the database so a second tab or device cannot
 * widen the cap. None of it touches the sim.
 */
const MINUTE = 60_000;
const HEARTBEAT_MS = 15_000;

type Env = { Variables: { user: SessionUser; requestId: string } };

export interface DailyTotals {
  coins: number;
  supporters: number;
  actions: number;
}

export interface Reward {
  coins: number;
  supporters: number;
  capped: boolean;
  today: DailyTotals;
}

export function registerPlaces(
  app: Hono<Env>,
  deps: { database: Db; requireUser: MiddlewareHandler<Env>; now: () => number; hub?: PlaceHub; chat?: Chat },
): PlaceHub {
  const { database, requireUser, now } = deps;
  const hub = deps.hub ?? new PlaceHub();
  const chat = deps.chat ?? createChat({ database, now });
  const sweeper = setInterval(() => hub.sweep(now()), 5_000);
  sweeper.unref?.();
  // Typed messages are kept only so a report can be reviewed; this is what deletes them (C93).
  const purger = setInterval(() => void chat.purge().catch(() => undefined), 10 * MINUTE);
  purger.unref?.();

  async function todayTotals(userId: string): Promise<DailyTotals> {
    const { rows } = await database.query<DailyTotals>(
      'select coins, supporters, actions from place_daily where user_id = $1 and day = $2',
      [userId, placesDay(now())],
    );
    return rows[0] ?? { coins: 0, supporters: 0, actions: 0 };
  }

  /** Pays a bonus (a finished job, a streak milestone) under the same daily caps as any action. */
  async function grant(userId: string, coins: number, supporters: number): Promise<GrantResult> {
    const before = await todayTotals(userId);
    const room = places.daily;
    const c = Math.max(0, Math.min(coins, room.coins - before.coins));
    const s = Math.max(0, Math.min(supporters, room.supporters - before.supporters));
    if (c > 0 || s > 0) {
      await database.query(
        `insert into place_daily as d (user_id, day, coins, supporters, actions) values ($1, $2, $3, $4, 0)
         on conflict (user_id, day) do update
           set coins = least(d.coins + $3, $5), supporters = least(d.supporters + $4, $6)`,
        [userId, placesDay(now()), c, s, room.coins, room.supporters],
      );
    }
    return { coins: c, supporters: s, capped: c < coins || s < supporters };
  }

  const jobs = createJobs({ database, now, grant });

  /** Pays an action, never beyond the day's caps, and counts it for the state's activity on the Board. */
  async function pay(user: SessionUser, stateId: string, actionId: string, solo = false): Promise<Reward> {
    const action = places.actions.find((a) => a.id === actionId)!;
    // An action that needs company, done with only Locals near, pays a share of its reward.
    const pct = solo ? action.soloPercent : 100;
    const want = { coins: Math.floor((action.coins * pct) / 100), supporters: Math.floor((action.supporters * pct) / 100) };
    const before = await todayTotals(user.id);
    const room = places.daily;
    const canPay = before.actions < room.actions;
    const coins = canPay ? Math.min(want.coins, room.coins - before.coins) : 0;
    const supporters = canPay ? Math.min(want.supporters, room.supporters - before.supporters) : 0;
    const capped = !canPay || coins < want.coins || supporters < want.supporters;
    if (want.coins === 0 && want.supporters === 0) return { coins: 0, supporters: 0, capped: false, today: before };

    const day = placesDay(now());
    const { rows } = await database.query<DailyTotals>(
      `insert into place_daily as d (user_id, day, coins, supporters, actions)
       values ($1, $2, $3, $4, 1)
       on conflict (user_id, day) do update
         set coins = least(d.coins + $3, $5), supporters = least(d.supporters + $4, $6), actions = d.actions + 1
       returning coins, supporters, actions`,
      [user.id, day, coins, supporters, room.coins, room.supporters],
    );

    // Activity is what a state's Board shows. It follows the standings rule: only accounts that
    // confirmed an address count, unless this is a local demo with that check off.
    // The national square belongs to no state, and a solo rally adds no activity to one.
    const counts = canPay && !solo && stateId !== places.square.stateId && action.activity > 0 && (!REQUIRE_VERIFIED_FOR_BOARDS || user.emailVerifiedAt !== null);
    if (counts) {
      await database.query(
        `insert into place_activity (state_id, day, points) values ($1, $2, $3)
         on conflict (state_id, day) do update set points = place_activity.points + excluded.points`,
        [stateId, day, action.activity],
      );
    }
    return { coins, supporters, capped, today: rows[0]! };
  }

  /** What the player chose about showing their Contender here. Only ever read for the player themself. */
  async function identityOf(userId: string): Promise<{ asked: boolean; contenderId: string | null }> {
    const { rows } = await database.query<{ mobilise_contender_id: string | null; mobilise_asked_at: Date | null }>(
      'select mobilise_contender_id, mobilise_asked_at from users where id = $1',
      [userId],
    );
    return { asked: rows[0]?.mobilise_asked_at != null, contenderId: rows[0]?.mobilise_contender_id ?? null };
  }

  /** The player's member in a room, or a ready-made 404. */
  function memberOf(user: SessionUser, roomId: string) {
    return hub.memberFor(user.id, roomId);
  }

  const catalogue = () => ({
    kinds: places.kinds,
    square: places.square,
    actions: places.actions,
    topics: places.topics,
    phrases: places.phrases,
    polls: places.polls,
    chatCopy: { reasons: places.chat.reasons, locks: places.chat.locks },
    emoji: places.emoji,
    daily: places.daily,
    bounds: places.bounds,
    walkSpeed: places.walkSpeedMetresPerSecond,
    companyRadius: places.companyRadiusMetres,
  });

  // Counts only, no names: lets the Mobilise button say how busy a state is without signing in.
  app.get('/api/places/online', (c) => {
    const state = c.req.query('state');
    if (state && !stateIndex.some((s) => s.id === state)) return c.json({ error: 'invalid' }, 400);
    c.header('cache-control', 'no-store');
    return c.json({ online: hub.online(state) });
  });

  // Per-state activity today and over the last week, for the Board.
  app.get('/api/places/activity', async (c) => {
    const { rows } = await database.query<{ state_id: string; today: string; week: string }>(
      `select state_id,
              coalesce(sum(points) filter (where day = $1), 0)::bigint as today,
              coalesce(sum(points), 0)::bigint as week
         from place_activity where day > $1::date - 7 group by state_id order by sum(points) desc, state_id`,
      [placesDay(now())],
    );
    c.header('cache-control', 'public, max-age=30');
    return c.json({ states: rows.map((r) => ({ stateId: r.state_id, today: Number(r.today), week: Number(r.week) })) });
  });

  app.post('/api/places/join', requireUser, rateLimit('place-join', LIMITS.placeJoinPerMinutePerIp, MINUTE), async (c) => {
    const parsed = placeJoinSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const user = c.get('user');
    const t = now();
    const identity = await identityOf(user.id);
    const { member, room, landed } = hub.join(
      { id: user.id, username: user.username },
      parsed.data.stateId,
      parsed.data.kind,
      identity.contenderId ? { contenderId: identity.contenderId } : null,
      t,
      parsed.data.roomId ?? null,
    );
    hub.setTitle(user.id, await jobs.wearing(user.id), t);
    const progress = parsed.data.stateId === places.square.stateId ? await jobs.record(user.id, { type: 'square' }) : null;
    return c.json({
      roomId: room.id,
      progress,
      poll: hub.pollFor(room.id, member.id, t),
      // 'assigned' when a requested room was full or gone, so the player is told they landed elsewhere.
      landed,
      requested: parsed.data.roomId ?? null,
      you: member.id,
      members: hub.snapshot(room.id, t),
      today: await todayTotals(user.id),
      identity,
      chat: await chat.status(user.id),
      ...catalogue(),
    });
  });

  app.get('/api/places/identity', requireUser, async (c) => {
    c.header('cache-control', 'no-store');
    return c.json(await identityOf(c.get('user').id));
  });

  // The one-time "show your Contender here?" answer, changeable any time. Null = plain citizen.
  app.post('/api/places/identity', requireUser, async (c) => {
    const user = c.get('user');
    if (!hit(`place-identity:${user.id}`, 20, MINUTE).ok) return c.json({ error: 'rate-limited' }, 429);
    const parsed = placeIdentitySchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    await database.query('update users set mobilise_contender_id = $2, mobilise_asked_at = now() where id = $1', [
      user.id,
      parsed.data.contenderId,
    ]);
    hub.setLook(user.id, parsed.data.contenderId ? { contenderId: parsed.data.contenderId } : null, now());
    return c.json({ asked: true, contenderId: parsed.data.contenderId });
  });

  // ---- C90: friends and the room browser ----------------------------------

  async function friendIdsOf(userId: string): Promise<string[]> {
    const { rows } = await database.query<{ other_id: string }>(
      "select other_id from place_friends where user_id = $1 and status = 'accepted'",
      [userId],
    );
    return rows.map((r) => r.other_id);
  }

  async function userByName(name: string): Promise<{ id: string; username: string } | null> {
    const { rows } = await database.query<{ id: string; username: string }>(
      'select id, username from users where lower(username) = lower($1)',
      [name],
    );
    return rows[0] ?? null;
  }

  async function count(userId: string, status: string): Promise<number> {
    const { rows } = await database.query<{ n: string }>(
      'select count(*)::int as n from place_friends where user_id = $1 and status = $2',
      [userId, status],
    );
    return Number(rows[0]?.n ?? 0);
  }

  // Rooms with people in them, friends' rooms first, then the player's own state, then the busiest.
  app.get('/api/places/rooms', requireUser, async (c) => {
    const user = c.get('user');
    const state = c.req.query('state');
    const friends = new Set(await friendIdsOf(user.id));
    const rows = hub.listRooms().map((r) => ({
      ...r,
      friends: hub.userIdsIn(r.roomId).filter((id) => friends.has(id)).length,
    }));
    rows.sort(
      (a, b) =>
        b.friends - a.friends ||
        Number(b.stateId === state) - Number(a.stateId === state) ||
        b.count - a.count ||
        a.roomId.localeCompare(b.roomId),
    );
    c.header('cache-control', 'no-store');
    return c.json({ rooms: rows.slice(0, places.rooms.listMax), busyAt: places.rooms.busyAt });
  });

  app.get('/api/places/friends', requireUser, async (c) => {
    const user = c.get('user');
    const { rows } = await database.query<{ other_id: string; username: string; status: string; mine: boolean }>(
      `select f.other_id, u.username, f.status, true as mine
         from place_friends f join users u on u.id = f.other_id where f.user_id = $1 and f.status in ('accepted', 'pending')
       union all
       select f.user_id, u.username, f.status, false
         from place_friends f join users u on u.id = f.user_id where f.other_id = $1 and f.status = 'pending'`,
      [user.id],
    );
    const friends = rows
      .filter((r) => r.status === 'accepted')
      .map((r) => {
        const at = hub.whereIs(r.other_id);
        return { name: r.username, online: at !== null, roomId: at?.roomId ?? null };
      })
      .sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name));
    const incoming = rows.filter((r) => r.status === 'pending' && !r.mine).map((r) => ({ name: r.username }));
    const outgoing = rows.filter((r) => r.status === 'pending' && r.mine).map((r) => ({ name: r.username }));
    c.header('cache-control', 'no-store');
    return c.json({ friends, incoming, outgoing, max: places.friends.max });
  });

  // Ask someone in your room to be friends by tapping them. No names are typed.
  app.post('/api/places/rooms/:roomId/friend', requireUser, async (c) => {
    const user = c.get('user');
    if (!hit(`place-friend:${user.id}`, 30, 60 * MINUTE).ok) return c.json({ error: 'rate-limited' }, 429);
    const parsed = placeFriendRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const roomId = c.req.param('roomId');
    if (!memberOf(user, roomId)) return c.json({ error: 'not-in-room' }, 404);
    const target = hub.userIdOf(roomId, parsed.data.memberId);
    if (!target) return c.json({ error: 'not-found' }, 404);
    if (target === user.id) return c.json({ error: 'invalid' }, 400);

    const { rows: mine } = await database.query<{ status: string }>(
      'select status from place_friends where user_id = $1 and other_id = $2',
      [user.id, target],
    );
    if (mine[0]?.status === 'blocked') return c.json({ error: 'blocked' }, 409);
    if (mine[0]) return c.json({ status: mine[0].status });
    const { rows: theirs } = await database.query<{ status: string }>(
      'select status from place_friends where user_id = $1 and other_id = $2',
      [target, user.id],
    );
    // Someone who blocked you looks exactly like a request that was never answered.
    if (theirs[0]?.status === 'blocked') return c.json({ status: 'pending' }, 201);
    if ((await count(user.id, 'accepted')) >= places.friends.max) return c.json({ error: 'friends-full' }, 409);

    if (theirs[0]?.status === 'pending') {
      await database.query(
        `update place_friends set status = 'accepted' where user_id = $1 and other_id = $2;`,
        [target, user.id],
      );
      await database.query(
        `insert into place_friends (user_id, other_id, status) values ($1, $2, 'accepted') on conflict do nothing`,
        [user.id, target],
      );
      return c.json({ status: 'accepted', progress: await jobs.record(user.id, { type: 'friend' }) }, 201);
    }
    if ((await count(user.id, 'pending')) >= places.friends.max) return c.json({ error: 'friends-full' }, 409);
    await database.query(`insert into place_friends (user_id, other_id, status) values ($1, $2, 'pending')`, [user.id, target]);
    return c.json({ status: 'pending', progress: await jobs.record(user.id, { type: 'friend' }) }, 201);
  });

  app.post('/api/places/friends/accept', requireUser, async (c) => {
    const user = c.get('user');
    const parsed = placeFriendSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const other = await userByName(parsed.data.name);
    if (!other) return c.json({ error: 'not-found' }, 404);
    const { rows: pending } = await database.query(
      `update place_friends set status = 'accepted' where user_id = $1 and other_id = $2 and status = 'pending' returning user_id`,
      [other.id, user.id],
    );
    if (pending.length === 0) return c.json({ error: 'not-found' }, 404);
    if ((await count(user.id, 'accepted')) >= places.friends.max) {
      await database.query(`update place_friends set status = 'pending' where user_id = $1 and other_id = $2`, [other.id, user.id]);
      return c.json({ error: 'friends-full' }, 409);
    }
    await database.query(
      `insert into place_friends (user_id, other_id, status) values ($1, $2, 'accepted') on conflict do nothing`,
      [user.id, other.id],
    );
    return c.json({ status: 'accepted', progress: await jobs.record(user.id, { type: 'friend' }) });
  });

  // Decline, cancel, unfriend and unblock are all "remove the link".
  app.post('/api/places/friends/remove', requireUser, async (c) => {
    const user = c.get('user');
    const parsed = placeFriendSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const other = await userByName(parsed.data.name);
    if (other) {
      await database.query(
        `delete from place_friends
          where (user_id = $1 and other_id = $2) or (user_id = $2 and other_id = $1 and status <> 'blocked')`,
        [user.id, other.id],
      );
    }
    return c.body(null, 204);
  });

  app.post('/api/places/friends/block', requireUser, async (c) => {
    const user = c.get('user');
    const parsed = placeFriendSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const other = await userByName(parsed.data.name);
    if (!other || other.id === user.id) return c.json({ error: 'not-found' }, 404);
    await database.query(
      `delete from place_friends where (user_id = $1 and other_id = $2) or (user_id = $2 and other_id = $1 and status <> 'blocked')`,
      [user.id, other.id],
    );
    await database.query(`insert into place_friends (user_id, other_id, status) values ($1, $2, 'blocked') on conflict do nothing`, [
      user.id,
      other.id,
    ]);
    return c.body(null, 204);
  });

  // ---- C91: Campaign Jobs, the streak and titles -------------------------------

  app.get('/api/places/jobs', requireUser, async (c) => {
    c.header('cache-control', 'no-store');
    return c.json(await jobs.snapshot(c.get('user').id));
  });

  // Wear an earned title on your name tag, or none. A title is chosen from a fixed list, never typed.
  app.post('/api/places/title', requireUser, async (c) => {
    const user = c.get('user');
    if (!hit(`place-title:${user.id}`, 20, MINUTE).ok) return c.json({ error: 'rate-limited' }, 429);
    const parsed = placeTitleSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const res = await jobs.wear(user.id, parsed.data.titleId);
    if (!res.ok) return c.json({ error: 'not-earned' }, 409);
    hub.setTitle(user.id, res.label, now());
    return c.json(await jobs.snapshot(user.id));
  });

  app.get('/api/places/rooms/:roomId/stream', requireUser, (c) => {
    const user = c.get('user');
    const member = memberOf(user, c.req.param('roomId'));
    if (!member) return c.json({ error: 'not-in-room' }, 404);
    return streamSSE(c, async (stream) => {
      let chain: Promise<unknown> = Promise.resolve();
      const send = (event: string, data: unknown) => {
        chain = chain.then(() => stream.writeSSE({ event, data: JSON.stringify(data) })).catch(() => undefined);
      };
      const sink = (e: HubEvent) => send(e.type, e);
      hub.attach(member, sink, now());
      stream.onAbort(() => hub.detach(member, sink, now()));
      send('hello', { you: member.id, members: hub.snapshot(member.roomId, now()), poll: hub.pollFor(member.roomId, member.id, now()) });
      while (!stream.aborted) {
        await stream.sleep(HEARTBEAT_MS);
        hub.touch(member, now());
        send('ping', { t: now() });
      }
    });
  });

  app.post('/api/places/rooms/:roomId/move', requireUser, async (c) => {
    const user = c.get('user');
    if (!hit(`place-move:${user.id}`, LIMITS.placeMovePerMinutePerUser, MINUTE).ok) return c.json({ error: 'rate-limited' }, 429);
    const parsed = placeMoveSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const member = memberOf(user, c.req.param('roomId'));
    if (!member) return c.json({ error: 'not-in-room' }, 404);
    hub.move(member, parsed.data, now());
    return c.body(null, 204);
  });

  app.post('/api/places/rooms/:roomId/act', requireUser, async (c) => {
    const user = c.get('user');
    if (!hit(`place-act:${user.id}`, LIMITS.placeActPerMinutePerUser, MINUTE).ok) return c.json({ error: 'rate-limited' }, 429);
    const parsed = placeActSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const roomId = c.req.param('roomId');
    const member = memberOf(user, roomId);
    if (!member) return c.json({ error: 'not-in-room' }, 404);
    const action = places.actions.find((a) => a.id === parsed.data.action)!;
    const result = hub.act(member, action, now());
    if (!result.ok) {
      if (result.reason === 'cooldown') return c.json({ error: 'cooldown', retryAfter: result.retryAfter }, 429);
      return c.json({ error: result.reason }, 409);
    }
    const stateId = roomId.split(':')[0]!;
    const reward = await pay(user, stateId, action.id, result.solo);
    const progress = await jobs.record(user.id, { type: 'action', action: action.id, company: result.withOthers > 0 });
    return c.json({ action: action.id, reward, progress });
  });

  app.post('/api/places/rooms/:roomId/say', requireUser, async (c) => {
    const user = c.get('user');
    if (!hit(`place-say:${user.id}`, LIMITS.placeSayPerMinutePerUser, MINUTE).ok) return c.json({ error: 'rate-limited' }, 429);
    const parsed = placeSaySchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const member = memberOf(user, c.req.param('roomId'));
    if (!member) return c.json({ error: 'not-in-room' }, 404);
    hub.say(member, parsed.data, now());
    return c.json({ progress: await jobs.record(user.id, { type: 'say' }) });
  });

  // C93: typed chat. Ships dark: with CR_CHAT_ENABLED off, every call here says so and the client
  // falls back to the preset phrases. A refusal tells the sender why and is never shown to anyone else.
  app.get('/api/places/chat', requireUser, async (c) => {
    c.header('cache-control', 'no-store');
    return c.json(await chat.status(c.get('user').id));
  });

  app.post('/api/places/rooms/:roomId/chat', requireUser, async (c) => {
    const user = c.get('user');
    if (!hit(`place-chat:${user.id}`, LIMITS.placeSayPerMinutePerUser, MINUTE).ok) return c.json({ error: 'rate-limited' }, 429);
    const parsed = placeChatSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const roomId = c.req.param('roomId');
    const member = memberOf(user, roomId);
    if (!member) return c.json({ error: 'not-in-room' }, 404);
    const res = await chat.send(user.id, roomId.split('#')[0]!, parsed.data.text);
    if (!res.ok) {
      if (res.error === 'chat-locked') return c.json({ error: res.error, lock: res.lock }, 403);
      if (res.error === 'rate-limited') return c.json({ error: res.error, retryAfter: res.retryAfter }, 429);
      // `field` is how the client's ApiError carries the reason.
      return c.json({ error: res.error, field: res.reason, reason: res.reason }, 422);
    }
    hub.sayText(member, res.text, now(), res.shadow);
    return c.json({ progress: await jobs.record(user.id, { type: 'say' }) });
  });

  // Start a poll from the fixed list. Starting one counts as saying something for the day's jobs.
  app.post('/api/places/rooms/:roomId/poll', requireUser, async (c) => {
    const user = c.get('user');
    if (!hit(`place-poll:${user.id}`, 10, MINUTE).ok) return c.json({ error: 'rate-limited' }, 429);
    const parsed = placePollSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const member = memberOf(user, c.req.param('roomId'));
    if (!member) return c.json({ error: 'not-in-room' }, 404);
    const res = hub.startPoll(member, parsed.data.pollId, now());
    if (!res.ok) return c.json({ error: res.reason, retryAfter: res.retryAfter }, 409);
    return c.json({ poll: res.poll, progress: await jobs.record(user.id, { type: 'say' }) }, 201);
  });

  app.post('/api/places/rooms/:roomId/vote', requireUser, async (c) => {
    const user = c.get('user');
    if (!hit(`place-vote:${user.id}`, 30, MINUTE).ok) return c.json({ error: 'rate-limited' }, 429);
    const parsed = placeVoteSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const member = memberOf(user, c.req.param('roomId'));
    if (!member) return c.json({ error: 'not-in-room' }, 404);
    const res = hub.vote(member, parsed.data.option, now());
    if (!res.ok) return c.json({ error: res.reason }, 409);
    return c.json({ poll: res.poll });
  });

  app.post('/api/places/rooms/:roomId/report', requireUser, async (c) => {
    const user = c.get('user');
    if (!hit(`place-report:${user.id}`, LIMITS.placeReportPerDayPerUser, 24 * 60 * MINUTE).ok) {
      return c.json({ error: 'rate-limited' }, 429);
    }
    const parsed = placeReportSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const roomId = c.req.param('roomId');
    if (!memberOf(user, roomId)) return c.json({ error: 'not-in-room' }, 404);
    const reported = hub.userIdOf(roomId, parsed.data.memberId);
    if (!reported) return c.json({ error: 'not-found' }, 404);
    await database.query(
      'insert into place_reports (reporter_id, reported_id, place_key, reason) values ($1, $2, $3, $4)',
      [user.id, reported, roomId.split('#')[0], parsed.data.reason],
    );
    // Enough different people reporting hides this player's typed text from others for a while.
    await chat.afterReport(reported);
    return c.body(null, 201);
  });

  app.post('/api/places/leave', requireUser, (c) => {
    hub.leave(c.get('user').id);
    return c.body(null, 204);
  });

  return hub;
}
