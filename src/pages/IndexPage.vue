<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { fetchEvent, fetchSessions, fetchAddons, submitRegistration } from '../data/facade.js';
import { provideRegistration, STEPS } from '../composables/useRegistration.js';
import { provideValidation } from '../composables/useValidation.js';
import WizardStepper from '../components/wizard/WizardStepper.vue';
import StepAttendee from '../components/wizard/StepAttendee.vue';
import StepSessions from '../components/wizard/StepSessions.vue';
import StepAddons from '../components/wizard/StepAddons.vue';
import StepReview from '../components/wizard/StepReview.vue';
import SuccessScreen from '../components/wizard/SuccessScreen.vue';

// Single wizard store provided at the root; steps inject it (D2). Validation is provided over the
// same store (D36) so the submit button, the Step-4 review, and the Step-1 form share one error map.
const registration = provideRegistration();
const { currentStep, attendee, ticketId, goToStep, next, prev, isFirstStep, isLastStep } =
  registration;

// The root loads the event name (header) plus the sessions + add-ons that submit-time conflict
// validation needs to resolve selected ids to their time slots (D36).
const eventName = ref('');
const ticketTypes = ref([]);
const sessions = ref([]);
const addons = ref([]);
const {
  attemptSubmit,
  submitted,
  isValid,
  errorStepsShown,
  reset: resetValidation,
} = provideValidation(registration, { sessions, addons });

// Submission lifecycle (D40): the shell owns the async submit, its pending flag, and the assigned
// confirmation number — it already orchestrates the root data fetches and holds the facade import,
// while the store owns the form/nav state. A non-null confirmation number is the terminal success
// state (D15): the stepper/steps/footer give way to the SuccessScreen.
const isSubmitting = ref(false);
const confirmationNumber = ref(null);
const isSuccess = computed(() => confirmationNumber.value !== null);

// After a failed submit the primary button is disabled until the errors clear (D37); it re-enables
// live as they are fixed (reward early, D7). Before the first submit it stays enabled — clicking it
// is what runs validation. It is also disabled while a submit is in flight (double-submit guard).
const submitDisabled = computed(
  () => isLastStep.value && ((submitted.value && !isValid.value) || isSubmitting.value)
);

onMounted(async () => {
  const [event, sessionList, addonList] = await Promise.all([
    fetchEvent(),
    fetchSessions(),
    fetchAddons(),
  ]);
  eventName.value = event.name;
  ticketTypes.value = event.ticketTypes;
  sessions.value = sessionList;
  addons.value = addonList;
});

// Success-screen echo of the submitted state (dynamic per §4 — the Figma "John"/"TechConf 2025"
// strings are placeholders). The greeting uses the first name only, matching the frame.
const attendeeFirstName = computed(() => (attendee.fullName || '').trim().split(/\s+/)[0]);
const selectedTicketName = computed(
  () => ticketTypes.value.find((t) => t.id === ticketId.value)?.name ?? ''
);

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

// Plain, fully-detached snapshot of the store for the facade — the seam a real POST would
// serialize (D1). Merch entries are copied one level deeper so no reactive proxy leaks into the
// payload (a shallow spread would keep the live `{ size, quantity }` references).
function buildSnapshot() {
  return {
    attendee: { ...attendee },
    ticketId: ticketId.value,
    selectedSessionIds: [...registration.selectedSessionIds.value],
    selectedWorkshopIds: [...registration.selectedWorkshopIds.value],
    selectedMealIds: [...registration.selectedMealIds.value],
    merchSelections: Object.fromEntries(
      Object.entries(registration.merchSelections).map(([id, sel]) => [id, { ...sel }])
    ),
  };
}

// After a failed submit, take the user to the errors: the submit button lives in the footer, but
// the error banner + flagged sections are at the top of the review. Scroll the banner into view and
// move focus to it (its role="alert" also announces) so the failure is never missed. preventScroll
// keeps focus from cancelling the smooth scroll; reduced-motion users get an instant jump.
function revealErrors() {
  nextTick(() => {
    const el = document.querySelector('[role="alert"]');
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    el.focus({ preventScroll: true });
  });
}

async function onPrimary() {
  if (!isLastStep.value) {
    next();
    return;
  }
  // Double-submit guard (AC-4.8/S-4): ignore clicks while a submit is already in flight.
  if (isSubmitting.value) return;
  // Unified submit-time validation (README §4.4): a failed submit reveals the per-step errors on
  // the review and never reaches the network.
  if (!attemptSubmit()) {
    revealErrors();
    return;
  }

  isSubmitting.value = true;
  try {
    const result = await submitRegistration(buildSnapshot());
    confirmationNumber.value = result.confirmationNumber;
  } finally {
    isSubmitting.value = false;
  }
}

// "Back to Home" (D15): the flow is terminal, so this is the only way back — clear the confirmation,
// the form/nav state, and the submitted flag, returning a pristine Step 1.
function onBackToHome() {
  confirmationNumber.value = null;
  registration.reset();
  resetValidation();
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

    <SuccessScreen
      v-if="isSuccess"
      :confirmation-number="confirmationNumber"
      :name="attendeeFirstName"
      :email="attendee.email"
      :ticket-name="selectedTicketName"
      :event-name="eventName"
      @home="onBackToHome"
    />

    <template v-else>
      <div class="border-x-0 border-b border-t-0 border-solid divider-default px-30 py-6">
        <WizardStepper
          :steps="STEPS"
          :current="currentStep"
          :error-keys="errorStepsShown"
          @select="goToStep"
        />
      </div>

      <main class="flex flex-1 flex-col gap-8 px-30 py-10">
        <!-- Each step renders its own visible title; this h1 stays screen-reader-only as the
             page's landmark heading (the stepper label). -->
        <h1 class="sr-only">{{ currentStepMeta.label }}</h1>
        <Transition name="step" mode="out-in">
          <StepAttendee v-if="currentStep === 0" />
          <StepSessions v-else-if="currentStep === 1" />
          <StepAddons v-else-if="currentStep === 2" />
          <StepReview v-else />
        </Transition>
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
          class="flex cursor-pointer items-center justify-center border-0 bg-accent-emphasis-rest text-inverse transition-[color,background-color,opacity] hover:bg-accent-emphasis-hover active:bg-accent-emphasis-active disabled:cursor-not-allowed disabled:!opacity-50"
          :class="primaryClass"
          :disabled="submitDisabled"
          @click="onPrimary"
        >
          <q-spinner v-if="isSubmitting" size="20px" />
          <span v-else>{{ primaryLabel }}</span>
        </button>
      </footer>
    </template>
  </div>
</template>
