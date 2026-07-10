<script setup>
import { computed } from 'vue';
import { formatCurrency } from '../../utils/pricing.js';

const props = defineProps({
  /** @type {import('../../data/normalize.js').Addon} */
  meal: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});

const emit = defineEmits(['toggle']);

// The selection ring is an inset box-shadow (never a border) so toggling can't change the
// card's box size. Each shadow is written as one full literal — not interpolated from a
// shared const — because UnoCSS extracts classes by scanning source text; an interpolated
// class would only render if the resolved string happened to appear verbatim elsewhere, so
// inlining keeps this card self-contained.
const rootClass = computed(() =>
  props.selected
    ? 'cursor-pointer bg-brand-subtle-rest shadow-[inset_0_0_0_2px_var(--border-brand-emphasis),0px_4px_16px_0px_rgba(0,0,0,0.08),0px_1px_3px_0px_rgba(0,0,0,0.04)]'
    : 'cursor-pointer bg-surface-l0 shadow-[inset_0_0_0_1px_var(--border-neutral-muted),0px_4px_16px_0px_rgba(0,0,0,0.08),0px_1px_3px_0px_rgba(0,0,0,0.04)] hover:bg-surface-l2'
);
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="selected"
    class="flex w-full flex-col gap-2 rounded-md border-0 p-4 text-left transition-colors"
    :class="rootClass"
    @click="emit('toggle', meal.id)"
  >
    <div class="flex w-full items-center justify-between gap-4">
      <span class="text-subtitle1 text-neutral">{{ meal.name }}</span>
      <span class="text-subtitle1 text-brand-emphasis">{{ formatCurrency(meal.price) }}</span>
    </div>

    <span class="text-sm font-regular text-neutral-muted">{{ meal.description }}</span>
  </button>
</template>
