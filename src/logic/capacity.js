/**
 * Capacity rules (README Step 2 §3): an item is **full** when `registered >= capacity`.
 *
 * Sessions and workshops carry `capacity` / `registered`; meal packages and merchandise
 * do not — those are treated as uncapped (never full, no remaining-spots number).
 */

/**
 * An absent `registered` count is read as 0, so `isFull` and `remainingSpots`
 * stay consistent (not-full / full-remaining) rather than disagreeing (one
 * returning `false` while the other returns `NaN`).
 * @param {{ capacity?: number, registered?: number }} item
 * @returns {boolean} True when the item is at or over capacity.
 */
export function isFull(item) {
  if (item.capacity == null) return false;
  return (item.registered ?? 0) >= item.capacity;
}

/**
 * @param {{ capacity?: number, registered?: number }} item
 * @returns {number|null} Remaining spots (never negative), or `null` when uncapped.
 */
export function remainingSpots(item) {
  if (item.capacity == null) return null;
  return Math.max(0, item.capacity - (item.registered ?? 0));
}

/**
 * Fraction of capacity filled, clamped to `[0, 1]`. Uncapped items (no `capacity`)
 * report 0. Shares the same null/zero handling as `isFull`/`remainingSpots` so the
 * capacity bar can never disagree with the spots label.
 * @param {{ capacity?: number, registered?: number }} item
 * @returns {number}
 */
export function fillFraction(item) {
  if (item.capacity == null || item.capacity === 0) return 0;
  return Math.min(1, (item.registered ?? 0) / item.capacity);
}
