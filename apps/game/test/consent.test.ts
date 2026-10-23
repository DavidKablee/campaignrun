import { describe, expect, it } from 'vitest';
import { appendConsent, contenderShareAllowed, latestAccepted, scoreSubmitFields, shareConsentPlan } from '../src/consent';

describe('C11 consent log', () => {
  it('appends immutable entries', () => {
    const log = appendConsent([], 'terms', '2026-10-08', true, Date.parse('2026-10-08T12:00:00Z'));
    expect(log).toHaveLength(1);
    expect(log[0]!.kind).toBe('terms');
    expect(latestAccepted(log, 'terms')?.version).toBe('2026-10-08');
  });

  it('keeps Contender share off until granted, and respects withdraw', () => {
    let log = appendConsent([], 'contender-share', 'v1', true, 1);
    expect(contenderShareAllowed(log)).toBe(true);
    log = appendConsent(log, 'withdraw-contender', 'v1', true, 2);
    expect(contenderShareAllowed(log)).toBe(false);
    log = appendConsent(log, 'contender-share', 'v1', true, 3);
    expect(contenderShareAllowed(log)).toBe(true);
  });

  it('omits Contender id from score fields without consent', () => {
    const denied = scoreSubmitFields({
      crowd: 12,
      delivered: 8,
      stateId: 'lagos',
      contenderId: 'mama-ankara',
      consentLog: [],
    });
    expect(denied).toEqual({ crowd: 12, delivered: 8, stateId: 'lagos' });
    expect('contenderId' in denied).toBe(false);

    const allowed = scoreSubmitFields({
      crowd: 12,
      delivered: 8,
      stateId: 'lagos',
      contenderId: 'mama-ankara',
      consentLog: appendConsent([], 'contender-share', 'v1', true, 1),
    });
    expect(allowed.contenderId).toBe('mama-ankara');
  });
});

describe('C39: the Contender switch and the server', () => {
  it('always writes the device log, signed in or not', () => {
    expect(shareConsentPlan(true, false).local).toBe('grant');
    expect(shareConsentPlan(true, true).local).toBe('grant');
    expect(shareConsentPlan(false, false).local).toBe('withdraw');
    expect(shareConsentPlan(false, true).local).toBe('withdraw');
  });

  it('never calls the server for a signed-out player', () => {
    expect(shareConsentPlan(true, false).server).toBeNull();
    expect(shareConsentPlan(false, false).server).toBeNull();
  });

  it('tells the server on withdrawal, not only on consent', () => {
    // The withdrawal call is what erases ids the server already holds, so a
    // plan that skipped it would leave shared data behind.
    expect(shareConsentPlan(false, true).server).toBe(false);
    expect(shareConsentPlan(true, true).server).toBe(true);
  });
});
