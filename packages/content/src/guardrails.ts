import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const dataDir = join(here, '..', 'data');

/** Lower-case, strip diacritics, map common leetspeak, drop non-letters. */
export function normalise(term: string): string {
  return term
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/[4@]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[^a-z]/g, '');
}

export function hashTerm(term: string): string {
  return createHash('sha256').update(normalise(term)).digest('hex');
}

/** Plain words that must never appear in player-facing copy (not names, safe to keep in repo). */
export const bannedWords: RegExp[] = [/\bcandidates?\b/i, /\binec\b/i];

export function loadHashes(): Set<string> {
  const raw = JSON.parse(readFileSync(join(dataDir, 'blocklist.hashes.json'), 'utf8')) as { hashes: string[] };
  return new Set(raw.hashes);
}

/** Collect every string value in a JSON document. */
export function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

/** Check text for banned words and hashed blocklist (single words and adjacent word pairs/triples). */
export function findViolations(text: string, hashes: Set<string>): string[] {
  const problems: string[] = [];
  for (const re of bannedWords) if (re.test(text)) problems.push(`banned word ${re}`);
  if (hashes.size > 0) {
    const words = text.split(/\s+/).filter(Boolean);
    for (let i = 0; i < words.length; i++) {
      for (let n = 1; n <= 3 && i + n <= words.length; n++) {
        if (hashes.has(hashTerm(words.slice(i, i + n).join(' ')))) problems.push('blocklisted term (hashed)');
      }
    }
  }
  return problems;
}

export function readJsonDir(sub: string): { file: string; json: unknown }[] {
  const dir = join(dataDir, sub);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((file) => ({ file, json: JSON.parse(readFileSync(join(dir, file), 'utf8')) as unknown }));
}

export function readAllDataFiles(): { file: string; json: unknown }[] {
  // `world/` holds sign text and district labels; it only exists once a state ships a look.
  const world = existsSync(join(dataDir, 'world')) ? readJsonDir('world') : [];
  return [...readJsonDir('.'), ...readJsonDir('states'), ...world];
}
