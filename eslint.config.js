import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      'reference/',
      'public/',
      'test-results/',
      'playwright-report/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // Architecture rule 1: the simulation is pure and deterministic.
    files: ['src/sim/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded RNG in src/sim/rng.ts.' },
        {
          object: 'performance',
          property: 'now',
          message: 'The simulation gets time only from step(dt).',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: 'The simulation gets time only from step(dt).' },
        { name: 'window', message: 'No DOM in src/sim.' },
        { name: 'document', message: 'No DOM in src/sim.' },
        { name: 'localStorage', message: 'Saving lives in src/save.' },
      ],
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['pixi.js', 'pixi.js/*'], message: 'No rendering in src/sim.' }] },
      ],
    },
  },
);
