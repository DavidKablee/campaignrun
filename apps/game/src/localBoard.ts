import { isPlausibleRun, type RunClaim } from '@cr/sim';
import { simConfig } from '@cr/content';
import { validateUsername } from './username';
import { watDay } from './meta';

export interface LocalBoardEntry {
  name: string;
  crowd: number;
  delivered: number;
  day: string;
  stateId: string;
}

export function submitLocalBoard(
  board: LocalBoardEntry[],
  username: string,
  claim: RunClaim,
  stateId: string,
  now = Date.now(),
): { ok: true; board: LocalBoardEntry[]; name: string } | { ok: false; reason: string } {
  const nameOk = validateUsername(username);
  if (!nameOk.ok) return { ok: false, reason: nameOk.reason };
  const scoreOk = isPlausibleRun(claim, simConfig);
  if (!scoreOk.ok) return { ok: false, reason: scoreOk.reason };
  if (!claim.finished) return { ok: false, reason: 'unfinished' };

  const entry: LocalBoardEntry = {
    name: nameOk.name,
    crowd: claim.displayCrowd,
    delivered: claim.delivered,
    day: watDay(now),
    stateId,
  };
  const next = [...board, entry].sort((a, b) => b.crowd - a.crowd || b.delivered - a.delivered).slice(0, 10);
  return { ok: true, board: next, name: nameOk.name };
}
