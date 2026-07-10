<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchEvent } from '../data/facade.js';
import { provideRegistration, STEPS } from '../composables/useRegistration.js';
import WizardStepper from '../components/wizard/WizardStepper.vue';
import StepAttendee from '../components/wizard/StepAttendee.vue';
import StepSessions from '../components/wizard/StepSessions.vue';
import StepAddons from '../components/wizard/StepAddons.vue';
import StepReview from '../components/wizard/StepReview.vue';

// Single wizard store provided at the root; steps inject it (D2).
const { currentStep, goToStep, next, prev, isFirstStep, isLastStep } = provideRegistration();

const eventName = ref('');
onMounted(async () => {
  const event = await fetchEvent();
  eventName.value = event.name;
});

const currentStepMeta = computed(() => STEPS[currentStep.value]);

// UI copy stays inline until it moves behind i18n in Phase 4 (D14).
const NEXT_LABELS = ['Next: Session Selection', 'Next: Add-ons', 'Next: Review'];
const primaryLabel = computed(() =>
  isLastStep.value ? 'Submit Registration' : NEXT_LABELS[currentStep.value]
);

const primaryClass = computed(() =>
  isLastStep.value
    ? 'h-12 min-w-[88px] rounded-xl px-5 text-lg font-semibold'
    : 'h-10 min-w-[72px] rounded-[10px] px-4 text-subtitle2'
);

function onPrimary() {
  // The Step 4 submit flow is wired in a later PR; until then the last step is a no-op.
  if (!isLastStep.value) next();
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface-l0 text-neutral">
    <header
      class="flex items-center gap-3 border-x-0 border-b border-t-0 border-solid divider-default px-12 py-4"
    >
      <div
        class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-emphasis-rest text-inverse"
      >
        <svg
          class="h-[14px] w-7"
          viewBox="0 0 500 250.408"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            transform="translate(125 0)"
            d="M249.979 250.408C48.7573 249.828 113.47 125.368 0 125.207V0C172.152 0.25058 125.745 125.024 249.979 125.201V250.403V250.408Z"
          />
          <path transform="translate(375 0)" d="M125.01 0H0V125.201H125.01V0Z" />
          <path transform="translate(0 125.207)" d="M125.01 0H0V125.201H125.01V0Z" />
        </svg>
      </div>
      <span class="text-h4 text-neutral">{{ eventName || 'Event Registration' }}</span>
    </header>

    <div class="border-x-0 border-b border-t-0 border-solid divider-default px-30 py-6">
      <WizardStepper :steps="STEPS" :current="currentStep" @select="goToStep" />
    </div>

    <main class="flex flex-1 flex-col gap-8 px-30 py-10">
      <!-- Each step renders its own visible title; this h1 stays screen-reader-only as the
           page's landmark heading (the stepper label). -->
      <h1 class="sr-only">{{ currentStepMeta.label }}</h1>
      <StepAttendee v-if="currentStep === 0" />
      <StepSessions v-else-if="currentStep === 1" />
      <StepAddons v-else-if="currentStep === 2" />
      <StepReview v-else />
    </main>

    <footer
      class="flex items-center border-x-0 border-b-0 border-t border-solid divider-default px-30 py-4"
      :class="isFirstStep ? 'justify-end' : 'justify-between'"
    >
      <button
        v-if="!isFirstStep"
        type="button"
        class="flex h-10 min-w-[72px] cursor-pointer items-center justify-center rounded-[10px] border-0 bg-neutral-muted-rest px-4 text-subtitle2 text-neutral-muted transition-colors hover:bg-neutral-muted-hover active:bg-neutral-muted-active"
        @click="prev"
      >
        Back
      </button>
      <button
        type="button"
        class="flex cursor-pointer items-center justify-center border-0 bg-accent-emphasis-rest text-inverse transition-colors hover:bg-accent-emphasis-hover active:bg-accent-emphasis-active"
        :class="primaryClass"
        @click="onPrimary"
      >
        {{ primaryLabel }}
      </button>
    </footer>
  </div>
</template>
