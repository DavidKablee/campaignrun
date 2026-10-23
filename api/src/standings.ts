import { campaignMap } from '@cr/content';
import type { Db } from './db.ts';
import { LIMITS, REQUIRE_VERIFIED_FOR_BOARDS } from './limits.ts';

/**
 * C41: everything public counts confirmed addresses only.
 *
 * The privacy floor below is what withholds a region's Contender breakdown
 * until enough people have played there. Counting unverified accounts would
 * make that floor a formality — 200 signups is an afternoon of scripting, and
 * clearing the floor is exactly what publishes other people's data.
 */
const verifiedOnly = REQUIRE_VERIFIED_FOR_BOARDS ? 'and u.email_verified_at is not null' : '';

/**
 * How many distinct players must have rallied in a region before its party
 * breakdown is published.
 *
 * This is a privacy floor, not a cosmetic one. A region's party tallies are
 * built from Contender choices, which guardrail 10 calls sensitive data; with
 * two players in a region an aggregate is not an aggregate, it names them.
 * Guardrail 2 sets the same kind of floor for polling-style numbers at 200
 * uniques per state, and the community Rally Map in the spec uses that number,
 * so this matches it rather than inventing a softer one. The figure lives in
 * content because the About page quotes it to the player; `CR_MIN_PLAYERS`
 * only exists to lower it for a local demo.
 *
 * Below the floor the API reports the region as pending and sends no tallies at
 * all — not zeroes, not a leader, nothing to reconstruct from.
 */
export const MIN_PLAYERS_PER_REGION = Number(
  process.env.CR_MIN_PLAYERS ?? campaignMap.standings.minPlayersPerRegion,
);

export interface RegionTally {
  contenderId: string;
  crowd: number;
  players: number;
}

export interface LiveRegion {
  stateId: string;
  players: number;
  /** False while the region is under the privacy floor; `tallies` is then empty. */
  published: boolean;
  tallies: RegionTally[];
}

/**
 * Each player contributes their best Crowd per region, so a region is won by
 * turnout and skill together rather than by who replayed it most.
 */
export async function liveStandings(database: Db, floor = MIN_PLAYERS_PER_REGION): Promise<LiveRegion[]> {
  const { rows } = await database.query<{
    state_id: string;
    contender_id: string;
    crowd: string;
    players: string;
  }>(
    `with best as (
       select s.user_id, s.state_id, s.contender_id, max(s.crowd) as crowd
         from scores s join users u on u.id = s.user_id
        where s.contender_id is not null ${verifiedOnly}
        group by s.user_id, s.state_id, s.contender_id
     )
     select state_id, contender_id, sum(crowd)::bigint as crowd, count(distinct user_id)::bigint as players
       from best
      group by state_id, contender_id`,
  );

  const byState = new Map<string, RegionTally[]>();
  for (const r of rows) {
    const list = byState.get(r.state_id) ?? [];
    list.push({ contenderId: r.contender_id, crowd: Number(r.crowd), players: Number(r.players) });
    byState.set(r.state_id, list);
  }

  const out: LiveRegion[] = [];
  for (const [stateId, tallies] of byState) {
    // Distinct players in the region, not the sum of per-party counts: one
    // player only ever appears under one Contender at a time, but they may have
    // played under two over the life of the campaign.
    const players = await distinctPlayers(database, stateId);
    const published = players >= floor;
    out.push({
      stateId,
      players,
      published,
      tallies: published ? tallies.sort((a, b) => b.crowd - a.crowd) : [],
    });
  }
  return out.sort((a, b) => a.stateId.localeCompare(b.stateId));
}

async function distinctPlayers(database: Db, stateId: string): Promise<number> {
  const { rows } = await database.query<{ n: string }>(
    `select count(distinct s.user_id)::bigint as n
       from scores s join users u on u.id = s.user_id
      where s.state_id = $1 and s.contender_id is not null ${verifiedOnly}`,
    [stateId],
  );
  return Number(rows[0]?.n ?? 0);
}

export interface BoardRow {
  username: string;
  crowd: number;
  rideId: string;
  createdAt: string;
}

/** One row per player — their best in the region — so the board is not one player's replays. */
export async function regionBoard(database: Db, stateId: string, limit = 20): Promise<BoardRow[]> {
  const { rows } = await database.query<{
    username: string;
    crowd: number;
    ride_id: string;
    created_at: Date;
  }>(
    `select distinct on (s.user_id) u.username, s.crowd, s.ride_id, s.created_at
       from scores s join users u on u.id = s.user_id
      where s.state_id = $1 ${verifiedOnly}
      order by s.user_id, s.crowd desc`,
    [stateId],
  );
  return rows
    .map((r) => ({ username: r.username, crowd: r.crowd, rideId: r.ride_id, createdAt: r.created_at.toISOString() }))
    .sort((a, b) => b.crowd - a.crowd)
    .slice(0, Math.min(limit, LIMITS.boardMaxRows));
}
