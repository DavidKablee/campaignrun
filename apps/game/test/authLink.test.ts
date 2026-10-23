import { describe, expect, it } from 'vitest';
import { authLinkFromUrl, strippedUrl } from '../src/authLink';

describe('C41: one-time links from the address bar', () => {
  it('reads a reset token and a verify token', () => {
    expect(authLinkFromUrl('?reset=abc123')).toEqual({ kind: 'reset', token: 'abc123' });
    expect(authLinkFromUrl('?verify=xyz789')).toEqual({ kind: 'verify', token: 'xyz789' });
    expect(authLinkFromUrl('?debug')).toBeNull();
    expect(authLinkFromUrl('')).toBeNull();
  });

  it('decodes a token that was percent-encoded into the link', () => {
    expect(authLinkFromUrl('?reset=a%2Bb%2Fc')).toEqual({ kind: 'reset', token: 'a+b/c' });
  });

  it('prefers the reset token when a URL somehow carries both', () => {
    // Only one flow can run, and a reset is the one with a password behind it.
    expect(authLinkFromUrl('?verify=v&reset=r')).toEqual({ kind: 'reset', token: 'r' });
  });

  it('strips the token but keeps the rest of the URL', () => {
    // The token is a credential: it must not stay in history or in a Referer.
    expect(strippedUrl('https://x.test/play?reset=secret&debug=1#top')).toBe('/play?debug=1#top');
    expect(strippedUrl('https://x.test/?verify=secret')).toBe('/');
    expect(strippedUrl('https://x.test/?debug')).toBe('/?debug=');
  });
});
