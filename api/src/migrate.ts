import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeDb, db } from './db.ts';

/** Idempotent: schema.sql is written so it can be re-run against a live database. */
export async function migrate(target = db()): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  await target.query(readFileSync(join(here, 'schema.sql'), 'utf8'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await migrate();
  console.log('migrate: schema applied');
  await closeDb();
}
