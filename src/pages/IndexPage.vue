<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchEvent } from '../data/facade.js';
import { provideRegistration, STEPS } from '../composables/useRegistration.js';
import WizardStepper from '../components/wizard/WizardStepper.vue';

// Provide the single wizard store at the root; steps inject it (D2).
const { currentStep, goToStep, next, prev, isFirstStep, isLastStep } = provideRegistration();

// Event name is rendered dynamically from the (async) facade, not hardcoded —
// the Figma "2025" title is a placeholder (IMPLEMENTATION_PLAN.md §4).
const eventName = ref('');
onMounted(async () => {
  const event = await fetchEvent();
  eventName.value = event.name;
});

const currentStepMeta = computed(() => STEPS[currentStep.value]);

// Primary-button copy per step. Placeholder wording pending i18n (D14) and exact
// Figma copy; the last step's submit flow is wired in a later (Step 4) PR.
const NEXT_LABELS = ['Next: Sessions', 'Next: Add-ons', 'Next: Review'];
const primaryLabel = computed(() =>
  isLastStep.value ? 'Submit Registration' : NEXT_LABELS[currentStep.value]
);

// Figma: Next = 40px tall / 10px radius / 14px label; Submit = 48px / 12px / 16px.
const primaryClass = computed(() =>
  isLastStep.value
    ? 'h-12 rounded-xl px-3 text-subtitle1'
    : 'h-10 rounded-[10px] px-2 text-subtitle2'
);

function onPrimary() {
  if (!isLastStep.value) next();
  // Step 4 submit is implemented in a later PR.
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface-l0 text-neutral">
    <!-- Header (72px, 48px insets, 1px divider-default bottom) -->
    <header class="flex items-center gap-3 border-b border-solid divider-default px-12 py-4">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-emphasis-rest text-inverse"
      >
        <q-icon name="event" size="22px" />
      </div>
      <span class="text-h4 text-neutral">{{ eventName || 'Event Registration' }}</span>
    </header>

    <!-- Stepper band (80px, 120px insets, 1px divider-default bottom) -->
    <div class="border-b border-solid divider-default px-30 py-6">
      <WizardStepper :steps="STEPS" :current="currentStep" @select="goToStep" />
    </div>

    <!-- Step content (120px insets, 40px vertical; per-step forms land in later PRs) -->
    <main class="flex flex-1 flex-col gap-8 px-30 py-10">
      <h1 class="text-h3 text-neutral">{{ currentStepMeta.label }}</h1>
      <div
        class="rounded-md border border-solid border-neutral-muted bg-surface-l1 p-5 text-neutral-muted"
      >
        Step {{ currentStep + 1 }} of {{ STEPS.length }} — the “{{ currentStepMeta.label }}” form is
        implemented in a later PR.
      </div>
    </main>

    <!-- Footer / action bar (120px insets, 1px divider-default top) -->
    <footer
      class="flex items-center border-t border-solid divider-default px-30 py-4"
      :class="isFirstStep ? 'justify-end' : 'justify-between'"
    >
      <button
        v-if="!isFirstStep"
        type="button"
        class="flex h-10 cursor-pointer items-center gap-1 rounded-[10px] border-0 bg-neutral-muted-rest px-2 text-subtitle2 text-neutral-muted transition-colors hover:bg-neutral-muted-hover active:bg-neutral-muted-active"
        @click="prev"
      >
        <q-icon name="chevron_left" size="18px" />
        Back
      </button>
      <button
        type="button"
        class="flex cursor-pointer items-center gap-1 border-0 bg-accent-emphasis-rest text-inverse transition-colors hover:bg-accent-emphasis-hover active:bg-accent-emphasis-active"
        :class="primaryClass"
        @click="onPrimary"
      >
        {{ primaryLabel }}
        <q-icon name="chevron_right" :size="isLastStep ? '22px' : '18px'" />
      </button>
    </footer>
  </div>
</template>
