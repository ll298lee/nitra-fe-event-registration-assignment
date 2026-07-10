import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import StepAddons from 'src/components/wizard/StepAddons.vue';
import { provideRegistration } from 'src/composables/useRegistration.js';

installQuasarPlugin();

// Resolve the async facade synchronously with the real, normalized mocks so assertions run
// against the true add-on/session data (prices, capacities, times, conflicts).
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
const Harness = defineComponent({
  setup() {
    store = provideRegistration();
    return () => h(StepAddons);
  },
});

async function mountStep() {
  const wrapper = mount(Harness);
  await flushPromises();
  return wrapper;
}

const workshopCards = (w) => w.findAll('[role="checkbox"]');
const cardByName = (w, name) => workshopCards(w).find((c) => c.text().includes(name));
const tabs = (w) => w.findAll('[role="tab"]');
const merchCards = (w) => w.findAll('[role="group"]');
const merchByName = (w, name) => merchCards(w).find((c) => c.text().includes(name));
const normalizeWs = (s) => s.replace(/\s+/g, ' ').trim();

describe('StepAddons (Step 3 — Add-ons: scaffold + Workshops + Order Summary)', () => {
  // AC-3.1 — three category tabs, in order Workshops / Meal Packages / Merchandise.
  it('renders the three category tabs in order', async () => {
    const w = await mountStep();
    expect(tabs(w).map((t) => t.text())).toEqual(['Workshops', 'Meal Packages', 'Merchandise']);
    // Workshops active by default → both workshop cards shown.
    expect(workshopCards(w)).toHaveLength(2);
    expect(cardByName(w, 'Hands-on Vue.js Testing')).toBeTruthy();
  });

  // AC-3.5 — ws1 is selectable and shows price, date+time, and remaining spots.
  it('renders ws1 with price, date-time, and 8 spots remaining', async () => {
    const w = await mountStep();
    const ws1 = cardByName(w, 'Hands-on Vue.js Testing'); // 22/30 → 8 left, $149

    expect(ws1.text()).toContain('$149');
    expect(ws1.text()).toContain('Nov 16, 2:00 PM – 5:00 PM');
    expect(ws1.text()).toContain('8 spots remaining');
    expect(ws1.attributes('disabled')).toBeUndefined();
  });

  // AC-3.2 — ws2 (25/25) is full: "Sold Out" and not selectable.
  it('shows ws2 as Sold Out and blocks selecting it', async () => {
    const w = await mountStep();
    const ws2 = cardByName(w, 'Docker & Kubernetes');

    expect(ws2.text()).toContain('Sold Out');
    expect(ws2.attributes('disabled')).toBeDefined();

    await ws2.trigger('click');
    expect(store.selectedWorkshopIds.value).not.toContain('ws2');
  });

  // AC-3.5 (interaction) — selecting/deselecting ws1 toggles the store + aria-checked.
  it('toggles ws1 selection on and off', async () => {
    const w = await mountStep();
    const ws1 = cardByName(w, 'Hands-on Vue.js Testing');

    await ws1.trigger('click');
    expect(store.selectedWorkshopIds.value).toContain('ws1');
    expect(ws1.attributes('aria-checked')).toBe('true');

    await ws1.trigger('click');
    expect(store.selectedWorkshopIds.value).not.toContain('ws1');
  });

  // AC-3.3 / D9 — a selected session that overlaps ws1 makes ws1 unavailable and names it.
  it('marks ws1 unavailable and names the conflicting session', async () => {
    const w = await mountStep();
    store.selectedSessionIds.value = ['s11']; // Accessibility Deep Dive 14:00–15:30, overlaps ws1
    await nextTick();

    const ws1 = cardByName(w, 'Hands-on Vue.js Testing');
    expect(ws1.text()).toContain('Unavailable — overlaps Accessibility Deep Dive');
    expect(ws1.attributes('disabled')).toBeDefined();

    await ws1.trigger('click');
    expect(store.selectedWorkshopIds.value).not.toContain('ws1');
  });

  // AC-3.4 / D6 — s10 ends exactly as ws1 begins (14:00Z); a touch is not a conflict.
  it('keeps ws1 available when only the back-to-back s10 is selected', async () => {
    const w = await mountStep();
    store.selectedSessionIds.value = ['s10']; // 13:00–14:00, touches ws1 at 14:00
    await nextTick();

    const ws1 = cardByName(w, 'Hands-on Vue.js Testing');
    expect(ws1.text()).not.toContain('Unavailable');
    expect(ws1.attributes('disabled')).toBeUndefined();
    await ws1.trigger('click');
    expect(store.selectedWorkshopIds.value).toContain('ws1');
  });

  // D10 — a workshop selected before a conflicting session is added stays selected
  // (kept, not auto-removed) and surfaces the conflict.
  it('keeps a stale-conflicting workshop selected and warns', async () => {
    const w = await mountStep();
    await cardByName(w, 'Hands-on Vue.js Testing').trigger('click'); // select ws1 first
    expect(store.selectedWorkshopIds.value).toContain('ws1');

    store.selectedSessionIds.value = ['s12']; // Edge Computing 14:30–16:00, overlaps ws1
    await nextTick();

    const ws1 = cardByName(w, 'Hands-on Vue.js Testing');
    expect(store.selectedWorkshopIds.value).toContain('ws1'); // not auto-removed
    expect(ws1.text()).toContain('Overlaps Edge Computing');
    expect(ws1.attributes('disabled')).toBeUndefined(); // still deselectable
  });

  // D10 (full variant) — a workshop that is full but already selected stays deselectable,
  // never locked behind the user (blocked = !selected && (full || conflicting)).
  it('keeps a full-but-selected workshop deselectable', async () => {
    const w = await mountStep();
    store.selectedWorkshopIds.value = ['ws2']; // ws2 is full, but seeded as selected
    await nextTick();

    const ws2 = cardByName(w, 'Docker & Kubernetes');
    expect(ws2.attributes('aria-checked')).toBe('true');
    expect(ws2.attributes('disabled')).toBeUndefined();

    await ws2.trigger('click');
    expect(store.selectedWorkshopIds.value).not.toContain('ws2');
  });

  // A full workshop that also overlaps a selected session shows only "Sold Out" — the
  // capacity block takes precedence over the (redundant) conflict line.
  it('shows only "Sold Out" for a full workshop that also conflicts', async () => {
    const w = await mountStep();
    store.selectedSessionIds.value = ['s6']; // Nov 15 15:30–17:00 overlaps ws2 15:30–18:30
    await nextTick();

    const ws2 = cardByName(w, 'Docker & Kubernetes');
    expect(ws2.text()).toContain('Sold Out');
    expect(ws2.text()).not.toContain('Unavailable');
    expect(ws2.text()).not.toContain('overlaps');
  });

  // AC-3.1 (interaction) — switching tabs swaps the category panel.
  it('switches to the Meal Packages / Merchandise tabs', async () => {
    const w = await mountStep();

    await tabs(w)[1].trigger('click');
    expect(cardByName(w, 'Standard Lunch (Both Days)')).toBeTruthy();
    expect(cardByName(w, 'Hands-on Vue.js Testing')).toBeFalsy(); // workshops gone
    expect(merchCards(w)).toHaveLength(0);

    await tabs(w)[2].trigger('click');
    expect(merchCards(w)).toHaveLength(4);
  });

  // AC-3.1 (a11y) — the tablist is a single tab stop (roving tabindex) + arrow-key switching.
  it('supports roving tabindex + arrow-key category switching', async () => {
    const w = await mountStep();
    expect(tabs(w)[0].attributes('tabindex')).toBe('0');
    expect(tabs(w)[1].attributes('tabindex')).toBe('-1');

    await w.find('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' });
    expect(tabs(w)[1].attributes('aria-selected')).toBe('true');
  });

  // AC-3.11 — the order-summary sidebar renders and reflects the selected workshop live.
  it('renders the order summary and updates it as workshops are selected', async () => {
    const w = await mountStep();
    const summary = w.find('[aria-label="Order summary"]');
    expect(summary.exists()).toBe(true);
    expect(summary.text()).toContain('Nothing selected yet.');

    await cardByName(w, 'Hands-on Vue.js Testing').trigger('click');
    expect(summary.text()).toContain('Hands-on Vue.js Testing × 1');
    expect(summary.text()).toContain('$149');
  });
});

const SHIPPING_COPY =
  'Merchandise items will be shipped to your address one week before the conference. ' +
  'Please ensure your shipping address in Step 1 is correct.';

describe('StepAddons (Step 3 — Merchandise + shipping banner)', () => {
  async function gotoMerch() {
    const w = await mountStep();
    await tabs(w)[2].trigger('click');
    return w;
  }
  const inc = (card) => card.get('button[aria-label^="Increase"]').trigger('click');
  const dec = (card) => card.get('button[aria-label^="Decrease"]').trigger('click');

  // AC-3.1 — the Merchandise tab lists all four merch items, in mock order.
  it('lists the four merchandise items in order', async () => {
    const w = await gotoMerch();
    const cards = merchCards(w);
    expect(cards).toHaveLength(4);
    expect(cards[0].text()).toContain('Conference T-Shirt');
    expect(cards[1].text()).toContain('Developer Sticker Pack');
    expect(cards[2].text()).toContain('Insulated Water Bottle');
    expect(cards[3].text()).toContain('Laptop Sleeve');
  });

  // AC-3.11 — adding merch writes { size, quantity } and the order summary updates live.
  it('adds merch to the store and the running total', async () => {
    const w = await gotoMerch();
    await inc(merchByName(w, 'Conference T-Shirt'));

    expect(store.merchSelections.merch1).toEqual({ size: null, quantity: 1 });

    const summary = w.find('[aria-label="Order summary"]');
    expect(summary.text()).toContain('Conference T-Shirt × 1');
    expect(summary.text()).toContain('$35');
  });

  // AC-3.6 — a chosen size is recorded on the selection.
  it('records the chosen size for a sized item', async () => {
    const w = await gotoMerch();
    await merchByName(w, 'Conference T-Shirt').get('select').setValue('L');
    expect(store.merchSelections.merch1.size).toBe('L');
  });

  // AC-3.6/3.7/3.8, D16 — quantity is capped at the item's own maxQuantity (merch3 → 2).
  it('caps quantity at the item maxQuantity', async () => {
    const w = await gotoMerch();
    const bottle = merchByName(w, 'Insulated Water Bottle'); // max 2
    await inc(bottle);
    await inc(bottle);
    await inc(bottle); // no-op — already at max
    expect(store.merchSelections.merch3.quantity).toBe(2);
    expect(bottle.get('button[aria-label^="Increase"]').attributes('disabled')).toBeDefined();
  });

  // AC-3.9 — the shipping banner shows the exact README copy once any merch is added.
  it('shows the shipping banner with the exact README copy when merch is added', async () => {
    const w = await gotoMerch();
    await inc(merchByName(w, 'Conference T-Shirt'));

    const banner = w.find('[role="note"]');
    expect(banner.exists()).toBe(true);
    expect(normalizeWs(banner.text())).toContain(SHIPPING_COPY);
    // Guards the icon-left layout against the Quasar `.flex` wrap regression (icon-on-top).
    expect(banner.classes()).toContain('flex-nowrap');
  });

  // AC-3.10 — no banner when no merch is in the order.
  it('shows no banner when nothing is added', async () => {
    const w = await gotoMerch();
    expect(w.find('[role="note"]').exists()).toBe(false);
  });

  // Removing the last unit drops the entry and hides the banner (card resets to rest state).
  it('removes the entry and hides the banner when quantity returns to 0', async () => {
    const w = await gotoMerch();
    const tshirt = merchByName(w, 'Conference T-Shirt');
    await inc(tshirt);
    expect(w.find('[role="note"]').exists()).toBe(true);

    await dec(tshirt);
    expect(store.merchSelections.merch1).toBeUndefined();
    expect(w.find('[role="note"]').exists()).toBe(false);
  });
});

describe('StepAddons (Step 3 — Meal Packages)', () => {
  // On the Meals tab the only checkbox cards are the meal cards (no time/capacity controls).
  async function gotoMeals() {
    const w = await mountStep();
    await tabs(w)[1].trigger('click');
    return w;
  }

  // AC-3.12 — the Meal Packages tab lists both meal packages, in mock order.
  it('lists both meal packages in order with price and description', async () => {
    const w = await gotoMeals();
    const cards = workshopCards(w);
    expect(cards).toHaveLength(2);
    expect(cards[0].text()).toContain('Standard Lunch (Both Days)');
    expect(cards[1].text()).toContain('Premium Dinner — Day 1 Networking Event');

    const lunch = cardByName(w, 'Standard Lunch (Both Days)');
    expect(lunch.text()).toContain('$45');
    expect(lunch.text()).toContain('Buffet lunch with vegetarian and vegan options.');
  });

  // AC-3.13 — selecting a meal writes to the store, reflects aria-checked, and updates the total.
  it('toggles a meal on and off, updating the store and running total', async () => {
    const w = await gotoMeals();
    const lunch = cardByName(w, 'Standard Lunch (Both Days)');
    const summary = w.find('[aria-label="Order summary"]');

    await lunch.trigger('click');
    expect(store.selectedMealIds.value).toContain('meal1');
    expect(lunch.attributes('aria-checked')).toBe('true');
    expect(summary.text()).toContain('Standard Lunch (Both Days) × 1');
    expect(summary.text()).toContain('$45');

    await lunch.trigger('click');
    expect(store.selectedMealIds.value).not.toContain('meal1');
    expect(lunch.attributes('aria-checked')).toBe('false');
  });

  // AC-3.13 — meals are independent (multi-select): both packages can be added at once.
  it('allows both meal packages to be selected together', async () => {
    const w = await gotoMeals();
    await cardByName(w, 'Standard Lunch (Both Days)').trigger('click');
    await cardByName(w, 'Premium Dinner — Day 1 Networking Event').trigger('click');
    expect(store.selectedMealIds.value).toEqual(['meal1', 'meal2']);
  });
});
