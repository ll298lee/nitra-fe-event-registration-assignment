import { computed, toValue } from 'vue';
import { useRegistration } from './useRegistration.js';
import { round2, workshopDiscountAmount } from '../utils/pricing.js';

/**
 * Live order summary — the single source of cart pricing for the Step 3 running
 * total (AC-3.11) and the Step 4 itemized breakdown (AC-4.2).
 *
 * Everything here is **fully computed, with zero watchers** (IMPLEMENTATION_PLAN.md
 * D3). That is what makes the killer sequence free and instant: VIP → add `ws1` →
 * Review → Edit → switch to General and the workshop discount vanishes on the next
 * render with no reconciliation code (AC-P-6). The VIP perk is applied over the
 * selected **workshops only** — meal, merchandise and ticket prices are never fed
 * into the discount, so nothing else can be discounted (AC-P-3/P-4, D11).
 */

/**
 * @typedef {Object} LineItem
 * @property {string} id
 * @property {'ticket'|'workshop'|'meal'|'merchandise'} type
 * @property {string} name
 * @property {string|null} size        Size for merchandise, else `null`.
 * @property {number} unitPrice
 * @property {number} quantity
 * @property {number} amount           `unitPrice * quantity`.
 */

/**
 * Build a computed order summary from the wizard store and the fetched reference
 * data. Kept as a plain factory (like `createRegistration`) so it is unit-testable
 * without a component; `useOrderSummary` wraps it with provide/inject.
 *
 * `sources.ticketTypes` / `sources.addons` may be refs, getters, or plain arrays
 * (read via `toValue`), so a component can pass the still-loading refs it fills
 * from the async facade and the summary reacts as the data arrives.
 *
 * @param {ReturnType<typeof import('./useRegistration.js').createRegistration>} registration
 * @param {{ ticketTypes?: unknown, addons?: unknown }} sources
 */
export function createOrderSummary(registration, sources = {}) {
  const ticketTypes = () => toValue(sources.ticketTypes) ?? [];
  const addons = () => toValue(sources.addons) ?? [];

  const addonById = computed(() => {
    const map = new Map();
    for (const addon of addons()) map.set(addon.id, addon);
    return map;
  });

  /**
   * Resolve one selected add-on id + quantity to a line item, or `null` when the
   * id is unknown (defensive against a selection that outlives its data) or the
   * quantity is non-positive (a merch entry the user zeroed out).
   * @returns {LineItem|null}
   */
  function toAddonLine(id, quantity, size = null) {
    const addon = addonById.value.get(id);
    if (!addon || quantity <= 0) return null;
    return {
      id: addon.id,
      type: addon.category,
      name: addon.name,
      size,
      unitPrice: addon.price,
      quantity,
      amount: round2(addon.price * quantity),
    };
  }

  const ticketLine = computed(() => {
    const id = toValue(registration.ticketId);
    if (!id) return null;
    const ticket = ticketTypes().find((t) => t.id === id);
    if (!ticket) return null;
    return {
      id: ticket.id,
      type: 'ticket',
      name: ticket.name,
      size: null,
      unitPrice: ticket.price,
      quantity: 1,
      amount: ticket.price,
    };
  });

  const workshopLines = computed(() =>
    toValue(registration.selectedWorkshopIds)
      .map((id) => toAddonLine(id, 1))
      .filter(Boolean)
  );

  const mealLines = computed(() =>
    toValue(registration.selectedMealIds)
      .map((id) => toAddonLine(id, 1))
      .filter(Boolean)
  );

  // Merch selections are keyed by add-on id → { size, quantity } (the shape the
  // store and its tests already use). Total-quantity max is enforced by the picker
  // UI, not here — the summary just prices whatever quantity it is given (D16).
  const merchLines = computed(() => {
    const selections = toValue(registration.merchSelections) ?? {};
    return Object.entries(selections)
      .map(([id, sel]) => toAddonLine(id, sel?.quantity ?? 0, sel?.size ?? null))
      .filter(Boolean);
  });

  const addonLines = computed(() => [
    ...workshopLines.value,
    ...mealLines.value,
    ...merchLines.value,
  ]);

  const lineItems = computed(() =>
    ticketLine.value ? [ticketLine.value, ...addonLines.value] : [...addonLines.value]
  );

  const workshopDiscount = computed(() =>
    workshopDiscountAmount(
      toValue(registration.ticketId),
      workshopLines.value.map((line) => line.amount)
    )
  );

  const subtotal = computed(() =>
    round2(
      (ticketLine.value?.amount ?? 0) + addonLines.value.reduce((sum, line) => sum + line.amount, 0)
    )
  );

  const total = computed(() => round2(subtotal.value - workshopDiscount.value));

  return {
    ticketLine,
    workshopLines,
    mealLines,
    merchLines,
    addonLines,
    lineItems,
    workshopDiscount,
    subtotal,
    total,
  };
}

/**
 * Inject the wizard store and build the order summary over it. Call from a Step 3 /
 * Step 4 component, passing the ticket-type + add-on refs it loads from the facade.
 * @param {{ ticketTypes?: unknown, addons?: unknown }} sources
 */
export function useOrderSummary(sources = {}) {
  return createOrderSummary(useRegistration(), sources);
}
