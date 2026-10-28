import { describe, expect, it } from 'vitest';
import { challengeText, challengeUrl, decodeChallenge, encodeChallenge, judgeChallenge, type Challenge } from '../src/challenge';

const sample: Challenge = { seed: 3_141_592_653, stateId: 'lagos', rideId: 'okada', crowd: 214, quick: false, from: 'Ade_22' };

describe('challenge links', () => {
  it('round-trips through the hash', () => {
    expect(decodeChallenge(`#${encodeChallenge(sample)}`)).toEqual(sample);
    expect(decodeChallenge(encodeChallenge({ ...sample, quick: true, from: '' }))).toEqual({ ...sample, quick: true, from: '' });
  });

  it('covers the full 32-bit seed range', () => {
    for (const seed of [0, 1, 0xffffffff]) {
      expect(decodeChallenge(encodeChallenge({ ...sample, seed }))?.seed).toBe(seed);
    }
  });

  it('drops a board name that is not a plain handle instead of putting it in a URL', () => {
    const url = encodeChallenge({ ...sample, from: 'Ade O. <script>' });
    expect(url.endsWith('~')).toBe(true);
    expect(decodeChallenge(url)?.from).toBe('');
  });

  it('rejects anything that is not a challenge or names things that do not exist', () => {
    expect(decodeChallenge('')).toBeNull();
    expect(decodeChallenge('#state=lagos')).toBeNull();
    expect(decodeChallenge('#c=zz~nowhere~okada~10~0~')).toBeNull();
    expect(decodeChallenge('#c=zz~lagos~submarine~10~0~')).toBeNull();
    expect(decodeChallenge('#c=zz~lagos~okada~999999~0~')).toBeNull();
    expect(decodeChallenge('#c=zz~lagos~okada~-5~0~')).toBeNull();
    expect(decodeChallenge('#c=zzzzzzzzzz~lagos~okada~10~0~')).toBeNull();
    expect(decodeChallenge('#c=zz~lagos~okada~10~2~')).toBeNull();
    expect(decodeChallenge('#c=zz~lagos~okada~10~0')).toBeNull();
  });

  it('builds a link from a page address, replacing any old hash', () => {
    const url = challengeUrl('https://example.test/play/#c=old', sample);
    expect(url.startsWith('https://example.test/play/#c=')).toBe(true);
    expect(url.match(/#/g)).toHaveLength(1);
  });

  it('names the score, the road and the ride in the share text', () => {
    const text = challengeText(sample, 'Okada', 'Lagos');
    expect(text).toContain(String(sample.crowd));
    expect(text).toContain('Lagos');
    expect(text).toContain('Okada');
  });

  it('judges a result', () => {
    expect(judgeChallenge(214, 230)).toEqual({ won: true, tied: false, margin: 16 });
    expect(judgeChallenge(214, 214)).toEqual({ won: false, tied: true, margin: 0 });
    expect(judgeChallenge(214, 200)).toEqual({ won: false, tied: false, margin: 14 });
  });
});
