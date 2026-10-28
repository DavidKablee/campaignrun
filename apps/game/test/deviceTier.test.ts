import { describe, expect, it } from 'vitest';
import { prefersDataSaver } from '../src/deviceTier';

describe('prefersDataSaver', () => {
  it('is off for a capable device on a good link', () => {
    expect(prefersDataSaver({ deviceMemory: 8, connection: { effectiveType: '4g' } })).toBe(false);
    expect(prefersDataSaver({})).toBe(false);
  });
  it('turns on for an OS data-saver request, a 2 GB phone or a slow link', () => {
    expect(prefersDataSaver({ connection: { saveData: true } })).toBe(true);
    expect(prefersDataSaver({ deviceMemory: 2 })).toBe(true);
    expect(prefersDataSaver({ connection: { effectiveType: '3g' } })).toBe(true);
  });
});
