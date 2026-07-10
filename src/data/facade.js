/**
 * Async data facade over the synchronous mock fixtures (IMPLEMENTATION_PLAN.md D1).
 *
 * The mocks are plain synchronous arrays, but loading / pending states are part of
 * the spec (Step 2 session list, Step 4 submit). A thin `async` wrapper that resolves
 * after a simulated latency lets the UI exercise real loading/pending affordances and
 * mirrors how a real API integration would look — swap these bodies for `fetch` and
 * nothing downstream changes.
 */
import { event } from '../mocks/event.js';
import { sessions } from '../mocks/sessions.js';
import { addons } from '../mocks/addons.js';
import { normalizeSessions, normalizeAddons } from './normalize.js';

/** Simulated network latency (ms) so loading states are observable. */
export const SIMULATED_LATENCY_MS = 250;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The event (name + ticket types) is immutable reference data read by both the header and
// Step 1, and Step 1 remounts on every visit. Cache the in-flight promise so it is fetched
// once and revisiting a step never re-incurs the latency or a second round-trip.
let eventPromise = null;

/**
 * @returns {Promise<typeof event>}
 */
export function fetchEvent() {
  if (!eventPromise) {
    eventPromise = delay(SIMULATED_LATENCY_MS).then(() => event);
  }
  return eventPromise;
}

// Sessions and add-ons are immutable reference data too, and their steps (2/3) plus the Step-4
// review all remount on every visit. Cache the in-flight promise (as fetchEvent does) so the
// first visit pays the latency once and every revisit — Back, "Edit → Step N" from the review —
// resolves from cache before paint, so the loading skeleton never re-flashes on navigation.
let sessionsPromise = null;

/**
 * @returns {Promise<import('./normalize.js').Session[]>}
 */
export function fetchSessions() {
  if (!sessionsPromise) {
    sessionsPromise = delay(SIMULATED_LATENCY_MS).then(() => normalizeSessions(sessions));
  }
  return sessionsPromise;
}

let addonsPromise = null;

/**
 * @returns {Promise<import('./normalize.js').Addon[]>}
 */
export function fetchAddons() {
  if (!addonsPromise) {
    addonsPromise = delay(SIMULATED_LATENCY_MS).then(() => normalizeAddons(addons));
  }
  return addonsPromise;
}

/**
 * Generate the server-assigned confirmation number shown on the success screen.
 * Format: `WDS-XXXXXXXX` (8 uppercase base-36 chars).
 * @returns {string}
 */
export function generateConfirmationNumber() {
  // Draw 8 uniform chars from [A-Z0-9]. (Not base-36-of-random + padEnd — that
  // biases short fractions toward a '0'-heavy suffix and loses uniqueness.)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let body = '';
  for (let i = 0; i < 8; i++) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `WDS-${body}`;
}

/**
 * Simulate submitting a completed registration. Resolves with the assigned
 * confirmation number and an echo of the submitted registration.
 * @param {Object} registration
 * @returns {Promise<{ confirmationNumber: string, registration: Object }>}
 */
export async function submitRegistration(registration) {
  await delay(SIMULATED_LATENCY_MS);
  return {
    confirmationNumber: generateConfirmationNumber(),
    registration,
  };
}
