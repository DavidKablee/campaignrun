/**
 * The one-word shout at the top of the result card.
 *
 * "Wahala" is trouble, so it belongs to a breakdown and not to a win. A good
 * run gets praise, and a bigger win gets bigger praise. The pick is a function
 * of the score so the card does not change its mind when it re-renders.
 */
export type Outcome = 'landslide' | 'majority' | 'foothold' | 'none' | 'breakdown';

const LINES: Record<Outcome, readonly string[]> = {
  landslide: ['NO BE SMALL!', 'E CHOKE!', 'YOU DON DO AM!', 'NA YOU BIG!'],
  majority: ['WELL DONE O!', 'E DEY SWEET!', 'OYA, NICE ONE!', 'SHARP SHARP!'],
  foothold: ['SMALL SMALL!', 'E GO BETTER!', 'KEEP AM UP!'],
  none: [],
  breakdown: ['WAHALA!', 'CHAI!', 'E DON HAPPEN!'],
};

export function resultExclaim(outcome: Outcome, score: number): string | null {
  const pool = LINES[outcome];
  if (pool.length === 0) return null;
  return pool[Math.abs(Math.trunc(score)) % pool.length]!;
}
