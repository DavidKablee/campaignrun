import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
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
});
