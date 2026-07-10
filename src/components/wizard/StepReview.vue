<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchEvent, fetchSessions, fetchAddons } from '../../data/facade.js';
import { useRegistration } from '../../composables/useRegistration.js';
import { useValidation } from '../../composables/useValidation.js';
import { formatDateTime } from '../../utils/datetime.js';
import ReviewSection from './ReviewSection.vue';
import PricingSummaryCard from './PricingSummaryCard.vue';
import ErrorBanner from './ErrorBanner.vue';
import CardSkeleton from './CardSkeleton.vue';

// Step 4 — Review & Submit (D35/D36). A single-column, read-only summary of every Step 1–3
// selection plus the itemized pricing; each section's Edit control jumps back to its step, with
// all state preserved by the shared store (AC-4.1/4.2/4.3). After a failed submit, sections with
// errors are flagged and surface the specific missing fields / time conflicts (AC-4.5/4.6/4.9).
// The async submit + success screen are a later Step-4 PR (D36h).

const {
  attendee,
  ticketId,
  selectedSessionIds,
  selectedWorkshopIds,
  selectedMealIds,
  merchSelections,
  goToStep,
} = useRegistration();

const { submitted, errors, errorSummary } = useValidation();
const { t } = useI18n({ useScope: 'global' });

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

// Error marker for a failing attendee field (D36): a missing field reads "— (required)"
// (shipping: "— (required for merchandise)"); a present-but-invalid value is returned as-is.
// Returns undefined when the field is valid or before the first submit.
function attendeeRowError(key, value) {
  if (!submitted.value || !errors.value.attendee[key]) return undefined;
  if (!value || value === EM_DASH) {
    return key === 'shippingAddress' ? t('step4.requiredMerch') : t('step4.required');
  }
  return value;
}

const attendeeRows = computed(() => {
  const rows = [
    { label: t('step4.rows.name'), key: 'fullName', value: attendee.fullName || EM_DASH },
    { label: t('step4.rows.email'), key: 'email', value: attendee.email || EM_DASH },
    { label: t('step4.rows.phone'), key: 'phone', value: attendee.phone || EM_DASH },
    { label: t('step4.rows.company'), key: 'company', value: attendee.company || EM_DASH },
    { label: t('step4.rows.jobTitle'), key: 'jobTitle', value: attendee.jobTitle || EM_DASH },
    {
      label: t('step4.rows.ticketType'),
      key: 'ticketId',
      value: selectedTicket.value
        ? t('step4.priceParens', {
            name: selectedTicket.value.name,
            price: dollars(selectedTicket.value.price),
          })
        : EM_DASH,
    },
  ];
  // Shipping Address is optional (required only with merch, D9): show it once entered, or — after a
  // failed submit — when it is required-but-missing so its error is visible; otherwise omit it (D35g).
  if (attendee.shippingAddress || (submitted.value && errors.value.attendee.shippingAddress)) {
    rows.push({
      label: t('step4.rows.shippingAddress'),
      key: 'shippingAddress',
      value: attendee.shippingAddress || EM_DASH,
    });
  }
  return rows.map((r) => ({ ...r, error: attendeeRowError(r.key, r.value) }));
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
    if (a)
      rows.push({
        label: t('step4.addonLabels.workshop'),
        value: t('step4.priceParens', { name: a.name, price: dollars(a.price) }),
      });
  }
  for (const id of selectedMealIds.value) {
    const a = addonById.value.get(id);
    if (a)
      rows.push({
        label: t('step4.addonLabels.meal'),
        value: t('step4.priceParens', { name: a.name, price: dollars(a.price) }),
      });
  }
  for (const [id, sel] of Object.entries(merchSelections)) {
    const a = addonById.value.get(id);
    if (!a || (sel?.quantity ?? 0) < 1) continue;
    const size = sel.size ? `, ${sel.size}` : '';
    const qty = sel.quantity > 1 ? ` × ${sel.quantity}` : '';
    rows.push({
      label: t('step4.addonLabels.merchandise'),
      value: t('step4.priceParens', { name: `${a.name}${size}${qty}`, price: dollars(a.price) }),
    });
  }
  return rows;
});

// Time-conflict errors flag their owning step's section at submit (D9, D36d) — session↔session on
// Sessions, workshop↔session on Add-ons.
const sessionErrors = computed(() => (submitted.value ? errors.value.sessions : []));
const addonErrors = computed(() => (submitted.value ? errors.value.addons : []));
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- The error banner is validation state, not reviewed data, so it renders outside the
         data-loading gate — otherwise a submit during the load window would find no banner to
         scroll/focus/announce (revealErrors targets [role="alert"]). -->
    <Transition name="fade">
      <ErrorBanner v-if="errorSummary.length" :items="errorSummary" />
    </Transition>

    <div v-if="loading" class="flex flex-col gap-6" aria-hidden="true">
      <q-skeleton type="text" width="240px" height="28px" />
      <CardSkeleton :lines="6" />
      <CardSkeleton :lines="2" />
      <CardSkeleton :lines="2" />
      <CardSkeleton :lines="4" />
    </div>

    <div v-else class="flex flex-col gap-6">
      <h2 class="text-h3 text-neutral">{{ $t('step4.heading') }}</h2>

      <ReviewSection
        :title="$t('step4.sections.attendee')"
        :edit-label="$t('step4.editStep', { n: 1 })"
        :rows="attendeeRows"
        @edit="goToStep(0)"
      />

      <ReviewSection
        :title="$t('step4.sections.sessions')"
        :edit-label="$t('step4.editStep', { n: 2 })"
        :rows="sessionRows"
        :errors="sessionErrors"
        :empty-message="$t('step4.empty.sessions')"
        @edit="goToStep(1)"
      />

      <ReviewSection
        :title="$t('step4.sections.addons')"
        :edit-label="$t('step4.editStep', { n: 3 })"
        :rows="addonRows"
        :errors="addonErrors"
        :empty-message="$t('step4.empty.addons')"
        @edit="goToStep(2)"
      />

      <PricingSummaryCard :ticket-types="ticketTypes" :addons="addons" />
    </div>
  </div>
</template>
