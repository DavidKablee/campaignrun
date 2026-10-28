import { describe, expect, it } from 'vitest';
import { calloutForEvent, calloutForLandmark } from '../src/radioCallouts';

describe('radioCallouts', () => {
  it('names the landmark ahead', () => {
    // Zone-flavoured flair prepended; landmark name always present
    expect(calloutForLandmark('Ojuelegba', 'SW')).toContain('Ojuelegba');
    expect(calloutForLandmark('Grand Rally', 'SW')).toContain('Grand Rally');
    // Unknown zone falls back gracefully
    expect(calloutForLandmark('Onitsha', 'SE')).toContain('Onitsha');
  });

  it('maps key sim events to DJ lines', () => {
    // Gate and dropoff lines have Nigerian flavour — spot-check a non-null return
    const gate = calloutForEvent({ type: 'gate' }, 'Lagos');
    expect(gate).toBeTruthy();
    const dropoff = calloutForEvent({ type: 'dropoff' }, 'Ojuelegba');
    expect(dropoff).toBeTruthy();
    expect(calloutForEvent({ type: 'onBeat' }, 'x')).toBeTruthy();
    expect(calloutForEvent({ type: 'pickup' }, 'x')).toBeNull();
  });

  it('never names a ride, a religious phrase or another state', () => {
    const all = new Set<string>();
    for (let i = 0; i < 400; i++) {
      for (const type of ['closeCall', 'weaveWarn', 'tollDodged', 'toll'] as const) all.add(calloutForEvent({ type }, 'X', 'NW', 'Katsina') ?? '');
      all.add(calloutForEvent({ type: 'zoneEnter' }, 'Bauchi gate', 'NW', 'Bauchi') ?? '');
      all.add(calloutForEvent({ type: 'zoneEnter' }, 'Itam Market', 'SS', 'Akwa Ibom') ?? '');
      all.add(calloutForLandmark('Old City Gate', 'SW', 'Ogun'));
    }
    const text = [...all].join('\n');
    expect(text).not.toMatch(/okada|danfo|keke|allahu|anambra|garden city|lagos|eko\b/i);
  });

  it('keeps the Lagos lines for Lagos', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) seen.add(calloutForLandmark('Ojuelegba', 'SW', 'Lagos'));
    expect([...seen].join(' ')).toMatch(/Eko|Lagos/);
  });
});
