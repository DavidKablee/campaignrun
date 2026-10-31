import type { Hono, MiddlewareHandler } from 'hono';
import { streamSSE } from 'hono/streaming';
import { places, placesDay, stateIndex } from '@cr/content';
import type { Db } from './db.ts';
import { REQUIRE_VERIFIED_FOR_BOARDS, LIMITS } from './limits.ts';
import { PlaceHub, type HubEvent } from './placesHub.ts';
import { hit, rateLimit } from './rateLimit.ts';
import type { SessionUser } from './auth.ts';
import {
  placeActSchema,
  placeIdentitySchema,
  placeJoinSchema,
  placeMoveSchema,
  placeReportSchema,
  placeSaySchema,
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
  deps: { database: Db; requireUser: MiddlewareHandler<Env>; now: () => number; hub?: PlaceHub },
): PlaceHub {
  const { database, requireUser, now } = deps;
  const hub = deps.hub ?? new PlaceHub();
  const sweeper = setInterval(() => hub.sweep(now()), 5_000);
  sweeper.unref?.();

  async function todayTotals(userId: string): Promise<DailyTotals> {
    const { rows } = await database.query<DailyTotals>(
      'select coins, supporters, actions from place_daily where user_id = $1 and day = $2',
      [userId, placesDay(now())],
    );
    return rows[0] ?? { coins: 0, supporters: 0, actions: 0 };
  }

  /** Pays an action, never beyond the day's caps, and counts it for the state's activity on the Board. */
  async function pay(user: SessionUser, stateId: string, actionId: string): Promise<Reward> {
    const action = places.actions.find((a) => a.id === actionId)!;
    const before = await todayTotals(user.id);
    const room = places.daily;
    const canPay = before.actions < room.actions;
    const coins = canPay ? Math.min(action.coins, room.coins - before.coins) : 0;
    const supporters = canPay ? Math.min(action.supporters, room.supporters - before.supporters) : 0;
    const capped = !canPay || coins < action.coins || supporters < action.supporters;
    if (action.coins === 0 && action.supporters === 0) return { coins: 0, supporters: 0, capped: false, today: before };

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
    const counts = canPay && action.activity > 0 && (!REQUIRE_VERIFIED_FOR_BOARDS || user.emailVerifiedAt !== null);
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
    actions: places.actions,
    phrases: places.phrases,
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
    const { member, room } = hub.join(
      { id: user.id, username: user.username },
      parsed.data.stateId,
      parsed.data.kind,
      identity.contenderId ? { contenderId: identity.contenderId } : null,
      t,
    );
    return c.json({
      roomId: room.id,
      you: member.id,
      members: hub.snapshot(room.id, t),
      today: await todayTotals(user.id),
      identity,
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
      send('hello', { you: member.id, members: hub.snapshot(member.roomId, now()) });
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
    return c.json({ action: action.id, reward: await pay(user, stateId, action.id) });
  });

  app.post('/api/places/rooms/:roomId/say', requireUser, async (c) => {
    const user = c.get('user');
    if (!hit(`place-say:${user.id}`, LIMITS.placeSayPerMinutePerUser, MINUTE).ok) return c.json({ error: 'rate-limited' }, 429);
    const parsed = placeSaySchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'invalid' }, 400);
    const member = memberOf(user, c.req.param('roomId'));
    if (!member) return c.json({ error: 'not-in-room' }, 404);
    hub.say(member, parsed.data, now());
    return c.body(null, 204);
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
    return c.body(null, 201);
  });

  app.post('/api/places/leave', requireUser, (c) => {
    hub.leave(c.get('user').id);
    return c.body(null, 204);
  });

  return hub;
}
