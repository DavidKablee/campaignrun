import { test, expect, type Page } from '@playwright/test';

/**
 * Phone play. These run on the touch project only and check the things a laptop never shows:
 * the rider stays on screen at every lane and curve phase, the run pauses when the page is
 * hidden or Back is pressed, and the HUD controls are big enough for a thumb.
 */
const PHONES = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
  { name: '844x390 landscape', width: 844, height: 390 },
];

async function startRun(page: Page, query: string) {
  await page.addInitScript(() => {
    localStorage.setItem('cr-storage', JSON.stringify({ state: { seenTutorial: true, following: 100 }, version: 11 }));
    localStorage.setItem('cr-contender', JSON.stringify({ state: { activeContenderId: 'captain-kobo' }, version: 2 }));
  });
  await page.goto(`/?debug&debugSeed=1&debugWeather=day${query}`);
  await page.getByRole('button', { name: /Continue campaign/i }).click();
  await page.getByRole('button', { name: /Start the run/i }).click();
  await page.waitForFunction(() => !!(window as unknown as { __crPlayerNdc?: unknown }).__crPlayerNdc, undefined, { timeout: 15_000 });
}

const ndc = (page: Page) => page.evaluate(() => (window as unknown as { __crPlayerNdc: { x: number; y: number } }).__crPlayerNdc);

for (const phone of PHONES) {
  for (const z of [300, 900]) {
    test(`${phone.name}: the rider stays in frame in every lane at ${z} m`, async ({ page }, info) => {
      test.skip(info.project.name !== 'mobile-portrait', 'phone viewports run on the touch project');
      await page.setViewportSize({ width: phone.width, height: phone.height });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await startRun(page, `&debugZ=${z}`);
      for (const [key, lane] of [['ArrowLeft', 'left'], ['ArrowRight', 'centre'], ['ArrowRight', 'right']] as const) {
        await page.keyboard.press(key);
        await page.waitForTimeout(700); // lane change + camera settle
        const p = await ndc(page);
        expect(Math.abs(p.x), `${phone.name} ${lane} lane at ${z} m`).toBeLessThan(0.8);
        expect(p.y).toBeGreaterThan(-1);
        expect(p.y).toBeLessThan(1);
      }
      await page.screenshot({ path: `test-results/shots/mobile-${phone.width}x${phone.height}-z${z}.png` });
      expect(errors.filter((e) => !/ResizeObserver|favicon/i.test(e))).toEqual([]);
    });
  }
}

test('hiding the page pauses the run', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-portrait', 'touch project only');
  await startRun(page, '');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('.cr-pause')).toBeVisible();
});

test('the Back gesture pauses instead of leaving the game', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-portrait', 'touch project only');
  await startRun(page, '');
  await page.goBack();
  await expect(page.locator('.cr-pause')).toBeVisible();
  expect(page.url()).toContain('debug');
});

test('the pause button and radio strip are thumb-sized and the radio button works', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-portrait', 'touch project only');
  await startRun(page, '');
  const pause = await page.locator('.cr-hud-pause').boundingBox();
  expect(pause!.width).toBeGreaterThanOrEqual(40);
  expect(pause!.height).toBeGreaterThanOrEqual(40);
  const radio = page.locator('.cr-radio-strip__btn');
  expect((await radio.boundingBox())!.height).toBeGreaterThanOrEqual(32);
  const before = await radio.getAttribute('aria-pressed');
  await radio.tap();
  expect(await radio.getAttribute('aria-pressed')).not.toBe(before);
  // Toggling the radio must not restart the run: the rider is still being tracked.
  expect(await ndc(page)).toBeTruthy();
});
