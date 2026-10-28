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

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2] !== 'feedback') await funnel(14);
  await feedback();
  await closeDb();
}
