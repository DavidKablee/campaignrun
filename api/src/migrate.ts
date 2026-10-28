import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeDb, db } from './db.ts';

/**
 * Idempotent: schema.sql is written so it can be re-run against a live database. It is sent as one
 * multi-statement query (one implicit transaction), so an advisory lock up front makes two
 * processes (or two test files) that migrate at once take turns instead of deadlocking.
 */
export async function migrate(target = db()): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  await target.query(`select pg_advisory_xact_lock(7841002);\n${readFileSync(join(here, 'schema.sql'), 'utf8')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await migrate();
  console.log('migrate: schema applied');
  await closeDb();
}
