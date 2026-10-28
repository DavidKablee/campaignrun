import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pg from 'pg';
import { createApp } from '../src/app';
import { migrate } from '../src/migrate';
import { memoryMailer } from '../src/mailer';
import { resetRateLimits } from '../src/rateLimit';
import { analytics, limits } from '@cr/content';

/**
 * The two anonymous surfaces (C78): usage counters with the weekly tally, and state corrections.
 * Real Postgres, like api.test.ts; skipped without DATABASE_URL.
 */
const url = process.env.DATABASE_URL;
const run = url ? describe : describe.skip;

run('anonymous counters, tally and corrections', () => {
  let pool: pg.Pool;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: url });
    await migrate(pool);
    app = createApp(pool, memoryMailer(), { requireReplay: false });
  });
  afterAll(async () => {
    await pool.end();
  });
  beforeEach(async () => {
    await pool.query('truncate event_counts');
    await pool.query('truncate state_feedback');
    resetRateLimits();
  });

  const post = (path: string, body: unknown) =>
    app.request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

  it('counts events by day, name and state, and adds batches together', async () => {
    const res = await post('/api/events', { events: [{ name: 'visit' }, { name: 'run_finish', state: 'kano' }, { name: 'run_finish', state: 'kano' }] });
    expect(res.status).toBe(204);
    await post('/api/events', { events: [{ name: 'run_finish', state: 'kano' }] });
    const { rows } = await pool.query("select name, state_id, n::int from event_counts order by name");
    expect(rows).toEqual([
      { name: 'run_finish', state_id: 'kano', n: 3 },
      { name: 'visit', state_id: '', n: 1 },
    ]);
  });

  it('stores nothing that identifies a visitor', async () => {
    const { rows } = await pool.query(
      "select column_name from information_schema.columns where table_name in ('event_counts', 'state_feedback')",
    );
    const cols = rows.map((r) => r.column_name as string);
    expect(cols.some((c) => /user|ip|device|session|email|token/.test(c))).toBe(false);
  });

  it('refuses an event off the list, an unknown state and an oversize batch', async () => {
    expect((await post('/api/events', { events: [{ name: 'sell_data' }] })).status).toBe(400);
    expect((await post('/api/events', { events: [{ name: 'run_finish', state: 'atlantis' }] })).status).toBe(400);
    const big = Array.from({ length: limits.events.maxPerRequest + 1 }, () => ({ name: analytics.events[0]! }));
    expect((await post('/api/events', { events: big })).status).toBe(400);
    expect((await post('/api/events', { nope: 1 })).status).toBe(400);
    const { rows } = await pool.query('select count(*)::int as n from event_counts');
    expect(rows[0].n).toBe(0);
  });

  it('rate-limits events per address', async () => {
    let last = 204;
    for (let i = 0; i < limits.events.perMinutePerIp + 2; i++) last = (await post('/api/events', { events: [{ name: 'visit' }] })).status;
    expect(last).toBe(429);
  });

  it('hides the tally until the game has enough rallies, then ranks states by count only', async () => {
    const hidden = await (await app.request('/api/tally')).json();
    expect(hidden).toEqual({ windowDays: limits.tally.windowDays, hidden: true });

    await pool.query(
      `insert into event_counts (day, name, state_id, n) values
         (current_date, 'run_finish', 'kano', 70), (current_date, 'run_finish', 'oyo', 40),
         (current_date, 'run_finish', 'imo', 5), (current_date, 'run_start', 'kano', 900),
         (current_date - 30, 'run_finish', 'delta', 500)`,
    );
    const shown = await (await app.request('/api/tally')).json();
    expect(shown.hidden).toBe(false);
    expect(shown.total).toBe(115);
    expect(shown.busiest).toEqual([
      { stateId: 'kano', rallies: 70 },
      { stateId: 'oyo', rallies: 40 },
      { stateId: 'imo', rallies: 5 },
    ]);
    expect(JSON.stringify(shown)).not.toMatch(/percent|%/);
  });

  it('saves a correction with no way back to the writer', async () => {
    const res = await post('/api/feedback/state', { stateId: 'osun', landmark: 'Dye Market', topic: 'colours', note: 'Indigo is darker here.', fromHere: true });
    expect(res.status).toBe(201);
    const { rows } = await pool.query('select state_id, landmark, topic, note, from_here from state_feedback');
    expect(rows).toEqual([{ state_id: 'osun', landmark: 'Dye Market', topic: 'colours', note: 'Indigo is darker here.', from_here: true }]);
  });

  it('refuses contact details, links, unknown topics and long notes', async () => {
    const base = { stateId: 'osun', topic: 'name' };
    for (const note of ['call me 0803 123 4567', 'mail me at a@b.com', 'see https://example.com', 'www.example.com']) {
      expect((await post('/api/feedback/state', { ...base, note })).status, note).toBe(400);
    }
    expect((await post('/api/feedback/state', { ...base, topic: 'rant' })).status).toBe(400);
    expect((await post('/api/feedback/state', { ...base, stateId: 'atlantis' })).status).toBe(400);
    expect((await post('/api/feedback/state', { ...base, note: 'x'.repeat(limits.feedback.noteMaxChars + 1) })).status).toBe(400);
    const { rows } = await pool.query('select count(*)::int as n from state_feedback');
    expect(rows[0].n).toBe(0);
  });

  it('rate-limits corrections per address per day', async () => {
    let last = 201;
    for (let i = 0; i < limits.feedback.perDayPerIp + 1; i++) last = (await post('/api/feedback/state', { stateId: 'osun', topic: 'other' })).status;
    expect(last).toBe(429);
  });
});
