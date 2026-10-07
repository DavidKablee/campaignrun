import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        waitlist: 'waitlist.html'
      },
      output: {
        // Dynamic JSON state packs are independently cacheable and measured by
        // tools/size-check.mjs rather than silently joining the main shell.
        chunkFileNames: (chunk) =>
          chunk.name === 'lagos' || chunk.name === 'dummy' ? 'states/[name]-[hash].js' : 'assets/[name]-[hash].js'
      },
    }
  }
});
