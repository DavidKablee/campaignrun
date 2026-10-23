/**
 * The device key for a name-only account (C42).
 *
 * This is the one credential in the game that lives in storage the page can
 * read. The session is an httpOnly cookie precisely so JavaScript cannot touch
 * it, but a name-only account has no password and no address, so something on
 * the device has to be able to say "this is me" after the cookie lapses — and
 * only the page can present it.
 *
 * The honest consequences, which the UI states rather than hides: clearing site
 * data destroys the account, and the key cannot be moved to another device.
 * Both are why the player is asked for an email later.
 */

const KEY = 'cr-device-key';

/**
 * Storage access throws outright in some privacy modes, so every call is
 * guarded. A name-only account simply cannot be created in that case, and the
 * sign-in screen says so instead of failing on the next tap.
 */
function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readDeviceKey(store: Storage | null = safeStorage()): string | null {
  try {
    const raw = store?.getItem(KEY) ?? null;
    return raw && raw.length >= 20 ? raw : null;
  } catch {
    return null;
  }
}

export function writeDeviceKey(key: string, store: Storage | null = safeStorage()): boolean {
  try {
    store?.setItem(KEY, key);
    return readDeviceKey(store) === key;
  } catch {
    return false;
  }
}

/** Called when the server rejects a key, so a deleted account stops retrying. */
export function clearDeviceKey(store: Storage | null = safeStorage()): void {
  try {
    store?.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

export function deviceKeySupported(store: Storage | null = safeStorage()): boolean {
  return store !== null;
}
