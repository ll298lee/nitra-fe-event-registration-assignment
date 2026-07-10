<script setup>
// Terminal success screen (IMPLEMENTATION_PLAN.md D15/D40, frame 1075:903). Presentational: the
// shell owns the submission lifecycle and passes the confirmation number plus the state it echoes
// (name/email/ticket/event) as props, and the "Back to Home" reset is emitted back up.
defineProps({
  confirmationNumber: { type: String, required: true },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  ticketName: { type: String, default: '' },
  eventName: { type: String, default: '' },
});
defineEmits(['home']);
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center gap-4 py-15">
    <div
      class="flex size-20 items-center justify-center rounded-full bg-success-emphasis-rest text-inverse"
    >
      <svg
        class="size-20"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M22 40L34.8571 54L58 26"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <h1 class="text-h2 text-success">{{ $t('success.title') }}</h1>

    <p class="text-lg font-regular text-neutral">
      {{ $t('success.confirmation', { number: confirmationNumber }) }}
    </p>

    <div class="flex flex-col text-center text-sm font-regular text-neutral-muted">
      <p>{{ $t('success.thanks', { name, ticket: ticketName, event: eventName }) }}</p>
      <p>{{ $t('success.email', { email }) }}</p>
    </div>

    <button
      type="button"
      class="flex h-10 min-w-[72px] cursor-pointer items-center justify-center rounded-[10px] border-0 bg-accent-emphasis-rest px-4 text-subtitle2 text-inverse transition-colors hover:bg-accent-emphasis-hover active:bg-accent-emphasis-active"
      @click="$emit('home')"
    >
      {{ $t('success.backToHome') }}
    </button>
  </div>
</template>
