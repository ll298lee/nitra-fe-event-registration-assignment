<script setup>
// Presentational stepper: renders `steps` at `current` and emits `select` on click.
// Navigation is free/non-linear — every step is clickable with no validation gate
// (D13, AC-N-1); the parent owns the step change.

const props = defineProps({
  /** @type {{ key?: string, label: string }[]} */
  steps: { type: Array, required: true },
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
