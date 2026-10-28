import { describe, expect, it } from 'vitest';
import { decodeReplayLog, rallySaturdayPlausible } from '../src/replayGate';
import { simConfig } from '@cr/content';
import { encodeInputLog } from '@cr/sim';

describe('replay gate', () => {
  it('reads a well-formed log and refuses anything else', () => {
    const good = Buffer.from(encodeInputLog([{ tick: 0, input: 8 }, { tick: 30, input: 16 }])).toString('base64');
    expect(decodeReplayLog(good)).toEqual([{ tick: 0, input: 8 }, { tick: 30, input: 16 }]);
    expect(decodeReplayLog('')).toBeNull();
    // A varint with its continuation bit set and no byte after it.
    expect(decodeReplayLog(Buffer.from([0x80]).toString('base64'))).toBeNull();
    // A tick past ten minutes of play.
    expect(decodeReplayLog(Buffer.from(encodeInputLog([{ tick: simConfig.tickHz * 700, input: 8 }])).toString('base64'))).toBeNull();
  });

  it('believes Rally Saturday only near the real window', () => {
    const sat7pm = Date.parse('2026-10-24T18:00:00Z'); // 19:00 WAT, Saturday
    expect(rallySaturdayPlausible(sat7pm)).toBe(true);
    expect(rallySaturdayPlausible(Date.parse('2026-10-24T20:10:00Z'))).toBe(true); // 21:10 WAT, within slack
    expect(rallySaturdayPlausible(Date.parse('2026-10-24T20:40:00Z'))).toBe(false);
    expect(rallySaturdayPlausible(Date.parse('2026-10-22T18:00:00Z'))).toBe(false); // a Thursday
  });
});

