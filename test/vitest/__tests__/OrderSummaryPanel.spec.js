import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import OrderSummaryPanel from 'src/components/wizard/OrderSummaryPanel.vue';
import { provideRegistration } from 'src/composables/useRegistration.js';
import { event } from 'src/mocks/event.js';
import { addons as rawAddons } from 'src/mocks/addons.js';
import { normalizeAddons } from 'src/data/normalize.js';

installQuasarPlugin();

const addons = normalizeAddons(rawAddons);

let store;
function mountPanel() {
  const Harness = defineComponent({
    setup() {
      store = provideRegistration();
      return () => h(OrderSummaryPanel, { ticketTypes: event.ticketTypes, addons });
    },
  });
  return mount(Harness);
}

describe('OrderSummaryPanel (Step 3 running total — AC-3.11, D29)', () => {
  it('shows an empty state and a $0 total before anything is selected', () => {
    const w = mountPanel();
    expect(w.text()).toContain('Nothing selected yet.');
    expect(w.text()).toContain('Total');
    expect(w.text()).toContain('$0');
  });

  it('labels the ticket line "{name} Ticket" with its price', async () => {
    const w = mountPanel();
    store.ticketId.value = 'general';
    await nextTick();
    expect(w.text()).toContain('General Ticket');
    expect(w.text()).toContain('$299');
  });

  // AC-3.11 / AC-P-2 — VIP + ws1 shows the workshop line, the teal discount line, and $733.10.
  it('renders the VIP workshop discount line and net total', async () => {
    const w = mountPanel();
    store.ticketId.value = 'vip';
    store.selectedWorkshopIds.value = ['ws1'];
    await nextTick();

    expect(w.text()).toContain('VIP Ticket');
    expect(w.text()).toContain('Hands-on Vue.js Testing × 1');
    expect(w.text()).toContain('Workshop discount (VIP 10%)');
    expect(w.text()).toContain('-$14.90');
    expect(w.text()).toContain('$733.10');
  });

  // AC-P-5 — a General cart with the same workshop shows NO discount line.
  it('omits the discount line for non-VIP tickets', async () => {
    const w = mountPanel();
    store.ticketId.value = 'general';
    store.selectedWorkshopIds.value = ['ws1'];
    await nextTick();

    expect(w.text()).not.toContain('Workshop discount');
    expect(w.text()).toContain('$448'); // 299 + 149
  });

  // AC-3.11 — a merch line renders "{name} × {qty}" and updates the total live.
  it('renders a merch line with quantity and updates the total', async () => {
    const w = mountPanel();
    store.ticketId.value = 'general';
    store.merchSelections.merch1 = { size: 'M', quantity: 2 }; // $35 × 2
    await nextTick();

    expect(w.text()).toContain('Conference T-Shirt × 2');
    expect(w.text()).toContain('$70');
    expect(w.text()).toContain('$369'); // 299 + 70
  });
});
