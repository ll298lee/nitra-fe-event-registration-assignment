<script setup>
import { computed } from 'vue';

const props = defineProps({
  track: { type: String, required: true },
});

// Track → semantic palette. No dedicated track token exists, so each track reuses an
// existing palette (IMPLEMENTATION_PLAN.md §4). `frontend` and `devops` deliberately share
// the accent palette — the Figma frame draws them identically (D23).
const NEUTRAL = 'bg-neutral-subtle-rest text-neutral-muted';
const ACCENT = 'bg-accent-muted-rest text-accent-emphasis';
const TRACK_CLASSES = {
  main: NEUTRAL,
  frontend: ACCENT,
  backend: 'bg-info-muted-rest text-info-emphasis',
  devops: ACCENT,
};

// Unknown tracks fall back to the neutral palette (not aliased onto `main`).
const badgeClass = computed(() => TRACK_CLASSES[props.track] ?? NEUTRAL);
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-[5px] py-[3px] text-[11px] font-medium uppercase leading-[14px]"
    :class="badgeClass"
  >
    {{ track }}
  </span>
</template>
