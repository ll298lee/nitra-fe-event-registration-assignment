import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';

// Vitest is set up via the official Quasar app extension (@quasar/testing-unit-vitest).
// Primary use: targeted business-logic unit tests (pure functions). Vue/Quasar component
// tests are also supported — mount with @vue/test-utils + installQuasarPlugin().
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: 'test/vitest/setup-file.js',
    include: [
      // Co-locate business-logic tests next to their source, e.g.
      // src/utils/pricing.test.js. Broader/component tests live under test/vitest.
      'src/**/*.{test,spec}.js',
      'test/vitest/__tests__/**/*.{test,spec}.js',
    ],
  },
  plugins: [vue({ template: { transformAssetUrls } }), quasar()],
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
