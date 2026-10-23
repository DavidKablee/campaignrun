import { describe, expect, it } from 'vitest';
import { calendar } from '@cr/content';
import { rosterCommit } from '../src/roster';
import { daysLeft } from '../src/campaignClock';

const base = { cardId: 'sister-beacon', activeId: 'mama-ankara', locked: false, graceUsed: false };

describe('C40: committing to a Contender', () => {
  it('is free before the first finish locks the choice', () => {
    expect(rosterCommit(base)).toEqual({ kind: 'open' });
  });

  it('is free for the Contender you already picked, even when locked', () => {
    // Dressing your own character must not cost the switch: the store ignores an
    // unchanged id, so charging for it would take the switch and give nothing.
    expect(rosterCommit({ ...base, cardId: 'mama-ankara', locked: true })).toEqual({ kind: 'open' });
    expect(rosterCommit({ ...base, cardId: 'mama-ankara', locked: true, graceUsed: true })).toEqual({
      kind: 'open',
    });
  });

  it('asks before spending the one free switch', () => {
    // The old roster spent it on the first tap of another card. `lockAfterFinish`
    // never clears, so that tap was the last word on a campaign-long choice.
    expect(rosterCommit({ ...base, locked: true })).toEqual({ kind: 'confirm-switch' });
  });

  it('reports a blocked switch instead of swallowing the tap', () => {
    expect(rosterCommit({ ...base, locked: true, graceUsed: true })).toEqual({ kind: 'blocked' });
  });
});

describe('C40: the countdown reads the calendar', () => {
  it('counts to the published close date and stops at zero', () => {
    const close = Date.parse(calendar.closeAt);
    expect(daysLeft(close - 86_400_000)).toBe(1);
    expect(daysLeft(close)).toBe(0);
    expect(daysLeft(close + 86_400_000 * 9)).toBe(0);
  });
});
