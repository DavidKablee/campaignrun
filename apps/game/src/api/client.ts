/**
 * Thin wrapper over fetch for the Campaign Run API.
 *
 * The session is an httpOnly cookie, so it is never readable from JS here —
 * every call just sends credentials and lets the server decide. That is also
 * why there is no token to store: there is nothing for this module to keep.
 */

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8787';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly field?: string,
    /** Seconds, from a 429. The player is told how long, not just "no". */
    readonly retryAfter?: number,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    });
  } catch {
    // A dead server and a lost network look the same from here, and the player
    // only needs to know the board is not reachable.
    throw new ApiError(0, 'offline');
  }
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    field?: string;
    retryAfter?: number;
  } & T;
  if (!res.ok) throw new ApiError(res.status, body.error ?? 'server', body.field, body.retryAfter);
  return body;
}

export const apiGet = <T,>(path: string) => api<T>(path);
export const apiPost = <T,>(path: string, data?: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) });
export const apiDelete = <T,>(path: string) => api<T>(path, { method: 'DELETE' });
