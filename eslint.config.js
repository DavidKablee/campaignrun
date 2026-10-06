import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const simBannedMath = ['random', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'exp', 'log', 'log2', 'log10', 'pow', 'hypot', 'cbrt', 'sinh', 'cosh', 'tanh'];

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // packages/sim must be pure + deterministic across browsers and the server.
    files: ['packages/sim/src/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        ...simBannedMath.map((property) => ({
          object: 'Math',
          property,
          message: `Math.${property} is banned in packages/sim (determinism). Use integers.`,
        })),
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'performance', 'Date', 'navigator', 'localStorage', 'requestAnimationFrame', 'setTimeout', 'setInterval'].map((name) => ({
          name,
          message: `${name} is banned in packages/sim (must be pure).`,
        })),
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['three', 'three/*', 'pixi.js', '@cr/game', '../../apps/*'], message: 'sim must not import rendering or app code.' },
          ],
        },
      ],
    },
  },
);
