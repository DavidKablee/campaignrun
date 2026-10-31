import { closeDb, db } from './db.ts';

/**
 * What the anonymous tables say, for the person running the game.
 *
 *   node --experimental-strip-types src/report.ts            funnel for the last 14 days, then corrections
 *   node --experimental-strip-types src/report.ts feedback   corrections only, newest first
 *
 * SQL only on purpose: it must run on a box that has the database URL and nothing else.
 */
const FUNNEL = [
  'visit',
  'run_start',
  'run_second',
  'run_finish',
  'share_whatsapp',
  'share_native',
  'share_copy',
  'share_card',
  'challenge_open',
  'challenge_start',
  'challenge_finish',
  'feedback_sent',
];

async function funnel(days: number) {
  const { rows } = await db().query<{ day: string; name: string; n: string }>(
    `select day::text, name, sum(n)::bigint as n from event_counts
      where day > (now() at time zone 'utc')::date - $1::int group by day, name order by day desc`,
    [days],
  );
  const byDay = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const d = byDay.get(r.day) ?? {};
    d[r.name] = Number(r.n);
    byDay.set(r.day, d);
  }
  console.log(['day', ...FUNNEL].join('\t'));
  for (const [day, d] of byDay) console.log([day, ...FUNNEL.map((k) => d[k] ?? 0)].join('\t'));
  const total = (k: string) => [...byDay.values()].reduce((a, d) => a + (d[k] ?? 0), 0);
  const ratio = (a: string, b: string) => (total(b) ? `${((100 * total(a)) / total(b)).toFixed(1)}%` : 'n/a');
  console.log(`\nfinished per started: ${ratio('run_finish', 'run_start')}`);
  console.log(`second run per visit: ${ratio('run_second', 'visit')}`);
  console.log(`challenge shares per finished run: ${ratio('share_whatsapp', 'run_finish')} (WhatsApp only)`);
  console.log(`challenges opened per WhatsApp share: ${ratio('challenge_open', 'share_whatsapp')}`);
}

async function feedback() {
  const { rows } = await db().query<{ state_id: string; landmark: string; topic: string; note: string; from_here: boolean; created_at: string }>(
    'select state_id, landmark, topic, note, from_here, created_at::text from state_feedback order by created_at desc limit 200',
  );
  console.log(`\n${rows.length} corrections (newest first)`);
  for (const r of rows) {
    console.log(`- ${r.state_id}${r.landmark ? ` / ${r.landmark}` : ''} [${r.topic}]${r.from_here ? ' (from there)' : ''}: ${r.note || '(no note)'}`);
  }
}

/**
 * C93: the review tool for typed chat.
 *   report chat                 who was reported lately, by how many people, and what they typed
 *   report chat release <name>  lift a hide (a wrongly reported player)
 *   report chat hide <name> [h] hide a player's text from others for h hours (default 24)
 * Messages are only kept for places.chat.retentionHours, so review within a day of a report.
 */
async function chatReview(args: string[]) {
  const [action, name, hours] = args;
  if (action === 'release' || action === 'hide') {
    if (!name) throw new Error(`usage: report chat ${action} <username>${action === 'hide' ? ' [hours]' : ''}`);
    const h = Number(hours ?? 24);
    const { rows } =
      action === 'release'
        ? await db().query('update users set chat_hidden_until = null where username = $1 returning username', [name])
        : await db().query(
            "update users set chat_hidden_until = now() + make_interval(hours => $2::int) where username = $1 returning username",
            [name, Number.isFinite(h) && h > 0 ? h : 24],
          );
    console.log(rows.length ? `${action}: ${name}` : `no player called ${name}`);
    return;
  }

  const { rows } = await db().query<{
    id: string;
    username: string;
    reporters: number;
    reports: number;
    reasons: string;
    hidden_until: string | null;
    last_report: string;
  }>(
    `select u.id, u.username, count(distinct r.reporter_id)::int as reporters, count(*)::int as reports,
            string_agg(distinct r.reason, ', ') as reasons, u.chat_hidden_until::text as hidden_until, max(r.created_at)::text as last_report
       from place_reports r join users u on u.id = r.reported_id
      where r.created_at > now() - interval '48 hours'
      group by u.id, u.username, u.chat_hidden_until
      order by reporters desc, max(r.created_at) desc limit 50`,
  );
  console.log(`\n${rows.length} reported players in the last 48 hours`);
  for (const r of rows) {
    const hidden = r.hidden_until && new Date(r.hidden_until) > new Date() ? `HIDDEN until ${r.hidden_until}` : 'not hidden';
    console.log(`\n${r.username}: ${r.reporters} people, ${r.reports} reports [${r.reasons}] ${hidden}; last ${r.last_report}`);
    const msgs = await db().query<{ body: string; place_key: string; shadowed: boolean; created_at: string }>(
      'select body, place_key, shadowed, created_at::text from place_chat where user_id = $1 order by created_at desc limit 10',
      [r.id],
    );
    if (msgs.rows.length === 0) console.log('  (no typed messages kept)');
    for (const m of msgs.rows) console.log(`  ${m.created_at} ${m.place_key}${m.shadowed ? ' (shadowed)' : ''}: ${m.body}`);
  }
  const blocked = await db().query<{ n: number }>("select count(*)::int as n from place_chat where shadowed and created_at > now() - interval '24 hours'");
  console.log(`\nshadowed messages kept in the last 24 hours: ${blocked.rows[0]?.n ?? 0}`);
  console.log('to lift a hide: pnpm --filter @cr/api report chat release <username>');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2] === 'chat') {
    await chatReview(process.argv.slice(3));
  } else {
    if (process.argv[2] !== 'feedback') await funnel(14);
    await feedback();
  }
  await closeDb();
}
