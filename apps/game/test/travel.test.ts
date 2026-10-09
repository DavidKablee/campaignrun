import { describe, expect, it } from 'vitest';
import { travelCaps } from '@cr/content';
import { canTravel, emptyTravel, noteTravel, syncTravelDay } from '../src/travel';

describe('C10 travel caps', () => {
  const noon = Date.parse('2026-10-26T12:00:00+01:00');

  it('allows a fresh day and blocks after max runs', () => {
    let progress = emptyTravel(noon);
    expect(canTravel(progress, 'lagos', noon)).toEqual({ ok: true });
    for (let i = 0; i < travelCaps.maxRunsPerDay; i++) {
      progress = noteTravel(progress, 'lagos', noon);
    }
    expect(canTravel(progress, 'lagos', noon)).toEqual({ ok: false, reason: 'runs' });
  });

  it('caps distinct states per day', () => {
    let progress = emptyTravel(noon);
    const states = ['lagos', 'kano', 'rivers', 'anambra', 'kaduna'];
    for (let i = 0; i < travelCaps.maxStatesPerDay; i++) {
      progress = noteTravel(progress, states[i]!, noon);
    }
    expect(canTravel(progress, states[travelCaps.maxStatesPerDay]!, noon)).toEqual({ ok: false, reason: 'states' });
    expect(canTravel(progress, 'lagos', noon).ok).toBe(true);
  });

  it('resets on a new WAT day', () => {
    let progress = emptyTravel(noon);
    for (let i = 0; i < travelCaps.maxRunsPerDay; i++) progress = noteTravel(progress, 'lagos', noon);
    const nextMorning = Date.parse('2026-10-27T07:00:00+01:00');
    progress = syncTravelDay(progress, nextMorning);
    expect(progress.runsToday).toBe(0);
    expect(canTravel(progress, 'lagos', nextMorning)).toEqual({ ok: true });
  });
});
