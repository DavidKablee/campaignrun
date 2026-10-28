/**
 * Writes packages/content/data/state-roads.json: for every shipped state, the
 * two things a replay needs to rebuild its road (the hazards and the signature
 * ride). The API cannot load state packs — they are lazy chunks behind
 * `import.meta.glob`, which a Node server does not have — so it reads this
 * table instead. A content test fails if this file and the packs disagree, so
 * run `pnpm content:roads` after editing a pack.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('../packages/content/data/states/', import.meta.url).pathname;
const out = {};
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const id = file.replace(/\.json$/, '');
  if (id === 'dummy') continue;
  const pack = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  out[id] = { hazards: pack.hazards, signatureRide: pack.signatureRide };
}
const target = new URL('../packages/content/data/state-roads.json', import.meta.url).pathname;
writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);
console.log(`wrote ${Object.keys(out).length} state roads`);
