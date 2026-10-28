import { rides, stateIndex } from '@cr/content';

/**
 * "Beat my run": a link that carries a road, not a replay.
 *
 * The whole course is a function of the seed, so the link only needs the seed,
 * the state, the ride and the score to beat. No account, no server, and — unlike
 * a ghost — no Contender id, so nothing sensitive (guardrail 10) rides along.
 * The score is the sender's own claim; this is a friendly bar, not a board.
 */
export interface Challenge {
  seed: number;
  stateId: string;
  rideId: string;
  /** The Turnout to beat. */
  crowd: number;
  /** The short course (a quick rally), so the receiver drives the same road. */
  quick: boolean;
  /** The sender's board name, or '' for "a friend". */
  from: string;
}

const KEY = 'c=';
const NAME_OK = /^[A-Za-z0-9_]{3,16}$/;
const MAX_CROWD = 99_999;

export function encodeChallenge(c: Challenge): string {
  const name = NAME_OK.test(c.from) ? c.from : '';
  return `${KEY}${[c.seed.toString(36), c.stateId, c.rideId, c.crowd, c.quick ? 1 : 0, name].join('~')}`;
}

export function decodeChallenge(raw: string): Challenge | null {
  const body = raw.startsWith('#') ? raw.slice(1) : raw;
  if (!body.startsWith(KEY)) return null;
  const parts = body.slice(KEY.length).split('~');
  if (parts.length !== 6) return null;
  const [seedPart, stateId, rideId, crowdPart, quickPart, from] = parts as [string, string, string, string, string, string];

  if (!/^[0-9a-z]{1,7}$/.test(seedPart)) return null;
  const seed = parseInt(seedPart, 36);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) return null;
  if (!stateIndex.some((s) => s.id === stateId)) return null;
  if (!rides.some((r) => r.id === rideId && r.playable)) return null;
  if (!/^\d{1,5}$/.test(crowdPart)) return null;
  const crowd = Number(crowdPart);
  if (crowd > MAX_CROWD) return null;
  if (quickPart !== '0' && quickPart !== '1') return null;
  if (from !== '' && !NAME_OK.test(from)) return null;

  return { seed, stateId, rideId, crowd, quick: quickPart === '1', from };
}

export function challengeUrl(base: string, c: Challenge): string {
  return `${base.split('#')[0]}#${encodeChallenge(c)}`;
}

/** The line that goes with the link when it is shared. */
export function challengeText(c: Challenge, rideName: string, stateName: string): string {
  return `Beat my ${c.crowd} Turnout on Campaigner — same road (${stateName} · ${rideName}). Game scores, not a poll.`;
}

export interface ChallengeVerdict {
  won: boolean;
  tied: boolean;
  margin: number;
}

export function judgeChallenge(theirs: number, mine: number): ChallengeVerdict {
  return { won: mine > theirs, tied: mine === theirs, margin: Math.abs(mine - theirs) };
}
