import { describe, expect, it } from 'vitest';
import {
  activeContenders,
  boardTotals,
  campaignMap,
  campaignStandings,
  hash32,
  parties,
  partyForContender,
  regionStanding,
  rivalCrowds,
  stateIndex,
} from '../src/index';
import { collectStrings, findViolations, loadHashes } from '../src/guardrails';

const allOpen = campaignMap.regions.map((r) => ({ stateId: r.id, open: true }));

describe('parties', () => {
  it('is one invented Party per active Contender', () => {
    expect(parties).toHaveLength(activeContenders.length);
    expect(new Set(parties.map((p) => p.id)).size).toBe(parties.length);
    for (const c of activeContenders) {
      const party = partyForContender(c.id);
      expect(party, `no party for ${c.id}`).toBeDefined();
    }
    // and no Party points at a Contender that does not exist
    const ids = new Set(activeContenders.map((c) => c.id));
    for (const p of parties) expect(ids.has(p.contenderId), `${p.id} -> ${p.contenderId}`).toBe(true);
  });

  it('gives every Party a distinct name, tag and map colour', () => {
    expect(new Set(parties.map((p) => p.name)).size).toBe(parties.length);
    expect(new Set(parties.map((p) => p.tag)).size).toBe(parties.length);
    expect(new Set(parties.map((p) => p.color.toLowerCase())).size).toBe(parties.length);
  });

  it('carries no slogan, emblem or symbol field (guardrail 3)', () => {
    for (const p of parties) {
      for (const key of Object.keys(p)) {
        expect(['slogan', 'chant', 'symbol', 'emblem', 'logo', 'motto']).not.toContain(key);
      }
    }
  });

  it('passes the name guardrail like every other content file', () => {
    const hashes = loadHashes();
    expect(hashes.size).toBeGreaterThan(0);
    for (const text of collectStrings(parties)) {
      expect(findViolations(text, hashes), text).toEqual([]);
    }
  });
});

describe('campaign map layout', () => {
  it('places every calendar state exactly once', () => {
    const placed = campaignMap.regions.map((r) => r.id);
    expect(new Set(placed).size).toBe(placed.length);
    expect([...placed].sort()).toEqual([...stateIndex.map((s) => s.id)].sort());
  });

  it('never stacks two regions on the same hex', () => {
    const seen = new Set(campaignMap.regions.map((r) => `${r.col},${r.row}`));
    expect(seen.size).toBe(campaignMap.regions.length);
  });

  it('interlocks: neighbouring rows are offset by half a hex', () => {
    const rows = [...new Set(campaignMap.regions.map((r) => r.row))].sort((a, b) => a - b);
    for (const row of rows) {
      const cols = campaignMap.regions.filter((r) => r.row === row).map((r) => r.col);
      const half = cols.map((c) => Number.isInteger(c));
      expect(new Set(half).size, `row ${row} mixes whole and half columns`).toBe(1);
    }
    for (let i = 1; i < rows.length; i++) {
      const a = campaignMap.regions.find((r) => r.row === rows[i - 1])!.col;
      const b = campaignMap.regions.find((r) => r.row === rows[i])!.col;
      expect(Number.isInteger(a), `rows ${rows[i - 1]}/${rows[i]} share parity`).not.toBe(Number.isInteger(b));
    }
  });
});

describe('generated standings', () => {
  it('is deterministic and inside the content band', () => {
    const { rivalCrowdMin, rivalCrowdSpan } = campaignMap.standings;
    for (const r of campaignMap.regions) {
      const a = rivalCrowds(r.id);
      expect(a).toEqual(rivalCrowds(r.id));
      expect(a).toHaveLength(parties.length);
      for (const v of a) {
        expect(v).toBeGreaterThanOrEqual(rivalCrowdMin);
        expect(v).toBeLessThan(rivalCrowdMin + rivalCrowdSpan);
      }
    }
  });

  /** Guardrail 5: no Contender may start ahead of another. */
  it('deals an equal number of regions to every Party before anyone plays', () => {
    const totals = boardTotals(campaignStandings(allOpen, null, {}), null);
    const held = parties.map((p) => totals.held[p.id] ?? 0);
    expect(Math.max(...held) - Math.min(...held)).toBeLessThanOrEqual(1);
    expect(held.reduce((a, b) => a + b, 0) + totals.contested).toBe(campaignMap.regions.length);
  });

  it('keeps generated Crowd totals close across parties', () => {
    const sums = parties.map(() => 0);
    for (const r of campaignMap.regions) rivalCrowds(r.id).forEach((v, i) => (sums[i]! += v));
    const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
    expect((Math.max(...sums) - Math.min(...sums)) / mean).toBeLessThan(0.1);
  });

  it('draws a region values from the state id alone, never from a Party', () => {
    // Party identity may only decide which rank a Party is handed. The six
    // numbers themselves must come out of the state id, so the board is the
    // same set of numbers however the content file orders the parties.
    const { rivalCrowdMin, rivalCrowdSpan } = campaignMap.standings;
    for (const r of campaignMap.regions) {
      const expected = Array.from(
        { length: parties.length },
        (_, i) => rivalCrowdMin + (hash32(`${r.id}:${i}`) % rivalCrowdSpan),
      ).sort((a, b) => a - b);
      expect([...rivalCrowds(r.id)].sort((a, b) => a - b), r.id).toEqual(expected);
    }
  });
});

describe('a region board', () => {
  const party = parties[0]!;

  it('uses the player real Crowd in place of their generated tally', () => {
    const s = regionStanding({ stateId: 'lagos', open: true }, party.id, 999);
    const mine = s.tallies.find((t) => t.partyId === party.id)!;
    expect(mine.crowd).toBe(999);
    expect(mine.isPlayer).toBe(true);
    expect(s.leaderPartyId).toBe(party.id);
    expect(s.playerCrowd).toBe(999);
  });

  it('leaves a region unheld when the top two are too close to call', () => {
    const s = regionStanding({ stateId: 'lagos', open: true }, party.id, 999);
    const runnerUp = s.tallies[1]!.crowd;
    const tied = regionStanding({ stateId: 'lagos', open: true }, party.id, runnerUp);
    expect(tied.contested).toBe(true);
    expect(tied.leaderPartyId).toBeNull();
  });

  it('never hands a closed region to anyone', () => {
    const s = regionStanding({ stateId: 'zamfara', open: false }, party.id, 10_000);
    expect(s.leaderPartyId).toBeNull();
    expect(s.contested).toBe(false);
    expect(s.margin).toBe(0);
  });

  it('counts held + contested + closed as the whole board', () => {
    const mixed = campaignMap.regions.map((r, i) => ({ stateId: r.id, open: i % 3 !== 0 }));
    const totals = boardTotals(campaignStandings(mixed, party.id, { lagos: { crowd: 42 } }), party.id);
    const held = Object.values(totals.held).reduce((a, b) => a + b, 0);
    expect(held + totals.contested + totals.closed).toBe(campaignMap.regions.length);
    expect(totals.playerHeld).toBe(totals.held[party.id]);
  });

  it('only counts player Crowd from open regions', () => {
    const closed = campaignMap.regions.map((r) => ({ stateId: r.id, open: false }));
    expect(boardTotals(campaignStandings(closed, party.id, { lagos: { crowd: 42 } }), party.id).playerCrowd).toBe(0);
  });
});
