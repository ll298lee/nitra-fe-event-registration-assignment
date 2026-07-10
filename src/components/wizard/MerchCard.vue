<script setup>
import { computed } from 'vue';

const props = defineProps({
  /** @type {import('../../data/normalize.js').Addon} */
  merch: { type: Object, required: true },
  /** Currently selected size, or `null` when none is chosen. */
  size: { type: String, default: null },
  /** Quantity currently in the order (0 ⇒ not added). */
  quantity: { type: Number, default: 0 },
});

const emit = defineEmits(['increment', 'decrement', 'select-size']);

const added = computed(() => props.quantity >= 1);
const atMin = computed(() => props.quantity <= 0);
const atMax = computed(() => props.quantity >= props.merch.maxQuantity);
const hasSizes = computed(() => Array.isArray(props.merch.sizes) && props.merch.sizes.length > 0);

// The selection ring is an inset box-shadow (never a border) so adding/removing an item
// can't change the card's box size. The full shadow value is written as one literal — not
// interpolated from a shared const — because UnoCSS extracts classes by scanning source
// text, and this 1px brand-emphasis ring appears on no other card, so a split token would
// never be generated.
const rootClass = computed(() =>
  added.value
    ? 'bg-brand-subtle-rest shadow-[inset_0_0_0_1px_var(--border-brand-emphasis),0px_4px_16px_0px_rgba(0,0,0,0.08),0px_1px_3px_0px_rgba(0,0,0,0.04)]'
    : 'bg-surface-l0 shadow-[inset_0_0_0_1px_var(--border-neutral-muted),0px_4px_16px_0px_rgba(0,0,0,0.08),0px_1px_3px_0px_rgba(0,0,0,0.04)]'
);

function onSizeChange(e) {
  emit('select-size', props.merch.id, e.target.value);
}
</script>

<template>
  <div
    role="group"
    :aria-label="merch.name"
    class="flex w-full flex-col items-start gap-2 rounded-md p-4"
    :class="rootClass"
  >
    <div class="flex w-full items-center justify-between gap-4">
      <span class="text-subtitle1 text-neutral">{{ merch.name }}</span>
      <span class="text-subtitle1 text-neutral">${{ merch.price }}</span>
    </div>

    <span class="text-sm font-regular text-neutral-muted">{{ merch.description }}</span>

    <div class="flex w-full items-center gap-4">
      <label v-if="hasSizes" class="flex items-center gap-2 whitespace-nowrap">
        <span class="text-sm font-medium text-neutral-muted">Size:</span>
        <span class="relative inline-flex items-center">
          <select
            :value="size ?? ''"
            :aria-label="`Size for ${merch.name}`"
            class="cursor-pointer appearance-none rounded-[6px] border border-solid border-neutral-muted bg-surface-l0 py-1.5 pl-3 pr-7 text-sm font-medium"
            :class="size ? 'text-neutral' : 'text-neutral-quiet'"
            @change="onSizeChange"
          >
            <option value="" disabled>Select</option>
            <option v-for="s in merch.sizes" :key="s" :value="s">{{ s }}</option>
          </select>
          <span
            class="pointer-events-none absolute right-2 text-[10px] text-neutral-quiet"
            aria-hidden="true"
            >▾</span
          >
        </span>
      </label>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-neutral-muted">Qty:</span>
        <button
          type="button"
          :disabled="atMin"
          :aria-label="`Decrease ${merch.name} quantity`"
          class="flex size-7 items-center justify-center rounded-[6px] border-0 bg-surface-l2 disabled:cursor-not-allowed"
          @click="emit('decrement', merch.id)"
        >
          <svg
            viewBox="0 0 12 2"
            class="w-3 transition-colors"
            :class="atMin ? 'text-neutral-disabled' : 'text-neutral'"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect width="12" height="2" />
          </svg>
        </button>
        <span
          class="flex h-7 w-6 items-center justify-center text-md font-semibold leading-[14px] text-neutral"
          aria-live="polite"
        >
          {{ quantity }}
        </span>
        <button
          type="button"
          :disabled="atMax"
          :aria-label="`Increase ${merch.name} quantity`"
          class="flex size-7 items-center justify-center rounded-[6px] border-0 bg-surface-l2 disabled:cursor-not-allowed"
          @click="emit('increment', merch.id)"
        >
          <svg
            viewBox="0 0 12 12"
            class="h-3 w-3 transition-colors"
            :class="atMax ? 'text-neutral-disabled' : 'text-neutral'"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="0" y="5" width="12" height="2" />
            <rect x="5" y="0" width="2" height="12" />
          </svg>
        </button>
        <span class="text-[10px] font-regular text-neutral-quiet">max {{ merch.maxQuantity }}</span>
      </div>
    </div>

    <span v-if="added" class="text-[11px] font-semibold text-success">✓ Added to order</span>
  </div>
</template>
