<script setup>
// Presentational stepper: renders `steps` at `current` and emits `select` on click.
// Navigation is free/non-linear — every step is clickable with no validation gate
// (D13, AC-N-1); the parent owns the step change. A step listed in `errorKeys` renders an
// error state that overrides completed/current/upcoming (D37).

const props = defineProps({
  /** @type {{ key?: string, label: string }[]} */
  steps: { type: Array, required: true },
  current: { type: Number, required: true },
  /** Keys of steps whose section has a submit-time error (D37). */
  errorKeys: { type: Array, default: () => [] },
});

const emit = defineEmits(['select']);

function isError(step) {
  return props.errorKeys.includes(step.key);
}

function circleClass(step, i) {
  if (isError(step)) return 'bg-danger-emphasis-rest text-inverse';
  return i <= props.current
    ? 'bg-brand-emphasis-rest text-inverse'
    : 'bg-surface-l2 text-neutral-quiet';
}

function labelClass(step, i) {
  if (isError(step)) return 'text-danger font-semibold';
  if (i === props.current) return 'text-neutral font-semibold';
  if (i < props.current) return 'text-neutral font-medium';
  return 'text-neutral-quiet font-regular';
}

function connectorClass(i) {
  // The connector after a step shows the completed style only for a completed, non-errored step;
  // an errored step's outgoing connector reverts to the incomplete style (D37).
  if (isError(props.steps[i])) return 'bg-surface-l2';
  return i < props.current ? 'bg-brand-emphasis-rest' : 'bg-surface-l2';
}
</script>

<template>
  <nav class="flex items-center" :aria-label="$t('stepper.aria')">
    <template v-for="(step, i) in steps" :key="step.key ?? i">
      <button
        type="button"
        class="group flex shrink-0 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 transition-opacity hover:opacity-70 focus-visible:outline-none"
        :aria-label="step.label"
        :aria-current="i === current ? 'step' : undefined"
        :aria-invalid="isError(step) || undefined"
        @click="emit('select', i)"
      >
        <span
          class="text-md flex h-8 w-8 items-center justify-center rounded-full font-semibold transition-colors group-focus-visible:shadow-[0_0_0_2px_var(--bg-surface-l0),0_0_0_4px_var(--border-brand-emphasis)]"
          :class="circleClass(step, i)"
        >
          <svg
            v-if="isError(step)"
            viewBox="0 0 32 32"
            class="h-8 w-8"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M15 10H17V18H15V10Z" />
            <path d="M15 20H17V22H15V20Z" />
          </svg>
          <svg
            v-else-if="i < current"
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
        <span
          class="text-[13px] leading-[normal] transition-colors"
          :class="[labelClass(step, i), i === current ? 'inline' : 'hidden tablet:!inline']"
          >{{ step.label }}</span
        >
      </button>

      <span
        v-if="i < steps.length - 1"
        class="mx-2 h-0.5 flex-1 rounded-[1px] transition-colors tablet:mx-4"
        :class="connectorClass(i)"
        aria-hidden="true"
      />
    </template>
  </nav>
</template>
