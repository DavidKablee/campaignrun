import { parties, partyForContender, campaignMap, type RegionStanding } from '@cr/content';

export interface LiveTally {
  contenderId: string;
  crowd: number;
  players: number;
}

export interface LiveRegion {
  stateId: string;
  players: number;
  /** False while the region is under the server's privacy floor. */
  published: boolean;
  tallies: LiveTally[];
}

export interface BoardRegion extends RegionStanding {
  /** Where the numbers came from, which the screen has to say out loud. */
  source: 'live' | 'practice';
  players: number;
}

/**
 * Lay the server's real standings over the generated practice board.
 *
 * A region only switches to live numbers once the server publishes them, which
 * it does only above its privacy floor — below that it sends no tallies at all,
 * so there is nothing here to fall back on and the region stays on the practice
 * numbers, labelled as such. Mixing the two silently would be the one thing
 * this screen must not do.
 */
export function mergeStandings(
  generated: RegionStanding[],
  live: LiveRegion[],
  playerPartyId: string | null,
): BoardRegion[] {
  const byState = new Map(live.map((r) => [r.stateId, r]));
  return generated.map((g) => {
    const l = byState.get(g.stateId);
    if (!l || !l.published || !g.open) {
      return { ...g, source: 'practice', players: l?.players ?? 0 };
    }

    const crowdByParty = new Map<string, number>();
    for (const t of l.tallies) {
      const party = partyForContender(t.contenderId);
      if (!party) continue;
      crowdByParty.set(party.id, (crowdByParty.get(party.id) ?? 0) + t.crowd);
    }
    const tallies = parties
      .map((p) => ({ partyId: p.id, crowd: crowdByParty.get(p.id) ?? 0, isPlayer: p.id === playerPartyId }))
      .sort((a, b) => b.crowd - a.crowd || a.partyId.localeCompare(b.partyId));

    const top = tallies[0]!;
    const margin = top.crowd - (tallies[1]?.crowd ?? 0);
    const contested = margin <= campaignMap.standings.contestedWithin;
    return {
      stateId: g.stateId,
      open: true,
      tallies,
      leaderPartyId: contested ? null : top.partyId,
      contested,
      margin,
      playerCrowd: g.playerCrowd,
      source: 'live',
      players: l.players,
    };
  });
}

export function liveRegionCount(board: BoardRegion[]): number {
  return board.filter((r) => r.source === 'live').length;
}
