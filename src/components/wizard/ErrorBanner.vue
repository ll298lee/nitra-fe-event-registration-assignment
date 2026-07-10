<script setup>
// Step-4 submit-error summary (D37). Lists each validation error as a "Step N: {message}"
// bullet; the host shows it only after a failed submit. role="alert" so assistive tech
// announces the errors when they appear.
defineProps({
  items: { type: Array, default: () => [] },
});
</script>

<template>
  <div
    class="flex flex-col gap-2 rounded-md border border-solid border-danger-muted bg-danger-muted-rest p-4 focus:outline-none"
    role="alert"
    tabindex="-1"
  >
    <p class="text-sm font-medium text-danger">{{ $t('step4.errorBannerTitle') }}</p>
    <ul class="flex flex-col gap-2">
      <li v-for="(item, i) in items" :key="i" class="text-sm font-regular text-danger">
        • {{ item }}
      </li>
    </ul>
  </div>
</template>
