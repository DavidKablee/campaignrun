import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * One player-facing word per idea (C85): the score is Crowd, the people on the bus are supporters,
 * the ride-unlock currency is Following. The old words stay out of the game's own source so a
 * string cannot drift back. Internal names (`following`, the `foothold` tier id) are fine.
 */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|css)$/.test(f) ? [p] : [];
  });
}
const src = files(join(__dirname, '../src'));

describe('player-facing vocabulary', () => {
  it('never calls the score Turnout', () => {
    const hits = src.filter((f) => /Turnout/.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('does not use poll language for the result tiers', () => {
    const hits = src.filter((f) => /['"`>](Foothold|Majority|Landslide)['"`<]|Hit Landslide/.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('does not use the ride-unlock currency under the people-on-the-bus word', () => {
    const hits = src.filter((f) => /\d[^\n]{0,12}Supporters\b/.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('the Board gives a lead as "in front", never as a margin that reads like a poll (C86)', () => {
    const board = readFileSync(join(__dirname, '../src/ui/CampaignMap.tsx'), 'utf8');
    expect(board).not.toMatch(/ahead by|leads by|\.margin/);
    expect(board).toMatch(/A game board/);
  });
});
