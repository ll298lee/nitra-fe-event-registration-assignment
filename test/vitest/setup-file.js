// This file will be run before each test file.
//
// Install the app's vue-i18n instance as a global @vue/test-utils plugin so mounted
// components resolve `$t` / `useI18n()` to the real `en` copy (the shipped default locale).
// Component specs assert English UI text, so this keeps them exercising the true strings
// rather than raw i18n keys (IMPLEMENTATION_PLAN.md D45).
import { config } from '@vue/test-utils';
import { i18n } from 'src/i18n/index.js';

if (!config.global.plugins.includes(i18n)) {
  config.global.plugins.push(i18n);
}
