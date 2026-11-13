import { defineConfig } from 'vitest/config';
import { serviceWorker } from './tools/vite/serviceWorker.ts';

export default defineConfig({
  // Relative paths, so the built game works from any folder: the site root or GitHub Pages'
  // /<repository>/ sub-path, without knowing the repository's name.
  base: './',
  server: { host: true, port: 5173 },
  // No source maps in the public build (docs/DEPLOY.md).
  build: { target: 'es2022', sourcemap: false },
  // The build date shown beside the version on the title screen (YYYY-MM-DD, the day it was built).
  define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)) },
  plugins: [serviceWorker()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
