import { reactive, ref, computed, provide, inject } from 'vue';

/**
 * Single source of wizard state (IMPLEMENTATION_PLAN.md D2).
 *
 * Provided once at the wizard root and injected by each step, so the four steps
 * share one reactive store and all selections survive free forward/back
 * navigation (D13) — no Pinia, per the rubric. `createRegistration` is a plain
 * factory (unit-testable without a component); `provideRegistration` /
 * `useRegistration` wrap it in Vue's provide/inject.
 */

/** Injection key. */
const REGISTRATION = Symbol('registration');

/** The four wizard steps, in order. */
export const STEPS = [
  { key: 'attendee', label: 'Attendee Info' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'addons', label: 'Add-ons' },
  { key: 'review', label: 'Review' },
];

/**
 * Build a fresh wizard store. Exported for unit tests; app code goes through
 * `provideRegistration` / `useRegistration`.
 */
function emptyAttendee() {
  return { fullName: '', email: '', phone: '', company: '', jobTitle: '', shippingAddress: '' };
}

export function createRegistration() {
  const currentStep = ref(0);

  // Step 1 — attendee details + chosen ticket.
  const attendee = reactive(emptyAttendee());
  const ticketId = ref(null);

  // Step 2 — selected session ids.
  const selectedSessionIds = ref([]);

  // Step 3 — add-on selections (workshop/meal ids + per-merch { size, quantity }).
  const selectedWorkshopIds = ref([]);
  const selectedMealIds = ref([]);
  const merchSelections = reactive({});

  /**
   * Jump to any step. Navigation is free/non-linear (D13) — deliberately NOT
   * gated by validation, which the spec defers to the Step 4 submit.
   * @param {number} index
   */
  function goToStep(index) {
    if (index >= 0 && index < STEPS.length) {
      currentStep.value = index;
    }
  }
  function next() {
    goToStep(currentStep.value + 1);
  }
  function prev() {
    goToStep(currentStep.value - 1);
  }

  const isFirstStep = computed(() => currentStep.value === 0);
  const isLastStep = computed(() => currentStep.value === STEPS.length - 1);

  /**
   * Clear every selection back to the pristine entry state (Step 1, nothing chosen).
   * The post-submit flow is terminal (D15/D40) — this is the only path back into a fresh
   * wizard, driven by the success screen's "Back to Home".
   */
  function reset() {
    currentStep.value = 0;
    Object.assign(attendee, emptyAttendee());
    ticketId.value = null;
    selectedSessionIds.value = [];
    selectedWorkshopIds.value = [];
    selectedMealIds.value = [];
    for (const id of Object.keys(merchSelections)) delete merchSelections[id];
  }

  return {
    STEPS,
    currentStep,
    attendee,
    ticketId,
    selectedSessionIds,
    selectedWorkshopIds,
    selectedMealIds,
    merchSelections,
    goToStep,
    next,
    prev,
    isFirstStep,
    isLastStep,
    reset,
  };
}

/**
 * Create the store and provide it to descendants. Call once at the wizard root.
 * @returns the store (so the root can use it directly)
 */
export function provideRegistration() {
  const registration = createRegistration();
  provide(REGISTRATION, registration);
  return registration;
}

/**
 * Inject the wizard store. Throws if no provider is above in the tree.
 */
export function useRegistration() {
  const registration = inject(REGISTRATION);
  if (!registration) {
    throw new Error('useRegistration() must be used within a provideRegistration() root');
  }
  return registration;
}
