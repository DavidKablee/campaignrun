import pg from 'pg';

export interface Db {
  query<R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<{ rows: R[] }>;
}

let pool: pg.Pool | null = null;

export function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return url;
}

export function db(): Db {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: connectionString(),
      max: Number(process.env.PGPOOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = null;
}
