import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const simSrc = join(__dirname, '../src');
const bannedProps = [
  'random',
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'atan2',
  'exp',
  'log',
  'log2',
  'log10',
  'pow',
  'hypot',
  'cbrt',
  'sinh',
  'cosh',
  'tanh',
];
const bannedGlobals = ['window', 'document', 'performance', 'Date', 'navigator', 'localStorage', 'requestAnimationFrame'];
const bannedImports = ['three', 'pixi.js', '@cr/game'];

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...walkTs(p));
    else if (name.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

describe('sim purity', () => {
  const files = walkTs(simSrc);

  it('has source files', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('bans transcendental Math, DOM globals, and renderer imports', () => {
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      // Strip line comments for crude scan
      const code = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const p of bannedProps) {
        expect(code, `${file}: Math.${p}`).not.toMatch(new RegExp(`Math\\.${p}\\b`));
      }
      for (const g of bannedGlobals) {
        // Allow the word only inside strings; crude: fail on bare identifier usage as call/member
        expect(code, `${file}: ${g}`).not.toMatch(new RegExp(`\\b${g}\\b`));
      }
      for (const imp of bannedImports) {
        expect(code, `${file}: import ${imp}`).not.toMatch(new RegExp(`from ['"]${imp.replace('.', '\\.')}`));
      }
    }
  });

  it('avoids float literals in step/collide/course (prefer integers)', () => {
    const critical = files.filter((f) => /\/(step|collide|course|geometry)\.ts$/.test(f));
    for (const file of critical) {
      const code = readFileSync(file, 'utf8')
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      // Disallow 0.45-style literals (allow 0 and integers)
      const floats = code.match(/(?<![A-Za-z0-9_])\d+\.\d+/g) ?? [];
      expect(floats, `${file} has float literals: ${floats.join(', ')}`).toEqual([]);
    }
  });
});
