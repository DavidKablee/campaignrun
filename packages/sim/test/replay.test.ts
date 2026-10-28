import { describe, expect, it } from 'vitest';
import { maxUpgradeLevel, simConfig, stateIndex, type UpgradeLevels } from '@cr/content';
import {
  decodeInputLog,
  encodeInputLog,
  initState,
  replayRun,
  seedRng,
  step,
  verifyReplay,
  type InputRecord,
  type ReplaySpec,
} from '../src';
import { rideSimTraits, rides, roadProfile, runModifiers, stateRoad } from '@cr/content';
import { botInput } from './helpers/dodgeBot';

const noUpgrades: UpgradeLevels = { magnet: 0, shield: 0, horn: 0, loading: 0, value: 0 };

/**
 * Plays a run the way the game does — sample, log on change, step — with a
 * deterministic bot that brakes in zones, weaves and hops, so the log is not a
 * trivial one. Returns the log and what the live sim ended on.
 */
function liveRun(spec: Omit<ReplaySpec, 'log'>) {
  const road = stateRoad(spec.stateId)!;
  const ride = rides.find((r) => r.id === spec.rideId)!;
  const state = initState(simConfig, seedRng(spec.seed), {
    ...rideSimTraits(ride),
    road: roadProfile(road.hazards),
    contenderId: spec.contenderId,
    upgrades: runModifiers(spec.upgrades),
    signatureRideBonusPermille: road.signatureRide === ride.id ? simConfig.bonuses.signatureRideBonusPermille : 1000,
    rallySaturdayMultiplierPermille: spec.rallySaturday ? simConfig.bonuses.rallySaturdayMultiplierPermille : 1000,
  });
  const log: InputRecord[] = [];
  let last = -1;
  while (state.phase === 'running' && state.tick < simConfig.tickHz * 600) {
    const bits = botInput(state, simConfig);
    if (bits !== last) {
      log.push({ tick: state.tick, input: bits });
      last = bits;
    }
    step(state, bits, simConfig);
  }
  return { log, state };
}

const base: Omit<ReplaySpec, 'log'> = {
  seed: 20260101,
  stateId: 'lagos',
  rideId: 'danfo',
  contenderId: 'mama-ankara',
  upgrades: noUpgrades,
  rallySaturday: false,
};

describe('server replay', () => {
  it('reproduces a live run exactly from its input log', () => {
    const { log, state } = liveRun(base);
    expect(state.phase).not.toBe('running');
    // A log that earned nothing would make every comparison below vacuous.
    expect(state.skillCrowd).toBeGreaterThan(0);
    const got = replayRun(simConfig, { ...base, log })!;
    expect(got).toMatchObject({
      phase: state.phase,
      ticks: state.tick,
      skillCrowd: state.skillCrowd,
      displayCrowd: state.displayCrowd,
      delivered: state.delivered,
      dents: state.dents,
      integrity: state.integrity,
    });
  });

  it('survives the wire format the client sends', () => {
    const { log, state } = liveRun({ ...base, seed: 77 });
    const over = decodeInputLog(encodeInputLog(log));
    expect(replayRun(simConfig, { ...base, seed: 77, log: over })!.skillCrowd).toBe(state.skillCrowd);
  });

  it('accepts the true score without being told the Contender, and names who played', () => {
    const { log, state } = liveRun({ ...base, contenderId: 'captain-kobo', seed: 31337 });
    const verdict = verifyReplay(
      simConfig,
      { ...base, seed: 31337, log, contenderId: null },
      { crowd: state.skillCrowd, delivered: state.delivered, dents: state.dents, integrity: state.integrity },
    );
    expect(verdict).toEqual({ ok: true, contenderId: 'captain-kobo' });
  });

  it('rejects an inflated score, a wrong seed and a different ride', () => {
    const { log, state } = liveRun(base);
    const claim = { crowd: state.skillCrowd, delivered: state.delivered, dents: state.dents, integrity: state.integrity };
    const spec = { ...base, log, contenderId: null };
    expect(verifyReplay(simConfig, spec, { ...claim, crowd: claim.crowd + 1 })).toEqual({ ok: false, reason: 'mismatch' });
    expect(verifyReplay(simConfig, spec, { ...claim, delivered: claim.delivered + 1 })).toEqual({ ok: false, reason: 'mismatch' });
    expect(verifyReplay(simConfig, { ...spec, seed: base.seed + 1 }, claim).ok).toBe(false);
    expect(verifyReplay(simConfig, { ...spec, rideId: 'keke' }, claim).ok).toBe(false);
  });

  it('does not let a better-upgraded replay stand in for a plain run', () => {
    const { log, state } = liveRun(base);
    const claim = { crowd: state.skillCrowd, delivered: state.delivered, dents: state.dents, integrity: state.integrity };
    const maxed = { ...noUpgrades, magnet: maxUpgradeLevel, loading: maxUpgradeLevel, value: maxUpgradeLevel };
    const other = replayRun(simConfig, { ...base, upgrades: maxed, log })!;
    // The same thumbs on a better convoy is a different run, which is why the
    // server replays with the upgrades the client says it had and holds the
    // claim to them.
    expect(other.skillCrowd === claim.crowd && other.delivered === claim.delivered && other.ticks === state.tick).toBe(false);
  });

  it('applies the Rally Saturday window only when the claim says it was open', () => {
    const { log, state } = liveRun({ ...base, rallySaturday: true, seed: 5 });
    const claim = { crowd: state.skillCrowd, delivered: state.delivered, dents: state.dents, integrity: state.integrity };
    expect(verifyReplay(simConfig, { ...base, seed: 5, log, rallySaturday: true }, claim).ok).toBe(true);
    expect(state.skillCrowd).toBeGreaterThan(0);
    expect(verifyReplay(simConfig, { ...base, seed: 5, log, rallySaturday: false }, claim).ok).toBe(false);
  });

  it('refuses a state, ride or Contender that does not exist', () => {
    const claim = { crowd: 0, delivered: 0, dents: 0, integrity: 100 };
    expect(replayRun(simConfig, { ...base, stateId: 'atlantis', log: [] })).toBeNull();
    expect(replayRun(simConfig, { ...base, rideId: 'submarine', log: [] })).toBeNull();
    expect(replayRun(simConfig, { ...base, contenderId: 'nobody', log: [] })).toBeNull();
    expect(verifyReplay(simConfig, { ...base, stateId: 'atlantis', log: [] }, claim)).toEqual({ ok: false, reason: 'unknown' });
  });

  it('stops a log that never ends the run', () => {
    const got = replayRun(simConfig, { ...base, log: [{ tick: 0, input: 0 }] })!;
    expect(got.ticks).toBeLessThanOrEqual(simConfig.tickHz * 600);
  });

  it('knows a road for every state in the index', () => {
    for (const s of stateIndex) expect(stateRoad(s.id), s.id).toBeDefined();
  });
});
