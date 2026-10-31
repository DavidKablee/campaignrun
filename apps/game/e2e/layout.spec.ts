import { test, expect, type Page } from '@playwright/test';

/**
 * C88: reach, size and layout on the screens a player hits first. No colours are asserted here.
 */
const seed = (page: Page, following: number, contender = false) =>
  page.addInitScript(
    ([f, c]) => {
      localStorage.setItem('cr-storage', JSON.stringify({ state: { following: f, seenTutorial: true }, version: 12 }));
      if (c) localStorage.setItem('cr-contender', JSON.stringify({ state: { activeContenderId: 'captain-kobo' }, version: 2 }));
    },
    [following, contender] as const,
  );

test('pinch-zoom is allowed (the viewport does not forbid scaling)', async ({ page }) => {
  await page.goto('/');
  const meta = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(meta).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/);
});

test('on a short landscape screen every splash button can be reached', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await seed(page, 1500, true);
  await page.goto('/');
  for (const name of [/Mobilise/, /Board/, /Yard/, /About/]) {
    const b = page.getByRole('button', { name }).first();
    await b.scrollIntoViewIfNeeded();
    await expect(b).toBeInViewport();
  }
});

test('an invite that arrives before the Mobilise unlock is explained, not dropped', async ({ page }) => {
  await seed(page, 40);
  await page.goto('/#mobilise=kano.stadium');
  await expect(page.locator('.cr-notice').filter({ hasText: 'Kano Stadium' })).toContainText('960 to go');
});

test('Back is a 44px button on the Board, the Roster and the Briefing', async ({ page }) => {
  await seed(page, 100, true);
  await page.goto('/');
  await page.getByRole('button', { name: /Continue campaign/i }).click();
  const brief = await page.getByRole('button', { name: 'Back' }).boundingBox();
  expect(brief!.width).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: /Board/ }).click();
  const board = await page.getByRole('button', { name: 'Back' }).boundingBox();
  expect(board!.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: /Contender/ }).click();
  const roster = await page.getByRole('button', { name: 'Back' }).boundingBox();
  expect(roster!.height).toBeGreaterThanOrEqual(44);
});

test('a greyed sign-up button says what is missing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Board/ }).click();
  await page.getByRole('button', { name: /Sign in to post/ }).click();
  await expect(page.getByText(/Enter your email to continue/)).toBeVisible();
});

test('Mobilise uses the width on a landscape screen', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await seed(page, 1500, true);
  await page.goto('/?debug');
  await page.getByRole('button', { name: /Mobilise/ }).first().click();
  const stage = await page.locator('.cr-places-stage').boundingBox();
  expect(stage!.height).toBeGreaterThan(390 * 0.5);
  expect(stage!.width).toBeGreaterThan(844 * 0.5);
});
