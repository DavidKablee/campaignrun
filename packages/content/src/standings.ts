import partiesJson from '../data/parties.json';
import mapJson from '../data/map.json';
import { mapSchema, partySchema, type CampaignMapLayout, type Party } from './schemas';

export const parties: Party[] = partySchema.array().parse(partiesJson);
export const campaignMap: CampaignMapLayout = mapSchema.parse(mapJson);

export function partyById(id: string): Party | undefined {
  return parties.find((p) => p.id === id);
}

/** Each Contender leads exactly one Party; picking a Contender picks the colour on the map. */
export function partyForContender(contenderId: string | null | undefined): Party | undefined {
  if (!contenderId) return undefined;
  return parties.find((p) => p.contenderId === contenderId);
}

export function regionLayout(stateId: string) {
  return campaignMap.regions.find((r) => r.id === stateId);
}

/** FNV-1a. Deterministic, integer-only, and identical in every browser — the map
 *  must look the same on two devices with the same progress. */
export function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * A fixed scramble of the rank slots, derived from the party count rather than
 * written down, so adding a seventh Party does not silently unbalance the map.
 */
const SLOT_ORDER: number[] = Array.from({ length: parties.length }, (_, i) => i).sort(
  (a, b) => hash32(`slot:${a}`) - hash32(`slot:${b}`),
);

/**
 * Crowd for every Party in a region before the player's own runs are applied.
 *
 * These numbers are generated, not collected: R0 has no server, so there is
 * nothing real to show and the UI says so.
 *
 * Guardrail 5 says all six Contenders are equal, and on a 37-region board that
 * has to be true by construction, not on average — drawing six independent
 * values per region left one Party leading 13 regions and another leading 1
 * before anyone had played. So a region's six values are drawn from its state
 * id, sorted into ranks, and the ranks are dealt onto the parties by an offset
 * that walks a scrambled cycle down the layout. Each block of six regions deals
 * every rank to every Party exactly once, so across the whole map no Party can
 * lead more than one region more than any other. Party identity never enters
 * the value itself, only which rank it is handed.
 */
export function rivalCrowds(stateId: string): number[] {
  const { rivalCrowdMin, rivalCrowdSpan } = campaignMap.standings;
  const n = parties.length;
  const placed = campaignMap.regions.findIndex((r) => r.id === stateId);
  const idx = placed >= 0 ? placed : hash32(stateId) % n;
  const ranked = Array.from(
    { length: n },
    (_, i) => rivalCrowdMin + (hash32(`${stateId}:${i}`) % rivalCrowdSpan),
  ).sort((a, b) => b - a);
  // Walk the scramble within each block, then shift by the block, so the deal
  // stays balanced without laying a visible repeating pattern across the map.
  const offset = (SLOT_ORDER[idx % n]! + Math.floor(idx / n)) % n;
  return Array.from({ length: n }, (_, p) => ranked[(p + offset) % n]!);
}

export interface PartyTally {
  partyId: string;
  crowd: number;
  /** True for the Party the player is campaigning for. */
  isPlayer: boolean;
}

export interface RegionStanding {
  stateId: string;
  /** Calendar-open and a pack has shipped. A closed region is never held. */
  open: boolean;
  /** Highest Crowd first. */
  tallies: PartyTally[];
  /** Null when the region is closed, or when the top two are too close to call. */
  leaderPartyId: string | null;
  contested: boolean;
  /** Gap between first and second. 0 for a closed region. */
  margin: number;
  playerCrowd: number;
}

export interface StandingsInput {
  stateId: string;
  open: boolean;
}

/**
 * One region's board. `playerCrowd` is the player's best Crowd there — a real
 * score from a real run, which replaces the generated value for their own Party.
 */
export function regionStanding(
  input: StandingsInput,
  playerPartyId: string | null,
  playerCrowd: number,
): RegionStanding {
  const generated = rivalCrowds(input.stateId);
  const tallies: PartyTally[] = parties.map((p, i) => {
    const isPlayer = p.id === playerPartyId;
    return { partyId: p.id, crowd: isPlayer ? playerCrowd : generated[i]!, isPlayer };
  });
  // Ties resolve by party order so the board never flickers between two equal rows.
  tallies.sort((a, b) => b.crowd - a.crowd || a.partyId.localeCompare(b.partyId));

  if (!input.open) {
    return { stateId: input.stateId, open: false, tallies, leaderPartyId: null, contested: false, margin: 0, playerCrowd };
  }
  const top = tallies[0]!;
  const second = tallies[1];
  const margin = top.crowd - (second?.crowd ?? 0);
  const contested = margin <= campaignMap.standings.contestedWithin;
  return {
    stateId: input.stateId,
    open: true,
    tallies,
    leaderPartyId: contested ? null : top.partyId,
    contested,
    margin,
    playerCrowd,
  };
}

export interface BoardTotals {
  /** Regions held, by party id. Contested and closed regions are in neither. */
  held: Record<string, number>;
  contested: number;
  closed: number;
  /** Regions the player's Party leads. */
  playerHeld: number;
  /** Sum of the player's own best Crowd across open regions. */
  playerCrowd: number;
}

export function boardTotals(standings: RegionStanding[], playerPartyId: string | null): BoardTotals {
  const held: Record<string, number> = {};
  for (const p of parties) held[p.id] = 0;
  let contested = 0;
  let closed = 0;
  let playerCrowd = 0;
  for (const s of standings) {
    if (!s.open) {
      closed++;
      continue;
    }
    playerCrowd += s.playerCrowd;
    if (s.leaderPartyId) held[s.leaderPartyId] = (held[s.leaderPartyId] ?? 0) + 1;
    else contested++;
  }
  return { held, contested, closed, playerHeld: playerPartyId ? (held[playerPartyId] ?? 0) : 0, playerCrowd };
}

export function campaignStandings(
  regions: StandingsInput[],
  playerPartyId: string | null,
  bestByState: Record<string, { crowd: number } | undefined>,
): RegionStanding[] {
  return regions.map((r) => regionStanding(r, playerPartyId, bestByState[r.stateId]?.crowd ?? 0));
}
