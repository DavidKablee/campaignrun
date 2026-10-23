import type { Context, MiddlewareHandler } from 'hono';

/**
 * A fixed-window counter, in process memory.
 *
 * In memory on purpose, with eyes open: it is per-instance, so two API
 * processes behind a load balancer each allow the full budget, and a restart
 * clears every counter. That is the right trade for the thing it defends
 * against — a script hammering one endpoint — and it costs no round trip on
 * the hot path. What it does *not* defend is a distributed attempt against one
 * account; that is what the per-address lockout in `loginThrottle` is for, and
 * that one lives in the database where it survives both problems.
 *
 * If this ever runs on more than one instance and the IP budget starts to
 * matter, move the counter to Redis or to Postgres — the interface here does
 * not change.
 */
interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

/** Exported for tests, and for a future scheduled sweep. */
export function sweepRateLimits(now = Date.now()): void {
  for (const [key, w] of buckets) if (w.resetAt <= now) buckets.delete(key);
}

export function resetRateLimits(): void {
  buckets.clear();
}

const TRUST_PROXY = process.env.CR_TRUST_PROXY === 'true';

/**
 * The client address.
 *
 * `x-forwarded-for` is only read when `CR_TRUST_PROXY=true`, because anyone can
 * send that header: trusting it by default would let a single attacker present
 * a fresh address on every request and make every limit here decorative. Turn
 * it on only when the API sits behind a proxy that overwrites the header.
 */
export function clientIp(c: Context): string {
  if (TRUST_PROXY) {
    const xff = c.req.header('x-forwarded-for');
    if (xff) return xff.split(',')[0]!.trim();
    const real = c.req.header('x-real-ip');
    if (real) return real.trim();
  }
  const socket = (c.env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined)?.incoming?.socket;
  return socket?.remoteAddress ?? 'unknown';
}

export function hit(key: string, limit: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfter: number } {
  const w = buckets.get(key);
  if (!w || w.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  w.count += 1;
  if (w.count > limit) return { ok: false, retryAfter: Math.ceil((w.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

/** Rate limits a route by client address. */
export function rateLimit(name: string, limit: number, windowMs: number): MiddlewareHandler {
  return async (c, next) => {
    const res = hit(`${name}:${clientIp(c)}`, limit, windowMs);
    if (!res.ok) {
      c.header('retry-after', String(res.retryAfter));
      return c.json({ error: 'rate-limited', retryAfter: res.retryAfter }, 429);
    }
    await next();
    return undefined;
  };
}
