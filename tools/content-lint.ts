/**
 * CLI entry used by `pnpm content:lint`.
 * Delegates to the content package test suite (schemas + guardrails).
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const result = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['vitest', 'run', 'packages/content/test'],
  { stdio: 'inherit', shell: false },
);
process.exit(result.status ?? 1);
