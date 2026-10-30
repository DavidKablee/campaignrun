import { watDay } from './meta';

export type DailyKind = 'clean' | 'landslide' | 'deliver' | 'integrity' | 'crowd';

export interface DailyChallenge {
  id: string;
  day: string;
  kind: DailyKind;
  label: string;
  target: number;
  reward: number;
}

const ROTATION: Array<{ kind: DailyKind; label: string; target: number; reward: number }> = [
  { kind: 'clean', label: 'Finish with 0 dents', target: 0, reward: 120 },
  { kind: 'landslide', label: 'Hit Overflowing in Lagos', target: 1, reward: 140 },
  { kind: 'deliver', label: 'Deliver 20 supporters', target: 20, reward: 110 },
  { kind: 'integrity', label: 'End Integrity at 80+', target: 80, reward: 130 },
  { kind: 'crowd', label: 'Score 30 Crowd', target: 30, reward: 125 },
];

/** Deterministic challenge from Africa/Lagos calendar day. */
export function todaysChallenge(now = Date.now()): DailyChallenge {
  const day = watDay(now);
  let h = 0;
  for (let i = 0; i < day.length; i++) h = (h * 33 + day.charCodeAt(i)) >>> 0;
  const pick = ROTATION[h % ROTATION.length]!;
  return { id: `${day}:${pick.kind}`, day, ...pick };
}

export function challengeMet(
  ch: DailyChallenge,
  r: { finished: boolean; dents: number; delivered: number; crowd: number; integrity: number; star: string },
): boolean {
  if (!r.finished) return false;
  switch (ch.kind) {
    case 'clean':
      return r.dents === 0;
    case 'landslide':
      return r.star === 'landslide';
    case 'deliver':
      return r.delivered >= ch.target;
    case 'integrity':
      return r.integrity >= ch.target;
    case 'crowd':
      return r.crowd >= ch.target;
    default:
      return false;
  }
}
