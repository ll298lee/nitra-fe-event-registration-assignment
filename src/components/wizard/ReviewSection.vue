<script setup>
import { computed } from 'vue';

// One Step-4 summary card: a titled panel with an Edit control that jumps back to the
// matching step (AC-4.1/4.3, D35). Rows are `{ label, value, error? }` pairs; a row with a
// truthy `error` renders that message in place of its value. `errors` holds section-level
// messages (e.g. time conflicts). Any row-level or section-level error puts the whole card
// into its error state (D36). The Edit control is a real <button> because it navigates.
const props = defineProps({
  title: { type: String, required: true },
  editLabel: { type: String, required: true },
  rows: { type: Array, default: () => [] },
  errors: { type: Array, default: () => [] },
  emptyMessage: { type: String, default: '' },
});

defineEmits(['edit']);

const hasError = computed(() => props.rows.some((r) => r.error) || props.errors.length > 0);
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-md border border-solid bg-surface-l1 p-5 transition-colors"
    :class="hasError ? 'border-danger-emphasis' : 'border-neutral-muted'"
  >
    <div class="flex items-center justify-between gap-4">
      <h3
        class="text-subtitle1 transition-colors"
        :class="hasError ? 'text-danger' : 'text-neutral'"
      >
        {{ title }}
      </h3>
      <button
        type="button"
        class="shrink-0 cursor-pointer rounded-[2px] border-0 bg-transparent text-sm font-semibold text-brand underline transition-colors hover:text-brand-emphasis focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--border-brand-emphasis)]"
        :aria-label="$t('step4.editAria', { title })"
        @click="$emit('edit')"
      >
        {{ editLabel }}
      </button>
    </div>

    <div v-for="(row, i) in rows" :key="i" class="flex w-full items-start justify-between gap-4">
      <span class="shrink-0 text-sm font-regular text-neutral-muted">{{ row.label }}</span>
      <span
        class="text-right text-sm font-regular"
        :class="row.error ? 'text-danger' : 'text-neutral'"
      >
        {{ row.error || row.value }}
      </span>
    </div>

    <p v-for="(err, i) in errors" :key="`err-${i}`" class="text-sm font-regular text-danger">
      {{ err }}
    </p>

    <p
      v-if="!rows.length && !errors.length && emptyMessage"
      class="text-sm font-regular text-neutral-quiet"
    >
      {{ emptyMessage }}
    </p>
  </section>
</template>
