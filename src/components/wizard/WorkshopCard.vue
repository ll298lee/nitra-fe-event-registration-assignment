<script setup>
import { computed } from 'vue';
import { isFull, remainingSpots } from '../../logic/capacity.js';
import { formatCurrency } from '../../utils/pricing.js';
import { formatDateTimeRange } from '../../utils/datetime.js';

const props = defineProps({
  /** @type {import('../../data/normalize.js').Addon} */
  workshop: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  /**
   * Selected sessions this workshop's time slot overlaps (from `conflictingSessions`).
   * Non-empty ⇒ a time conflict; the card names them (AC-3.3, D9, D31b).
   * @type {{ title: string }[]}
   */
  conflicts: { type: Array, default: () => [] },
});

const emit = defineEmits(['toggle']);

const full = computed(() => isFull(props.workshop));
const remaining = computed(() => remainingSpots(props.workshop));
const conflicting = computed(() => props.conflicts.length > 0);

// A full or conflicting workshop can't be newly selected, but one already selected (before
// it filled or the conflict arose) stays deselectable — kept, not auto-removed (D10).
const blocked = computed(() => !props.selected && (full.value || conflicting.value));

const conflictLabel = computed(() => {
  if (!conflicting.value) return '';
  const titles = props.conflicts.map((s) => s.title).join(', ');
  return props.selected ? `Overlaps ${titles}` : `Unavailable — overlaps ${titles}`;
});

const DROP_SHADOW = '0px_4px_16px_0px_rgba(0,0,0,0.08),0px_1px_3px_0px_rgba(0,0,0,0.04)';
const rootClass = computed(() => {
  if (props.selected) {
    return `cursor-pointer bg-brand-subtle-rest shadow-[inset_0_0_0_2px_var(--border-brand-emphasis),${DROP_SHADOW}]`;
  }
  if (blocked.value) {
    return `cursor-not-allowed bg-surface-l0 shadow-[inset_0_0_0_1px_var(--border-neutral-muted),${DROP_SHADOW}]`;
  }
  return `cursor-pointer bg-surface-l0 shadow-[inset_0_0_0_1px_var(--border-neutral-muted),${DROP_SHADOW}] hover:bg-surface-l2`;
});

function onToggle() {
  if (blocked.value) return;
  emit('toggle', props.workshop.id);
}
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="selected"
    :disabled="blocked"
    class="flex w-full flex-col gap-2 rounded-md border-0 p-4 text-left transition-colors"
    :class="rootClass"
    @click="onToggle"
  >
    <div class="flex w-full items-center justify-between gap-4">
      <span class="text-subtitle1 text-neutral">{{ workshop.name }}</span>
      <span class="text-subtitle1 text-brand-emphasis">{{ formatCurrency(workshop.price) }}</span>
    </div>

    <span class="text-sm font-regular text-neutral-muted">{{ workshop.description }}</span>

    <span class="text-[11px] font-regular leading-[14px] text-neutral-quiet">
      {{ formatDateTimeRange(workshop.start, workshop.end) }}
    </span>

    <span
      class="text-[11px] leading-[14px] text-neutral-quiet"
      :class="full ? 'font-semibold' : 'font-regular'"
    >
      {{ full ? 'Sold Out' : `${remaining} spots remaining` }}
    </span>

    <span v-if="conflicting && !full" class="text-[11px] font-medium leading-[14px] text-warning">
      {{ conflictLabel }}
    </span>
  </button>
</template>
