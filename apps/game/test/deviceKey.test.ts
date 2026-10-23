import { describe, expect, it } from 'vitest';
import { clearDeviceKey, deviceKeySupported, readDeviceKey, writeDeviceKey } from '../src/deviceKey';

/** localStorage, small enough to reason about, with the failure modes it has. */
function fakeStore(opts: { throwOnSet?: boolean; dropWrites?: boolean } = {}): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => {
      if (opts.throwOnSet) throw new Error('storage is disabled');
      if (!opts.dropWrites) map.set(k, v);
    },
  } as Storage;
}

const KEY = 'k'.repeat(43);

describe('device key storage', () => {
  it('round-trips a key', () => {
    const store = fakeStore();
    expect(writeDeviceKey(KEY, store)).toBe(true);
    expect(readDeviceKey(store)).toBe(KEY);
  });

  it('reads nothing from an empty device', () => {
    expect(readDeviceKey(fakeStore())).toBeNull();
  });

  it('ignores a truncated key instead of sending it to the server', () => {
    const store = fakeStore();
    store.setItem('cr-device-key', 'short');
    expect(readDeviceKey(store)).toBeNull();
  });

  it('clears a key the server has rejected', () => {
    const store = fakeStore();
    writeDeviceKey(KEY, store);
    clearDeviceKey(store);
    expect(readDeviceKey(store)).toBeNull();
  });

  it('reports failure when the device refuses to store anything', () => {
    // Private-mode storage that throws, and the quieter kind that accepts a
    // write and keeps nothing. Both mean the account would be unreachable on
    // the next boot, so both have to come back false rather than look saved.
    expect(writeDeviceKey(KEY, fakeStore({ throwOnSet: true }))).toBe(false);
    expect(writeDeviceKey(KEY, fakeStore({ dropWrites: true }))).toBe(false);
  });

  it('says plainly when there is no storage at all', () => {
    expect(deviceKeySupported(null)).toBe(false);
    expect(deviceKeySupported(fakeStore())).toBe(true);
    expect(readDeviceKey(null)).toBeNull();
    expect(writeDeviceKey(KEY, null)).toBe(false);
  });
});
