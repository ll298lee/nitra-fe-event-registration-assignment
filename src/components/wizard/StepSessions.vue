<script setup>
import { ref, computed, onMounted, nextTick, useId } from 'vue';
import { fetchSessions } from '../../data/facade.js';
import { useRegistration } from '../../composables/useRegistration.js';
import { dayGroupKey, formatDayLabel } from '../../utils/datetime.js';
import SessionCard from './SessionCard.vue';
import CardSkeleton from './CardSkeleton.vue';

// Step 2 — Session Selection. Sessions are organized by day into a segmented day switcher
// (D23); free multi-select with conflict validation deferred to Step 4 (README §Step 2, D24).

const { selectedSessionIds } = useRegistration();

const uid = useId();
const sessions = ref([]);
const loading = ref(true);
const tablistRef = ref(null);

onMounted(async () => {
  try {
    sessions.value = await fetchSessions();
  } finally {
    loading.value = false;
  }
});

const days = computed(() => {
  const groups = new Map();
  for (const s of sessions.value) {
    const key = dayGroupKey(s.start);
    if (!groups.has(key)) {
      groups.set(key, { key, label: formatDayLabel(s.start), sessions: [] });
    }
    groups.get(key).sessions.push(s);
  }
  return [...groups.values()];
});

const activeDayIndex = ref(0);
const activeDay = computed(() => days.value[activeDayIndex.value] ?? null);

const selectedCount = computed(() => selectedSessionIds.value.length);

function isSelected(id) {
  return selectedSessionIds.value.includes(id);
}
function toggle(id) {
  selectedSessionIds.value = isSelected(id)
    ? selectedSessionIds.value.filter((x) => x !== id)
    : [...selectedSessionIds.value, id];
}

// Roving tabindex + arrow-key navigation, per the WAI-ARIA tabs pattern.
function onTabKeydown(e) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
  if (!keys.includes(e.key)) return;
  const n = days.value.length;
  if (!n) return;
  e.preventDefault();
  let i = activeDayIndex.value;
  if (e.key === 'Home') i = 0;
  else if (e.key === 'End') i = n - 1;
  else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (i + 1) % n;
  else i = (i - 1 + n) % n;
  activeDayIndex.value = i;
  nextTick(() => tablistRef.value?.querySelectorAll('[role="tab"]')[i]?.focus());
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <h2 class="text-h3 text-neutral">{{ $t('step2.heading') }}</h2>

    <div v-if="loading" class="flex flex-col gap-6" aria-hidden="true">
      <q-skeleton width="176px" height="40px" class="rounded-[10px]" />
      <q-skeleton type="text" width="140px" />
      <div class="grid grid-cols-1 gap-4 tablet:grid-cols-2">
        <CardSkeleton v-for="n in 4" :key="n" :lines="2" />
      </div>
    </div>

    <template v-else>
      <div
        ref="tablistRef"
        role="tablist"
        :aria-label="$t('step2.dayAria')"
        class="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-[10px] bg-surface-l2 p-1 tablet:flex-nowrap"
        @keydown="onTabKeydown"
      >
        <button
          v-for="(day, i) in days"
          :id="`${uid}-tab-${i}`"
          :key="day.key"
          type="button"
          role="tab"
          :aria-selected="activeDayIndex === i"
          :aria-controls="`${uid}-panel`"
          :tabindex="activeDayIndex === i ? 0 : -1"
          class="h-8 shrink-0 cursor-pointer whitespace-nowrap rounded-lg border-0 px-4 py-2 text-[13px] leading-[normal] transition-colors tablet:px-5"
          :class="
            activeDayIndex === i
              ? 'bg-brand-emphasis-rest font-semibold text-inverse'
              : 'bg-transparent font-medium text-neutral-muted hover:text-neutral'
          "
          @click="activeDayIndex = i"
        >
          {{ day.label }}
        </button>
      </div>

      <p class="text-sm font-medium text-neutral-muted">
        {{ $t('step2.counter', { count: selectedCount }, selectedCount) }}
      </p>

      <div
        v-if="activeDay"
        :id="`${uid}-panel`"
        role="tabpanel"
        :aria-labelledby="`${uid}-tab-${activeDayIndex}`"
        class="grid grid-cols-1 gap-4 tablet:grid-cols-2"
      >
        <SessionCard
          v-for="s in activeDay.sessions"
          :key="s.id"
          :session="s"
          :selected="isSelected(s.id)"
          @toggle="toggle"
        />
      </div>
    </template>
  </div>
</template>
