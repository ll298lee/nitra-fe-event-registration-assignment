<script setup>
import { useI18n } from 'vue-i18n';

// Header locale toggle (IMPLEMENTATION_PLAN.md D45) — a deliberate Figma spec-gap fill: the
// frame is English-only with no switcher, so this control is added to make the zh-TW locale
// reachable. Reuses the segmented tab-control treatment of the Step 2/3 day/category tabs.
const { t, locale } = useI18n({ useScope: 'global' });

const LOCALES = [
  { code: 'en', labelKey: 'language.en' },
  { code: 'zh-TW', labelKey: 'language.zhTW' },
];
</script>

<template>
  <div
    role="group"
    :aria-label="t('language.label')"
    class="inline-flex items-center gap-1 rounded-[10px] bg-surface-l2 p-1"
  >
    <button
      v-for="l in LOCALES"
      :key="l.code"
      type="button"
      :aria-pressed="locale === l.code"
      class="h-7 cursor-pointer whitespace-nowrap rounded-lg border-0 px-3 text-[13px] leading-[normal] transition-colors"
      :class="
        locale === l.code
          ? 'bg-brand-emphasis-rest font-semibold text-inverse'
          : 'bg-transparent font-medium text-neutral-muted hover:text-neutral'
      "
      @click="locale = l.code"
    >
      {{ t(l.labelKey) }}
    </button>
  </div>
</template>
