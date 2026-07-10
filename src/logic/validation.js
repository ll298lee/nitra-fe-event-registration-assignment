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
 * Copy note (D14 / D34): the user-facing strings live here for now (deferred i18n) and
 * are centralized in the message builders below so the Phase-4 locale extraction has a
 * single place to relocate them.
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

// ── Messages (deferred-i18n copy, D14/D34) ──

const requiredMsg = (label) => `${label} is required`;
const INVALID_EMAIL = 'Enter a valid email address';
const INVALID_PHONE = 'Enter a valid phone number';
const SHIPPING_REQUIRED = 'Shipping Address is required when merchandise is selected';
const TICKET_REQUIRED = 'Please select a ticket type';
const sessionConflictMsg = (a, b) => `${a.title} overlaps with ${b.title}`;
const workshopConflictMsg = (workshop, session) =>
  `${workshop.name} overlaps with ${session.title}`;

// ── Per-step validators ──

/**
 * Validate the Step-1 attendee block. Required-then-format: an empty field reports
 * "required"; a present-but-malformed email/phone reports the format message.
 * `shippingRequired` is the cross-step condition (merch selected in Step 3, D9).
 * @param {Object} [attendee]
 * @param {{ shippingRequired?: boolean }} [options]
 * @returns {Record<string, string>} field → message, only for failing fields.
 */
export function validateAttendee(attendee, { shippingRequired = false } = {}) {
  const a = attendee ?? {};
  const errors = {};

  if (!isPresent(a.fullName)) errors.fullName = requiredMsg('Full Name');

  if (!isPresent(a.email)) errors.email = requiredMsg('Email');
  else if (!isValidEmail(a.email)) errors.email = INVALID_EMAIL;

  if (!isPresent(a.phone)) errors.phone = requiredMsg('Phone');
  else if (!isValidPhone(a.phone)) errors.phone = INVALID_PHONE;

  if (!isPresent(a.company)) errors.company = requiredMsg('Company');
  if (!isPresent(a.jobTitle)) errors.jobTitle = requiredMsg('Job Title');

  if (shippingRequired && !isPresent(a.shippingAddress)) {
    errors.shippingAddress = SHIPPING_REQUIRED;
  }

  return errors;
}

/**
 * Session↔session time conflicts among the selected sessions. README Step 2 §2 defers
 * this to submit and asks that "the relevant step be indicated with errors" — so it
 * flags Step 2 (D34). Each conflicting pair yields one message naming both sessions.
 * @param {{ id: string, title: string, start: Date, end: Date }[]} selectedSessions
 * @returns {string[]}
 */
export function sessionConflictErrors(selectedSessions) {
  return detectConflicts(selectedSessions).map(([a, b]) => sessionConflictMsg(a, b));
}

/**
 * Workshop↔session conflicts (README Step 3 §2, D9): every selected workshop that
 * overlaps a selected session yields one message naming the session. This is the stale
 * conflict path (AC-4.6) — the workshop is never mutated here (pure), so it is kept and
 * reported at submit (D10).
 * @param {{ name: string, start?: Date, end?: Date }[]} selectedWorkshops
 * @param {{ id: string, title: string, start: Date, end: Date }[]} selectedSessions
 * @returns {string[]}
 */
export function workshopConflictErrors(selectedWorkshops, selectedSessions) {
  const errors = [];
  for (const workshop of selectedWorkshops) {
    for (const session of conflictingSessions(workshop, selectedSessions)) {
      errors.push(workshopConflictMsg(workshop, session));
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
 * @returns {{ attendee: Record<string, string>, sessions: string[], addons: string[] }}
 */
export function validateAll(state, sources = {}) {
  const s = state ?? {};
  const sessionMap = byId(sources.sessions);
  const addonMap = byId(sources.addons);

  const selectedSessions = (s.selectedSessionIds ?? [])
    .map((id) => sessionMap.get(id))
    .filter(Boolean);
  const selectedWorkshops = (s.selectedWorkshopIds ?? [])
    .map((id) => addonMap.get(id))
    .filter(Boolean);

  const attendee = validateAttendee(s.attendee, {
    shippingRequired: hasMerchSelected(s.merchSelections),
  });
  // Ticket selection is mandatory to register (README Step 1) though it is not one of
  // the tabulated "fields" — a deliberate spec-gap fill flagged for review (D34). It is
  // a Step-1 concern, so it rides in the attendee group and flags Step 1.
  if (!s.ticketId) attendee.ticketId = TICKET_REQUIRED;

  return {
    attendee,
    sessions: sessionConflictErrors(selectedSessions),
    addons: workshopConflictErrors(selectedWorkshops, selectedSessions),
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
 * @returns {string[]}
 */
export function summarizeErrors(errors = {}) {
  const lines = [];
  for (const message of Object.values(errors.attendee ?? {})) {
    lines.push(`Step ${STEP_NUMBER.attendee}: ${message}`);
  }
  for (const message of errors.sessions ?? [])
    lines.push(`Step ${STEP_NUMBER.sessions}: ${message}`);
  for (const message of errors.addons ?? []) lines.push(`Step ${STEP_NUMBER.addons}: ${message}`);
  return lines;
}
