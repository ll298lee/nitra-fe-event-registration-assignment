<script setup>
// Custom, token-styled progress stepper (IMPLEMENTATION_PLAN.md D13) — Quasar's
// Material QStepper defaults fight the Figma design, so this is hand-built from
// semantic tokens. Presentational: it renders `steps` at `current` and emits
// `select` when a step is clicked. Navigation is free/non-linear (every step is
// clickable, no validation gate); the parent owns the actual step change.

const props = defineProps({
  /** @type {{ key?: string, label: string }[]} */
  steps: { type: Array, required: true },
  /** Zero-based index of the active step. */
  current: { type: Number, required: true },
});

const emit = defineEmits(['select']);

// Completed (i < current) and current (i === current) share the brand-teal
// circle with white content; upcoming (i > current) is a muted gray circle.
function circleClass(i) {
  return i <= props.current
    ? 'bg-brand-emphasis-rest text-inverse'
    : 'bg-surface-l2 text-neutral-muted';
}

// The connector after step i is teal once step i is completed, else gray.
function connectorClass(i) {
  return i < props.current ? 'bg-brand-emphasis-rest' : 'bg-surface-l3';
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
          class="flex h-8 w-8 items-center justify-center rounded-full font-semibold"
          :class="circleClass(i)"
        >
          <q-icon v-if="i < current" name="check" size="18px" />
          <span v-else>{{ i + 1 }}</span>
        </span>
        <span class="text-subtitle2" :class="i > current ? 'text-neutral-muted' : 'text-neutral'">
          {{ step.label }}
        </span>
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
