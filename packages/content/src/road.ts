import hazardsJson from '../data/hazards.json';
import roadJson from '../data/road.json';
import {
  hazardEffectSchema,
  hazardSchema,
  roadTuningSchema,
  type Hazard,
  type HazardEffect,
  type Ride,
} from './schemas';

/** Parsed at import time: a bad hazard table fails the build, not the player. */
export const hazardEffects: HazardEffect[] = hazardEffectSchema.array().parse(hazardsJson);
export const roadTuning = roadTuningSchema.parse(roadJson);

const byId = new Map(hazardEffects.map((h) => [h.id, h]));

export function hazardEffect(id: Hazard): HazardEffect {
  const found = byId.get(id);
  if (!found) throw new Error(`No effect for hazard: ${id}`);
  return found;
}

/**
 * What a state's hazards do to a run, as permille of the numbers the sim
 * already has. This is the only thing the sim learns about a state: it never
 * sees a hazard name, so adding a hazard is a content change, not a sim change.
 */
export interface RoadProfile {
  topSpeedPermille: number;
  accelPermille: number;
  brakeDecelPermille: number;
  laneChangePermille: number;
  gapPermille: number;
  doubleChancePermille: number;
  /** Per obstacle kind; a kind that is absent is unchanged (1000). */
  obstacleWeightPermille: Record<string, number>;
}

/** A road with no hazards on it: exactly the config's own numbers. */
export const NEUTRAL_ROAD: RoadProfile = {
  topSpeedPermille: 1000,
  accelPermille: 1000,
  brakeDecelPermille: 1000,
  laneChangePermille: 1000,
  gapPermille: 1000,
  doubleChancePermille: 1000,
  obstacleWeightPermille: {},
};

const ROAD_KEYS = [
  'topSpeedPermille',
  'accelPermille',
  'brakeDecelPermille',
  'laneChangePermille',
  'gapPermille',
  'doubleChancePermille',
] as const;

function mul(a: number, b: number): number {
  return Math.floor((a * b) / 1000);
}

function clampTo(value: number, bound: { min: number; max: number }): number {
  return Math.min(bound.max, Math.max(bound.min, value));
}

/**
 * Compose one state's hazards into a single profile.
 *
 * The hazards are sorted into the schema's own order first and de-duplicated.
 * Permille multiplication truncates, so composing the same three hazards in a
 * different order could differ by a micrometre — and a pack author reordering
 * a list must not change how the state plays, or a ghost recorded before the
 * edit would replay off by a hair.
 */
export function roadProfile(hazards: readonly Hazard[]): RoadProfile {
  const order = hazardSchema.options;
  const unique = [...new Set(hazards)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const out: RoadProfile = { ...NEUTRAL_ROAD, obstacleWeightPermille: {} };
  for (const id of unique) {
    const effect = hazardEffect(id);
    for (const key of ROAD_KEYS) out[key] = mul(out[key], effect.road[key]);
    for (const [kind, permille] of Object.entries(effect.obstacleWeights)) {
      out.obstacleWeightPermille[kind] = mul(out.obstacleWeightPermille[kind] ?? 1000, permille);
    }
  }
  const clamp = roadTuning.clamp;
  for (const key of ROAD_KEYS) out[key] = clampTo(out[key], clamp[key]);
  for (const kind of Object.keys(out.obstacleWeightPermille)) {
    out.obstacleWeightPermille[kind] = clampTo(
      out.obstacleWeightPermille[kind]!,
      clamp.obstacleWeightPermille,
    );
  }
  return out;
}

/** Briefing copy: one row per hazard, in the schema's order so it reads the same every run. */
export function roadLines(hazards: readonly Hazard[]): { id: Hazard; label: string; note: string }[] {
  const order = hazardSchema.options;
  return [...new Set(hazards)]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map((id) => {
      const effect = hazardEffect(id);
      return { id, label: effect.label, note: effect.note };
    });
}

export type RoadFitTone = 'good' | 'bad' | 'even';
export interface RoadFitNote {
  tone: RoadFitTone;
  text: string;
}

type ObstacleLike = { kind: string; heightMm: number; sizeTag?: 'narrow' | 'flood' | 'light' };

/**
 * The bits of `simConfig` the advice needs. Passed in rather than imported so
 * this module never depends on the parsed config — see `roadFit` in index.ts,
 * which is the version game code actually calls.
 */
export interface RoadFitContext {
  obstacles: readonly ObstacleLike[];
  hopHeightMm: number;
}

/** The strongest multiplier this road puts on any obstacle matching `match`. */
function topWeight(
  profile: RoadProfile,
  obstacles: readonly ObstacleLike[],
  match: (o: ObstacleLike) => boolean,
): number {
  let top = 1000;
  for (const o of obstacles) {
    if (!match(o)) continue;
    top = Math.max(top, profile.obstacleWeightPermille[o.kind] ?? 1000);
  }
  return top;
}

/**
 * Add a note only if this ride differs from the baseline on the stat the road
 * is asking about. A ride sitting exactly on the baseline — which is the keke,
 * on every stat — has nothing to say here, and inventing praise for the
 * yardstick would make the whole line worthless.
 */
function pushVersus(notes: RoadFitNote[], permille: number, good: string, bad: string): void {
  const base = roadTuning.advice.baselinePermille;
  if (permille > base) notes.push({ tone: 'good', text: good });
  else if (permille < base) notes.push({ tone: 'bad', text: bad });
}

/**
 * Whether this ride is the right one for this road, read off the composed
 * profile rather than written by hand — so the briefing cannot promise
 * something the course generator will not do. Bad news leads: the point of the
 * line is to stop you taking a Coaster into a flood state.
 */
export function rideRoadFit(ride: Ride, hazards: readonly Hazard[], ctx: RoadFitContext): RoadFitNote[] {
  const profile = roadProfile(hazards);
  const { advice } = roadTuning;
  const copy = advice.copy;
  const notes: RoadFitNote[] = [];
  const tagged = (tag: string) => topWeight(profile, ctx.obstacles, (o) => o.sizeTag === tag);

  // C26: 'flood' blocks size L only, 'narrow' lets size S alone through,
  // 'light' is ploughed by rides with ploughsLight. The road decides which of
  // those three it is full of; the ride decides whether that is good news.
  if (tagged('flood') >= advice.floodPermille) {
    notes.push(ride.size === 'L' ? { tone: 'bad', text: copy.floodBad } : { tone: 'good', text: copy.floodGood });
  }
  if (tagged('narrow') >= advice.narrowPermille) {
    notes.push(ride.size === 'S' ? { tone: 'good', text: copy.narrowGood } : { tone: 'bad', text: copy.narrowBad });
  }
  if (tagged('light') >= advice.lightPermille) {
    notes.push(ride.ploughsLight ? { tone: 'good', text: copy.lightGood } : { tone: 'bad', text: copy.lightBad });
  }
  if (
    profile.laneChangePermille <= advice.tightLanePermille &&
    ride.handling.laneChangePermille < advice.baselinePermille
  ) {
    notes.push({ tone: 'bad', text: copy.tightBad });
  }
  // Dust, fog and heat put nothing extra on the road — they just mean you see
  // it late, which the course generator spends as doubled spawns. Nothing
  // about ride size answers that; lane-change speed does.
  if (profile.doubleChancePermille >= advice.doublePermille) {
    pushVersus(notes, ride.handling.laneChangePermille, copy.doubleGood, copy.doubleBad);
  }
  // A road thick with low obstacles is a road you hop, and hop airtime is the
  // one handling stat the ride ladder spends freely (a bus barely leaves the
  // ground). 'Low' means low enough for a hop to clear, which is the same test
  // collide.ts makes, so this cannot promise a hop the sim would not honour.
  if (topWeight(profile, ctx.obstacles, (o) => ctx.hopHeightMm > o.heightMm) >= advice.roughPermille) {
    pushVersus(notes, ride.handling.hopPermille, copy.roughGood, copy.roughBad);
  }
  // Wet tarmac lengthens the brake into every load zone by the same proportion
  // for everybody, so what decides it is the ride's own braking.
  if (profile.brakeDecelPermille <= advice.slickPermille) {
    pushVersus(notes, ride.handling.brakeDecelPermille, copy.slickGood, copy.slickBad);
  }
  // The counterweight to all of the above. Every rule so far reads a handling
  // stat, and C44 gave the big rides worse handling across the board — so on
  // their own they would advise a Trek on all 38 roads. What a big ride is
  // actually for is surviving the road: it scatters less of its crowd per
  // knock (`hitDropPermille`), and the Hilux eats one knock outright. A road
  // that is packed or that hides what is coming is where that pays.
  const busy =
    profile.gapPermille <= advice.busyPermille || profile.doubleChancePermille >= advice.doublePermille;
  if (busy) {
    if (ride.freeHitPerRun) notes.push({ tone: 'good', text: copy.knockGood });
    // Inverted: a *lower* share of the crowd scattered is the better ride.
    else pushVersus(notes, 2 * advice.baselinePermille - ride.hitDropPermille, copy.knockGood, copy.knockBad);
  }

  if (notes.length === 0) return [{ tone: 'even', text: copy.even }];

  // Bad news first, and only as much of it as the briefing has room for: a
  // screen two taps from the road wants a verdict, not an audit. One slot is
  // held back for good news whenever there is any, because a bus on a flood
  // road has three complaints and one real reason to be there, and dropping
  // the reason would make the line a scolding rather than a choice.
  const bad = notes.filter((n) => n.tone === 'bad');
  const good = notes.filter((n) => n.tone === 'good');
  const room = good.length > 0 ? advice.maxNotes - 1 : advice.maxNotes;
  const kept = bad.slice(0, Math.max(0, room));
  return [...kept, ...good.slice(0, advice.maxNotes - kept.length)];
}
