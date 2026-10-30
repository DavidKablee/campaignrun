import { liveEvents, stateIndex } from '@cr/content';
import { isClosed, isFinalWeek, remoteFeatured } from './campaignClock';
import { watDay, watWeek } from './meta';
import { campaignRows } from './trail';

/**
 * The standing live events (C81), all run from the clock and the player's own device:
 *
 * - **Weekly Tour**: one open state is featured each Lagos-time week; the first finished rally
 *   there that week pays a bonus.
 * - **Final Week**: for the last seven days the finale state is featured and the bonus can be
 *   earned once a day instead of once a week.
 * - **Rally Saturday**: announced here, but it is the sim's own double Crowd between 6 and 9 pm
 *   Lagos time on a Saturday (`weather.isRallySaturday`, already part of every replay).
 *
 * The tour and Final Week touch only the coins a finished run pays, so a replay stays valid and a
 * Contender's power is not affected (guardrail 5). The featured state is the same for everyone
 * because it is derived from the date and the calendar, not from any account.
 */
const HOUR = 3_600_000;
/** Lagos has no daylight saving: it is UTC+1 all year. */
const WAT_OFFSET = HOUR;

export type TourKind = 'tour' | 'final';

export interface Tour {
  kind: TourKind;
  stateId: string;
  stateName: string;
  coins: number;
  /** Changes when the bonus can be earned again: once a week, or once a day in the Final Week. */
  periodKey: string;
}

/** 0 is Sunday, 6 is Saturday, in Lagos time. */
export function watWeekday(now: number = Date.now()): number {
  return new Date(now + WAT_OFFSET).getUTCDay();
}

/** Lagos-time hour of the day, 0 to 23. */
function watHour(now: number): number {
  return new Date(now + WAT_OFFSET).getUTCHours();
}

/** The same window the sim's double Crowd uses: Saturday, 6 pm to 9 pm Lagos time. */
export function isRallySaturdayWindow(now: number = Date.now()): boolean {
  return !isClosed(now) && watWeekday(now) === 6 && watHour(now) >= 18 && watHour(now) < 21;
}

/** Saturday before 6 pm: the double Crowd is coming tonight. */
export function isRallySaturdayAhead(now: number = Date.now()): boolean {
  return !isClosed(now) && watWeekday(now) === 6 && watHour(now) < 18;
}

/** Monday 00:00 Lagos time of the week `now` falls in, as a UTC millisecond. */
function weekStartMs(now: number): number {
  const wat = new Date(now + WAT_OFFSET);
  const sinceMonday = (wat.getUTCDay() + 6) % 7;
  return Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate() - sinceMonday) - WAT_OFFSET;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/**
 * The states that were open when this week began (at six in the morning, after that day's
 * unlocks), so the featured state does not change when a batch unlocks mid-week.
 */
function weekPool(now: number): string[] {
  const rows = campaignRows(weekStartMs(now) + 6 * HOUR).filter((r) => r.open);
  const ids = rows.map((r) => r.id).sort();
  const outsideLagos = ids.filter((id) => id !== 'lagos');
  return outsideLagos.length > 0 ? outsideLagos : ids;
}

function nameOf(stateId: string): string {
  return stateIndex.find((s) => s.id === stateId)?.name ?? stateId;
}

function isOpen(stateId: string, now: number): boolean {
  return campaignRows(now).some((r) => r.id === stateId && r.open);
}

/** The tour in force right now, or null once the campaign has closed. */
export function currentTour(now: number = Date.now()): Tour | null {
  if (isClosed(now)) return null;
  if (isFinalWeek(now) && isOpen(liveEvents.finalWeekStateId, now)) {
    const stateId = liveEvents.finalWeekStateId;
    return { kind: 'final', stateId, stateName: nameOf(stateId), coins: liveEvents.finalWeekDailyBonus, periodKey: `final:${watDay(now)}` };
  }
  const week = watWeek(now);
  const asked = remoteFeatured();
  let stateId = asked && isOpen(asked, now) ? asked : '';
  if (!stateId) {
    const pool = weekPool(now);
    if (pool.length === 0) return null;
    stateId = pool[hash(week) % pool.length]!;
  }
  return { kind: 'tour', stateId, stateName: nameOf(stateId), coins: liveEvents.tourBonus, periodKey: `tour:${week}` };
}

/** What a finished run earns from the tour: the coins and the period it uses up, or null. */
export function tourBonusFor(
  run: { finished: boolean; stateId: string },
  claimedKey: string | null,
  now: number = Date.now(),
): { coins: number; periodKey: string; kind: TourKind; stateName: string } | null {
  if (!run.finished) return null;
  const tour = currentTour(now);
  if (!tour || tour.stateId !== run.stateId || tour.periodKey === claimedKey) return null;
  return { coins: tour.coins, periodKey: tour.periodKey, kind: tour.kind, stateName: tour.stateName };
}

export interface LiveBanner {
  id: 'tour' | 'final' | 'saturday';
  title: string;
  line: string;
  stateId?: string;
}

/** The banners for the splash: the tour or Final Week, and Rally Saturday when it is one. */
export function liveBanners(now: number = Date.now(), claimedKey: string | null = null): LiveBanner[] {
  const out: LiveBanner[] = [];
  const tour = currentTour(now);
  if (tour) {
    const done = claimedKey === tour.periodKey;
    if (tour.kind === 'final') {
      out.push({
        id: 'final',
        title: 'Final week',
        stateId: tour.stateId,
        line: done
          ? `Today's ${tour.stateName} bonus is in. Come back tomorrow.`
          : `Finish a rally in ${tour.stateName} today for ₦${tour.coins}. It comes round every day this week.`,
      });
    } else {
      out.push({
        id: 'tour',
        title: 'Weekly Tour',
        stateId: tour.stateId,
        line: done
          ? `This week's ${tour.stateName} bonus is in. A new state comes on Monday.`
          : `This week: ${tour.stateName}. Finish a rally there for ₦${tour.coins}.`,
      });
    }
  }
  if (isRallySaturdayWindow(now)) {
    out.push({ id: 'saturday', title: 'Rally Saturday', line: 'On until 9 pm. Crowd counts double on your own runs.' });
  } else if (isRallySaturdayAhead(now)) {
    out.push({ id: 'saturday', title: 'Rally Saturday', line: 'Tonight, 6 to 9 pm. Crowd counts double on your own runs.' });
  }
  return out;
}
