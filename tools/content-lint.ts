import { execSync } from 'node:child_process';
console.log('Running content tests...');
try {
  execSync('pnpm vitest run packages/content/test', { stdio: 'inherit' });
} catch {
  process.exit(1);
}
