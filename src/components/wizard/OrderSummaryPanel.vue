<script setup>
import { toRef } from 'vue';
import { useOrderSummary } from '../../composables/useOrderSummary.js';
import { formatCurrency } from '../../utils/pricing.js';

// Live order summary for Step 3 (running total) and, later, Step 4 (breakdown). Data is
// owned by the hosting step and passed in, so the panel stays presentational and reusable;
// pricing itself is the fully-computed useOrderSummary engine (D26/D29, AC-3.11).
const props = defineProps({
  ticketTypes: { type: Array, default: () => [] },
  addons: { type: Array, default: () => [] },
});

const { lineItems, workshopDiscount, total } = useOrderSummary({
  ticketTypes: toRef(props, 'ticketTypes'),
  addons: toRef(props, 'addons'),
});

function lineLabel(item) {
  return item.type === 'ticket' ? `${item.name} Ticket` : `${item.name} × ${item.quantity}`;
}
</script>

<template>
  <section
    class="flex flex-col gap-4 rounded-md border border-solid border-neutral-muted bg-surface-l1 p-6"
    aria-label="Order summary"
  >
    <h2 class="text-subtitle1 text-neutral">Order Summary</h2>

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
      class="flex w-full items-start justify-between gap-4 text-sm font-regular text-brand-emphasis"
    >
      <span>Workshop discount (VIP 10%)</span>
      <span class="shrink-0 whitespace-nowrap">-{{ formatCurrency(workshopDiscount) }}</span>
    </div>

    <div class="h-px w-full bg-[var(--divider-muted)]" />

    <div class="flex w-full items-start justify-between gap-4 text-sm font-medium text-neutral">
      <span>Total</span>
      <span class="shrink-0 whitespace-nowrap">{{ formatCurrency(total) }}</span>
    </div>
  </section>
</template>
