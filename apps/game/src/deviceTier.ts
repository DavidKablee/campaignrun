interface NavLike {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

/**
 * A first visit on a phone that is plainly struggling (2 GB or less, a
 * data-saver request from the OS, or a 2G/3G link) starts with Data saver on.
 * It is only a default: once the player has touched the setting, the saved
 * value wins.
 */
export function prefersDataSaver(nav?: NavLike): boolean {
  const n = nav ?? (typeof navigator === 'undefined' ? undefined : (navigator as unknown as NavLike));
  if (!n) return false;
  if (n.connection?.saveData) return true;
  if (typeof n.deviceMemory === 'number' && n.deviceMemory <= 2) return true;
  const t = n.connection?.effectiveType;
  return t === 'slow-2g' || t === '2g' || t === '3g';
}
