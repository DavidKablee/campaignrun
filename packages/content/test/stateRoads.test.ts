import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stateIndex, stateRoad, stateRoads } from '../src';

const dir = join(__dirname, '..', 'data', 'states');

describe('state roads table (what the server replays against)', () => {
  it('matches every shipped pack, so a pack edit cannot leave the server on an old road', () => {
    const packs = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'dummy.json');
    expect(Object.keys(stateRoads).sort()).toEqual(packs.map((f) => f.replace(/\.json$/, '')).sort());
    for (const file of packs) {
      const pack = JSON.parse(readFileSync(join(dir, file), 'utf8')) as { hazards: string[]; signatureRide: string };
      const id = file.replace(/\.json$/, '');
      expect(stateRoad(id), `${id} (run pnpm content:roads)`).toEqual({
        hazards: pack.hazards,
        signatureRide: pack.signatureRide,
      });
    }
  });

  it('covers every state in the index', () => {
    for (const s of stateIndex) expect(stateRoad(s.id), s.id).toBeDefined();
  });
});
