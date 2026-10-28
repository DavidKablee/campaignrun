import { describe, expect, it } from 'vitest';
import { parseTally } from '../src/tally';

describe('parseTally', () => {
  it('turns the server answer into named rows', () => {
    const t = parseTally({ windowDays: 7, hidden: false, total: 115, busiest: [{ stateId: 'kano', rallies: 70 }, { stateId: 'oyo', rallies: 40 }] });
    expect(t?.rows.map((r) => [r.name, r.rallies])).toEqual([['Kano', 70], ['Oyo', 40]]);
    expect(t?.total).toBe(115);
  });

  it('shows nothing while the server hides it, or for anything that is not that answer', () => {
    expect(parseTally({ windowDays: 7, hidden: true })).toBeNull();
    expect(parseTally(null)).toBeNull();
    expect(parseTally('x')).toBeNull();
    expect(parseTally({ hidden: false, windowDays: 7, total: 3, busiest: 'no' })).toBeNull();
    expect(parseTally({ hidden: false, windowDays: 'seven', total: 3, busiest: [] })).toBeNull();
  });

  it('drops rows for unknown states and bad counts, and shows nothing if none are left', () => {
    expect(parseTally({ hidden: false, windowDays: 7, total: 5, busiest: [{ stateId: 'atlantis', rallies: 5 }] })).toBeNull();
    const t = parseTally({ hidden: false, windowDays: 7, total: 9, busiest: [{ stateId: 'kano', rallies: -1 }, { stateId: 'imo', rallies: 9.7 }] });
    expect(t?.rows).toEqual([{ stateId: 'imo', name: 'Imo', rallies: 9 }]);
  });
});
