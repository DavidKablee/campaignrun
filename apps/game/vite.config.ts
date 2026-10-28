import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ command }) => ({
  // The dev server reads VITE_* values from the repo-root .env (the API address a phone on the
  // LAN needs). A production build keeps the app folder, so a local address is never baked in.
  envDir: command === 'serve' ? '../..' : undefined,
  plugins: [
    react(),
    {
      // The content package sits outside this app's root, so a dev server never saw files
      // added to its data folders: the `import.meta.glob` lists of state packs and world
      // libraries went stale and a new state silently drew the Lagos world. Watching the
      // folder makes the globs refresh when a file is added.
      name: 'cr-watch-content-data',
      configureServer(server) {
        server.watcher.add(fileURLToPath(new URL('../../packages/content/data', import.meta.url)));
      },
    },
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'flags.json', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Campaign Run',
        short_name: 'Campaign Run',
        description: 'Fictional campaign lane runner. Game scores. Not a poll.',
        theme_color: '#0B1220',
        background_color: '#0B1220',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        lang: 'en',
        categories: ['games'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Shell + fonts; state packs AND biome-kit models stay runtime-cached
        // (not precached) so first paint stays lean (ADR-0009: never part of
        // first load). They're cached the first time a run actually fetches
        // them, then available offline from then on — same contract as the
        // existing state-pack caching below.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        globIgnores: ['**/states/**', '**/waitlist*', '**/models/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/flags\.json$/, /^\/states\//, /^\/models\//],
        runtimeCaching: [
          {
            urlPattern: /\/states\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cr-state-packs',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\/models\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cr-biome-models',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { host: true },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        waitlist: 'waitlist.html',
      },
      output: {
        // Dynamic JSON state packs are independently cacheable and measured by
        // tools/size-check.mjs rather than silently joining the main shell.
        chunkFileNames: (chunk) =>
          chunk.facadeModuleId?.includes('/data/states/') || chunk.facadeModuleId?.includes('\\data\\states\\')
            ? 'states/[name]-[hash].js'
            : 'assets/[name]-[hash].js',
      },
    },
  },
}));
