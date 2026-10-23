import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/*/test/**/*.test.ts', 'api/test/**/*.test.ts', 'tools/**/*.test.ts'],
    environment: 'node',
  },
});
