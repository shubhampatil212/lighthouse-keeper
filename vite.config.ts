import { defineConfig } from 'vitest/config';
import { serviceWorker } from './tools/vite/serviceWorker';

export default defineConfig({
  server: { host: true, port: 5173 },
  build: { target: 'es2022' },
  plugins: [serviceWorker()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
