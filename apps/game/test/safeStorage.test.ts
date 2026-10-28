import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeStorage } from '../src/safeStorage';

describe('safeStorage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps a value in memory when localStorage rejects the write', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
      removeItem: () => {},
    });
    expect(() => safeStorage.setItem('k', 'v')).not.toThrow();
    expect(safeStorage.getItem('k')).toBe('v');
    safeStorage.removeItem('k');
    expect(safeStorage.getItem('k')).toBeNull();
  });

  it('reads through when localStorage works', () => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    });
    safeStorage.setItem('a', '1');
    expect(safeStorage.getItem('a')).toBe('1');
    expect(data.get('a')).toBe('1');
  });
});
