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
      // Link previews need absolute URLs. Set VITE_PUBLIC_URL (https://your.domain, no trailing slash)
      // when building for a host; without it og:url is dropped and the image path stays relative.
      name: 'cr-public-url',
      transformIndexHtml(html) {
        const base = (process.env.VITE_PUBLIC_URL ?? '').replace(/\/+$/, '');
        const out = base ? html : html.replace(/^.*property="og:url".*\n/m, '');
        return out.replaceAll('%PUBLIC_URL%', base);
      },
    },
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
      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Campaigner',
        short_name: 'Campaigner',
        description: 'Drive your convoy through Nigeria. Load your people, dodge the go-slow, fill the rally.',
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
        // flags.json is the kill switch and the remote calendar: a precached copy would only ever change
        // with a new service worker, which is exactly when it is no use.
        globIgnores: ['**/states/**', '**/waitlist*', '**/models/**', '**/flags.json'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/flags\.json$/, /^\/states\//, /^\/models\//],
        runtimeCaching: [
          {
            urlPattern: /\/flags\.json$/i,
            handler: 'NetworkFirst',
            // A slow network falls back to the last copy after 3 s, so an offline player still boots.
            options: { cacheName: 'cr-flags', networkTimeoutSeconds: 3, expiration: { maxEntries: 1 } },
          },
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
