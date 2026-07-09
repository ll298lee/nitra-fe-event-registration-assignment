<script setup>
// Custom, token-styled progress stepper (IMPLEMENTATION_PLAN.md D13), built to the
// measured Step 1 / Step 4 Figma values. Presentational: renders `steps` at
// `current` and emits `select` on click. Free/non-linear navigation — every step is
// clickable, no validation gate; the parent owns the step change.
//
// Figma: circle 32px; current/completed = teal (bg-brand-emphasis-rest) with white
// number / white 2px check; upcoming = gray[50] (bg-surface-l2) with a 0.4 number.
// Label 14px (Figma 13px — no exact token; nearest on-scale is text-md/14, see §4),
// weight current=semibold / completed=medium / upcoming=regular; upcoming color 0.4.
// Connector 2px: teal once the prior step is done, else gray[50].

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
          <q-icon v-if="i < current" name="check" size="16px" />
          <span v-else>{{ i + 1 }}</span>
        </span>
        <span class="text-md" :class="labelClass(i)">{{ step.label }}</span>
      </button>

      <span
        v-if="i < steps.length - 1"
        class="mx-4 h-0.5 flex-1 rounded-full"
        :class="connectorClass(i)"
        aria-hidden="true"
      />
    </template>
  </nav>
</template>
