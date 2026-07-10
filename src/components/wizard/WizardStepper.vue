<script setup>
// Custom, token-styled progress stepper (IMPLEMENTATION_PLAN.md D13), built to the
// measured Step 1 / Step 4 Figma values. Presentational: renders `steps` at
// `current` and emits `select` on click. Free/non-linear navigation — every step is
// clickable, no validation gate; the parent owns the step change.
//
// Figma: circle 32px; current/completed = teal (bg-brand-emphasis-rest) with white
// 14px semibold number / white check; upcoming = gray[50] (bg-surface-l2) with a
// 0.4 semibold number. The completed check is Figma's own 2px round-cap/round-join
// stroked glyph (path M9 16.3667L13.9 21.5L23 10.5), not the Material `check`.
// Label is 13px/leading-normal (no exact token — arbitrary text-[13px], see §4),
// weight current=semibold / completed=medium / upcoming=regular; upcoming color 0.4.
// Connector 2px with a 1px corner radius: teal once the prior step is done, else gray[50].

const props = defineProps({
  /** @type {{ key?: string, label: string }[]} */
  steps: { type: Array, required: true },
  /** Zero-based index of the active step. */
  current: { type: Number, required: true },
});

const emit = defineEmits(['select']);

function circleClass(i) {
  return i <= props.current
    ? 'bg-brand-emphasis-rest text-inverse'
    : 'bg-surface-l2 text-neutral-quiet';
}

function labelClass(i) {
  if (i === props.current) return 'text-neutral font-semibold';
  if (i < props.current) return 'text-neutral font-medium';
  return 'text-neutral-quiet font-regular';
}

function connectorClass(i) {
  return i < props.current ? 'bg-brand-emphasis-rest' : 'bg-surface-l2';
}
</script>

<template>
  <nav class="flex items-center" aria-label="Registration progress">
    <template v-for="(step, i) in steps" :key="step.key ?? i">
      <button
        type="button"
        class="flex shrink-0 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 transition-opacity hover:opacity-70"
        :aria-current="i === current ? 'step' : undefined"
        @click="emit('select', i)"
      >
        <span
          class="text-md flex h-8 w-8 items-center justify-center rounded-full font-semibold"
          :class="circleClass(i)"
        >
          <svg
            v-if="i < current"
            viewBox="0 0 32 32"
            class="h-8 w-8"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 16.3667L13.9 21.5L23 10.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span v-else>{{ i + 1 }}</span>
        </span>
        <span class="text-[13px] leading-[normal]" :class="labelClass(i)">{{ step.label }}</span>
      </button>

      <span
        v-if="i < steps.length - 1"
        class="mx-4 h-0.5 flex-1 rounded-[1px]"
        :class="connectorClass(i)"
        aria-hidden="true"
      />
    </template>
  </nav>
</template>
