import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import console from 'node:console';

const plainFile = process.argv[2] || 'private/blocklist.plain.txt';
const outFile = 'packages/content/data/blocklist.hashes.json';

try {
  const words = readFileSync(plainFile, 'utf8').split('\n').map(w => w.trim()).filter(Boolean);
  const hashes = words.map(w => createHash('sha256').update(
    w.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
     .replace(/0/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e')
     .replace(/[4@]/g, 'a').replace(/[5$]/g, 's').replace(/[^a-z]/g, '')
  ).digest('hex'));
  
  writeFileSync(outFile, JSON.stringify({
    note: "SHA-256 hashes of normalised blocked terms.",
    hashes: Array.from(new Set(hashes))
  }, null, 2));
  console.log(`Hashed ${hashes.length} terms to ${outFile}`);
} catch {
  console.log(`Skipping hash generation (could not read ${plainFile})`);
}
