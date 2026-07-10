<script setup>
import { toRef } from 'vue';
import { useOrderSummary } from '../../composables/useOrderSummary.js';
import { formatCurrency } from '../../utils/pricing.js';

// Step 4 itemized pricing (AC-4.2). Reuses the shared useOrderSummary engine (D26) — the same
// pricing contract as the Step 3 running total — but is its own presentational component,
// separate from OrderSummaryPanel (styling rationale in IMPLEMENTATION_PLAN.md D35).
const props = defineProps({
  ticketTypes: { type: Array, default: () => [] },
  addons: { type: Array, default: () => [] },
});

const { lineItems, workshopDiscount, total } = useOrderSummary({
  ticketTypes: toRef(props, 'ticketTypes'),
  addons: toRef(props, 'addons'),
});

// Show the "× n" quantity suffix only when it carries information (quantity > 1); a
// single-quantity line is just its name (D35f).
function lineLabel(item) {
  if (item.type === 'ticket') return `${item.name} Ticket`;
  return item.quantity > 1 ? `${item.name} × ${item.quantity}` : item.name;
}
</script>

<template>
  <section
    class="flex flex-col gap-2 rounded-md border border-solid border-neutral-muted bg-surface-l1 p-5"
    aria-label="Pricing summary"
  >
    <h3 class="text-subtitle1 text-neutral">Pricing Summary</h3>

    <p v-if="!lineItems.length" class="text-sm font-regular text-neutral-quiet">
      Nothing selected yet.
    </p>

    <div
      v-for="item in lineItems"
      :key="`${item.type}-${item.id}-${item.size ?? ''}`"
      class="flex w-full items-start justify-between gap-4 text-sm font-regular text-neutral-muted"
    >
      <span>{{ lineLabel(item) }}</span>
      <span class="shrink-0 whitespace-nowrap">{{ formatCurrency(item.amount) }}</span>
    </div>

    <div
      v-if="workshopDiscount > 0"
      class="flex w-full items-start justify-between gap-4 text-[11px] font-regular leading-[14px] text-brand-emphasis"
    >
      <span>Workshop discount (VIP 10%)</span>
      <span class="shrink-0 whitespace-nowrap">-{{ formatCurrency(workshopDiscount) }}</span>
    </div>

    <div class="h-px w-full bg-[var(--divider-muted)]" />

    <div class="flex w-full items-start justify-between gap-4 text-sm font-medium text-neutral">
      <span>Grand Total</span>
      <span class="shrink-0 whitespace-nowrap">{{ formatCurrency(total) }}</span>
    </div>
  </section>
</template>
