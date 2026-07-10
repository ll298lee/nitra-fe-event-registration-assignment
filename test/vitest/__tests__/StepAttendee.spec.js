import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import StepAttendee from 'src/components/wizard/StepAttendee.vue';
import { provideRegistration } from 'src/composables/useRegistration.js';
import { provideValidation } from 'src/composables/useValidation.js';

installQuasarPlugin();

// StepAttendee fetches the event (ticket types) from the async facade on mount.
// Resolve it synchronously with the real event mock so the assertions run against the
// true ticket data (prices, VIP perks) rather than a hand-rolled fixture.
vi.mock('src/data/facade.js', async () => {
  const { event } = await import('src/mocks/event.js');
  return { fetchEvent: () => Promise.resolve(event) };
});

// StepAttendee injects the wizard store (provide/inject); wrap it in a root that
// provides one. The injection Symbol is intentionally not exported, so we go through
// provideRegistration() in a harness setup rather than global.provide.
let store;
let validation;
const Harness = defineComponent({
  setup() {
    store = provideRegistration();
    // Step-1 field validation needs no session/add-on sources.
    validation = provideValidation(store, {});
    return () => h(StepAttendee);
  },
});

async function mountStep() {
  const wrapper = mount(Harness);
  await flushPromises(); // resolve fetchEvent + render the ticket cards
  return wrapper;
}

const cards = (wrapper) => wrapper.findAll('[role="radio"]');
const cardByName = (wrapper, name) => cards(wrapper).find((c) => c.text().includes(name));

describe('StepAttendee (Step 1 — Attendee Info)', () => {
  // AC-1.1 — the five required fields + an optional Shipping Address are shown.
  it('renders the attendee fields plus an optional shipping address', async () => {
    const wrapper = await mountStep();

    expect(wrapper.findAll('input')).toHaveLength(6);

    const labels = wrapper.findAll('label').map((l) => l.text());
    ['Full Name', 'Email', 'Phone', 'Company', 'Job Title'].forEach((f) => {
      expect(labels).toContain(f);
    });
    // Shipping Address is present and marked optional (not required).
    expect(labels.some((l) => /Shipping Address/.test(l) && /\(Optional\)/.test(l))).toBe(true);
  });

  // AC-1.2 — three ticket cards, single-select (choosing one deselects the rest).
  it('makes ticket selection single-select', async () => {
    const wrapper = await mountStep();
    expect(cards(wrapper)).toHaveLength(3);

    await cards(wrapper)[0].trigger('click');
    let checked = cards(wrapper).filter((c) => c.attributes('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(cards(wrapper)[0].attributes('aria-checked')).toBe('true');

    await cards(wrapper)[1].trigger('click');
    checked = cards(wrapper).filter((c) => c.attributes('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(cards(wrapper)[1].attributes('aria-checked')).toBe('true');
    expect(cards(wrapper)[0].attributes('aria-checked')).toBe('false');
  });

  // AC-1.2 (a11y) — the radio group is a single tab stop (roving tabindex) and arrow keys
  // move selection per the WAI-ARIA radiogroup pattern.
  it('supports roving tabindex + arrow-key selection', async () => {
    const wrapper = await mountStep();
    const group = wrapper.find('[role="radiogroup"]');

    // Nothing selected yet → the first card is the group's only tab stop.
    expect(cards(wrapper)[0].attributes('tabindex')).toBe('0');
    expect(cards(wrapper)[1].attributes('tabindex')).toBe('-1');

    await group.trigger('keydown', { key: 'ArrowRight' });
    expect(cards(wrapper)[1].attributes('aria-checked')).toBe('true');
    expect(cards(wrapper)[1].attributes('tabindex')).toBe('0');
    expect(cards(wrapper)[0].attributes('tabindex')).toBe('-1');

    await group.trigger('keydown', { key: 'ArrowLeft' });
    expect(cards(wrapper)[0].attributes('aria-checked')).toBe('true');

    // Wraps: ArrowLeft from the first selects the last.
    await group.trigger('keydown', { key: 'ArrowLeft' });
    expect(cards(wrapper)[2].attributes('aria-checked')).toBe('true');
  });

  // AC-1.3 — VIP lists the "10% off workshops" perk; General and Student do not.
  it('shows the "10% off workshops" perk on VIP only', async () => {
    const wrapper = await mountStep();

    expect(cardByName(wrapper, 'VIP').text()).toContain('10% off workshops');
    expect(cardByName(wrapper, 'General').text()).not.toContain('10% off workshops');
    expect(cardByName(wrapper, 'Student').text()).not.toContain('10% off workshops');
  });

  // AC-1.4 (render side) — ticket prices show as whole dollars per the frame / README
  // §Step 1 table ($299 / $599 / $99), not the $X,XXX.XX running-total form.
  it('renders ticket prices as whole dollars', async () => {
    const wrapper = await mountStep();

    expect(cardByName(wrapper, 'General').text()).toContain('$299');
    expect(cardByName(wrapper, 'VIP').text()).toContain('$599');
    expect(cardByName(wrapper, 'Student').text()).toContain('$99');
  });

  // AC-1.5 — no inline validation on Step 1 (all validation deferred to Step 4).
  it('shows no inline validation errors before submit', async () => {
    const wrapper = await mountStep();

    expect(wrapper.find('[aria-invalid="true"]').exists()).toBe(false);
    expect(wrapper.find('.text-danger').exists()).toBe(false);
  });
});

describe('StepAttendee (Step 1 — submit-time validation, D36)', () => {
  const shippingLabel = (wrapper) =>
    wrapper.findAll('label').find((l) => l.text().includes('Shipping Address'));

  // AC-V-5 — a failed submit reveals the field errors that were deferred (punish late).
  it('reveals field + ticket errors after a failed submit', async () => {
    const wrapper = await mountStep();
    expect(wrapper.find('.text-danger').exists()).toBe(false);

    expect(validation.attemptSubmit()).toBe(false);
    await nextTick();

    expect(wrapper.find('[aria-invalid="true"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Full Name is required');
    expect(wrapper.text()).toContain('Please select a ticket type');
  });

  // AC-V-5 — a fixed field clears its error live, without another submit (reward early).
  it('clears a field error live once it is fixed', async () => {
    const wrapper = await mountStep();
    validation.attemptSubmit();
    await nextTick();
    expect(wrapper.text()).toContain('Full Name is required');

    store.attendee.fullName = 'Ada Lovelace';
    await nextTick();
    expect(wrapper.text()).not.toContain('Full Name is required');
  });

  // AC-1.6/1.7 — Shipping Address drops its "(Optional)" label once merch is selected, and
  // reverts when merch is removed (non-sticky).
  it('toggles the shipping "(Optional)" label with merch selection', async () => {
    const wrapper = await mountStep();
    expect(shippingLabel(wrapper).text()).toContain('(Optional)');

    store.merchSelections.merch1 = { size: 'M', quantity: 1 };
    await nextTick();
    // Required now: "(Optional)" drops and the "*" appears (D39).
    expect(shippingLabel(wrapper).text()).not.toContain('(Optional)');
    expect(shippingLabel(wrapper).text()).toContain('Shipping Address *');

    delete store.merchSelections.merch1;
    await nextTick();
    expect(shippingLabel(wrapper).text()).toContain('(Optional)');
    expect(shippingLabel(wrapper).text()).not.toContain('Shipping Address *');
  });
});
