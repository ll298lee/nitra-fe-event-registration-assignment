<script setup>
import { ref, computed, onMounted, nextTick, useId } from 'vue';
import { fetchEvent, fetchSessions, fetchAddons } from '../../data/facade.js';
import { useRegistration } from '../../composables/useRegistration.js';
import { conflictingSessions } from '../../logic/conflicts.js';
import { isFull } from '../../logic/capacity.js';
import WorkshopCard from './WorkshopCard.vue';
import OrderSummaryPanel from './OrderSummaryPanel.vue';

// Step 3 — Add-ons. Add-ons are grouped by category into a segmented tab control (D27);
// this PR wires the Workshops tab + the live order-summary sidebar. Meal Packages and
// Merchandise land in later PRs (D30/D31a).

const { selectedSessionIds, selectedWorkshopIds } = useRegistration();

const uid = useId();
const ticketTypes = ref([]);
const sessions = ref([]);
const addons = ref([]);
const loading = ref(true);
const tablistRef = ref(null);

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

const CATEGORIES = [
  { key: 'workshop', label: 'Workshops' },
  { key: 'meal', label: 'Meal Packages' },
  { key: 'merchandise', label: 'Merchandise' },
];
const activeIndex = ref(0);
const activeCategory = computed(() => CATEGORIES[activeIndex.value]);

const workshops = computed(() => addons.value.filter((a) => a.category === 'workshop'));

const selectedSessions = computed(() =>
  sessions.value.filter((s) => selectedSessionIds.value.includes(s.id))
);

// Conflicts per workshop, memoized so each card's `:conflicts` keeps a stable reference
// (and skips re-rendering) until the selected sessions actually change.
const conflictsByWorkshop = computed(
  () =>
    new Map(workshops.value.map((ws) => [ws.id, conflictingSessions(ws, selectedSessions.value)]))
);

function isWorkshopSelected(id) {
  return selectedWorkshopIds.value.includes(id);
}
function toggleWorkshop(id) {
  if (isWorkshopSelected(id)) {
    selectedWorkshopIds.value = selectedWorkshopIds.value.filter((x) => x !== id);
    return;
  }
  // Re-assert the block at the mutation, not only in the card: a full or time-conflicting
  // workshop can never enter the selection, whatever the emitter (AC-3.2/3.3, D9, D31b).
  const workshop = workshops.value.find((w) => w.id === id);
  if (!workshop || isFull(workshop) || conflictsByWorkshop.value.get(id)?.length) return;
  selectedWorkshopIds.value = [...selectedWorkshopIds.value, id];
}

// Roving tabindex + arrow-key navigation, per the WAI-ARIA tabs pattern (as Step 2).
function onTabKeydown(e) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
  if (!keys.includes(e.key)) return;
  e.preventDefault();
  const n = CATEGORIES.length;
  let i = activeIndex.value;
  if (e.key === 'Home') i = 0;
  else if (e.key === 'End') i = n - 1;
  else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (i + 1) % n;
  else i = (i - 1 + n) % n;
  activeIndex.value = i;
  nextTick(() => tablistRef.value?.querySelectorAll('[role="tab"]')[i]?.focus());
}
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-center py-10">
      <q-spinner size="32px" class="text-brand-emphasis" />
    </div>

    <div v-else class="flex items-start gap-8">
      <div class="flex flex-1 flex-col gap-6">
        <h2 class="text-h3 text-neutral">Select Add-ons</h2>

        <div
          ref="tablistRef"
          role="tablist"
          aria-label="Add-on category"
          class="inline-flex w-fit gap-1 rounded-[10px] bg-surface-l2 p-1"
          @keydown="onTabKeydown"
        >
          <button
            v-for="(cat, i) in CATEGORIES"
            :id="`${uid}-tab-${i}`"
            :key="cat.key"
            type="button"
            role="tab"
            :aria-selected="activeIndex === i"
            :aria-controls="`${uid}-panel`"
            :tabindex="activeIndex === i ? 0 : -1"
            class="h-8 cursor-pointer rounded-lg border-0 px-5 py-2 text-[13px] leading-[normal] transition-colors"
            :class="
              activeIndex === i
                ? 'bg-brand-emphasis-rest font-semibold text-inverse'
                : 'bg-transparent font-medium text-neutral-muted hover:text-neutral'
            "
            @click="activeIndex = i"
          >
            {{ cat.label }}
          </button>
        </div>

        <div
          :id="`${uid}-panel`"
          role="tabpanel"
          :aria-labelledby="`${uid}-tab-${activeIndex}`"
          :tabindex="activeCategory.key === 'workshop' ? undefined : 0"
          class="flex flex-col gap-4"
        >
          <template v-if="activeCategory.key === 'workshop'">
            <WorkshopCard
              v-for="ws in workshops"
              :key="ws.id"
              :workshop="ws"
              :selected="isWorkshopSelected(ws.id)"
              :conflicts="conflictsByWorkshop.get(ws.id) ?? []"
              @toggle="toggleWorkshop"
            />
          </template>

          <p v-else class="text-sm font-regular text-neutral-quiet">
            {{ activeCategory.label }} selection is coming in the next update.
          </p>
        </div>
      </div>

      <aside class="w-[380px] shrink-0">
        <OrderSummaryPanel :ticket-types="ticketTypes" :addons="addons" />
      </aside>
    </div>
  </div>
</template>
