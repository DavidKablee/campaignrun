import { test, expect } from '@playwright/test';

/**
 * Each state with its own look is driven to the same set of places along the
 * course, in the same light and with the same seed, and photographed. The shots
 * are for people to review (test-results/shots/state-<id>-<place>.png); what the
 * test asserts is that nothing throws and the frame stays inside the mobile
 * budget (draw calls and triangles, read from the ?debug overlay).
 *
 * `debugState` plays a state without unlocking or travelling to it,
 * `debugWeather` and `debugSeed` make every shot the same light and the same road.
 */
const STATES = ['kano', 'rivers', 'anambra', 'kaduna', 'delta', 'kwara', 'oyo', 'borno', 'enugu', 'plateau', 'katsina', 'ogun', 'bauchi', 'sokoto', 'akwa-ibom', 'imo', 'edo', 'ondo', 'abia', 'benue', 'osun', 'adamawa', 'jigawa', 'cross-river'];
const GATE = 20;
const SEG = 340;
/** A spot 18 m before the chunk a landmark's set piece stands in, so the piece is the first thing ahead. */
const venuePiece = (i: number) => Math.floor((GATE + SEG * i + 230) / 40) * 40 - 18;
const entryPiece = (i: number) => Math.ceil((GATE + SEG * i) / 40) * 40 - 18;
const PLACES: [string, number][] = [
  ['piece0-venue', venuePiece(0)],
  ['piece1-entry', entryPiece(1)],
  ['piece1-venue', venuePiece(1)],
  ['piece2-entry', entryPiece(2)],
  ['piece2-venue', venuePiece(2)],
  ['piece3-entry', entryPiece(3)],
  ['piece3-venue', venuePiece(3)],
  ['piece4-venue', venuePiece(4)],
  ['start', 4],
  ['seg0-entry', GATE + 12],
  ['seg0-venue', GATE + 190],
  ['seg1-entry', GATE + SEG + 12],
  ['seg1-venue', GATE + SEG + 190],
  ['seg2-entry', GATE + SEG * 2 + 12],
  ['seg2-venue', GATE + SEG * 2 + 190],
  ['seg3-entry', GATE + SEG * 3 + 12],
  ['seg3-venue', GATE + SEG * 3 + 190],
  ['seg4-venue', GATE + SEG * 4 + 190],
  ['seg5', GATE + SEG * 5 + 120],
  ['seg6', GATE + SEG * 6 + 120],
  ['seg7', GATE + SEG * 7 + 120],
  ['finish', GATE + SEG * 8 + 20],
];

for (const id of STATES) {
  test(`${id}: the course renders inside budget at every place`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-landscape', 'visual tour runs once');
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      localStorage.setItem('cr-storage', JSON.stringify({ state: { seenTutorial: true, following: 100 }, version: 11 }));
      localStorage.setItem('cr-contender', JSON.stringify({ state: { activeContenderId: 'captain-kobo' }, version: 2 }));
    });
    for (const [place, z] of PLACES) {
      await page.goto(`/?debug&debugState=${id}&debugSeed=1&debugWeather=day&debugZ=${z}`);
      await page.getByRole('button', { name: /Continue campaign/i }).click();
      await page.getByRole('button', { name: /Start the run/i }).click();
      await page.waitForTimeout(1600);
      await page.screenshot({ path: `test-results/shots/state-${id}-${place}.png` });
      const overlay = (await page.locator('.cr-debug').textContent()) ?? '';
      const draws = Number(/draws (\d+)/.exec(overlay)?.[1] ?? 0);
      const tris = Number(/tris (\d+)/.exec(overlay)?.[1] ?? 0);
      expect(draws, `${id} ${place}: ${overlay}`).toBeLessThanOrEqual(150);
      expect(tris, `${id} ${place}: ${overlay}`).toBeLessThanOrEqual(120_000);
    }
    expect(errors.filter((e) => !/ResizeObserver|favicon/i.test(e))).toEqual([]);
  });
}
