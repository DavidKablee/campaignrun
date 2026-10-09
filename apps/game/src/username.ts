/** Client-side username rules for the local board (server filter lands with C11). */

const BANNED = [/\bcandidates?\b/i, /\binec\b/i, /\bpoll\b/i];

export function validateUsername(raw: string): { ok: true; name: string } | { ok: false; reason: string } {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < 3 || name.length > 16) return { ok: false, reason: 'length' };
  if (!/^[\p{L}\p{N} ._-]+$/u.test(name)) return { ok: false, reason: 'chars' };
  for (const re of BANNED) {
    if (re.test(name)) return { ok: false, reason: 'banned' };
  }
  return { ok: true, name };
}
