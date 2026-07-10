/**
 * Unified submit-time validation (README Step 4 §4; IMPLEMENTATION_PLAN.md D7–D10, D34).
 *
 * Framework-free pure predicates over a plain snapshot of the wizard store — the same
 * boundary as `conflicts.js` / `capacity.js`. The reactive "reward early, punish late"
 * touched-field wrapper (D7) lives in the `useValidation` composable, not here, so this
 * layer is unit-testable without a component.
 *
 * All validation runs at submit time (README Step 1 defers it): nothing here is eager.
 * The functions never mutate the registration — a stale conflict is reported, not
 * silently removed (D10, AC-4.6).
 *
 * Copy note (D14 / D34 / D45): user-facing messages are produced through an injected
 * `t(key, params)` translator (vue-i18n), passed in by the `useValidation` composable, so
 * this layer stays framework-free and unit-testable. The copy itself lives in `src/i18n/*`,
 * keyed under `validation.*` and (for time conflicts) `conflict.*` — the latter shared with
 * `WorkshopCard` so the two surfaces cannot drift.
 */

import { detectConflicts, conflictingSessions } from './conflicts.js';

// ── Field-format predicates ──

// A pragmatic email shape: a local part, `@`, and a dotted domain (rejects `abc`, `a@`,
// `a@b`; accepts `a@b.com`). Not an RFC-5322 monster — that over-rejects valid addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  return EMAIL_RE.test(String(value ?? '').trim());
}

/**
 * Lenient phone check (D8): accept common international shapes — "+1 415 555 0100",
 * "(415) 555-0100", "4155550100" — by allowing only phone punctuation and requiring
 * 7–15 digits (E.164's 15-digit ceiling). Deliberately NOT a strict E.164 regex, which
 * reads as a junior tell and rejects valid international numbers.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidPhone(value) {
  const str = String(value ?? '').trim();
  if (str === '' || /[^\d\s+()\-.]/.test(str)) return false;
  const digits = str.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * A required text value is satisfied when it has non-whitespace content.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPresent(value) {
  return String(value ?? '').trim().length > 0;
}

/**
 * Merch is "selected" when any entry carries a quantity ≥ 1 — the condition that makes
 * Shipping Address required in Step 1 (AC-1.6/1.7, AC-V-4).
 * @param {Record<string, { quantity?: number }>} [merchSelections]
 * @returns {boolean}
 */
export function hasMerchSelected(merchSelections) {
  return Object.values(merchSelections ?? {}).some((sel) => (sel?.quantity ?? 0) >= 1);
}

// ── Per-step validators ──

/**
 * Validate the Step-1 attendee block. Required-then-format: an empty field reports
 * "required"; a present-but-malformed email/phone reports the format message.
 * `shippingRequired` is the cross-step condition (merch selected in Step 3, D9).
 * @param {Object} [attendee]
 * @param {{ shippingRequired?: boolean }} [options]
 * @param {(key: string, params?: object) => string} t  Injected i18n translator (D45).
 * @returns {Record<string, string>} field → message, only for failing fields.
 */
export function validateAttendee(attendee, { shippingRequired = false } = {}, t) {
  const a = attendee ?? {};
  const errors = {};
  const required = (field) => t('validation.required', { label: t(`validation.labels.${field}`) });

  if (!isPresent(a.fullName)) errors.fullName = required('fullName');

  if (!isPresent(a.email)) errors.email = required('email');
  else if (!isValidEmail(a.email)) errors.email = t('validation.emailInvalid');

  if (!isPresent(a.phone)) errors.phone = required('phone');
  else if (!isValidPhone(a.phone)) errors.phone = t('validation.phoneInvalid');

  if (!isPresent(a.company)) errors.company = required('company');
  if (!isPresent(a.jobTitle)) errors.jobTitle = required('jobTitle');

  if (shippingRequired && !isPresent(a.shippingAddress)) {
    errors.shippingAddress = t('validation.shippingRequired');
  }

  return errors;
}

/**
 * Session↔session time conflicts among the selected sessions. README Step 2 §2 defers
 * this to submit and asks that "the relevant step be indicated with errors" — so it
 * flags Step 2 (D34). Each conflicting pair yields one message naming both sessions.
 * @param {{ id: string, title: string, start: Date, end: Date }[]} selectedSessions
 * @param {(key: string, params?: object) => string} t  Injected i18n translator (D45).
 * @returns {string[]}
 */
export function sessionConflictErrors(selectedSessions, t) {
  return detectConflicts(selectedSessions).map(([a, b]) =>
    t('conflict.session', { a: a.title, b: b.title })
  );
}

/**
 * Workshop↔session conflicts (README Step 3 §2, D9): every selected workshop that
 * overlaps a selected session yields one message naming the session. This is the stale
 * conflict path (AC-4.6) — the workshop is never mutated here (pure), so it is kept and
 * reported at submit (D10).
 * @param {{ name: string, start?: Date, end?: Date }[]} selectedWorkshops
 * @param {{ id: string, title: string, start: Date, end: Date }[]} selectedSessions
 * @param {(key: string, params?: object) => string} t  Injected i18n translator (D45).
 * @returns {string[]}
 */
export function workshopConflictErrors(selectedWorkshops, selectedSessions, t) {
  const errors = [];
  for (const workshop of selectedWorkshops) {
    for (const session of conflictingSessions(workshop, selectedSessions)) {
      errors.push(t('conflict.workshop', { workshop: workshop.name, session: session.title }));
    }
  }
  return errors;
}

function byId(list) {
  const map = new Map();
  for (const item of list ?? []) map.set(item.id, item);
  return map;
}

/**
 * Unified submit-time validation (README Step 4 §4, AC-4.4). Returns a per-step error
 * map keyed by wizard step (`attendee` / `sessions` / `addons`); the `review` step
 * carries no errors of its own. Pure — never mutates the registration (D10).
 *
 * @param {{
 *   attendee?: Object,
 *   ticketId?: string|null,
 *   selectedSessionIds?: string[],
 *   selectedWorkshopIds?: string[],
 *   merchSelections?: Object,
 * }} state  Plain snapshot of the wizard store (the useValidation composable unwraps refs).
 * @param {{ sessions?: Object[], addons?: Object[] }} [sources]  Normalized reference data.
 * @param {(key: string, params?: object) => string} t  Injected i18n translator (D45).
 * @returns {{ attendee: Record<string, string>, sessions: string[], addons: string[] }}
 */
export function validateAll(state, sources = {}, t) {
  const s = state ?? {};
  const sessionMap = byId(sources.sessions);
  const addonMap = byId(sources.addons);

  const selectedSessions = (s.selectedSessionIds ?? [])
    .map((id) => sessionMap.get(id))
    .filter(Boolean);
  const selectedWorkshops = (s.selectedWorkshopIds ?? [])
    .map((id) => addonMap.get(id))
    .filter(Boolean);

  const attendee = validateAttendee(
    s.attendee,
    { shippingRequired: hasMerchSelected(s.merchSelections) },
    t
  );
  // Ticket selection is mandatory to register (README Step 1) though it is not one of
  // the tabulated "fields" — a deliberate spec-gap fill flagged for review (D34). It is
  // a Step-1 concern, so it rides in the attendee group and flags Step 1.
  if (!s.ticketId) attendee.ticketId = t('validation.ticketRequired');

  return {
    attendee,
    sessions: sessionConflictErrors(selectedSessions, t),
    addons: workshopConflictErrors(selectedWorkshops, selectedSessions, t),
  };
}

/**
 * Wizard-ordered step keys that carry at least one error — drives the Step-4 error
 * navigation and the stepper error indicators (AC-4.5). Keys match `STEPS` (except
 * `review`, which never self-errors).
 * @param {{ attendee?: Object, sessions?: unknown[], addons?: unknown[] }} errors
 * @returns {string[]}
 */
export function errorStepKeys(errors = {}) {
  const keys = [];
  if (Object.keys(errors.attendee ?? {}).length) keys.push('attendee');
  if ((errors.sessions ?? []).length) keys.push('sessions');
  if ((errors.addons ?? []).length) keys.push('addons');
  return keys;
}

/**
 * The submit gate: true when a `validateAll` result has no errors anywhere (AC-4.4).
 * @param {ReturnType<typeof validateAll>} errors
 * @returns {boolean}
 */
export function isValid(errors) {
  return errorStepKeys(errors).length === 0;
}

// 1-based wizard step number for each error group, for the submit-error summary (D37).
const STEP_NUMBER = { attendee: 1, sessions: 2, addons: 3 };

/**
 * Flatten a `validateAll` result into a wizard-ordered list of "Step {N}: {message}" strings
 * for the Step-4 error-summary banner (D37, README §4.5). One entry per individual error
 * (each missing/invalid field, each time conflict) — attendee first, then sessions, then addons.
 * @param {ReturnType<typeof validateAll>} [errors]
 * @param {(key: string, params?: object) => string} t  Injected i18n translator (D45).
 * @returns {string[]}
 */
export function summarizeErrors(errors = {}, t) {
  const line = (step, message) => t('step4.errorLine', { step, message });
  const lines = [];
  for (const message of Object.values(errors.attendee ?? {})) {
    lines.push(line(STEP_NUMBER.attendee, message));
  }
  for (const message of errors.sessions ?? []) lines.push(line(STEP_NUMBER.sessions, message));
  for (const message of errors.addons ?? []) lines.push(line(STEP_NUMBER.addons, message));
  return lines;
}
