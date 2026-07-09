/**
 * Time-conflict detection (README Step 2 §2, Step 3 §2).
 *
 * Overlap uses **strict** inequality (IMPLEMENTATION_PLAN.md D6): two slots that only
 * touch at an endpoint (back-to-back) do **not** conflict. The mock data is engineered
 * around the 14:00Z boundary (`s10` ends as `s11`/`ws1` begin), so a touch must remain
 * co-selectable.
 *
 * These are pure predicates over `{ start, end }` intervals — capacity filtering (which
 * full items are even co-selectable) and user-facing messages live in their own layers.
 */

/**
 * @param {{ start: Date, end: Date }} a
 * @param {{ start: Date, end: Date }} b
 * @returns {boolean} True when the intervals strictly overlap (touching endpoints → false).
 */
export function intervalsOverlap(a, b) {
  return a.start < b.end && b.start < a.end;
}

/**
 * Find every pair of items whose time slots strictly overlap.
 * @template {{ start: Date, end: Date }} T
 * @param {T[]} items
 * @returns {[T, T][]} Conflicting pairs (unordered, each pair once).
 */
export function detectConflicts(items) {
  const conflicts = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (intervalsOverlap(items[i], items[j])) {
        conflicts.push([items[i], items[j]]);
      }
    }
  }
  return conflicts;
}

/**
 * Sessions from `selectedSessions` that conflict with a timed add-on (workshop).
 * Non-timed add-ons (meals, merch) never conflict, so this returns `[]` for them.
 * @param {{ start?: Date, end?: Date }} addon
 * @param {{ start: Date, end: Date }[]} selectedSessions
 * @returns {Object[]} The conflicting sessions (empty when none / not timed).
 */
export function conflictingSessions(addon, selectedSessions) {
  if (!addon.start || !addon.end) return [];
  return selectedSessions.filter((session) => intervalsOverlap(addon, session));
}
