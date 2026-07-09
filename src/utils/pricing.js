/**
 * Pricing primitives: currency formatting and the VIP workshop-discount math.
 *
 * Aggregation across a whole cart (ticket + add-on lines − discount = grand total)
 * lives in `useOrderSummary` (Phase 3); this module owns only the pure, reusable
 * primitives those higher layers compose.
 */

/**
 * VIP perk rate — 10% off workshops.
 *
 * IMPLEMENTATION_PLAN.md D11: the mock stores this perk only as the display string
 * `"10% off workshops"`; there is **no numeric rate in the data**. Naming the
 * constant here keeps `0.10` from reading as a magic number downstream.
 * @type {number}
 */
export const WORKSHOP_DISCOUNT_RATE = 0.1;

/** Ticket id that receives the workshop discount. */
export const DISCOUNT_TICKET_ID = 'vip';

/**
 * Round to whole cents, avoiding binary floating-point drift
 * (e.g. `149 * 0.1` → `14.900000000000002`).
 * @param {number} amount
 * @returns {number}
 */
export function round2(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/**
 * Format a number as USD: `$X,XXX.XX` — always two decimals, thousands separators.
 * (IMPLEMENTATION_PLAN.md D5.)
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

/**
 * Discount amount applied over the given workshop prices.
 *
 * The discount applies to **workshops only** and **only for the VIP ticket**; every
 * other ticket returns `0`. By construction it can only ever be computed from workshop
 * prices — meal, merchandise and ticket prices are never passed in — so nothing else
 * can be discounted (AC-P-3/P-4).
 *
 * @param {string} ticketId               Selected ticket id (`general` | `vip` | `student`).
 * @param {number[]} [workshopPrices]      Prices of the selected workshops.
 * @returns {number} Rounded discount amount (0 when not VIP or no workshops).
 */
export function workshopDiscountAmount(ticketId, workshopPrices = []) {
  if (ticketId !== DISCOUNT_TICKET_ID) return 0;
  const subtotal = workshopPrices.reduce((sum, price) => sum + price, 0);
  return round2(subtotal * WORKSHOP_DISCOUNT_RATE);
}
