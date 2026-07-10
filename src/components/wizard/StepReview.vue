<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchEvent, fetchSessions, fetchAddons } from '../../data/facade.js';
import { useRegistration } from '../../composables/useRegistration.js';
import { formatDateTime } from '../../utils/datetime.js';
import ReviewSection from './ReviewSection.vue';
import PricingSummaryCard from './PricingSummaryCard.vue';

// Step 4 — Review & Submit (PR 2, D35). A single-column, read-only summary of every Step 1–3
// selection plus the itemized pricing; each section's Edit control jumps back to its step, with
// all state preserved by the shared store (AC-4.1/4.2/4.3). Submit + validation wiring and the
// success screen are later Step-4 PRs (D34).

const {
  attendee,
  ticketId,
  selectedSessionIds,
  selectedWorkshopIds,
  selectedMealIds,
  merchSelections,
  goToStep,
} = useRegistration();

const ticketTypes = ref([]);
const sessions = ref([]);
const addons = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [event, sessionList, addonList] = await Promise.all([
      fetchEvent(),
      fetchSessions(),
      fetchAddons(),
    ]);
    ticketTypes.value = event.ticketTypes;
    sessions.value = sessionList;
    addons.value = addonList;
  } finally {
    loading.value = false;
  }
});

const addonById = computed(() => new Map(addons.value.map((a) => [a.id, a])));

// Whole-dollar (no-cents) price for the summary rows, deliberately distinct from the Pricing
// card's formatCurrency — do not collapse the two (D35).
const dollars = (price) => `$${price}`;
const EM_DASH = '—';

const selectedTicket = computed(
  () => ticketTypes.value.find((t) => t.id === ticketId.value) ?? null
);

const attendeeRows = computed(() => {
  const rows = [
    { label: 'Name', value: attendee.fullName || EM_DASH },
    { label: 'Email', value: attendee.email || EM_DASH },
    { label: 'Phone', value: attendee.phone || EM_DASH },
    { label: 'Company', value: attendee.company || EM_DASH },
    { label: 'Job Title', value: attendee.jobTitle || EM_DASH },
    {
      label: 'Ticket Type',
      value: selectedTicket.value
        ? `${selectedTicket.value.name} (${dollars(selectedTicket.value.price)})`
        : EM_DASH,
    },
  ];
  // Shipping Address is optional (required only with merch, D9); the frame omits it, so show
  // it only once the attendee has entered one (D35g).
  if (attendee.shippingAddress) {
    rows.push({ label: 'Shipping Address', value: attendee.shippingAddress });
  }
  return rows;
});

const sessionRows = computed(() =>
  sessions.value
    .filter((s) => selectedSessionIds.value.includes(s.id))
    .map((s) => ({ label: formatDateTime(s.start), value: s.title }))
);

const addonRows = computed(() => {
  const rows = [];
  for (const id of selectedWorkshopIds.value) {
    const a = addonById.value.get(id);
    if (a) rows.push({ label: 'Workshop', value: `${a.name} (${dollars(a.price)})` });
  }
  for (const id of selectedMealIds.value) {
    const a = addonById.value.get(id);
    if (a) rows.push({ label: 'Meal', value: `${a.name} (${dollars(a.price)})` });
  }
  for (const [id, sel] of Object.entries(merchSelections)) {
    const a = addonById.value.get(id);
    if (!a || (sel?.quantity ?? 0) < 1) continue;
    const size = sel.size ? `, ${sel.size}` : '';
    const qty = sel.quantity > 1 ? ` × ${sel.quantity}` : '';
    rows.push({ label: 'Merchandise', value: `${a.name}${size}${qty} (${dollars(a.price)})` });
  }
  return rows;
});
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-center py-10">
      <q-spinner size="32px" class="text-brand-emphasis" />
    </div>

    <div v-else class="flex flex-col gap-6">
      <h2 class="text-h3 text-neutral">Review Your Registration</h2>

      <ReviewSection
        title="Attendee Information"
        edit-label="Edit → Step 1"
        :rows="attendeeRows"
        @edit="goToStep(0)"
      />

      <ReviewSection
        title="Selected Sessions"
        edit-label="Edit → Step 2"
        :rows="sessionRows"
        empty-message="No sessions selected."
        @edit="goToStep(1)"
      />

      <ReviewSection
        title="Add-ons"
        edit-label="Edit → Step 3"
        :rows="addonRows"
        empty-message="No add-ons selected."
        @edit="goToStep(2)"
      />

      <PricingSummaryCard :ticket-types="ticketTypes" :addons="addons" />
    </div>
  </div>
</template>
