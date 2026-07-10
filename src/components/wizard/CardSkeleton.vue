<script setup>
defineProps({
  lines: { type: Number, default: 2 },
});
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-md border border-solid border-neutral-muted p-4"
    aria-hidden="true"
  >
    <div class="flex items-center justify-between gap-4">
      <q-skeleton type="text" width="45%" />
      <q-skeleton type="text" width="15%" />
    </div>
    <q-skeleton v-for="n in lines" :key="n" type="text" :width="n === lines ? '55%' : '90%'" />
  </div>
</template>
