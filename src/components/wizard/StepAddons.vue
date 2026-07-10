<script setup>
import { ref, computed, onMounted, nextTick, useId } from 'vue';
import { fetchEvent, fetchSessions, fetchAddons } from '../../data/facade.js';
import { useRegistration } from '../../composables/useRegistration.js';
import { conflictingSessions } from '../../logic/conflicts.js';
import { isFull } from '../../logic/capacity.js';
import WorkshopCard from './WorkshopCard.vue';
import MealCard from './MealCard.vue';
import MerchCard from './MerchCard.vue';
import ShippingBanner from './ShippingBanner.vue';
import OrderSummaryPanel from './OrderSummaryPanel.vue';

// Step 3 — Add-ons. Add-ons are grouped by category into a segmented tab control (D27);
// all three tabs (Workshops / Meal Packages / Merchandise) + the live order-summary
// sidebar are wired.

const { selectedSessionIds, selectedWorkshopIds, selectedMealIds, merchSelections } =
  useRegistration();

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
const meals = computed(() => addons.value.filter((a) => a.category === 'meal'));
const merchandise = computed(() => addons.value.filter((a) => a.category === 'merchandise'));

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

// Meals are the simplest add-on — no capacity or time slot, so no conflict/full guard: a
// plain multi-select toggle into selectedMealIds (both packages are independently selectable).
function isMealSelected(id) {
  return selectedMealIds.value.includes(id);
}
function toggleMeal(id) {
  selectedMealIds.value = isMealSelected(id)
    ? selectedMealIds.value.filter((x) => x !== id)
    : [...selectedMealIds.value, id];
}

// Merch is stored per id as { size, quantity } (D16/D26). A size picked before the first
// increment is kept as a { size, quantity: 0 } entry so the dropdown doesn't snap back;
// decrementing an added item back to 0 deletes its entry so the card resets to rest.
// Invariant: "merch added" is ALWAYS `quantity >= 1` (see `anyMerchAdded` and the order
// summary's merchLines), never mere key presence — a size-only entry has quantity 0.
function merchSize(id) {
  return merchSelections[id]?.size ?? null;
}
function merchQty(id) {
  return merchSelections[id]?.quantity ?? 0;
}
function incrementMerch(id) {
  const merch = merchandise.value.find((m) => m.id === id);
  if (!merch) return;
  const current = merchSelections[id];
  // Clamp at the item's own maxQuantity — the running total prices whatever it is given (D16).
  const quantity = Math.min((current?.quantity ?? 0) + 1, merch.maxQuantity);
  merchSelections[id] = { size: current?.size ?? null, quantity };
}
function decrementMerch(id) {
  const current = merchSelections[id];
  const quantity = (current?.quantity ?? 0) - 1;
  if (quantity <= 0) {
    delete merchSelections[id];
  } else {
    merchSelections[id] = { size: current?.size ?? null, quantity };
  }
}
function selectMerchSize(id, size) {
  const current = merchSelections[id];
  merchSelections[id] = { size, quantity: current?.quantity ?? 0 };
}

// Shipping banner (AC-3.9/3.10) is a cart-level notice: shown whenever any merch is actually
// in the order (quantity ≥ 1), independent of the active tab.
const anyMerchAdded = computed(() =>
  Object.values(merchSelections).some((sel) => (sel?.quantity ?? 0) >= 1)
);

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

        <ShippingBanner v-if="anyMerchAdded" />

        <div
          :id="`${uid}-panel`"
          role="tabpanel"
          :aria-labelledby="`${uid}-tab-${activeIndex}`"
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

          <template v-else-if="activeCategory.key === 'meal'">
            <MealCard
              v-for="meal in meals"
              :key="meal.id"
              :meal="meal"
              :selected="isMealSelected(meal.id)"
              @toggle="toggleMeal"
            />
          </template>

          <template v-else-if="activeCategory.key === 'merchandise'">
            <MerchCard
              v-for="m in merchandise"
              :key="m.id"
              :merch="m"
              :size="merchSize(m.id)"
              :quantity="merchQty(m.id)"
              @increment="incrementMerch"
              @decrement="decrementMerch"
              @select-size="selectMerchSize"
            />
          </template>
        </div>
      </div>

      <aside class="w-[380px] shrink-0">
        <OrderSummaryPanel :ticket-types="ticketTypes" :addons="addons" />
      </aside>
    </div>
  </div>
</template>
