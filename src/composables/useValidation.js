import { ref, computed, toValue, provide, inject } from 'vue';
import { useRegistration } from './useRegistration.js';
import {
  validateAll,
  errorStepKeys,
  isValid as computeIsValid,
  summarizeErrors,
} from '../logic/validation.js';

/**
 * Reactive adapter over the pure `validation.js` logic (IMPLEMENTATION_PLAN.md D36).
 *
 * The logic layer is framework-free and validates a plain store snapshot (D34); this
 * composable is the "reward early, punish late" wrapper (D7): a single `submitted` flag
 * gates whether errors are shown, and once a submit has failed every currently-invalid
 * field re-validates live (the error clears the moment the field becomes valid). Because
 * the error map is recomputed live from the store, an invalid field surfaces its error
 * whether or not it was individually "touched", so no separate touched map is needed.
 *
 * Provided once at the wizard root and injected by the submit button (IndexPage), the
 * Step-4 review, and the Step-1 form so all three share one `submitted` flag and one
 * error map. `createValidation` is a plain factory (unit-testable without a component).
 */

/** Injection key. */
const VALIDATION = Symbol('validation');

/**
 * Build the reactive validation state over the wizard store and the fetched reference
 * data. `sources.sessions` / `sources.addons` may be refs/getters/plain arrays (read via
 * `toValue`) — conflict detection needs the normalized objects; field validation does not.
 *
 * @param {ReturnType<typeof import('./useRegistration.js').createRegistration>} registration
 * @param {{ sessions?: unknown, addons?: unknown }} [sources]
 */
export function createValidation(registration, sources = {}) {
  const submitted = ref(false);

  // Live error map. Reading the reactive `attendee`/`merchSelections` and the `toValue`'d
  // refs inside the computed tracks them, so the map updates as the user edits — which is
  // what makes a shown error clear the instant its field becomes valid (D7).
  const errors = computed(() =>
    validateAll(
      {
        attendee: registration.attendee,
        ticketId: toValue(registration.ticketId),
        selectedSessionIds: toValue(registration.selectedSessionIds),
        selectedWorkshopIds: toValue(registration.selectedWorkshopIds),
        merchSelections: registration.merchSelections,
      },
      { sessions: toValue(sources.sessions) ?? [], addons: toValue(sources.addons) ?? [] }
    )
  );

  const isValid = computed(() => computeIsValid(errors.value));
  const errorSteps = computed(() => errorStepKeys(errors.value));

  // Submitted-gated inputs for the Step-4 error affordances (D37): the wizard-step keys the
  // stepper flags as errored, and the flat "Step N: {message}" list the error banner renders.
  // Empty until the first failed submit, per the deferred-validation model (D7).
  const errorStepsShown = computed(() => (submitted.value ? errorSteps.value : []));
  const errorSummary = computed(() => (submitted.value ? summarizeErrors(errors.value) : []));

  /**
   * Run the unified submit-time validation (README §4.4): mark the form submitted so
   * errors become visible, and report whether it is valid. Pure w.r.t. the store (D10).
   * @returns {boolean}
   */
  function attemptSubmit() {
    submitted.value = true;
    return isValid.value;
  }

  /** Return to the pristine, error-free state (used when the wizard resets). */
  function reset() {
    submitted.value = false;
  }

  /**
   * Submitted-gated error message for a Step-1 attendee field (`''` before the first
   * submit, or when the field is valid). Consumed by the form fields and the review.
   * @param {string} key
   * @returns {string}
   */
  function attendeeError(key) {
    return submitted.value ? (errors.value.attendee[key] ?? '') : '';
  }

  return {
    submitted,
    errors,
    isValid,
    errorSteps,
    errorStepsShown,
    errorSummary,
    attemptSubmit,
    reset,
    attendeeError,
  };
}

/**
 * Create the validation state and provide it to descendants. Call once at the wizard root.
 * @param {ReturnType<typeof import('./useRegistration.js').createRegistration>} registration
 * @param {{ sessions?: unknown, addons?: unknown }} [sources]
 */
export function provideValidation(registration, sources = {}) {
  const validation = createValidation(registration, sources);
  provide(VALIDATION, validation);
  return validation;
}

/**
 * Inject the shared validation state. Falls back to building one over the injected
 * registration store if no provider is above (keeps component tests simple), matching the
 * resilience of the other composables.
 */
export function useValidation(sources = {}) {
  const injected = inject(VALIDATION, null);
  if (injected) return injected;
  return createValidation(useRegistration(), sources);
}
