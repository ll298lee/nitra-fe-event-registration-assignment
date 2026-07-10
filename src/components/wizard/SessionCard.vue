<script setup>
import { computed } from 'vue';
import { isFull, remainingSpots, fillFraction } from '../../logic/capacity.js';
import { formatTimeRange } from '../../utils/datetime.js';
import TrackBadge from './TrackBadge.vue';

const props = defineProps({
  /** @type {import('../../data/normalize.js').Session} */
  session: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});

const emit = defineEmits(['toggle']);

const full = computed(() => isFull(props.session));
const remaining = computed(() => remainingSpots(props.session));
const fraction = computed(() => fillFraction(props.session));

// Capacity fill-level bands (IMPLEMENTATION_PLAN.md D25) — four tones keyed off how full
// the session is; a full session is its own "Sold Out" band.
const tone = computed(() => {
  if (full.value) return 'full';
  const f = fraction.value;
  if (f >= 0.75) return 'high';
  if (f >= 0.5) return 'medium';
  return 'low';
});

const BAR_TONE = {
  full: 'bg-danger-emphasis-rest',
  high: 'bg-accent-bold-rest',
  medium: 'bg-warning-bold-rest',
  low: 'bg-brand-emphasis-rest',
};
const LABEL_TONE = {
  full: 'text-danger-emphasis',
  high: 'text-accent-emphasis',
  medium: 'text-warning',
  low: 'text-brand-emphasis',
};

const fillWidth = computed(() => `${Math.round(fraction.value * 100)}%`);
const spotsLabel = computed(() => (full.value ? 'Sold Out' : `${remaining.value} spots left`));

const DROP_SHADOW = '0px_4px_16px_0px_rgba(0,0,0,0.08),0px_1px_3px_0px_rgba(0,0,0,0.04)';
const rootClass = computed(() => {
  if (full.value) {
    return `cursor-not-allowed bg-surface-l2 shadow-[inset_0_0_0_1px_var(--border-neutral-muted),${DROP_SHADOW}]`;
  }
  if (props.selected) {
    return `cursor-pointer bg-brand-subtle-rest shadow-[inset_0_0_0_2px_var(--border-brand-emphasis),${DROP_SHADOW}]`;
  }
  return `cursor-pointer bg-surface-l0 shadow-[inset_0_0_0_1px_var(--border-neutral-muted),${DROP_SHADOW}] hover:bg-surface-l2`;
});

function onToggle() {
  if (full.value) return;
  emit('toggle', props.session.id);
}
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="selected"
    :disabled="full"
    class="flex min-h-[162px] w-full flex-col gap-2 rounded-md border-0 p-4 text-left transition-colors"
    :class="rootClass"
    @click="onToggle"
  >
    <div class="flex w-full items-center justify-between">
      <TrackBadge :track="session.track" />
      <span
        v-if="!full"
        class="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px]"
        :class="
          selected
            ? 'bg-brand-emphasis-rest'
            : 'bg-surface-l0 shadow-[inset_0_0_0_1px_var(--border-neutral-emphasis)]'
        "
        aria-hidden="true"
      >
        <svg
          v-if="selected"
          class="h-[7px] w-[10px] text-inverse"
          viewBox="0 0 10 7"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M9.81695 0.175499C9.93414 0.288013 10 0.440541 10 0.599565C10 0.75859 9.93414 0.91111 9.81695 1.02363L3.7655 6.82453C3.64812 6.93687 3.48901 7 3.32312 7C3.15723 7 2.99811 6.93687 2.88074 6.82453L0.168019 4.22413C0.0574398 4.11037 -0.00275754 3.95991 9.70775e-05 3.80444C0.00296004 3.64898 0.0686579 3.50065 0.18336 3.39069C0.298054 3.28075 0.452796 3.21777 0.614975 3.21503C0.777154 3.21228 0.934107 3.27 1.05278 3.376L3.32312 5.55233L8.93219 0.175499C9.04955 0.0631217 9.20864 0 9.37457 0C9.54042 0 9.6996 0.0631217 9.81695 0.175499Z"
          />
        </svg>
      </span>
    </div>

    <span class="text-subtitle1" :class="full ? 'text-neutral-disabled' : 'text-neutral'">
      {{ session.title }}
    </span>

    <span
      class="text-sm font-regular"
      :class="full ? 'text-neutral-disabled' : 'text-neutral-muted'"
    >
      {{ session.speaker }}, {{ session.speakerTitle }}
    </span>

    <span
      class="text-[11px] font-regular leading-[14px]"
      :class="full ? 'text-neutral-disabled' : 'text-neutral-quiet'"
    >
      {{ formatTimeRange(session.start, session.end) }}
    </span>

    <div class="h-[6px] w-full overflow-hidden rounded-[3px] bg-surface-l2">
      <div class="h-full rounded-[3px]" :class="BAR_TONE[tone]" :style="{ width: fillWidth }" />
    </div>

    <span
      class="text-[11px] leading-[14px]"
      :class="[LABEL_TONE[tone], full ? 'font-semibold' : 'font-medium']"
    >
      {{ spotsLabel }}
    </span>
  </button>
</template>
