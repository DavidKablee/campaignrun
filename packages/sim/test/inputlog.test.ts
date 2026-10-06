import { describe, it, expect } from 'vitest';
import { encodeInputLog, decodeInputLog } from '../src/inputlog';

describe('InputLog', () => {
  it('round-trips delta encoding', () => {
    const records = [
      { tick: 0, input: 0 },
      { tick: 10, input: 1 },
      { tick: 15, input: 4 },
      { tick: 300, input: 8 }, // tests varint > 127
      { tick: 301, input: 0 },
    ];
    
    const encoded = encodeInputLog(records);
    const decoded = decodeInputLog(encoded);
    
    expect(decoded).toEqual(records);
  });
});
