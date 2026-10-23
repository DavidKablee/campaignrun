import { calendar } from '@cr/content';

/**
 * Days until the campaign closes. The close date was inlined in `App.tsx` as a
 * second `Date.UTC(...)` literal while `calendar.closeAt` held the same moment
 * in content; two copies of a date the player is counting down to can drift.
 */
const CLOSE_MS = Date.parse(calendar.closeAt);

export function daysLeft(now: number = Date.now()): number {
  return Math.max(0, Math.ceil((CLOSE_MS - now) / 86_400_000));
}
