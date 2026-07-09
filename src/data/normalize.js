/**
 * Edge normalizers + shared JSDoc typedefs.
 *
 * The mocks carry event times as ISO-8601 strings (e.g. `2028-11-15T09:00:00Z`).
 * We parse those strings **once here at the data edge** into `Date` objects so the
 * rest of the app never re-parses raw strings. Downstream logic reads the parsed
 * `start` / `end` fields (never `date` / `endDate`).
 *
 * Timezone note (IMPLEMENTATION_PLAN.md D4): the `Z` timestamps denote event
 * *wall-clock* time, not an instant to be shown in the viewer's local zone. The
 * parsed `Date` objects are therefore only ever read via their UTC fields by
 * `src/utils/datetime.js` — that is what keeps display from shifting by the
 * viewer's offset.
 */

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} title
 * @property {string} speaker
 * @property {string} speakerTitle
 * @property {string} track      One of `main` | `frontend` | `backend` | `devops`.
 * @property {Date}   start      Parsed from the raw ISO `date`.
 * @property {Date}   end        Parsed from the raw ISO `endDate`.
 * @property {number} capacity
 * @property {number} registered
 * @property {string} description
 */

/**
 * @typedef {Object} Addon
 * @property {string}  id
 * @property {'workshop'|'meal'|'merchandise'} category
 * @property {string}  name
 * @property {string}  description
 * @property {number}  price
 * @property {Date}   [start]        Present for workshops only (parsed from `date`).
 * @property {Date}   [end]          Present for workshops only (parsed from `endDate`).
 * @property {number} [capacity]     Present for workshops only.
 * @property {number} [registered]   Present for workshops only.
 * @property {string[]} [sizes]      Present for some merchandise.
 * @property {number} [maxQuantity]  Present for merchandise.
 */

/**
 * Parse a single session's ISO timestamps into `start` / `end` Date objects.
 * @param {Object} raw
 * @returns {Session}
 */
export function normalizeSession(raw) {
  return {
    ...raw,
    start: new Date(raw.date),
    end: new Date(raw.endDate),
  };
}

/**
 * Parse a single add-on. Only workshops carry time slots, so `start` / `end`
 * are added only when the raw add-on has a `date`.
 * @param {Object} raw
 * @returns {Addon}
 */
export function normalizeAddon(raw) {
  const addon = { ...raw };
  // Attach a time slot only when it is *complete* — a lone `date` without a
  // valid `endDate` would otherwise become an Invalid Date `end` that passes
  // truthiness guards and silently breaks conflict comparisons.
  if (raw.date && raw.endDate) {
    addon.start = new Date(raw.date);
    addon.end = new Date(raw.endDate);
  }
  return addon;
}

/**
 * @param {Object[]} raw
 * @returns {Session[]}
 */
export function normalizeSessions(raw) {
  return raw.map(normalizeSession);
}

/**
 * @param {Object[]} raw
 * @returns {Addon[]}
 */
export function normalizeAddons(raw) {
  return raw.map(normalizeAddon);
}
