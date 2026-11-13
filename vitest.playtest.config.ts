import { defineConfig } from 'vitest/config';

/** `npm run playtest`: the bot play-tester (tools/playtest/), kept apart from the unit tests. */
export default defineConfig({
  test: {
    include: ['tools/playtest/**/*.playtest.ts'],
    environment: 'node',
    globalSetup: ['tools/playtest/global.ts'],
    testTimeout: 60 * 60 * 1000,
    reporters: ['dot'],
  },
});
