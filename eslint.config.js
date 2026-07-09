import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    // Global ignores — must be a standalone object to apply to the whole run.
    ignores: ['dist', '.quasar', 'node_modules', '.yarn', 'src-capacitor', 'src-cordova'],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // Quasar / build-time globals
        process: 'readonly',
        __statics: 'readonly',
        ga: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-debugger': 'warn',
    },
  },

  {
    // Vitest globals for test files (globals: true is set in vitest.config.mjs).
    files: ['**/*.{test,spec}.js', 'test/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        suite: 'readonly',
      },
    },
  },

  // Keep last: disables all ESLint formatting rules so Prettier owns formatting.
  prettier,
];
