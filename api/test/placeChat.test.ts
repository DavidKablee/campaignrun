import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pg from 'pg';
import { places } from '@cr/content';
import { hashTerm } from '../../packages/content/src/guardrails.ts';
import { createApp } from '../src/app';
import { migrate } from '../src/migrate';
import { memoryMailer } from '../src/mailer';
import { resetRateLimits } from '../src/rateLimit';
import { checkText, statusFor, tidy } from '../src/placeChat';
import { createChat } from '../src/placeChat';
import type { Db } from '../src/db';

describe('typed chat rules (C93)', () => {
  const hashes = new Set([hashTerm('zorbleflux'), hashTerm('big bad wolf')]);
  const ok = (t: string) => checkText(t, { hashes });
  const refused = (t: string, last?: string) => {
    const v = checkText(t, { hashes, last });
    return v.ok ? null : v.reason;
  };

  it('lets ordinary talk through, tidied', () => {
    expect(ok('  Good   morning, neighbour! ')).toEqual({ ok: true, text: 'Good morning, neighbour!' });
    expect(ok('Abeg, how far? Market dey sweet today').ok).toBe(true);
  });

  it('refuses empty text and anything past the length limit', () => {
    expect(refused('   ')).toBe('empty');
    expect(refused('a'.repeat(places.chat.maxChars) + 'b')).not.toBeNull();
    expect(ok('Abeg make we gather for the market today, bring your neighbours too').ok).toBe(true);
    expect(refused('Abeg make we gather for the market today and bring all your neighbours and friends too')).toBe('too-long');
  });

  it('refuses links, handles and emails', () => {
    for (const t of ['see https://example.com now', 'go to www.thing.org', 'join t.me/abc', 'mail me bob@site.com', '@someone hi', 'visit mysite . com', 'visit mysite dot com']) {
      expect(refused(t), t).toBe('links');
    }
  });

  it('refuses phone and account numbers however they are spaced or spelled', () => {
    for (const t of ['call 08031234567', 'call 0803 123 4567', '0-8-0-3-1-2-3-4-5', 'acct 0123456789', 'zero eight zero three one two three']) {
      expect(refused(t), t).toBe('numbers');
    }
    expect(ok('I have 3 flyers and 2 more').ok).toBe(true);
    expect(ok('Kano 2027 rally, who dey come?').ok).toBe(true);
  });

  it('refuses floods of the same character or word', () => {
    expect(refused('heeeeeeeeeeelp')).toBe('flood');
    expect(refused('go go go go go go')).toBe('flood');
    expect(refused('aaabbbaaabbb')).toBe('flood');
  });

  it('refuses the same message twice in a row', () => {
    expect(refused('Good morning', 'good morning')).toBe('repeat');
    expect(refused('Good morning', 'Good evening')).toBeNull();
  });

  it('uses the hashed word filter, including pairs and spaced-out letters', () => {
    expect(refused('you are a zorbleflux')).toBe('blocked');
    expect(refused('Z0RBLEFLUX!')).toBe('blocked');
    expect(refused('the big bad wolf is here')).toBe('blocked');
    expect(refused('z o r b l e f l u x')).toBe('blocked');
    expect(refused('flux of zorble')).toBeNull();
  });

  it('strips control and zero-width characters before judging', () => {
    expect(tidy('he​llo\u0007 there')).toBe('he llo there');
  });

  it('opens typing only after the account age and a finished job, and only while the switch is on', () => {
    const base = { accountAgeHours: places.chat.minAccountHours, jobsDone: places.chat.minJobsDone };
    expect(statusFor({ enabled: false, ...base }).lock).toBe('off');
    expect(statusFor({ enabled: true, ...base, accountAgeHours: places.chat.minAccountHours - 0.1 }).lock).toBe('age');
    expect(statusFor({ enabled: true, ...base, jobsDone: 0 }).lock).toBe('job');
    expect(statusFor({ enabled: true, ...base })).toMatchObject({ canType: true, lock: null, maxChars: places.chat.maxChars });
  });
});

const url = process.env.DATABASE_URL;
const run = url ? describe : describe.skip;

run('typed chat api (C93)', () => {
  let pool: pg.Pool;
  let database: Db;
  let app: ReturnType<typeof createApp>;
  let clock = Date.UTC(2026, 9, 30, 12, 0, 0);
  let seq = 0;

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
    resetRateLimits();
    clock = Date.UTC(2026, 9, 30, 12, 0, 0);
    process.env.CR_CHAT_ENABLED = 'true';
  });
  afterEach(() => {
    delete process.env.CR_CHAT_ENABLED;
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

  /** A player who is old enough and has finished a job, so typing is open to them. */
  async function typist(name: string, state: string) {
    const cookie = await guest(name);
    await database.query(`update users set created_at = $2 where username = $1`, [name, new Date(clock - 48 * 3_600_000)]);
    await database.query(
      `insert into place_jobs (user_id, day, job_id, progress, done_at) select id, '2026-10-30', 'done', 1, now() from users where username = $1`,
      [name],
    );
    const res = await json('/api/places/join', cookie, { stateId: state, kind: 'market' });
    const body = (await res.json()) as { roomId: string; you: string };
    return { cookie, ...body, name };
  }

  const chat = (who: { cookie: string; roomId: string }, text: string) =>
    json(`/api/places/rooms/${encodeURIComponent(who.roomId)}/chat`, who.cookie, { text });

  const newState = () => ['kano', 'lagos', 'rivers', 'oyo', 'kaduna', 'enugu', 'edo', 'ogun'][seq++ % 8]!;

  async function listen(who: { cookie: string; roomId: string }) {
    const stream = await app.request(`/api/places/rooms/${encodeURIComponent(who.roomId)}/stream`, { headers: { cookie: who.cookie } });
    const reader = stream.body!.getReader();
    const decoder = new TextDecoder();
    const state = { seen: '' };
    const read = async (until: RegExp) => {
      while (!until.test(state.seen)) {
        const { value, done } = await reader.read();
        if (done) break;
        state.seen += decoder.decode(value);
      }
    };
    await read(/event: hello/);
    return { state, read, stop: () => reader.cancel() };
  }

  it('is off by default: the switch says so and nothing is relayed', async () => {
    delete process.env.CR_CHAT_ENABLED;
    const a = await typist('offa', newState());
    const st = (await (await json('/api/places/chat', a.cookie, undefined, 'GET')).json()) as { enabled: boolean; canType: boolean; lock: string };
    expect(st).toMatchObject({ enabled: false, canType: false, lock: 'off' });
    const res = await chat(a, 'hello there');
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: 'chat-locked', lock: 'off' });
    expect((await database.query('select 1 from place_chat')).rows).toHaveLength(0);
  });

  it('tells the join response whether this player may type', async () => {
    const cookie = await guest('newbie1');
    const res = await json('/api/places/join', cookie, { stateId: newState(), kind: 'market' });
    const body = (await res.json()) as { chat: { enabled: boolean; canType: boolean; lock: string }; chatCopy: { reasons: object; locks: object } };
    expect(body.chat).toMatchObject({ enabled: true, canType: false });
    expect(body.chatCopy.locks).toHaveProperty('age');
  });

  it('keeps a new account out until it is old enough, then until a job is finished', async () => {
    const cookie = await guest('newbie2');
    const room = (await (await json('/api/places/join', cookie, { stateId: newState(), kind: 'market' })).json()) as { roomId: string };
    const who = { cookie, roomId: room.roomId };
    let res = await chat(who, 'hello');
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ lock: 'age' });

    await database.query(`update users set created_at = $1 where username = 'newbie2'`, [new Date(clock - 25 * 3_600_000)]);
    res = await chat(who, 'hello');
    expect(await res.json()).toMatchObject({ lock: 'job' });

    await database.query(
      `insert into place_jobs (user_id, day, job_id, progress, done_at) select id, '2026-10-30', 'x', 1, now() from users where username = 'newbie2'`,
    );
    expect((await chat(who, 'hello')).status).toBe(200);
  });

  it('relays an accepted message to the room', async () => {
    const state = newState();
    const a = await typist('talka', state);
    const b = await typist('talkb', state);
    const ear = await listen(b);
    expect((await chat(a, 'Good morning Kano')).status).toBe(200);
    await ear.read(/"text":"Good morning Kano"/);
    expect(ear.state.seen).toMatch(/event: say[\s\S]*"id":"[^"]+"[\s\S]*"text":"Good morning Kano"/);
    await ear.stop();
  });

  it('drops a refused message with a reason and shows it to no one', async () => {
    const state = newState();
    const a = await typist('refa', state);
    const res = await chat(a, 'call 08031234567');
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ error: 'refused', reason: 'numbers', field: 'numbers' });
    expect((await database.query('select 1 from place_chat')).rows).toHaveLength(0);
    for (const reason of ['numbers', 'links', 'flood', 'repeat', 'blocked', 'empty', 'too-long']) {
      expect(places.chat.reasons[reason], reason).toBeDefined();
    }
  });

  it('allows one message per gap', async () => {
    const a = await typist('gapa', newState());
    expect((await chat(a, 'first one')).status).toBe(200);
    clock += 1000;
    const res = await chat(a, 'second one');
    expect(res.status).toBe(429);
    expect(((await res.json()) as { retryAfter: number }).retryAfter).toBeGreaterThan(0);
    clock += places.chat.gapSeconds * 1000;
    expect((await chat(a, 'second one')).status).toBe(200);
  });

  it('counts a typed message toward the day\'s say job like a phrase', async () => {
    const a = await typist('jobsa', newState());
    const res = await chat(a, 'hello all');
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveProperty('progress');
  });

  it('cools a sender down after repeated blocked tries: they still see their text, others do not', async () => {
    const state = newState();
    const a = await typist('strika', state);
    const b = await typist('strikb', state);
    for (let i = 0; i < places.chat.strikesToCoolDown; i++) {
      clock += 5000;
      expect((await chat(a, `call 0803123456${i}`)).status).toBe(422);
    }
    const ear = await listen(b);
    clock += 5000;
    expect((await chat(a, 'secret words')).status).toBe(200);
    clock += 5000;
    expect((await chat(b, 'visible words')).status).toBe(200);
    await ear.read(/visible words/);
    expect(ear.state.seen).not.toContain('secret words');
    await ear.stop();
    const { rows } = await database.query<{ shadowed: boolean }>(`select shadowed from place_chat where body = 'secret words'`);
    expect(rows[0]!.shadowed).toBe(true);
  });

  it('hides a player\'s text from others after reports from enough different people', async () => {
    const state = newState();
    const target = await typist('target', state);
    const reporters = [];
    for (const n of ['rep1', 'rep2', 'rep3']) reporters.push(await typist(n, state));
    const report = (who: { cookie: string; roomId: string }) =>
      json(`/api/places/rooms/${encodeURIComponent(who.roomId)}/report`, who.cookie, { memberId: target.you, reason: 'harassment' });

    // The same person reporting twice is one voice.
    await report(reporters[0]!);
    await report(reporters[0]!);
    await report(reporters[1]!);
    clock += 5000;
    let ear = await listen(reporters[2]!);
    await chat(target, 'before the third report');
    await ear.read(/before the third report/);
    await ear.stop();

    await report(reporters[2]!);
    clock += 5000;
    ear = await listen(reporters[2]!);
    await chat(target, 'after the third report');
    clock += 5000;
    await chat(reporters[0]!, 'marker message');
    await ear.read(/marker message/);
    expect(ear.state.seen).not.toContain('after the third report');
    await ear.stop();

    // The hide lapses on its own.
    clock += (places.chat.hideHours + 1) * 3_600_000;
    const st = await database.query<{ hidden: boolean }>(`select coalesce(chat_hidden_until > $1::timestamptz, false) as hidden from users where username = 'target'`, [new Date(clock)]);
    expect(st.rows[0]!.hidden).toBe(false);
  });

  it('keeps messages only for the retention window', async () => {
    const a = await typist('keepa', newState());
    await chat(a, 'old message');
    clock += (places.chat.retentionHours - 1) * 3_600_000;
    await chat(a, 'newer message');
    const svc = createChat({ database, now: () => clock + 2 * 3_600_000 });
    expect(await svc.purge()).toBe(1);
    const { rows } = await database.query<{ body: string }>('select body from place_chat');
    expect(rows.map((r) => r.body)).toEqual(['newer message']);
  });

  it('leaves the preset phrases working whether chat is on or off', async () => {
    delete process.env.CR_CHAT_ENABLED;
    const a = await typist('presa', newState());
    const res = await json(`/api/places/rooms/${encodeURIComponent(a.roomId)}/say`, a.cookie, { phrase: places.phrases[0]!.id });
    expect(res.status).toBe(200);
  });

  it('deletes a player\'s messages with their account', async () => {
    const a = await typist('gonea', newState());
    await chat(a, 'bye now');
    await database.query(`delete from users where username = 'gonea'`);
    expect((await database.query('select 1 from place_chat')).rows).toHaveLength(0);
  });
});
