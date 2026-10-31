import { execFileSync } from 'node:child_process';
import { test, expect, type Browser, type Page } from '@playwright/test';

/**
 * Mobilise (C82). The offline path needs nothing running; the two-player path needs the API on
 * 127.0.0.1:8787 with a database (see docs/LOCAL-BACKEND.md) and skips itself when it is not there.
 */
const API = 'http://127.0.0.1:8787';

async function seeded(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    baseURL: 'http://127.0.0.1:4173',
  });
  await context.addInitScript(() => {
    localStorage.setItem('cr-storage', JSON.stringify({ state: { following: 1500, seenTutorial: true }, version: 12 }));
  });
  return context.newPage();
}

async function openMobilise(page: Page) {
  await page.goto('/?debug');
  await page.getByRole('button', { name: /Continue campaign/i }).click();
  await page.getByRole('button', { name: /^Mobilise/ }).click();
}

test('a first-time player sees Mobilise on the splash, beside Run my race', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Run my race/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Mobilise/ })).toBeVisible();
});

test('Mobilise is locked below 1,000 Following and says how far to go', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173' });
  await context.addInitScript(() => {
    localStorage.setItem('cr-storage', JSON.stringify({ state: { following: 40, seenTutorial: true }, version: 12 }));
  });
  const page = await context.newPage();
  await page.goto('/');
  const button = page.getByRole('button', { name: /^Mobilise/ });
  await expect(button).toBeDisabled();
  await expect(button).toContainText('Unlocks at 1,000 Following · 960 to go');
  await context.close();
});

test('Mobilise says "Opening soon" and stays shut when the server is unreachable', async ({ browser }) => {
  const page = await seeded(browser);
  await page.route('**/api/places/online**', (r) => r.abort());
  await page.goto('/');
  await page.getByRole('button', { name: /Continue campaign/i }).click();
  const button = page.getByRole('button', { name: /^Mobilise/ });
  await expect(button).toContainText('Opening soon');
  await expect(button).toBeDisabled();
  await page.context().close();
});

test('two players meet in a place, act and talk in presets', async ({ browser, request }) => {
  const health = await request.get(`${API}/api/health`).catch(() => null);
  test.skip(!health?.ok(), 'API not running on 127.0.0.1:8787');

  const a = await seeded(browser);
  const b = await seeded(browser);
  const suffix = Math.random().toString(36).slice(2, 7);
  for (const [page, name] of [[a, `alpha_${suffix}`], [b, `bravo_${suffix}`]] as const) {
    const res = await page.context().request.post(`${API}/api/auth/guest`, { data: { username: name } });
    expect(res.status()).toBe(201);
  }
  await openMobilise(a);
  await openMobilise(b);
  // The two projects run side by side against one API, so the room may hold more than these two.
  await expect(a.locator('.cr-places-title')).toContainText(/(?:[2-9]|1\d) players/, { timeout: 15_000 });
  await expect(b.locator('.cr-places-title')).toContainText(/(?:[2-9]|1\d) players/, { timeout: 15_000 });

  // Locals fill the place and say so; the first-visit card explains the controls once.
  await expect(a.locator('.cr-places-title')).toContainText(/\d+ locals/);
  await expect(a.locator('.cr-places-coach')).toContainText('Tap the ground to walk');
  await a.getByRole('button', { name: 'Got it' }).click();
  await expect(a.locator('.cr-places-coach')).toHaveCount(0);
  await expect(a.locator('.cr-place-tag.is-local').first()).toBeVisible();

  // The invite sheet offers WhatsApp, copy and the deep link; nothing about the Contender.
  await a.getByRole('button', { name: 'Invite a friend here' }).click();
  await expect(a.getByRole('button', { name: 'Share on WhatsApp' })).toBeVisible();
  await expect(a.getByRole('region', { name: 'Invite a friend' })).not.toContainText(/contender:/i);
  await a.screenshot({ path: `test-results/shots/places-invite-${test.info().project.name}.png` });
  await a.getByRole('button', { name: 'Close' }).click();

  // A canvass pays coins and the toast says so.
  await a.getByRole('button', { name: /^Canvass/ }).click();
  await expect(a.locator('.cr-places-toast')).toContainText('₦3');

  // B says a preset phrase from the talk tray, which keeps the scene in view; A sees the bubble.
  await b.getByRole('button', { name: /^Say/ }).click();
  await expect(b.locator('.cr-places-stage')).toBeVisible();
  await b.screenshot({ path: `test-results/shots/places-talk-${test.info().project.name}.png` });
  await b.getByRole('button', { name: 'Good morning, neighbour!' }).click();
  await expect(a.locator('.cr-place-bubble').first()).toContainText('Good morning, neighbour!', { timeout: 10_000 });

  await a.screenshot({ path: `test-results/shots/places-${test.info().project.name}.png` });

  // There is no way to type: no text field in the place at all.
  await expect(a.locator('.cr-screen--places input[type="text"], .cr-screen--places textarea')).toHaveCount(0);

  // The scene stays inside the draw budget.
  const stats = await a.evaluate(() => (window as unknown as { __place?: { stats: () => { draws: number } } }).__place?.stats());
  test.info().annotations.push({ type: 'draws', description: JSON.stringify(stats) });
  expect(stats?.draws ?? 0).toBeLessThan(200);

  await a.context().close();
  await b.context().close();
});

test('players can switch to the national square, and become friends by tapping each other (C90)', async ({ browser, request }) => {
  const health = await request.get(`${API}/api/health`).catch(() => null);
  test.skip(!health?.ok(), 'API not running on 127.0.0.1:8787');

  const a = await seeded(browser);
  const b = await seeded(browser);
  const suffix = Math.random().toString(36).slice(2, 7);
  for (const [page, name] of [[a, `fa_${suffix}`], [b, `fb_${suffix}`]] as const) {
    const res = await page.context().request.post(`${API}/api/auth/guest`, { data: { username: name } });
    expect(res.status()).toBe(201);
  }
  // Both open the same quiet place (the parallel project may be in lagos, so use a state it does not).
  for (const page of [a, b]) {
    await page.goto('/?debug#mobilise=enugu.park');
    await expect(page.locator('.cr-places-title strong')).toContainText('Enugu Park');
  }
  await expect(a.locator('.cr-places-title')).toContainText(/[2-9] players/, { timeout: 15_000 });

  // A taps B in the People tray and asks to be friends.
  await a.getByRole('button', { name: /^People here/ }).click();
  await a.getByRole('region', { name: 'People here' }).getByRole('button', { name: new RegExp(`fb_${suffix}`) }).click();
  await a.getByRole('button', { name: 'Add friend' }).click();
  await expect(a.locator('.cr-places-toast')).toContainText('Friend request sent');

  // B sees the request and accepts; both now list each other as friends, online, in this place.
  await b.getByRole('button', { name: /^People here/ }).click();
  await b.getByRole('button', { name: /^Friends/ }).click();
  await expect(b.getByRole('region', { name: 'Campaign Phone' })).toContainText(`fa_${suffix}`);
  await b.getByRole('button', { name: 'Accept' }).click();
  await expect(b.getByRole('region', { name: 'Campaign Phone' })).toContainText('In Enugu Park');

  // A switches rooms: the browser lists this room with the friend badge, and the square is one tap away.
  await a.getByRole('button', { name: 'Campaign Phone' }).click();
  const phone = a.getByRole('region', { name: 'Campaign Phone' });
  // The home screen lists the apps; Jobs shows today's three jobs and what they pay.
  for (const app of ['Jobs', 'Friends', 'Rooms', 'Messages', 'Board', 'Convoy', 'Settings']) {
    await expect(phone.getByRole('button', { name: new RegExp(`^${app}`) })).toBeVisible();
  }
  await phone.getByRole('button', { name: /^Jobs/ }).click();
  await expect(phone.locator('.cr-phone-list').first().locator('li')).toHaveCount(3);
  await a.screenshot({ path: `test-results/shots/places-phone-jobs-${test.info().project.name}.png` });
  await phone.getByRole('button', { name: 'Back to the phone home' }).click();
  await phone.getByRole('button', { name: /^Rooms/ }).click();
  await expect(phone).toContainText('Enugu Park');
  await expect(phone).toContainText('1 friend');
  await phone.getByRole('button', { name: /Naija Square/ }).click();
  await expect(a.locator('.cr-places-title strong')).toContainText('Naija Square');
  await a.screenshot({ path: `test-results/shots/places-square-${test.info().project.name}.png` });

  await a.context().close();
  await b.context().close();
});

test('a player starts a poll from the Say tray and the room votes on it (C92)', async ({ browser, request }) => {
  const health = await request.get(`${API}/api/health`).catch(() => null);
  test.skip(!health?.ok(), 'API not running on 127.0.0.1:8787');

  const a = await seeded(browser);
  const b = await seeded(browser);
  const suffix = Math.random().toString(36).slice(2, 7);
  for (const [page, name] of [[a, `pa_${suffix}`], [b, `pb_${suffix}`]] as const) {
    const res = await page.context().request.post(`${API}/api/auth/guest`, { data: { username: name } });
    expect(res.status()).toBe(201);
  }
  // A place of their own for this check, so a poll in a shared room does not collide with another run.
  const spot = test.info().project.name === 'mobile-portrait' ? 'sokoto.lake' : 'katsina.lake';
  for (const page of [a, b]) {
    await page.goto(`/?debug#mobilise=${spot}`);
    await expect(page.locator('.cr-places-title')).toContainText('Lakeside');
  }
  await expect(a.locator('.cr-places-title')).toContainText(/[2-9] players/, { timeout: 15_000 });

  // The tray is a set of topic packs, with the polls among them.
  await a.getByRole('button', { name: /^Say/ }).click();
  const topics = a.getByRole('region', { name: 'Say something' }).getByLabel('Topics').getByRole('button');
  expect(await topics.count()).toBeGreaterThanOrEqual(12);
  await a.getByRole('button', { name: 'Polls', exact: true }).click();
  await a.getByRole('button', { name: /^Jollof: party or home\?/ }).click();

  // Both see the poll card; B votes; A sees the count move.
  await expect(a.getByRole('group', { name: 'Poll' })).toContainText('Jollof: party or home?');
  await expect(b.getByRole('group', { name: 'Poll' })).toBeVisible({ timeout: 10_000 });
  await b.getByRole('group', { name: 'Poll' }).getByRole('button', { name: /Party jollof/ }).click();
  await expect(a.getByRole('group', { name: 'Poll' }).getByRole('button', { name: /Party jollof/ })).toContainText('1', { timeout: 10_000 });
  await a.screenshot({ path: `test-results/shots/places-poll-${test.info().project.name}.png` });

  // A second vote from the same player is not possible: the buttons are spent.
  await expect(b.getByRole('group', { name: 'Poll' }).getByRole('button', { name: /Home jollof/ })).toBeDisabled();

  await a.context().close();
  await b.context().close();
});

test('an invite link opens the same place for a friend', async ({ browser }) => {
  const page = await seeded(browser);
  await page.goto('/#mobilise=kano.stadium');
  await expect(page.locator('.cr-places-title strong')).toContainText('Kano Stadium');
  await expect(page).toHaveURL(/^[^#]*$/);
  await page.context().close();
});

test('a link that names no real place is ignored', async ({ browser }) => {
  const page = await seeded(browser);
  await page.goto('/#mobilise=nowhere.moon');
  await expect(page.locator('.cr-screen--places')).toHaveCount(0);
  await page.context().close();
});

// C93: typed chat ships dark. This needs the API started with CR_CHAT_ENABLED=true and E2E_DATABASE_URL
// pointing at its database (to age the account and finish a job); it skips itself otherwise.
test('a player who is old enough types a line and a refused one is dropped with a reason (C93)', async ({ browser, request }) => {
  const health = await request.get(`${API}/api/health`).catch(() => null);
  test.skip(!health?.ok(), 'API not running on 127.0.0.1:8787');
  const dbUrl = process.env.E2E_DATABASE_URL;
  test.skip(!dbUrl, 'E2E_DATABASE_URL not set');

  const page = await seeded(browser);
  const name = `typist_${Math.random().toString(36).slice(2, 7)}`;
  const res = await page.context().request.post(`${API}/api/auth/guest`, { data: { username: name } });
  expect(res.status()).toBe(201);
  const status = await page.context().request.get(`${API}/api/places/chat`);
  test.skip(!(((await status.json()) as { enabled: boolean }).enabled), 'API has CR_CHAT_ENABLED off');

  execFileSync('psql', [
    dbUrl!,
    '-c',
    `update users set created_at = now() - interval '2 days' where username = '${name}';
     insert into place_jobs (user_id, day, job_id, progress, done_at) select id, current_date, 'e2e', 1, now() from users where username = '${name}';`,
  ]);

  await page.goto('/?debug#mobilise=kaduna.park');
  await expect(page.locator('.cr-places-title strong')).toContainText('Kaduna Park');
  await page.locator('.cr-place-action--say').click();
  const box = page.getByLabel('Type a message');
  await expect(box).toBeVisible();

  await box.fill('call 08031234567');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Say something' })).toContainText(/Phone and account numbers/);
  // Locals chatter in bubbles of their own, so look for this text only.
  await expect(page.locator('.cr-place-bubble', { hasText: '08031234567' })).toHaveCount(0);

  await box.fill('Good morning Kaduna');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('.cr-place-bubble', { hasText: 'Good morning Kaduna' })).toHaveCount(1);
  await page.context().close();
});
