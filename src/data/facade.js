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

/**
 * @returns {Promise<typeof event>}
 */
export async function fetchEvent() {
  await delay(SIMULATED_LATENCY_MS);
  return event;
}

/**
 * @returns {Promise<import('./normalize.js').Session[]>}
 */
export async function fetchSessions() {
  await delay(SIMULATED_LATENCY_MS);
  return normalizeSessions(sessions);
}

/**
 * @returns {Promise<import('./normalize.js').Addon[]>}
 */
export async function fetchAddons() {
  await delay(SIMULATED_LATENCY_MS);
  return normalizeAddons(addons);
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
