import { test, expect } from '@playwright/test';

test('first-timer flow: splash → straight into the run, sim waits under the tutorial', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const shot = (n: string) => page.screenshot({ path: `test-results/shots/${info.project.name}-${n}.png` });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Campaigner' })).toBeVisible();
  await shot('1-splash');
  await page.getByRole('button', { name: /I'm 18\+ · Play/i }).click();

  // No roster, studio or briefing in the way: the instructions are the first thing.
  const gotIt = page.getByRole('button', { name: /Got it/i });
  await expect(gotIt).toBeVisible({ timeout: 10_000 });
  const crowd = page.locator('.cr-hud-metric', { hasText: 'Momentum' }).locator('strong');
  const before = await crowd.textContent();
  await page.waitForTimeout(1500);
  expect(await crowd.textContent()).toBe(before);

  await gotIt.click();
  await expect(page.locator('canvas.cr-canvas')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1500);
  await shot('2-game');

  const real = errors.filter((e) => !/ResizeObserver|favicon/i.test(e));
  expect(real).toEqual([]);
});

test('canvas fills the viewport (no portrait column on landscape)', async ({ page }) => {
  await page.goto('/?debug');
  await page.getByRole('button', { name: /I'm 18\+ · Play/i }).click();
  await page.getByRole('button', { name: /Got it/i }).click({ timeout: 10_000 });
  const box = await page.locator('canvas.cr-canvas').boundingBox();
  const vp = page.viewportSize()!;
  expect(box!.width).toBeGreaterThan(vp.width - 2);
  expect(box!.height).toBeGreaterThan(vp.height - 2);
});

test('every Lagos segment renders (jump along the course)', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-landscape', 'visual tour runs once');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // A returning player with a Contender already chosen: Play lands on the briefing.
  await page.addInitScript(() => {
    localStorage.setItem('cr-storage', JSON.stringify({ state: { seenTutorial: true, following: 100 }, version: 6 }));
    localStorage.setItem('cr-contender', JSON.stringify({ state: { activeContenderId: 'captain-kobo' }, version: 2 }));
  });
  for (const [name, z] of [['ojuelegba', 120], ['bridge', 400], ['link', 640], ['market', 900], ['park', 1160], ['island', 1340]] as const) {
    await page.goto(`/?debug&debugZ=${z}`);
    await page.getByRole('button', { name: /Continue campaign/i }).click();
    await page.getByRole('button', { name: /Start the run/i }).click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `test-results/shots/tour-${name}.png` });
  }
  expect(errors.filter((e) => !/ResizeObserver|favicon/i.test(e))).toEqual([]);
});

test('a "beat my run" link opens a banner, drops the hash, and starts the same road', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem('cr-storage', JSON.stringify({ state: { seenTutorial: true, following: 100 }, version: 6 }));
  });
  await page.goto('/#c=zz~lagos~okada~100~0~Ade_22');
  const banner = page.locator('.cr-challenge-banner');
  await expect(banner).toContainText('Ade_22');
  await expect(banner).toContainText('100');
  expect(new URL(page.url()).hash).toBe('');

  await page.getByRole('button', { name: /Take the challenge/i }).click();
  await expect(page.locator('canvas.cr-canvas')).toBeVisible({ timeout: 10_000 });
  expect(errors.filter((e) => !/ResizeObserver|favicon/i.test(e))).toEqual([]);
});

test('a link that names nothing real is ignored', async ({ page }) => {
  await page.goto('/#c=zz~atlantis~submarine~100~0~');
  await expect(page.getByRole('heading', { name: 'Campaigner' })).toBeVisible();
  await expect(page.locator('.cr-challenge-banner')).toHaveCount(0);
});

test('the first-timer rally is a quick one: it ends on a result that offers the Contender pick', async ({ page }) => {
  // Past the quick finish line, so the run ends on its first tick without a bot.
  await page.goto('/?debug&debugZ=1500');
  await page.getByRole('button', { name: /I'm 18\+ · Play/i }).click();
  await page.getByRole('button', { name: /Got it/i }).click({ timeout: 10_000 });
  await expect(page.locator('.cr-result')).toContainText('Quick rally', { timeout: 15_000 });
  await expect(page.getByText(/do not go on a board/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Pick your Contender/i }).first()).toBeVisible();
});
