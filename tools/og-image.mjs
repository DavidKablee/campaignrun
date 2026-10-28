// Regenerates apps/game/public/og-image.png (1200x630) from tools/og-image.html.
// Run: PLAYWRIGHT_BROWSERS_PATH=0 node tools/og-image.mjs
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('./og-image.html', import.meta.url));
const out = fileURLToPath(new URL('../apps/game/public/og-image.png', import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`file://${src}`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out });
await browser.close();
console.log('wrote', out);
