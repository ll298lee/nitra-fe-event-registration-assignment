/**
 * Wall-clock date/time helpers (IMPLEMENTATION_PLAN.md D4).
 *
 * Every mock timestamp is a `Z`/UTC instant, but it denotes the event's **wall-clock**
 * time — `2028-11-15T09:00:00Z` means the 9:00 AM session, not "09:00 UTC shown in the
 * viewer's zone." So we read the Date's **UTC** fields directly and format them
 * ourselves. This is deliberate over `Intl.DateTimeFormat` with a local timeZone:
 *
 *   - It never shifts by the viewer's offset — e.g. `ws2` (18:30Z) stays on Nov 15
 *     instead of being pushed to Nov 16 for a Taipei (+8) viewer.
 *   - It is fully deterministic across environments (no ICU / locale variance, and no
 *     narrow-no-break-space surprises before AM/PM).
 */

const PERIOD = { AM: 'AM', PM: 'PM' };

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Wall-clock short day label `MMM D` (e.g. `Nov 15`), used for the Step 2 day tabs.
 * Reads UTC fields so the label never shifts across the viewer's local-midnight boundary.
 * @param {Date} date
 * @returns {string}
 */
export function formatDayLabel(date) {
  return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/**
 * Format a Date's wall-clock time as `h:mm AM/PM` (e.g. `3:30 PM`).
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date) {
  const hours24 = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const period = hours24 >= 12 ? PERIOD.PM : PERIOD.AM;
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Format a wall-clock time range as `h:mm AM/PM – h:mm AM/PM` (en dash, e.g.
 * `3:30 PM – 5:00 PM`).
 * @param {Date} start
 * @param {Date} end
 * @returns {string}
 */
export function formatTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/**
 * Wall-clock day key `YYYY-MM-DD`, used to group sessions by day.
 * Reads UTC fields so the grouping never shifts across the local-midnight boundary.
 * @param {Date} date
 * @returns {string}
 */
export function dayGroupKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
