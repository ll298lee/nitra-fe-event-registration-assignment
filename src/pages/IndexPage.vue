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

// Primary-button copy per step — verbatim from the Figma action bars (Step 1 uses
// the full "Session Selection", Steps 2-3 the short step names). Copy will move behind
// i18n (D14) later; the last step's submit flow is wired in a later (Step 4) PR.
const NEXT_LABELS = ['Next: Session Selection', 'Next: Add-ons', 'Next: Review'];
const primaryLabel = computed(() =>
  isLastStep.value ? 'Submit Registration' : NEXT_LABELS[currentStep.value]
);

// Figma buttons hug their label with net 16px (md) / 20px (lg) side padding and a
// min-width floor: Next = 40px tall / 10px radius / md-label (14/20/610) / min-w 72px;
// Submit = 48px / 12px radius / lg-label (16/24/610 = text-lg semibold) / min-w 88px.
const primaryClass = computed(() =>
  isLastStep.value
    ? 'h-12 min-w-[88px] rounded-xl px-5 text-lg font-semibold'
    : 'h-10 min-w-[72px] rounded-[10px] px-4 text-subtitle2'
);

function onPrimary() {
  if (!isLastStep.value) next();
  // Step 4 submit is implemented in a later PR.
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface-l0 text-neutral">
    <!-- Header (72px, 48px insets, 1px divider-default bottom only).
         border-x-0/border-t-0 zero the other sides: border-solid styles all four sides,
         and without a Tailwind border-width reset the unset sides default to `medium` (3px). -->
    <header
      class="flex items-center gap-3 border-x-0 border-b border-t-0 border-solid divider-default px-12 py-4"
    >
      <div
        class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-emphasis-rest text-inverse"
      >
        <!-- Figma "N Emblem — White" (node 1116:1005): 3 white vectors — top-right +
             bottom-left squares joined by the central N-stroke; 28×14 (viewBox 500×250.408),
             white via currentColor from text-inverse. Replaces the earlier invented calendar icon. -->
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

    <!-- Stepper band (80px, 120px insets, 1px divider-default bottom only) -->
    <div class="border-x-0 border-b border-t-0 border-solid divider-default px-30 py-6">
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

    <!-- Footer / action bar (120px insets, 1px divider-default top only) -->
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
