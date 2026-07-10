<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { fetchEvent } from '../../data/facade.js';
import { useRegistration } from '../../composables/useRegistration.js';
import TicketCard from './TicketCard.vue';
import FormField from './FormField.vue';

// Step 1 — Attendee Info. Ticket type + attendee form. Validation is deferred to the
// Step 4 submit (README §Step 1, AC-1.5), so nothing validates on this step.

const { attendee, ticketId } = useRegistration();

const ticketTypes = ref([]);
const loadingEvent = ref(true);
const groupRef = ref(null);

onMounted(async () => {
  try {
    const event = await fetchEvent();
    ticketTypes.value = event.ticketTypes;
  } finally {
    loadingEvent.value = false;
  }
});

function selectTicket(id) {
  ticketId.value = id;
}

// Roving tabindex: the active radio (selected, or the first when none is) is the group's
// single tab stop.
function tabindexFor(id) {
  const active = ticketId.value ?? ticketTypes.value[0]?.id;
  return id === active ? 0 : -1;
}

// Arrow/Home/End move selection and focus, per the WAI-ARIA radiogroup pattern.
function onKeydown(e) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
  if (!keys.includes(e.key)) return;
  const radios = Array.from(groupRef.value?.querySelectorAll('[role="radio"]') ?? []);
  if (!radios.length) return;
  e.preventDefault();
  const n = radios.length;
  const focused = radios.indexOf(document.activeElement);
  const from =
    focused === -1 ? ticketTypes.value.findIndex((t) => t.id === ticketId.value) : focused;
  const base = from === -1 ? 0 : from;
  let next;
  if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = n - 1;
  else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (base + 1) % n;
  else next = (base - 1 + n) % n;
  ticketId.value = ticketTypes.value[next].id;
  nextTick(() => radios[next].focus());
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <section class="flex flex-col gap-4">
      <h2 class="text-subtitle1 text-neutral">Select Ticket Type</h2>

      <div v-if="loadingEvent" class="flex justify-center py-10">
        <q-spinner size="32px" class="text-brand-emphasis" />
      </div>

      <div
        v-else
        ref="groupRef"
        role="radiogroup"
        aria-label="Ticket type"
        class="grid grid-cols-3 gap-4"
        @keydown="onKeydown"
      >
        <TicketCard
          v-for="t in ticketTypes"
          :key="t.id"
          :ticket="t"
          :selected="ticketId === t.id"
          :tabindex="tabindexFor(t.id)"
          @select="selectTicket"
        />
      </div>
    </section>

    <section class="flex flex-col gap-8">
      <h2 class="text-h3 text-neutral">Attendee Information</h2>

      <div class="flex flex-col gap-5">
        <div class="flex gap-6">
          <FormField
            v-model="attendee.fullName"
            class="flex-1"
            label="Full Name"
            placeholder="Enter your full name"
            autocomplete="name"
          />
          <FormField
            v-model="attendee.email"
            class="flex-1"
            label="Email"
            type="email"
            placeholder="Enter your email address"
            autocomplete="email"
          />
        </div>

        <div class="flex gap-6">
          <FormField
            v-model="attendee.phone"
            class="flex-1"
            label="Phone"
            type="tel"
            placeholder="Enter your phone number"
            autocomplete="tel"
          />
          <FormField
            v-model="attendee.company"
            class="flex-1"
            label="Company"
            placeholder="Enter your company name"
            autocomplete="organization"
          />
        </div>

        <FormField
          v-model="attendee.jobTitle"
          label="Job Title"
          placeholder="Enter your job title"
          autocomplete="organization-title"
        />

        <FormField
          v-model="attendee.shippingAddress"
          label="Shipping Address"
          :optional="true"
          placeholder="Enter your shipping address"
          autocomplete="street-address"
        />
      </div>
    </section>
  </div>
</template>
