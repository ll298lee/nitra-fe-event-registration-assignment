<script setup>
import { toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useOrderSummary } from '../../composables/useOrderSummary.js';
import { formatCurrency } from '../../utils/pricing.js';

const { t } = useI18n({ useScope: 'global' });

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
  return item.type === 'ticket'
    ? t('summary.ticketLine', { name: item.name })
    : t('summary.line', { name: item.name, qty: item.quantity });
}
</script>

<template>
  <section
    class="flex flex-col gap-4 rounded-md border border-solid border-neutral-muted bg-surface-l1 p-6"
    :aria-label="$t('summary.aria.order')"
  >
    <h2 class="text-subtitle1 text-neutral">{{ $t('summary.orderTitle') }}</h2>

    <p v-if="!lineItems.length" class="text-sm font-regular text-neutral-quiet">
      {{ $t('summary.empty') }}
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
      <span>{{ $t('summary.discount') }}</span>
      <span class="shrink-0 whitespace-nowrap">-{{ formatCurrency(workshopDiscount) }}</span>
    </div>

    <div class="h-px w-full bg-[var(--divider-muted)]" />

    <div class="flex w-full items-start justify-between gap-4 text-sm font-medium text-neutral">
      <span>{{ $t('summary.total') }}</span>
      <span class="shrink-0 whitespace-nowrap">{{ formatCurrency(total) }}</span>
    </div>
  </section>
</template>
