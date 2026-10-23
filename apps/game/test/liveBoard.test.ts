import { describe, expect, it } from 'vitest';
import { campaignStandings, parties, partyForContender } from '@cr/content';
import { liveRegionCount, mergeStandings, type LiveRegion } from '../src/liveBoard';

const regions = [
  { stateId: 'lagos', open: true },
  { stateId: 'kano', open: true },
  { stateId: 'oyo', open: false },
];
const beacon = partyForContender('sister-beacon')!;
const generated = () => campaignStandings(regions, beacon.id, { lagos: { crowd: 20 } });

describe('merging the live board over the practice board', () => {
  it('keeps practice numbers for a region the server has not published', () => {
    const live: LiveRegion[] = [{ stateId: 'lagos', players: 4, published: false, tallies: [] }];
    const board = mergeStandings(generated(), live, beacon.id);
    const lagos = board.find((r) => r.stateId === 'lagos')!;
    expect(lagos.source).toBe('practice');
    // it still reports how many people have rallied, which names nobody
    expect(lagos.players).toBe(4);
    expect(lagos.tallies).toEqual(generated().find((r) => r.stateId === 'lagos')!.tallies);
  });

  it('switches a region to live numbers once the server publishes it', () => {
    const live: LiveRegion[] = [
      {
        stateId: 'lagos',
        players: 240,
        published: true,
        tallies: [
          { contenderId: 'sister-beacon', crowd: 5000, players: 120 },
          { contenderId: 'captain-kobo', crowd: 1200, players: 120 },
        ],
      },
    ];
    const lagos = mergeStandings(generated(), live, beacon.id).find((r) => r.stateId === 'lagos')!;
    expect(lagos.source).toBe('live');
    expect(lagos.leaderPartyId).toBe(beacon.id);
    expect(lagos.tallies.find((t) => t.partyId === beacon.id)!.crowd).toBe(5000);
    // every party appears, so the legend and the map agree on the roster
    expect(lagos.tallies).toHaveLength(parties.length);
  });

  it('gives a party with no live Crowd a zero rather than dropping it', () => {
    const live: LiveRegion[] = [
      { stateId: 'kano', players: 300, published: true, tallies: [{ contenderId: 'uncle-boombox', crowd: 10, players: 300 }] },
    ];
    const kano = mergeStandings(generated(), live, beacon.id).find((r) => r.stateId === 'kano')!;
    expect(kano.tallies.filter((t) => t.crowd === 0)).toHaveLength(parties.length - 1);
  });

  it('calls a published region too close when the top two are level', () => {
    const live: LiveRegion[] = [
      {
        stateId: 'kano',
        players: 300,
        published: true,
        tallies: [
          { contenderId: 'sister-beacon', crowd: 100, players: 150 },
          { contenderId: 'captain-kobo', crowd: 100, players: 150 },
        ],
      },
    ];
    const kano = mergeStandings(generated(), live, beacon.id).find((r) => r.stateId === 'kano')!;
    expect(kano.contested).toBe(true);
    expect(kano.leaderPartyId).toBeNull();
  });

  it('never hands a closed region to the live board', () => {
    const live: LiveRegion[] = [
      { stateId: 'oyo', players: 999, published: true, tallies: [{ contenderId: 'captain-kobo', crowd: 9999, players: 999 }] },
    ];
    const oyo = mergeStandings(generated(), live, beacon.id).find((r) => r.stateId === 'oyo')!;
    expect(oyo.source).toBe('practice');
    expect(oyo.leaderPartyId).toBeNull();
  });

  it('counts how many regions are actually live', () => {
    const live: LiveRegion[] = [
      { stateId: 'lagos', players: 300, published: true, tallies: [{ contenderId: 'captain-kobo', crowd: 5, players: 300 }] },
      { stateId: 'kano', players: 2, published: false, tallies: [] },
    ];
    expect(liveRegionCount(mergeStandings(generated(), live, beacon.id))).toBe(1);
  });

  it('ignores a Contender the content pack no longer has', () => {
    const live: LiveRegion[] = [
      { stateId: 'kano', players: 300, published: true, tallies: [{ contenderId: 'retired-person', crowd: 500, players: 300 }] },
    ];
    const kano = mergeStandings(generated(), live, beacon.id).find((r) => r.stateId === 'kano')!;
    expect(kano.tallies.every((t) => t.crowd === 0)).toBe(true);
  });
});
