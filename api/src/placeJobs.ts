import { jobsForDay, placeTitleById, places, placesDay, type PlaceJob } from '@cr/content';
import type { Db } from './db.ts';

/**
 * C91: Campaign Jobs, the streak and titles.
 *
 * Progress is counted here, from actions the hub already accepted, so a client cannot report its own.
 * The jobs of a Lagos day are the same for everyone and come from the date alone (`jobsForDay`). What a
 * job pays goes through `grant`, which applies the same daily coin and Following caps as any action, so
 * jobs can never widen them. Nothing here is for sale and nothing is random.
 */

export type JobEvent =
  | { type: 'action'; action: string; company: boolean }
  | { type: 'say' }
  | { type: 'square' }
  | { type: 'friend' };

export interface JobView {
  id: string;
  label: string;
  progress: number;
  target: number;
  done: boolean;
  coins: number;
  supporters: number;
}

export interface JobsSnapshot {
  day: string;
  jobs: JobView[];
  allDone: { coins: number; supporters: number; paid: boolean };
  streak: { count: number; best: number; doneToday: boolean; next: { days: number; title: string } | null };
  titles: { id: string; label: string; earned: boolean }[];
  wearing: string | null;
}

export interface GrantResult {
  coins: number;
  supporters: number;
  capped: boolean;
}

export interface JobsProgress {
  snapshot: JobsSnapshot;
  /** Ids of the jobs this event finished. */
  completed: string[];
  reward: GrantResult | null;
  /** Label of a title earned by this event, if any. */
  newTitle: string | null;
}

const ALL_DONE_ROW = '_all';

function matches(job: PlaceJob, e: JobEvent): boolean {
  switch (e.type) {
    case 'action':
      return job.type === 'action' && job.action === e.action && (!job.withCompany || e.company);
    default:
      return job.type === e.type;
  }
}

function yesterdayOf(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

export function createJobs(deps: {
  database: Db;
  now: () => number;
  grant: (userId: string, coins: number, supporters: number) => Promise<GrantResult>;
}) {
  const { database, now, grant } = deps;

  async function snapshot(userId: string): Promise<JobsSnapshot> {
    const day = placesDay(now());
    const todays = jobsForDay(day);
    const [rows, streakRows, titleRows, userRows] = await Promise.all([
      database.query<{ job_id: string; progress: number; done: boolean }>(
        'select job_id, progress, done_at is not null as done from place_jobs where user_id = $1 and day = $2::date',
        [userId, day],
      ),
      database.query<{ last_day: string; count: number; best: number }>(
        "select to_char(last_day, 'YYYY-MM-DD') as last_day, count, best from place_streak where user_id = $1",
        [userId],
      ),
      database.query<{ title_id: string }>('select title_id from place_titles where user_id = $1', [userId]),
      database.query<{ mobilise_title: string | null }>('select mobilise_title from users where id = $1', [userId]),
    ]);
    const byId = new Map(rows.rows.map((r) => [r.job_id, r]));
    const s = streakRows.rows[0];
    // A streak that missed yesterday is over; it still reads as the best the player reached.
    const live = s && (s.last_day === day || s.last_day === yesterdayOf(day)) ? s.count : 0;
    const earned = new Set(titleRows.rows.map((r) => r.title_id));
    const next = places.streak.milestones.find((m) => m.days > live);
    return {
      day,
      jobs: todays.map((j) => {
        const r = byId.get(j.id);
        return { id: j.id, label: j.label, progress: r?.progress ?? 0, target: j.target, done: r?.done ?? false, coins: j.coins, supporters: j.supporters };
      }),
      allDone: { ...places.jobs.allDone, paid: byId.has(ALL_DONE_ROW) },
      streak: {
        count: live,
        best: s?.best ?? 0,
        doneToday: s?.last_day === day,
        next: next ? { days: next.days, title: placeTitleById(next.title)?.label ?? '' } : null,
      },
      titles: places.titles.map((t) => ({ id: t.id, label: t.label, earned: earned.has(t.id) })),
      wearing: userRows.rows[0]?.mobilise_title ?? null,
    };
  }

  /** Counts one thing a player did. Returns null when no job of today cares about it. */
  async function record(userId: string, event: JobEvent): Promise<JobsProgress | null> {
    const day = placesDay(now());
    const todays = jobsForDay(day);
    const hits = todays.filter((j) => matches(j, event));
    if (hits.length === 0) return null;

    const completed: PlaceJob[] = [];
    for (const job of hits) {
      const { rows } = await database.query<{ progress: number }>(
        `insert into place_jobs as p (user_id, day, job_id, progress) values ($1, $2::date, $3, 1)
         on conflict (user_id, day, job_id) do update set progress = least(p.progress + 1, $4)
           where p.done_at is null
         returning progress`,
        [userId, day, job.id, job.target],
      );
      if (rows[0] && rows[0].progress >= job.target) {
        // Only the call that flips done_at pays, so two requests at once cannot pay a job twice.
        const flipped = await database.query(
          'update place_jobs set done_at = now() where user_id = $1 and day = $2::date and job_id = $3 and done_at is null returning job_id',
          [userId, day, job.id],
        );
        if (flipped.rows.length > 0) completed.push(job);
      }
    }

    let coins = completed.reduce((n, j) => n + j.coins, 0);
    let supporters = completed.reduce((n, j) => n + j.supporters, 0);
    let newTitle: string | null = null;

    if (completed.length > 0) {
      const done = await database.query<{ n: number }>(
        `select count(*)::int as n from place_jobs where user_id = $1 and day = $2::date and done_at is not null and job_id <> $3`,
        [userId, day, ALL_DONE_ROW],
      );
      if ((done.rows[0]?.n ?? 0) >= todays.length) {
        const paid = await database.query(
          `insert into place_jobs (user_id, day, job_id, progress, done_at) values ($1, $2::date, $3, 0, now())
           on conflict do nothing returning job_id`,
          [userId, day, ALL_DONE_ROW],
        );
        if (paid.rows.length > 0) {
          coins += places.jobs.allDone.coins;
          supporters += places.jobs.allDone.supporters;
        }
      }

      const streak = await database.query<{ count: number }>(
        `insert into place_streak as s (user_id, last_day, count, best) values ($1, $2::date, 1, 1)
         on conflict (user_id) do update set
           count = case when s.last_day = $2::date then s.count when s.last_day = $2::date - 1 then s.count + 1 else 1 end,
           best = greatest(s.best, case when s.last_day = $2::date then s.count when s.last_day = $2::date - 1 then s.count + 1 else 1 end),
           last_day = $2::date
         returning count`,
        [userId, day],
      );
      const count = streak.rows[0]?.count ?? 1;
      const milestone = places.streak.milestones.find((m) => m.days === count);
      if (milestone) {
        const earned = await database.query(
          'insert into place_titles (user_id, title_id) values ($1, $2) on conflict do nothing returning title_id',
          [userId, milestone.title],
        );
        // A title and its bonus are earned once, however the streak is broken and rebuilt.
        if (earned.rows.length > 0) {
          coins += milestone.coins;
          supporters += milestone.supporters;
          newTitle = placeTitleById(milestone.title)?.label ?? null;
        }
      }
    }

    const reward = coins > 0 || supporters > 0 ? await grant(userId, coins, supporters) : null;
    return { snapshot: await snapshot(userId), completed: completed.map((j) => j.id), reward, newTitle };
  }

  /** Wear an earned title, or none. Returns the label to show on the name tag. */
  async function wear(userId: string, titleId: string | null): Promise<{ ok: true; label: string | null } | { ok: false }> {
    if (titleId === null) {
      await database.query('update users set mobilise_title = null where id = $1', [userId]);
      return { ok: true, label: null };
    }
    const title = placeTitleById(titleId);
    if (!title) return { ok: false };
    const have = await database.query('select 1 from place_titles where user_id = $1 and title_id = $2', [userId, titleId]);
    if (have.rows.length === 0) return { ok: false };
    await database.query('update users set mobilise_title = $2 where id = $1', [userId, titleId]);
    return { ok: true, label: title.label };
  }

  /** The label a player is wearing, for the name tag. */
  async function wearing(userId: string): Promise<string | null> {
    const { rows } = await database.query<{ mobilise_title: string | null }>('select mobilise_title from users where id = $1', [userId]);
    return placeTitleById(rows[0]?.mobilise_title)?.label ?? null;
  }

  return { snapshot, record, wear, wearing };
}

export type Jobs = ReturnType<typeof createJobs>;
