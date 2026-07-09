/**
 * Capacity rules (README Step 2 §3): an item is **full** when `registered >= capacity`.
 *
 * Sessions and workshops carry `capacity` / `registered`; meal packages and merchandise
 * do not — those are treated as uncapped (never full, no remaining-spots number).
 */

/**
 * @param {{ capacity?: number, registered?: number }} item
 * @returns {boolean} True when the item is at or over capacity.
 */
export function isFull(item) {
  if (item.capacity == null) return false;
  return item.registered >= item.capacity;
}

/**
 * @param {{ capacity?: number, registered?: number }} item
 * @returns {number|null} Remaining spots (never negative), or `null` when uncapped.
 */
export function remainingSpots(item) {
  if (item.capacity == null) return null;
  return Math.max(0, item.capacity - item.registered);
}
