<script setup>
defineProps({
  /** @type {{ id: string, name: string, price: number, description: string, perks: string[] }} */
  ticket: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  // Roving tabindex for the radio pattern: 0 for the active radio, -1 for the rest, so the
  // group is a single tab stop and arrow keys (handled by the parent) move selection.
  tabindex: { type: Number, default: 0 },
});

defineEmits(['select']);
</script>

<template>
  <!-- The selection ring is an inset box-shadow, not a border, so the selected state's
       extra thickness never changes the card's box size or the grid row height. -->
  <button
    type="button"
    role="radio"
    :aria-checked="selected"
    :tabindex="tabindex"
    class="flex w-full flex-col gap-3 rounded-md border-0 p-5 text-left transition-colors"
    :class="
      selected
        ? 'bg-brand-subtle-rest shadow-[inset_0_0_0_2px_var(--border-brand-emphasis),0px_4px_16px_0px_rgba(0,0,0,0.08),0px_1px_3px_0px_rgba(0,0,0,0.04)]'
        : 'bg-surface-l1 shadow-[inset_0_0_0_1px_var(--border-neutral-muted),0px_4px_16px_0px_rgba(0,0,0,0.08),0px_1px_3px_0px_rgba(0,0,0,0.04)] hover:bg-surface-l2'
    "
    @click="$emit('select', ticket.id)"
  >
    <div class="flex items-center justify-between">
      <span class="text-subtitle1 text-neutral">{{ ticket.name }}</span>
      <span class="text-subtitle1 text-neutral">${{ ticket.price }}</span>
    </div>

    <p class="text-sm font-regular text-neutral-muted">{{ ticket.description }}</p>

    <ul class="flex flex-col gap-3">
      <li v-for="perk in ticket.perks" :key="perk" class="flex items-center gap-2">
        <svg
          viewBox="0 0 16 16"
          class="h-3.5 w-3.5 shrink-0 text-neutral"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16ZM11.6875 4.55312C11.3531 4.30937 10.8844 4.38438 10.6406 4.71875L6.90938 9.85L5.28125 8.22188C4.9875 7.92813 4.5125 7.92813 4.22188 8.22188C3.93125 8.51563 3.92813 8.99062 4.22188 9.28125L6.47188 11.5312C6.62813 11.6875 6.84062 11.7656 7.05937 11.75C7.27812 11.7344 7.47812 11.6219 7.60625 11.4438L11.8531 5.6C12.0969 5.26562 12.0219 4.79687 11.6875 4.55312Z"
          />
        </svg>
        <span class="text-sm font-regular text-neutral-muted">{{ perk }}</span>
      </li>
    </ul>

    <!-- Always rendered but toggled with `invisible` (not v-if) so selecting a ticket
         never changes the card/row height — reserving its space keeps the layout stable. -->
    <span
      class="inline-flex w-fit items-center rounded-full bg-success-bold-rest px-[9px] py-[3px] text-[11px] font-medium leading-[14px] text-inverse"
      :class="{ invisible: !selected }"
    >
      ✓ Selected
    </span>
  </button>
</template>
