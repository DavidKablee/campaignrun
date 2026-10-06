#!/usr/bin/env node
/**
 * Fails if first-load gzip of apps/game/dist exceeds 4 MB,
 * or any file under dist/states exceeds 3 MB gzip.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import process from 'node:process';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'apps/game/dist');
const FIRST_LOAD_MAX = 4 * 1024 * 1024;
const STATE_PACK_MAX = 3 * 1024 * 1024;

function gzipSize(buf) {
  return gzipSync(buf, { level: 9 }).byteLength;
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

if (!existsSync(DIST)) {
  console.error('size-check: apps/game/dist missing — run build first');
  process.exit(1);
}

const files = walk(DIST);
let firstLoad = 0;
const counted = new Set();

// Approximate first load: index.html + referenced JS/CSS in root assets (exclude waitlist, exclude lazy state packs)
for (const f of files) {
  const rel = f.slice(DIST.length + 1);
  if (rel.startsWith('states/')) continue;
  if (rel === 'waitlist.html' || rel.includes('waitlist')) continue;
  const buf = readFileSync(f);
  const gz = gzipSize(buf);
  // Count JS/CSS/WASM/fonts/html that ship with main shell
  if (/\.(html|js|css|woff2?|ttf|otf|svg|json|wasm)$/i.test(rel) || rel.endsWith('.map') === false) {
    if (/\.(html|js|css|woff2?|ttf|otf)$/i.test(rel) || rel === 'flags.json') {
      if (!counted.has(rel)) {
        counted.add(rel);
        firstLoad += gz;
      }
    }
  }
}

console.log(`size-check: first-load gzip ≈ ${(firstLoad / 1024).toFixed(1)} KB (budget ${(FIRST_LOAD_MAX / 1024 / 1024).toFixed(0)} MB)`);
if (firstLoad > FIRST_LOAD_MAX) {
  console.error('size-check: FAIL first load over budget');
  process.exit(1);
}

const statesDir = join(DIST, 'states');
if (existsSync(statesDir)) {
  for (const f of walk(statesDir)) {
    const gz = gzipSize(readFileSync(f));
    const rel = f.slice(DIST.length + 1);
    console.log(`size-check: state pack ${rel} gzip ${(gz / 1024).toFixed(1)} KB`);
    if (gz > STATE_PACK_MAX) {
      console.error(`size-check: FAIL ${rel} over ${STATE_PACK_MAX} bytes`);
      process.exit(1);
    }
  }
}

console.log('size-check: OK');
process.exit(0);
