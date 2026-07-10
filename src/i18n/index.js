import { createI18n } from 'vue-i18n';
import en from './en.js';
import zhTW from './zh-TW.js';

/**
 * The app's vue-i18n instance (IMPLEMENTATION_PLAN.md D14 / D45).
 *
 * Composition-API mode (`legacy: false`) so components read copy via `useI18n()` in
 * `<script setup>` and `$t` in templates (`globalInjection`). `en` is the default and the
 * fallback — the shipped English UI stays byte-identical to the Figma frame; `zh-TW` is
 * reached via the header language switcher.
 */
export const messages = { en, 'zh-TW': zhTW };

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  globalInjection: true,
  messages,
});
