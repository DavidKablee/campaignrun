import { describe, it, expect } from 'vitest';
import { encodeInputLog, decodeInputLog } from '../src/inputlog';

describe('inputlog', () => {
  it('round-trips records', () => {
    const records = [
      { tick: 0, input: 8 },
      { tick: 10, input: 9 },
      { tick: 11, input: 8 },
      { tick: 200, input: 16 },
    ];
    const bytes = encodeInputLog(records);
    expect(decodeInputLog(bytes)).toEqual(records);
  });
});
