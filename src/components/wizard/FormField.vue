<script setup>
import { useId } from 'vue';

const model = defineModel({ type: String, default: '' });

defineProps({
  label: { type: String, required: true },
  optional: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: undefined },
  // Set by the Step 4 unified-validation pass; empty here because Step 1 defers all
  // validation to submit (README §Step 1, AC-1.5).
  error: { type: String, default: '' },
});

const inputId = useId();
const errorId = `${inputId}-error`;
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      :for="inputId"
      class="text-sm font-medium"
      :class="error ? 'text-danger' : 'text-neutral'"
    >
      {{ label }}<span v-if="optional"> (Optional)</span>
    </label>
    <input
      :id="inputId"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : undefined"
      class="h-11 w-full rounded-md border border-solid bg-surface-l0 px-3 py-2.5 text-lg font-regular text-neutral outline-none transition-colors placeholder:text-neutral-quiet"
      :class="
        error ? 'border-danger-emphasis' : 'border-neutral-muted focus:border-neutral-emphasis'
      "
    />
    <span v-if="error" :id="errorId" class="text-sm text-danger">{{ error }}</span>
  </div>
</template>
