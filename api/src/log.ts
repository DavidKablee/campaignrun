import { randomUUID } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';

/**
 * One JSON line per request, and an id that reaches the player.
 *
 * Before C41 the whole of observability was a `console.error` in the error
 * handler: an outage would have been reported by players, and a 500 could not
 * be traced to the request that caused it. The id is echoed in `x-request-id`
 * and included in a 500 body, so a support message can quote it.
 *
 * Nothing here logs an email address, a password, a token or a Contender id.
 * The first two are credentials, the third is a credential in all but name,
 * and the fourth is sensitive under guardrail 10 — a log file is exactly the
 * kind of place a Contender choice must not leak into.
 */
type Level = 'info' | 'warn' | 'error';

export function log(level: Level, event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const requestLogger: MiddlewareHandler<{ Variables: { requestId: string } }> = async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? randomUUID();
  c.set('requestId', requestId);
  c.header('x-request-id', requestId);
  const started = Date.now();
  await next();
  log(c.res.status >= 500 ? 'error' : c.res.status >= 400 ? 'warn' : 'info', 'request', {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    ms: Date.now() - started,
  });
};
