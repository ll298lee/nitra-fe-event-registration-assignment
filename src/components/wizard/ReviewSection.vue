<script setup>
// One Step-4 summary card: a titled panel with an Edit control that jumps back to the
// matching step (AC-4.1/4.3, D35). Rows are `{ label, value }` pairs; an empty selection
// falls back to `emptyMessage`. The Edit control is a real <button> because it navigates.
defineProps({
  title: { type: String, required: true },
  editLabel: { type: String, required: true },
  rows: { type: Array, default: () => [] },
  emptyMessage: { type: String, default: '' },
});

defineEmits(['edit']);
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-md border border-solid border-neutral-muted bg-surface-l1 p-5"
  >
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-subtitle1 text-neutral">{{ title }}</h3>
      <button
        type="button"
        class="shrink-0 cursor-pointer rounded-[2px] border-0 bg-transparent text-sm font-semibold text-brand underline transition-colors hover:text-brand-emphasis focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--border-brand-emphasis)]"
        :aria-label="`Edit ${title}`"
        @click="$emit('edit')"
      >
        {{ editLabel }}
      </button>
    </div>

    <div v-for="(row, i) in rows" :key="i" class="flex w-full items-start justify-between gap-4">
      <span class="shrink-0 text-sm font-regular text-neutral-muted">{{ row.label }}</span>
      <span class="text-right text-sm font-regular text-neutral">{{ row.value }}</span>
    </div>

    <p v-if="!rows.length && emptyMessage" class="text-sm font-regular text-neutral-quiet">
      {{ emptyMessage }}
    </p>
  </section>
</template>
