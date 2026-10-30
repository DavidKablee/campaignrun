import { test, expect } from '@playwright/test';

test('first-timer flow: splash → straight into the run, sim waits under the tutorial', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const shot = (n: string) => page.screenshot({ path: `test-results/shots/${info.project.name}-${n}.png` });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Campaigner' })).toBeVisible();
  await shot('1-splash');
  await page.getByRole('button', { name: /Run my race/i }).click();

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

test('the coach card teaches loading, and Quit from the trial goes back to the start', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Run my race/i }).click();
  await expect(page.locator('.cr-coach-card')).toContainText(/flick down and hold to load/i, { timeout: 10_000 });
  // Integrity is a meter on the glass, so the first card says what it is.
  await expect(page.locator('.cr-coach-card')).toContainText(/Integrity is your clean name/i);
  await page.getByRole('button', { name: /Got it/i }).click();
  await page.locator('.cr-hud-pause').click();
  await page.getByRole('button', { name: 'Quit' }).click();
  // No Contender yet, so no Briefing: Play there is still the trial.
  await expect(page.getByRole('button', { name: /Run my race/i })).toBeVisible();
});

test('Grassroots Start taken before playing still gets the coached trial', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'cr-storage',
      JSON.stringify({ state: { following: 35, coins: 40, startingStory: 'grassroots' }, version: 12 }),
    );
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Run my race/i }).click();
  await expect(page.getByRole('button', { name: /Got it/i })).toBeVisible({ timeout: 10_000 });
});

test('canvas fills the viewport (no portrait column on landscape)', async ({ page }) => {
  await page.goto('/?debug');
  await page.getByRole('button', { name: /Run my race/i }).click();
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
  await page.getByRole('button', { name: /Run my race/i }).click();
  await page.getByRole('button', { name: /Got it/i }).click({ timeout: 10_000 });
  await expect(page.locator('.cr-result')).toContainText('Quick rally', { timeout: 15_000 });
  await expect(page.getByText(/do not go on a board/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Pick your Contender/i }).first()).toBeVisible();
  // The challenge link waits until there is a Contender to explain the score.
  await expect(page.getByRole('button', { name: /WhatsApp/i })).toHaveCount(0);
});

test('Esc pauses a run and resumes it, and is Back on a menu', async ({ page }) => {
  await page.goto('/?debug');
  await page.getByRole('button', { name: /Run my race/i }).click();
  await page.getByRole('button', { name: /Got it/i }).click({ timeout: 10_000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('.cr-pause')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.cr-pause')).toHaveCount(0);
  await expect(page.locator('canvas.cr-canvas')).toBeVisible();
});

test('Esc backs out of a menu to the splash, and the Reduce motion setting reaches the page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Yard/ }).click();
  await expect(page.getByRole('heading', { name: 'Convoy Yard' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Campaigner' })).toBeVisible();
  await page.getByRole('button', { name: /About/ }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Campaigner' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'false');
});

test('the Board says it is a game board, and still draws a map with no WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const real = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
      if (/webgl/i.test(kind)) return null;
      return (real as (k: string, ...r: unknown[]) => RenderingContext | null).call(this, kind, ...rest);
    } as typeof real;
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Board/ }).click();
  await expect(page.getByText(/A game board\./)).toBeVisible();
  await expect(page.locator('svg.cr-board-flat polygon').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.cr-board-focus')).toContainText(/Practice/);
  await expect(page.locator('.cr-board-focus')).not.toContainText(/ahead by|leads by/);
});

test('Briefing puts Start the run on its own row, and the Settings button has a word', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cr-storage', JSON.stringify({ state: { seenTutorial: true, following: 100 }, version: 12 }));
    localStorage.setItem('cr-contender', JSON.stringify({ state: { activeContenderId: 'captain-kobo' }, version: 2 }));
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Settings/ })).toContainText('Settings');
  await page.getByRole('button', { name: /Continue campaign/i }).click();
  const start = (await page.getByRole('button', { name: /Start the run/i }).boundingBox())!;
  const quick = (await page.getByRole('button', { name: /Quick rally/i }).boundingBox())!;
  expect(start.width).toBeGreaterThan(quick.width * 1.5);
  expect(start.y).toBeLessThan(quick.y);
});
