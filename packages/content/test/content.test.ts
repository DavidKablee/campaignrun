import { describe, expect, it } from 'vitest';
import {
  controlTuning,
  followingGain,
  maxUpgradeLevel,
  metaConfig,
  runModifiers,
  runPayout,
  upgradeReadout,
  upgradeValue,
  activeContenders,
  campaignMap,
  calendar,
  availableStatePacks,
  contenders,
  copy,
  isRidePlayable,
  lagosLaunch,
  rideDifferences,
  rideSimTraits,
  rideStats,
  loadStatePack,
  outfits,
  rides,
  shippedStatePacks,
  simConfig,
  stateIndex,
  stations,
  integrityEvents,
  stateSchema,
  hazardEffects,
  hazardSchema,
  roadFit,
  roadLines,
  roadProfile,
  roadTuning,
  travelCaps,
  legal,
  venueTypeSchema,
} from '../src/index';
import { collectStrings, findViolations, hashTerm, loadHashes, readAllDataFiles, readJsonDir } from '../src/guardrails';

describe('content packs', () => {
  it('has six active original Contenders with in-run-only perks', () => {
    expect(activeContenders).toHaveLength(6);
    expect(new Set(contenders.map((c) => c.id)).size).toBe(contenders.length);
  });

  it('ride ladder is monotonic', () => {
    for (let i = 1; i < rides.length; i++) {
      expect(rides[i]!.capacity).toBeGreaterThan(rides[i - 1]!.capacity);
      expect(rides[i]!.followingGate).toBeGreaterThan(rides[i - 1]!.followingGate);
    }
    expect(rides.find((r) => r.id === 'okada')!.followingGate).toBe(150);
    const okada = rides.find((r) => r.id === 'okada')!;
    const keke = rides.find((r) => r.id === 'keke')!;
    expect(isRidePlayable(okada, 149)).toBe(false);
    expect(isRidePlayable(okada, 150)).toBe(true);
    expect(isRidePlayable(keke, 1_499)).toBe(false);
    expect(isRidePlayable(keke, 1_500)).toBe(true);
    // C26: full roster is playable (gated by Following, not a playable:false lock).
    expect(rides.filter((r) => r.playable).map((r) => r.id)).toEqual(['trek', 'okada', 'keke', 'hilux', 'danfo', 'coaster', 'grand-convoy']);
  });

  it('sim config sanity', () => {
    expect(simConfig.maxSpeedUm).toBeGreaterThan(simConfig.baseSpeedUm);
    expect(simConfig.spawn.gapMinMm).toBeLessThanOrEqual(simConfig.spawn.gapMaxMm);
    expect(simConfig.runTicks / simConfig.tickHz).toBeGreaterThanOrEqual(75);
    expect(simConfig.runTicks / simConfig.tickHz).toBeLessThanOrEqual(100);
  });

  it('disclosure is present and neutral', () => {
    expect(copy.disclosure).toMatch(/not polls/i);
    expect(copy.disclosure).toMatch(/Fictional game/);
  });
  it('legal copy carries a versioned consent gate', () => {
    expect(legal.version.length).toBeGreaterThan(0);
    expect(legal.contenderConsentBody).toMatch(/consent/i);
    expect(legal.privacyBody.length).toBeGreaterThan(20);
  });
});

describe('characters', () => {
  it('every active Contender has a look and a valid default outfit', () => {
    const { options, characters } = outfits;
    for (const c of activeContenders) {
      const ch = characters[c.id];
      expect(ch, c.id).toBeDefined();
      expect(options.tops.map((o) => o.id)).toContain(ch!.outfit.top);
      expect(options.bottoms.map((o) => o.id)).toContain(ch!.outfit.bottom);
      expect(options.footwear.map((o) => o.id)).toContain(ch!.outfit.footwear);
      expect(options.headwear.map((o) => o.id)).toContain(ch!.outfit.headwear);
    }
  });
  it('obstacles include hoppable and non-hoppable kinds', () => {
    const low = simConfig.obstacles.filter((o) => o.heightMm < simConfig.hopHeightMm);
    const high = simConfig.obstacles.filter((o) => o.heightMm >= simConfig.hopHeightMm);
    expect(low.length).toBeGreaterThanOrEqual(4);
    expect(high.length).toBeGreaterThanOrEqual(3);
  });
});

describe('integrity events', () => {
  it('ships three generic threats with civic facts', () => {
    expect(integrityEvents.map((e) => e.id).sort()).toEqual(['sleepy-voter', 'snatcher', 'vote-buyer']);
    for (const e of integrityEvents) {
      expect(e.title.length).toBeGreaterThan(3);
      expect(e.civicFact.length).toBeGreaterThan(20);
      expect(e.verified).toBe(true);
    }
  });
});

describe('campaign map data', () => {
  it('lists every calendar state once, with a station', () => {
    const ids = calendar.unlocks.flatMap((u) => u.states);
    expect(new Set(stateIndex.map((s) => s.id))).toEqual(new Set(ids));
    expect(stateIndex).toHaveLength(ids.length);
    expect(ids.filter((s) => s !== 'fct')).toHaveLength(36);
    for (const row of stateIndex) {
      expect(stations.some((st) => st.id === row.audioStem)).toBe(true);
    }
    expect(stateIndex.find((s) => s.id === 'lagos')!.audioStem).toBe('sw-fuji');
  });
});

describe('calendar', () => {
  const stateIds = calendar.unlocks.flatMap((u) => u.states);
  it('unlocks 36 states plus FCT, no duplicates', () => {
    expect(new Set(stateIds).size).toBe(stateIds.length);
    expect(stateIds.filter((s) => s !== 'fct')).toHaveLength(36);
    expect(stateIds).toContain('fct');
  });
  it('every unlock is Monday 06:00 WAT (05:00Z)', () => {
    for (const u of calendar.unlocks) {
      const d = new Date(u.at);
      expect(d.getUTCDay()).toBe(1);
      expect(d.getUTCHours()).toBe(5);
      expect(d.getUTCMinutes()).toBe(0);
    }
  });
  it('closes 23:59 WAT on Fri 15 Jan 2027', () => {
    const d = new Date(calendar.closeAt);
    expect(d.toISOString()).toBe('2027-01-15T22:59:00.000Z');
    expect(d.getUTCDay()).toBe(5);
  });
});

describe('JSON-only state addition', () => {
  it('every file in data/states parses against the schema (no code change needed)', () => {
    const files = readJsonDir('states');
    expect(files.length).toBeGreaterThanOrEqual(2);
    for (const f of files) expect(() => stateSchema.parse(f.json), f.file).not.toThrow();
  });
  it('palaces cannot be venues', () => {
    expect(venueTypeSchema.safeParse('palace').success).toBe(false);
  });
  it('loads a registered state pack without application-specific code', async () => {
    expect(availableStatePacks()).toContain('lagos');
    const state = await loadStatePack('lagos');
    expect(state.id).toBe('lagos');
    expect(lagosLaunch.landmarks).toEqual(state.landmarks.map((landmark) => landmark.name));
    expect(lagosLaunch.welcomeLine).toBe(state.welcomeLines[0]);
    expect(lagosLaunch.audioStem).toBe(state.audioStem);
    await expect(loadStatePack('not-a-state')).rejects.toThrow('Unknown state pack');
  });
  it('ships the 26 Oct week as JSON-only packs', async () => {
    expect(shippedStatePacks()).toEqual(expect.arrayContaining(['kano', 'rivers', 'anambra', 'kaduna']));
    for (const id of ['kano', 'rivers', 'anambra', 'kaduna'] as const) {
      const pack = await loadStatePack(id);
      expect(pack.id).toBe(id);
      expect(pack.landmarks).toHaveLength(5);
      expect(stateIndex.some((s) => s.id === id && s.audioStem === pack.audioStem)).toBe(true);
    }
    expect(travelCaps.maxRunsPerDay).toBeGreaterThan(0);
  });
  it('C34: every state the calendar unlocks has a pack behind it', async () => {
    // Nine states had packs and 28 were stubs, so every unlock week from 9 Nov
    // would have opened onto nothing. This is the invariant, not the batch lists
    // below it: a state added to the calendar without content fails here.
    const scheduled = calendar.unlocks.flatMap((u) => u.states);
    expect(shippedStatePacks().sort()).toEqual([...scheduled].sort());

    const rideIds = new Set(rides.map((r) => r.id));
    for (const id of scheduled) {
      const pack = await loadStatePack(id);
      const row = stateIndex.find((s) => s.id === id)!;
      expect(pack.name, id).toBe(row.name);
      expect(pack.zone, id).toBe(row.zone);
      // The map screen reads the index and the run reads the pack; if these drift
      // the radio changes station when the run starts.
      expect(pack.audioStem, id).toBe(row.audioStem);
      expect(rideIds.has(pack.signatureRide), `${id}: ${pack.signatureRide}`).toBe(true);
      expect(pack.landmarks, id).toHaveLength(5);
      expect(pack.welcomeLines.length, id).toBeGreaterThan(0);
    }
  });

  it('C34: no landmark is a palace or a throne (spec amendment A8)', async () => {
    // venueTypeSchema already has no 'palace' member; this catches one smuggled in
    // under another venueType, which is the way it would actually happen.
    for (const id of shippedStatePacks()) {
      const pack = await loadStatePack(id);
      for (const l of pack.landmarks) {
        expect(l.name, `${id}: ${l.name}`).not.toMatch(/\b(palace|throne|emir'?s? court)\b/i);
      }
    }
  });

  it('C34: hazards stay a closed vocabulary', () => {
    // Guards the schema itself: if hazards go back to z.string() the 38 packs are
    // free to invent synonyms again, and whoever implements them inherits the mess.
    expect(hazardSchema.safeParse('go-slow').success).toBe(true);
    expect(hazardSchema.safeParse('dust').success).toBe(false);
    expect(hazardSchema.safeParse('traffic').success).toBe(false);
  });

  it('ships the 2 Nov week (C27 batch) as JSON-only packs, no palace venues, no dead signatureRide', async () => {
    expect(shippedStatePacks()).toEqual(expect.arrayContaining(['oyo', 'borno', 'delta', 'kwara']));
    for (const id of ['oyo', 'borno', 'delta', 'kwara'] as const) {
      const pack = await loadStatePack(id);
      expect(pack.id).toBe(id);
      expect(pack.landmarks).toHaveLength(5);
      expect(stateIndex.some((s) => s.id === id && s.audioStem === pack.audioStem)).toBe(true);
      for (const l of pack.landmarks) expect(venueTypeSchema.safeParse(l.venueType).success).toBe(true);
      expect(rides.some((r) => r.id === pack.signatureRide)).toBe(true);
    }
  });
});

describe('guardrail lint', () => {
  it('no banned words or hashed terms in any content file', () => {
    const hashes = loadHashes();
    for (const f of readAllDataFiles()) {
      if (f.file === 'blocklist.hashes.json') continue;
      for (const s of collectStrings(f.json)) expect(findViolations(s, hashes), `${f.file}: ${s}`).toEqual([]);
    }
  });
  it('the hashed blocklist is populated (an empty list silently disables guardrail 12)', () => {
    // C31: this shipped empty, so every name check passed by default. Keep it loaded.
    expect(loadHashes().size).toBeGreaterThan(0);
  });
  it('every Contender outfit and prop map keys off a live roster id', () => {
    const ids = new Set(contenders.map((c) => c.id));
    expect(Object.keys(outfits.characters).sort()).toEqual([...ids].sort());
  });
  it('detects banned wording and hashed terms', () => {
    expect(findViolations('our candidate wins', new Set())).not.toEqual([]);
    const h = new Set([hashTerm('Banned Name')]);
    expect(findViolations('hello b4nn3d n4me there', h)).not.toEqual([]);
    expect(findViolations('hello world', h)).toEqual([]);
  });
});

describe('C39: the privacy floor has one home', () => {
  it('map standings carry the minimum players per region', () => {
    // The API enforces it and the About page quotes it to the player; a second
    // copy of the number is a promise that can drift from what the server does.
    expect(campaignMap.standings.minPlayersPerRegion).toBe(200);
  });
});

describe('C44: a ride is more than its seat count', () => {
  it('no ride is slower than the speed it coasts at', () => {
    // A ceiling below the coast speed would put the ride permanently above its
    // own maximum and snap it down the moment the player touched the gas.
    for (const ride of rides) {
      const ceiling = Math.floor((simConfig.maxSpeedUm * ride.handling.topSpeedPermille) / 1000);
      expect(ceiling, ride.id).toBeGreaterThan(simConfig.baseSpeedUm);
    }
  });

  it('momentum is reachable', () => {
    // It was 1050 permille of a speed the sim clamps to 1000 permille, so the
    // whole momentum multiplier sat at its minimum for every run ever played
    // (found in C44). Anything at or above 1000 brings that back.
    expect(simConfig.momentum.fastThresholdPermille).toBeLessThan(1000);
  });

  it('a bigger ride never handles better than a smaller one', () => {
    // The ladder may hand out upsides in any order, but agility is the thing a
    // player trades for seats: if a heavier ride also turned faster there would
    // be no reason to drive anything but the biggest one you own.
    for (let i = 1; i < rides.length; i++) {
      const lighter = rides[i - 1]!;
      const heavier = rides[i]!;
      expect(heavier.handling.laneChangePermille, heavier.id).toBeLessThanOrEqual(
        lighter.handling.laneChangePermille,
      );
    }
    expect(rides.every((r) => r.tradeoff.length > 0)).toBe(true);
  });

  it('the keke is the baseline every other ride is measured against', () => {
    const keke = rides.find((r) => r.id === 'keke')!;
    expect(rideDifferences(keke)).toEqual([]);
    expect(rideStats(keke).every((s) => s.tone === 'even' && s.deltaPercent === 0)).toBe(true);
    expect(rideDifferences(rides.find((r) => r.id === 'grand-convoy')!).length).toBeGreaterThan(0);
  });

  it('a stat that is worse when the number is higher reads as a downside', () => {
    // The inversion that ships backwards if nobody checks it: an okada scatters
    // 40% MORE of its crowd on a knock, so +40% is bad news told in red, not a
    // bonus told in green.
    const okada = rides.find((r) => r.id === 'okada')!;
    const scatter = rideStats(okada).find((s) => s.id === 'scatter')!;
    expect(scatter.permille).toBe(1400);
    expect(scatter.deltaPercent).toBe(40);
    expect(scatter.higherIsBetter).toBe(false);
    expect(scatter.tone).toBe('down');

    const laneChange = rideStats(okada).find((s) => s.id === 'lane-change')!;
    expect(laneChange.deltaPercent).toBe(30);
    expect(laneChange.tone).toBe('up');

    const convoy = rides.find((r) => r.id === 'grand-convoy')!;
    const convoyScatter = rideStats(convoy).find((s) => s.id === 'scatter')!;
    expect(convoyScatter.deltaPercent).toBe(-30);
    expect(convoyScatter.tone).toBe('up');
  });

  it('what a ride card promises is what the collision rules do', () => {
    // Written as "wades floods" first time out, which is backwards: C26's rule
    // makes a flood transparent to S and M and blocks L. Prose cannot be
    // tested, but the claims that map onto a size class can be.
    for (const ride of rides) {
      const copy = `${ride.trait} ${ride.tradeoff}`.toLowerCase();
      if (copy.includes('flood')) expect(ride.size, ride.id).toBe('L');
      if (copy.includes('narrow gap')) expect(ride.size, ride.id).toBe('S');
      if (copy.includes('plough')) expect(ride.ploughsLight, ride.id).toBe(true);
      if (copy.includes('free hit')) expect(ride.freeHitPerRun, ride.id).toBe(true);
      if (copy.includes('magnet')) expect(ride.magnetBonusMm, ride.id).toBeGreaterThan(0);
    }
    // And the other way: a ride with a mechanic says so.
    for (const ride of rides.filter((r) => r.ploughsLight)) {
      expect(`${ride.trait} ${ride.tradeoff}`.toLowerCase(), ride.id).toContain('plough');
    }
  });

  it('hands the sim every ride field it takes', () => {
    // Two call sites have to agree about how a ride drives — the live run and
    // the ghost re-simulation — so they share this bundle. A ride field added
    // without adding it here would quietly stop reaching the sim.
    const traits = rideSimTraits(rides.find((r) => r.id === 'danfo')!);
    expect(Object.keys(traits).sort()).toEqual([
      'capacity',
      'rideFreeHit',
      'rideHandling',
      'rideHitDropPermille',
      'rideMagnetBonusMm',
      'ridePloughsLight',
      'rideRivalDrawPermille',
      'rideSize',
    ]);
    expect(traits.rideHandling.laneChangePermille).toBe(700);
    expect(traits.ridePloughsLight).toBe(true);
  });
});

/**
 * C45. A state's `hazards` were three words that nothing read: every one of the
 * 38 packs generated the same road from the same obstacle table, so the only
 * reason to change ride was the seat count. These hold the new wiring — and,
 * because hazards are data and the rides they judge are data too, they hold
 * the advice copy to the mechanics as well.
 */
describe('C45: hazards differ per state', () => {
  it('every hazard in the vocabulary has exactly one effect', () => {
    const ids = hazardEffects.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...hazardSchema.options].sort());
  });

  it('no hazard is inert', () => {
    // A hazard with nothing behind it is the state C45 found all 20 of them in.
    for (const h of hazardEffects) {
      const changesRoad = Object.values(h.road).some((v) => v !== 1000);
      const changesTable = Object.keys(h.obstacleWeights).length > 0;
      expect(changesRoad || changesTable, h.id).toBe(true);
    }
  });

  it('only reweights obstacles the sim actually spawns', () => {
    const kinds = new Set(simConfig.obstacles.map((o) => o.kind));
    for (const h of hazardEffects) {
      for (const kind of Object.keys(h.obstacleWeights)) {
        expect(kinds, `${h.id} -> ${kind}`).toContain(kind);
      }
    }
  });

  it('go-slow is the mild one, because it is on almost every road', async () => {
    const packs = await Promise.all(shippedStatePacks().map((id) => loadStatePack(id)));
    const withGoSlow = packs.filter((p) => p.hazards.includes('go-slow')).length;
    expect(withGoSlow).toBeGreaterThan(packs.length * 0.8);
    // So if it were harsh, every road in the game would be harsh in the same
    // way and nothing would distinguish one state from another.
    const goSlow = hazardEffects.find((h) => h.id === 'go-slow')!;
    for (const [key, value] of Object.entries(goSlow.road)) {
      expect(Math.abs(value - 1000), `go-slow ${key}`).toBeLessThanOrEqual(50);
    }
  });

  it('composing a road does not depend on the order the pack lists hazards', () => {
    // Permille multiplication truncates, so a pack author reordering the list
    // must not change how the state plays — a ghost recorded before the edit
    // would replay off by a hair.
    const hazards = ['flood-sheet', 'creek-crossing', 'go-slow'] as const;
    const forward = roadProfile(hazards);
    const backward = roadProfile([...hazards].reverse());
    expect(backward).toEqual(forward);
    expect(roadProfile([...hazards, 'go-slow'])).toEqual(forward);
  });

  it('an empty hazard list is the road the sim always had', () => {
    const neutral = roadProfile([]);
    expect(neutral.obstacleWeightPermille).toEqual({});
    for (const value of Object.values(neutral).filter((v) => typeof v === 'number')) {
      expect(value).toBe(1000);
    }
  });

  it('three hazards cannot compound past the clamps', () => {
    const clamp = roadTuning.clamp;
    const nastiest = hazardSchema.options;
    const stacked = roadProfile(nastiest); // all 20 at once: nothing ships this
    expect(stacked.topSpeedPermille).toBe(clamp.topSpeedPermille.min);
    expect(stacked.gapPermille).toBe(clamp.gapPermille.min);
    for (const permille of Object.values(stacked.obstacleWeightPermille)) {
      expect(permille).toBeLessThanOrEqual(clamp.obstacleWeightPermille.max);
      expect(permille).toBeGreaterThanOrEqual(clamp.obstacleWeightPermille.min);
    }
  });

  it('the road clamp honours the spacing floor the plausibility bound counts on', () => {
    // `maxCrowdFor` bounds flat rival Crowd by how many entities fit on the
    // course at the tightest legal spacing. A road clamp below this floor would
    // fit more than the bound allows and start rejecting honest runs.
    expect(roadTuning.clamp.gapPermille.min).toBeGreaterThanOrEqual(simConfig.course.roadGapFloorPermille);
  });

  it('no shipped road takes the gas pedal away from any ride', async () => {
    // The clamp that matters: a ride multiplied below the coast speed sits
    // pinned at its own ceiling and the gas stops meaning anything. The sim
    // has the same assertion as a run-time floor; this is why it never fires.
    const packs = await Promise.all(shippedStatePacks().map((id) => loadStatePack(id)));
    for (const pack of packs) {
      const road = roadProfile(pack.hazards);
      for (const ride of rides) {
        const ceiling = Math.floor(
          (Math.floor((simConfig.maxSpeedUm * ride.handling.topSpeedPermille) / 1000) * road.topSpeedPermille) / 1000,
        );
        expect(ceiling, `${pack.id}/${ride.id}`).toBeGreaterThan(simConfig.baseSpeedUm);
      }
    }
  });

  it('names every hazard it applies, in a stable order', async () => {
    const pack = await loadStatePack('lagos');
    const lines = roadLines(pack.hazards);
    expect(lines).toHaveLength(pack.hazards.length);
    expect(lines.map((l) => l.id)).toEqual(roadLines([...pack.hazards].reverse()).map((l) => l.id));
    for (const line of lines) {
      expect(line.label.length, line.id).toBeGreaterThan(0);
      expect(line.note.length, line.id).toBeGreaterThan(0);
    }
  });

  it('what a hazard says is what a hazard does', () => {
    // Same rule as the ride cards (C44): prose cannot be tested, but a claim
    // that maps onto a mechanic can be. A water hazard has to put water on the
    // road or lengthen the brake; it cannot just say it does.
    for (const h of hazardEffects) {
      const flood = h.obstacleWeights['flood-patch'] ?? 1000;
      if (h.family === 'water') {
        // Water either sits on the road, or makes it slick, or — river-fog —
        // comes off the water and hides it. What it may not do is nothing.
        const wet = flood > 1000 || h.road.brakeDecelPermille < 1000;
        expect(wet || h.road.doubleChancePermille > 1000, h.id).toBe(true);
      }
      if (flood > 1000) expect(h.family, h.id).toBe('water');
      // Seeing late is spent as doubled spawns, never as extra obstacles.
      if (/\b(fog|dust|heat|see)\b/.test(h.note.toLowerCase())) {
        expect(h.road.doubleChancePermille, h.id).toBeGreaterThan(1000);
      }
    }
  });

  it('tells you a big ride is wrong for a flood state and right for a barrier one', async () => {
    const coaster = rides.find((r) => r.id === 'coaster')!;
    const danfo = rides.find((r) => r.id === 'danfo')!;
    const okada = rides.find((r) => r.id === 'okada')!;
    const bayelsa = await loadStatePack('bayelsa');
    const kano = await loadStatePack('kano');

    const tones = (notes: { tone: string }[]) => notes.map((n) => n.tone);
    expect(tones(roadFit(coaster, bayelsa.hazards))).toContain('bad');
    expect(tones(roadFit(okada, bayelsa.hazards))).toContain('good');
    // Kano is cart-weave: light barriers, which a ploughing ride goes through.
    expect(tones(roadFit(danfo, kano.hazards))).toContain('good');
    expect(tones(roadFit(okada, kano.hazards))).toContain('bad');
  });

  it('keeps the briefing short, and never drops the one good reason', async () => {
    const packs = await Promise.all(shippedStatePacks().map((id) => loadStatePack(id)));
    const { maxNotes } = roadTuning.advice;
    for (const pack of packs) {
      for (const ride of rides) {
        const notes = roadFit(ride, pack.hazards);
        expect(notes.length, `${pack.id}/${ride.id}`).toBeGreaterThan(0);
        expect(notes.length, `${pack.id}/${ride.id}`).toBeLessThanOrEqual(maxNotes);
        // 'even' is the only tone that stands alone.
        if (notes.some((n) => n.tone === 'even')) expect(notes).toHaveLength(1);
        const full = new Set(notes.map((n) => n.text));
        expect(full.size).toBe(notes.length);
      }
    }
  });

  it('the road, not the price, decides which ride is right', async () => {
    // The point of the chunk. Scored crudely — good notes minus bad ones — the
    // ranking has to actually move between states, and it has to be a different
    // ride at the top on a flooded road than on a road of light barriers.
    const packs = await Promise.all(shippedStatePacks().map((id) => loadStatePack(id)));
    const score = (rideId: string, hazards: readonly import('../src/index').Hazard[]) => {
      const notes = roadFit(rides.find((r) => r.id === rideId)!, hazards);
      return notes.filter((n) => n.tone === 'good').length - notes.filter((n) => n.tone === 'bad').length;
    };
    const signatures = new Set(packs.map((p) => rides.map((r) => score(r.id, p.hazards)).join(',')));
    expect(signatures.size).toBeGreaterThan(5);

    const bayelsa = packs.find((p) => p.id === 'bayelsa')!;
    const kano = packs.find((p) => p.id === 'kano')!;
    expect(score('keke', bayelsa.hazards)).toBeGreaterThan(score('danfo', bayelsa.hazards));
    expect(score('danfo', kano.hazards)).toBeGreaterThan(score('keke', kano.hazards));
  });

  it('says nothing about the keke, which is the yardstick', async () => {
    // Every handling figure is measured against the keke, so on a road whose
    // only hazards are handling ones the keke must have no opinion at all —
    // otherwise the baseline is quietly praising itself.
    const keke = rides.find((r) => r.id === 'keke')!;
    const notes = roadFit(keke, ['heat-shimmer']);
    expect(notes).toHaveLength(1);
    expect(notes[0]!.tone).toBe('even');
  });
});

describe('C46: the controls are gestures, not pads', () => {
  it('drives itself, because the gas pad is gone from the screen', () => {
    expect(controlTuning.autoGas).toBe(true);
  });

  it('keeps a flick and a tap from being the same thing', () => {
    // A flick has to leave the circle a tap is allowed to wander in, and a
    // hold has to outlast the longest tap. Either overlap and one gesture
    // starts eating the other.
    expect(controlTuning.swipeMinPx).toBeGreaterThan(controlTuning.tapMaxMovePx);
    expect(controlTuning.holdHornMs).toBeGreaterThan(controlTuning.tapMaxMs);
  });

  it('leaves time to double-tap inside the on-beat window', () => {
    const windowMs = (simConfig.bonuses.onBeatWindowTicks / simConfig.tickHz) * 1000;
    expect(windowMs).toBeGreaterThan(controlTuning.tapMaxMs * simConfig.bonuses.onBeatTaps);
  });

  it('will not let a flick-and-release load a zone on its own', () => {
    // The brake runs on after the thumb lifts so dodging works, but a pickup
    // has to be a deliberate hold — otherwise one flick loads the convoy.
    const loadMs = (simConfig.zones.loadTicks / simConfig.tickHz) * 1000;
    expect(controlTuning.brakeGraceMs).toBeLessThan(loadMs);
  });

  it('keeps every buzz short enough to read as feedback', () => {
    const h = controlTuning.haptics;
    for (const ms of [h.laneMs, h.hopMs, h.brakeMs, h.beatMs, h.hornMs]) {
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(50);
    }
  });
});

describe('C48: the Convoy Yard explains itself', () => {
  const noUpgrades = { magnet: 0, shield: 0, horn: 0, loading: 0, value: 0 } as const;

  it('gives every upgrade its own stat, so no two fight over one number', () => {
    const stats = metaConfig.upgrades.map((u) => u.effect.stat);
    expect(new Set(stats).size).toBe(stats.length);
  });

  it('sells no level that changes nothing', () => {
    // A `ticks-down` upgrade that reached its floor mid-ladder would keep
    // charging for levels that do not move the number, and the shop would
    // print the same value on both sides of its own arrow.
    for (const upgrade of metaConfig.upgrades) {
      for (let level = 0; level < maxUpgradeLevel; level++) {
        expect(
          upgradeValue(upgrade, level + 1),
          `${upgrade.id} level ${level + 1} does nothing`,
        ).not.toBe(upgradeValue(upgrade, level));
        expect(upgradeReadout(upgrade, level).atFloor).toBe(false);
      }
    }
  });

  it('prints the number the run actually applies', () => {
    // The whole point of C48: the shop reads the same function `step()` is
    // handed, so a price cannot be attached to an effect the sim ignores.
    for (let level = 0; level <= maxUpgradeLevel; level++) {
      const levels = { magnet: level, shield: level, horn: level, loading: level, value: level };
      const mods = runModifiers(levels);
      for (const upgrade of metaConfig.upgrades) {
        expect(mods[upgrade.effect.stat]).toBe(upgradeValue(upgrade, level));
      }
    }
  });

  it('keeps the payout the Yard quotes', () => {
    // ₦60 a rally + ₦4 a supporter, times the Fundraising Desk. These are the
    // figures the How it works tab prints, so they are asserted here rather
    // than left to be read off a screenshot.
    expect(runPayout(0, noUpgrades)).toBe(metaConfig.rewards.baseRun);
    expect(runPayout(18, noUpgrades)).toBe(
      metaConfig.rewards.baseRun + 18 * metaConfig.rewards.perDelivered,
    );
    const desk = { ...noUpgrades, value: maxUpgradeLevel };
    expect(runPayout(18, desk)).toBe(
      Math.floor((runPayout(18, noUpgrades) * runModifiers(desk).rewardPermille) / 1000),
    );
    // And the Desk is the only upgrade that touches it.
    for (const upgrade of metaConfig.upgrades) {
      if (upgrade.effect.stat === 'rewardPermille') continue;
      const levels = { ...noUpgrades, [upgrade.id]: maxUpgradeLevel };
      expect(runPayout(18, levels)).toBe(runPayout(18, noUpgrades));
    }
  });

  it('names delivering supporters as the only source of Following', () => {
    expect(followingGain(0)).toBe(0);
    expect(followingGain(18)).toBe(18 * metaConfig.rewards.followingPerDelivered);
  });

  it('keeps every ride gate reachable inside a campaign', () => {
    // The Yard now tells the player how many more supporters a ride needs, so
    // the number had better be one a person could deliver. Best case per run
    // is the capacity of the best ride already open, once per venue plus the
    // grand rally.
    const dropsPerRun = simConfig.course.segmentCount + 1;
    const ladder = [...rides].filter((r) => r.playable).sort((a, b) => a.followingGate - b.followingGate);
    for (let i = 1; i < ladder.length; i++) {
      const best = ladder[i - 1]!;
      const gap = ladder[i]!.followingGate - best.followingGate;
      const perRun = best.capacity * dropsPerRun * metaConfig.rewards.followingPerDelivered;
      const runs = Math.ceil(gap / perRun);
      expect(runs, `${ladder[i]!.id} needs ${runs} perfect runs on a ${best.id}`).toBeLessThanOrEqual(150);
    }
  });

  it('lets the daily goals pay for the cheapest upgrade in a day', () => {
    // Otherwise the shop's first row is unbuyable on day one and the screen
    // reads as a price list rather than a shop.
    const dayIncome =
      metaConfig.rewards.donation + metaConfig.missions.daily.length * metaConfig.rewards.dailyMission;
    const cheapest = Math.min(...metaConfig.upgrades.map((u) => u.costs[0]!));
    expect(dayIncome).toBeGreaterThanOrEqual(cheapest);
  });
});
