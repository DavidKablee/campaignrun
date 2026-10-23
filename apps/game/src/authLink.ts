export type AuthLink = { kind: 'verify' | 'reset'; token: string };

/**
 * Reads a one-time link token out of the address bar.
 *
 * Both links land the player on the game with the token as a query parameter,
 * which is the only thing an email client can usefully open.
 */
export function authLinkFromUrl(search: string): AuthLink | null {
  const params = new URLSearchParams(search);
  const reset = params.get('reset');
  if (reset) return { kind: 'reset', token: reset };
  const verify = params.get('verify');
  if (verify) return { kind: 'verify', token: verify };
  return null;
}

/**
 * The same URL with the token taken out.
 *
 * A reset token is a credential for the few minutes it lives, and a URL is the
 * least private place on the web: it goes into browser history, into the
 * `Referer` of anything the page loads, and into a screenshot of a shared
 * screen. It is read once at startup and the address bar is rewritten.
 */
export function strippedUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.delete('reset');
  url.searchParams.delete('verify');
  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ''}${url.hash}`;
}
