import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { closeDb, db } from './db.ts';
import { migrate } from './migrate.ts';

const port = Number(process.env.PORT ?? 8787);
const database = db();

if (process.env.CR_MIGRATE_ON_BOOT !== 'false') await migrate(database);

const server = serve({ fetch: createApp(database).fetch, port }, (info) => {
  console.log(`campaign-run api on http://localhost:${info.port}`);
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    server.close(() => {
      void closeDb().then(() => process.exit(0));
    });
  });
}
