import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/*/test/**/*.test.ts', 'api/test/**/*.test.ts', 'tools/**/*.test.ts'],
    environment: 'node',
    // The API suites share one test database and truncate it between tests, so files run one at a time.
    fileParallelism: false,
  },
});
