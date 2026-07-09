<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchEvent } from '../data/facade.js';
import { provideRegistration, STEPS } from '../composables/useRegistration.js';
import WizardStepper from '../components/wizard/WizardStepper.vue';

// Provide the single wizard store at the root; steps inject it (D2).
const { currentStep, goToStep, next, prev, isFirstStep, isLastStep } = provideRegistration();

// Event name is rendered dynamically from the (async) facade, not hardcoded —
// the Figma "WebDev Summit 2025" is a placeholder (IMPLEMENTATION_PLAN.md §4).
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

function onPrimary() {
  if (!isLastStep.value) next();
  // Step 4 submit is implemented in a later PR.
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface-l0 text-neutral">
    <!-- Header -->
    <header class="border-b border-neutral-muted">
      <div class="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-6 py-4">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-emphasis-rest text-inverse"
        >
          <q-icon name="event" size="22px" />
        </div>
        <span class="text-subtitle1 text-neutral">{{ eventName || 'Event Registration' }}</span>
      </div>
    </header>

    <!-- Stepper -->
    <div class="border-b border-neutral-muted">
      <div class="mx-auto w-full max-w-[1200px] px-6 py-6">
        <WizardStepper :steps="STEPS" :current="currentStep" @select="goToStep" />
      </div>
    </div>

    <!-- Step content (per-step forms land in later PRs) -->
    <main class="flex-1">
      <div class="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-10">
        <h1 class="text-h2 text-neutral">{{ currentStepMeta.label }}</h1>
        <div class="rounded-xl border border-neutral-muted bg-surface-l1 p-8 text-neutral-muted">
          Step {{ currentStep + 1 }} of {{ STEPS.length }} — the “{{ currentStepMeta.label }}” form
          is implemented in a later PR.
        </div>
      </div>
    </main>

    <!-- Footer / action bar -->
    <footer class="border-t border-neutral-muted">
      <div
        class="mx-auto flex w-full max-w-[1200px] items-center px-6 py-4"
        :class="isFirstStep ? 'justify-end' : 'justify-between'"
      >
        <q-btn
          v-if="!isFirstStep"
          unelevated
          no-caps
          label="Back"
          class="rounded-[10px] bg-surface-l3 px-5 text-subtitle2 text-neutral"
          @click="prev"
        />
        <q-btn
          unelevated
          no-caps
          :label="primaryLabel"
          class="rounded-[10px] bg-accent-emphasis-rest px-5 text-subtitle2 text-inverse"
          @click="onPrimary"
        />
      </div>
    </footer>
  </div>
</template>
