import { test, expect } from '@playwright/test';

test('flow: splash → roster → studio → Lagos briefing → game', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const shot = (n: string) => page.screenshot({ path: `test-results/shots/${info.project.name}-${n}.png` });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Campaign Run' })).toBeVisible();
  await shot('1-splash');
  await page.getByRole('button', { name: /I'm 18\+ · Play/i }).click();
  await expect(page.getByRole('heading', { name: 'Pick your Contender' })).toBeVisible();
  await expect(page.locator('.cr-portrait img').first()).toBeVisible({ timeout: 10_000 });
  await shot('2-roster');

  await page.getByRole('button', { name: /Mama Ankara/i }).click();
  await expect(page.locator('canvas.cr-studio-canvas')).toBeVisible();
  await page.waitForTimeout(600);
  await shot('3-studio');
  await page.getByRole('tab', { name: 'Top' }).click();
  await page.getByRole('button', { name: 'Kaftan' }).click();
  await page.getByRole('button', { name: 'Turn right' }).click();
  await page.getByRole('button', { name: 'Turn right' }).click();
  await page.waitForTimeout(500);
  await shot('4-studio-edited');

  await page.getByRole('button', { name: /Campaign in Lagos/i }).click();
  await expect(page.getByText('Day 1 · Lagos')).toBeVisible();
  await shot('5-briefing');
  await page.getByRole('button', { name: /Start the run/i }).click();

  const gotIt = page.getByRole('button', { name: /Got it/i });
  await gotIt.click({ timeout: 10_000 });

  await expect(page.getByText('Crowd')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('canvas.cr-canvas')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1500);
  await shot('6-game');

  const real = errors.filter((e) => !/ResizeObserver|favicon/i.test(e));
  expect(real).toEqual([]);
});

test('canvas fills the viewport (no portrait column on landscape)', async ({ page }) => {
  await page.goto('/?debug');
  await page.getByRole('button', { name: /I'm 18\+ · Play/i }).click();
  await page.getByRole('button', { name: /Engineer Spark/i }).click();
  await page.getByRole('button', { name: /Campaign in Lagos/i }).click();
  await page.getByRole('button', { name: /Start the run/i }).click();
  await page.getByRole('button', { name: /Got it/i }).click({ timeout: 10_000 });
  const box = await page.locator('canvas.cr-canvas').boundingBox();
  const vp = page.viewportSize()!;
  expect(box!.width).toBeGreaterThan(vp.width - 2);
  expect(box!.height).toBeGreaterThan(vp.height - 2);
});

test('every Lagos segment renders (jump along the 1.4 km course)', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-landscape', 'visual tour runs once');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('cr-storage', JSON.stringify({ state: { seenTutorial: true, activeContenderId: 'captain-kobo' }, version: 6 })));
  for (const [name, z] of [['ojuelegba', 120], ['bridge', 400], ['link', 640], ['market', 900], ['park', 1160], ['island', 1340]] as const) {
    await page.goto(`/?debug&debugZ=${z}`);
    await page.getByRole('button', { name: /I'm 18\+ · Play/i }).click();
    await page.getByRole('button', { name: /Captain Kobo/i }).click();
    await page.getByRole('button', { name: /Campaign in Lagos/i }).click();
    await page.getByRole('button', { name: /Start the run/i }).click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `test-results/shots/tour-${name}.png` });
  }
  expect(errors.filter((e) => !/ResizeObserver|favicon/i.test(e))).toEqual([]);
});
