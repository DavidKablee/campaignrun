/**
 * C29: local-only "personal best" ghost per state. No server, no friend/top-5 ghosts —
 * those need a backend (C12). Stores the input log for your best-Crowd finished run of each
 * state so the next run of that state can replay it alongside you.
 */
const KEY = 'cr-ghosts-v1';

export interface GhostRecord {
  stateId: string;
  seed: number;
  contenderId: string;
  rideId: string;
  ticks: number;
  crowd: number;
  log: string; // base64-encoded delta-encoded input log
}

type Store = Record<string, GhostRecord>;

function readStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // storage full or unavailable — ghosts are a nice-to-have, fail silent
  }
}

export function loadGhost(stateId: string): GhostRecord | null {
  return readStore()[stateId] ?? null;
}

/** Pure comparison — a new run only replaces the stored ghost if it beats it on Crowd. */
export function shouldReplaceGhost(existing: GhostRecord | null, candidate: GhostRecord): boolean {
  return !existing || candidate.crowd > existing.crowd;
}

/** Only overwrites the stored ghost if this run's Crowd beats the existing one. */
export function saveGhostIfBest(record: GhostRecord): boolean {
  const store = readStore();
  const existing = store[record.stateId] ?? null;
  if (!shouldReplaceGhost(existing, record)) return false;
  store[record.stateId] = record;
  writeStore(store);
  return true;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
