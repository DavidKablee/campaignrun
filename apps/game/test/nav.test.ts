import { describe, expect, it } from 'vitest';
import { backTarget, type NavContext } from '../src/nav';
import type { Screen } from '../src/state';

const ctx = (over: Partial<NavContext> = {}): NavContext => ({
  picked: false,
  settingsBack: 'splash',
  authReturn: null,
  placesBack: 'briefing',
  ...over,
});

describe('backTarget', () => {
  it('has nowhere to go from the splash', () => {
    expect(backTarget('splash', ctx())).toBeNull();
  });

  it('sends the plain menus to the splash', () => {
    for (const s of ['about', 'account', 'yard', 'briefing', 'roster'] as Screen[]) {
      expect(backTarget(s, ctx())).toBe('splash');
    }
  });

  it('steps the Studio back to the roster', () => {
    expect(backTarget('studio', ctx())).toBe('roster');
  });

  it('returns Settings to wherever it was opened from, and never to itself', () => {
    expect(backTarget('settings', ctx({ settingsBack: 'briefing' }))).toBe('briefing');
    expect(backTarget('settings', ctx({ settingsBack: 'settings' }))).toBe('splash');
  });

  it('returns Mobilise to where it was opened and Auth to the place it came from', () => {
    expect(backTarget('places', ctx({ placesBack: 'summary' }))).toBe('summary');
    expect(backTarget('auth', ctx({ authReturn: 'places', placesBack: 'splash' }))).toBe('splash');
    expect(backTarget('auth', ctx())).toBe('splash');
  });

  it('leaves a result for the Briefing only once a Contender is chosen', () => {
    expect(backTarget('summary', ctx())).toBe('splash');
    expect(backTarget('summary', ctx({ picked: true }))).toBe('briefing');
  });

  it('treats the run as a toggle between playing and paused', () => {
    expect(backTarget('game', ctx())).toBe('paused');
    expect(backTarget('paused', ctx())).toBe('game');
  });
});
