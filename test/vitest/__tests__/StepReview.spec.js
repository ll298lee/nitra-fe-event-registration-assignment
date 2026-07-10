import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import StepReview from 'src/components/wizard/StepReview.vue';
import { provideRegistration } from 'src/composables/useRegistration.js';
import { provideValidation } from 'src/composables/useValidation.js';
import { normalizeSessions, normalizeAddons } from 'src/data/normalize.js';
import { sessions as rawSessions } from 'src/mocks/sessions.js';
import { addons as rawAddons } from 'src/mocks/addons.js';

installQuasarPlugin();

const sessionsData = normalizeSessions(rawSessions);
const addonsData = normalizeAddons(rawAddons);

// Resolve the async facade synchronously with the real, normalized mocks so the review renders
// against true ticket/session/add-on data (names, prices, times).
vi.mock('src/data/facade.js', async () => {
  const { normalizeSessions, normalizeAddons } = await import('src/data/normalize.js');
  const { sessions } = await import('src/mocks/sessions.js');
  const { addons } = await import('src/mocks/addons.js');
  const { event } = await import('src/mocks/event.js');
  return {
    fetchEvent: () => Promise.resolve(event),
    fetchSessions: () => Promise.resolve(normalizeSessions(sessions)),
    fetchAddons: () => Promise.resolve(normalizeAddons(addons)),
  };
});

let store;
let validation;
const Harness = defineComponent({
  setup() {
    store = provideRegistration();
    validation = provideValidation(store, { sessions: sessionsData, addons: addonsData });
    return () => h(StepReview);
  },
});

async function mountStep() {
  const wrapper = mount(Harness);
  await flushPromises();
  return wrapper;
}

// Seed a representative registration, then let the computed summary rows recompute.
async function seedFullCart() {
  Object.assign(store.attendee, {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Inc.',
    jobTitle: 'Senior Developer',
  });
  store.ticketId.value = 'vip';
  store.selectedSessionIds.value = ['s1', 's4'];
  store.selectedWorkshopIds.value = ['ws1'];
  await nextTick();
}

const editBtn = (w, title) => w.get(`[aria-label="Edit ${title}"]`);

describe('StepReview (Step 4 — Review & Submit: summary + itemized pricing, D35)', () => {
  // AC-4.1 — a readable grouped summary of every step's selections.
  it('renders the page title and the four grouped sections', async () => {
    const w = await mountStep();
    await seedFullCart();

    expect(w.text()).toContain('Review Your Registration');
    expect(w.text()).toContain('Attendee Information');
    expect(w.text()).toContain('Selected Sessions');
    expect(w.text()).toContain('Add-ons');
    expect(w.text()).toContain('Pricing Summary');
  });

  // AC-4.1 — attendee fields + the ticket type (name + whole-dollar price).
  it('shows the attendee details and ticket type', async () => {
    const w = await mountStep();
    await seedFullCart();

    expect(w.text()).toContain('John Doe');
    expect(w.text()).toContain('john@example.com');
    expect(w.text()).toContain('+1 (555) 123-4567');
    expect(w.text()).toContain('Acme Inc.');
    expect(w.text()).toContain('Senior Developer');
    expect(w.text()).toContain('VIP ($599)');
    // Shipping Address is omitted while empty (D35g) — seedFullCart never sets it.
    expect(w.text()).not.toContain('Shipping Address');
  });

  // AC-4.1 / D35g — Shipping Address appears as a conditional row once the attendee provides one.
  it('shows the Shipping Address row only when provided', async () => {
    const w = await mountStep();
    store.attendee.shippingAddress = '742 Evergreen Terrace';
    await nextTick();

    const attendee = w.findAll('section')[0];
    expect(attendee.text()).toContain('Shipping Address');
    expect(attendee.text()).toContain('742 Evergreen Terrace');
  });

  // AC-4.1 — sessions render by wall-clock start time + title (D4/D35).
  it('lists each selected session by start time and title', async () => {
    const w = await mountStep();
    await seedFullCart();

    expect(w.text()).toContain('Nov 15, 9:00 AM');
    expect(w.text()).toContain('Opening Keynote: The Future of the Web Platform');
    expect(w.text()).toContain('Nov 15, 1:00 PM');
    expect(w.text()).toContain('Modern CSS: Beyond Tailwind');
  });

  // AC-4.1 — add-ons render by category + name + whole-dollar price.
  it('lists selected add-ons with their category and price', async () => {
    const w = await mountStep();
    await seedFullCart();

    expect(w.text()).toContain('Workshop');
    expect(w.text()).toContain('Hands-on Vue.js Testing ($149)');
  });

  // AC-4.1 / D35e — a merch add-on surfaces its size and quantity in the summary.
  it('shows merch size and quantity in the add-ons summary', async () => {
    const w = await mountStep();
    store.merchSelections.merch1 = { size: 'M', quantity: 2 };
    await nextTick();

    expect(w.text()).toContain('Merchandise');
    expect(w.text()).toContain('Conference T-Shirt, M × 2 ($35)');
  });

  // AC-4.1 / D35e — the two summary conditionals are independent: the size clause is omitted
  // for a sizeless item, and "× 1" is never shown at quantity 1.
  it('omits the size clause for sizeless merch and never shows "× 1"', async () => {
    const w = await mountStep();
    store.merchSelections.merch2 = { size: null, quantity: 1 }; // Developer Sticker Pack — no sizes
    store.merchSelections.merch1 = { size: 'L', quantity: 1 }; // Conference T-Shirt — sized
    await nextTick();

    const addons = w.findAll('section')[2]; // Attendee, Sessions, Add-ons, Pricing
    expect(addons.text()).toContain('Developer Sticker Pack ($12)');
    expect(addons.text()).not.toContain('Developer Sticker Pack,'); // no stray size clause
    expect(addons.text()).toContain('Conference T-Shirt, L ($35)');
    expect(addons.text()).not.toContain('× 1');
  });

  // AC-4.2 / AC-P-2 — itemized pricing: lines with cents, VIP discount line, Grand Total.
  it('renders the itemized pricing with the VIP discount and grand total', async () => {
    const w = await mountStep();
    await seedFullCart();

    const pricing = w.get('[aria-label="Pricing summary"]');
    expect(pricing.text()).toContain('VIP Ticket');
    expect(pricing.text()).toContain('$599');
    expect(pricing.text()).toContain('Hands-on Vue.js Testing'); // qty 1 → bare name, no suffix
    expect(pricing.text()).toContain('$149');
    expect(pricing.text()).toContain('Workshop discount (VIP 10%)');
    expect(pricing.text()).toContain('-$14.90');
    expect(pricing.text()).toContain('Grand Total');
    expect(pricing.text()).toContain('$733.10');
  });

  // AC-4.2 / D35b — the frame has no aggregate "Subtotal" row.
  it('shows no aggregate subtotal row', async () => {
    const w = await mountStep();
    await seedFullCart();
    expect(w.text()).not.toContain('Subtotal');
  });

  // AC-P-5 — a non-VIP cart with the same workshop shows no discount line.
  it('omits the discount line for a non-VIP ticket', async () => {
    const w = await mountStep();
    store.ticketId.value = 'general';
    store.selectedWorkshopIds.value = ['ws1'];
    await nextTick();

    const pricing = w.get('[aria-label="Pricing summary"]');
    expect(pricing.text()).not.toContain('Workshop discount');
    expect(pricing.text()).toContain('$448'); // 299 + 149
  });

  // AC-4.2 / D35f — a merch line with quantity > 1 shows "× n".
  it('shows "× n" for a merch line with quantity greater than one', async () => {
    const w = await mountStep();
    store.ticketId.value = 'general';
    store.merchSelections.merch1 = { size: 'M', quantity: 2 };
    await nextTick();

    const pricing = w.get('[aria-label="Pricing summary"]');
    expect(pricing.text()).toContain('Conference T-Shirt × 2');
    expect(pricing.text()).toContain('$70'); // 35 × 2
  });

  // AC-4.3 — each Edit control jumps to its step and preserves all state.
  it('navigates to the matching step on Edit, preserving state', async () => {
    const w = await mountStep();
    await seedFullCart();

    await editBtn(w, 'Attendee Information').trigger('click');
    expect(store.currentStep.value).toBe(0);

    await editBtn(w, 'Selected Sessions').trigger('click');
    expect(store.currentStep.value).toBe(1);

    await editBtn(w, 'Add-ons').trigger('click');
    expect(store.currentStep.value).toBe(2);

    // State survives the navigation (single shared store, no reset).
    expect(store.ticketId.value).toBe('vip');
    expect(store.selectedSessionIds.value).toEqual(['s1', 's4']);
    expect(store.selectedWorkshopIds.value).toEqual(['ws1']);
  });

  // AC-4.1 (robustness) — empty selections render friendly empty states + em-dash ticket.
  it('renders empty states when nothing is selected', async () => {
    const w = await mountStep();

    expect(w.text()).toContain('No sessions selected.');
    expect(w.text()).toContain('No add-ons selected.');
    expect(w.get('[aria-label="Pricing summary"]').text()).toContain('Nothing selected yet.');

    // The Ticket Type row specifically falls back to the em-dash placeholder.
    const attendee = w.findAll('section')[0];
    const ticketRow = attendee
      .findAll('.justify-between')
      .find((r) => r.element.children.length === 2 && r.text().includes('Ticket Type'));
    expect(ticketRow.text()).toContain('—');
  });
});

describe('StepReview (Step 4 — submit-time error display, D36)', () => {
  const sectionByTitle = (w, title) =>
    w.findAll('section').find((s) => s.find('h3').exists() && s.find('h3').text() === title);

  // AC-V-5 — nothing is flagged before a submit is attempted.
  it('shows no error markers before submit', async () => {
    const w = await mountStep();
    expect(w.text()).not.toContain('(required)');
  });

  // AC-4.4/4.5 — a failed submit turns the Attendee card red and marks each missing field.
  it('flags missing attendee fields after a failed submit', async () => {
    const w = await mountStep();
    expect(validation.attemptSubmit()).toBe(false);
    await nextTick();

    const attendee = sectionByTitle(w, 'Attendee Information');
    expect(attendee.find('h3').classes()).toContain('text-danger');
    expect(attendee.text()).toContain('— (required)'); // missing fields + Ticket Type
  });

  // D37 / AC-4.5 — the error-summary banner appears after a failed submit and lists each error.
  it('renders the error-summary banner after a failed submit', async () => {
    const w = await mountStep();
    expect(w.find('[role="alert"]').exists()).toBe(false); // none before submit

    validation.attemptSubmit();
    await nextTick();

    const banner = w.find('[role="alert"]');
    expect(banner.exists()).toBe(true);
    expect(banner.text()).toContain('Please fix the following errors before submitting');
    expect(banner.text()).toContain('Step 1: Full Name is required');
    expect(banner.text()).toContain('Step 1: Please select a ticket type');
  });

  // AC-4.9 — a session↔session conflict is surfaced on the Sessions card.
  it('surfaces a session conflict on the Sessions card', async () => {
    const w = await mountStep();
    store.selectedSessionIds.value = ['s4', 's5']; // 13:00–14:30 vs 13:30–15:00 overlap
    validation.attemptSubmit();
    await nextTick();

    const sessionsSection = sectionByTitle(w, 'Selected Sessions');
    expect(sessionsSection.find('h3').classes()).toContain('text-danger');
    expect(sessionsSection.text()).toContain('overlaps with');
  });

  // AC-4.6 / D10 — a stale workshop↔session conflict is surfaced on the Add-ons card, kept.
  it('surfaces a stale workshop conflict on the Add-ons card without removing it', async () => {
    const w = await mountStep();
    store.selectedWorkshopIds.value = ['ws1'];
    store.selectedSessionIds.value = ['s11']; // Accessibility Deep Dive overlaps ws1
    validation.attemptSubmit();
    await nextTick();

    const addonsSection = sectionByTitle(w, 'Add-ons');
    expect(addonsSection.find('h3').classes()).toContain('text-danger');
    expect(addonsSection.text()).toContain('Accessibility Deep Dive');
    expect(store.selectedWorkshopIds.value).toEqual(['ws1']); // not auto-removed (D10)
  });

  // AC-1.6 — shipping shows a merch-specific required marker when merch is selected.
  it('shows the merch-specific shipping requirement after submit', async () => {
    const w = await mountStep();
    store.merchSelections.merch1 = { size: 'M', quantity: 1 };
    validation.attemptSubmit();
    await nextTick();

    const attendee = sectionByTitle(w, 'Attendee Information');
    expect(attendee.text()).toContain('— (required for merchandise)');
  });

  // D36c — a present-but-invalid field shows its entered value in place (flagged), not a
  // "— (required)" marker, distinguishing that branch of attendeeRowError.
  it('shows a present-but-invalid attendee value in place, flagged', async () => {
    const w = await mountStep();
    store.attendee.email = 'not-an-email';
    validation.attemptSubmit();
    await nextTick();

    const attendee = sectionByTitle(w, 'Attendee Information');
    const emailRow = attendee
      .findAll('.justify-between')
      .find((r) => r.element.children.length === 2 && r.text().includes('Email'));
    expect(emailRow.text()).toContain('not-an-email'); // entered value, not "— (required)"
    expect(emailRow.findAll('span')[1].classes()).toContain('text-danger');
  });

  // AC-V-5 / D7 — the "reward early" half at the review surface: a section's error state reverts
  // live once its fields are fixed, with no second submit.
  it('reverts a section error state live once its fields are fixed', async () => {
    const w = await mountStep();
    validation.attemptSubmit();
    await nextTick();
    expect(sectionByTitle(w, 'Attendee Information').find('h3').classes()).toContain('text-danger');
    expect(sectionByTitle(w, 'Attendee Information').text()).toContain('— (required)');

    Object.assign(store.attendee, {
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '4155550100',
      company: 'Analytical Engines',
      jobTitle: 'Mathematician',
    });
    store.ticketId.value = 'vip';
    await nextTick();

    const attendee = sectionByTitle(w, 'Attendee Information');
    expect(attendee.find('h3').classes()).not.toContain('text-danger');
    expect(attendee.text()).not.toContain('(required)');
  });

  // AC-4.4 — a valid submit at the component layer leaves every section clean.
  it('keeps every section clean after a valid submit', async () => {
    const w = await mountStep();
    await seedFullCart(); // vip + s1/s4 + ws1 — no conflicts, valid attendee
    expect(validation.attemptSubmit()).toBe(true);
    await nextTick();

    w.findAll('section').forEach((s) => {
      expect(s.find('h3').classes()).not.toContain('text-danger');
    });
    expect(w.text()).not.toContain('(required)');
  });
});
