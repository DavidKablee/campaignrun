import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'apps/game/e2e',
  timeout: 90_000,
  use: { baseURL: 'http://127.0.0.1:4173' },
  projects: [
    {
      name: 'mobile-portrait',
      use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
    },
    {
      name: 'desktop-landscape',
      use: { viewport: { width: 1280, height: 720 } },
    },
  ],
  webServer: {
    command: 'pnpm --filter @cr/game preview --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
