import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { createRegistration, provideRegistration } from './useRegistration.js';
import { createOrderSummary, useOrderSummary } from './useOrderSummary.js';
import { event } from '../mocks/event.js';
import { addons } from '../mocks/addons.js';
import { normalizeAddons } from '../data/normalize.js';
import { formatCurrency } from '../utils/pricing.js';

// Real reference data — the summary is driven by the actual mock prices so the
// asserted totals trace to the fixtures, not a hand-rolled copy.
const sources = { ticketTypes: event.ticketTypes, addons: normalizeAddons(addons) };

function makeSummary() {
  const registration = createRegistration();
  const summary = createOrderSummary(registration, sources);
  return { registration, summary };
}

describe('createOrderSummary — empty & ticket-only carts', () => {
  it('an untouched cart has no lines and a zero total', () => {
    const { summary } = makeSummary();
    expect(summary.ticketLine.value).toBeNull();
    expect(summary.lineItems.value).toEqual([]);
    expect(summary.subtotal.value).toBe(0);
    expect(summary.workshopDiscount.value).toBe(0);
    expect(summary.total.value).toBe(0);
  });

  it('a ticket-only cart totals the ticket price', () => {
    const { registration, summary } = makeSummary();
    registration.ticketId.value = 'general';
    expect(summary.ticketLine.value).toMatchObject({ id: 'general', quantity: 1, amount: 299 });
    expect(summary.subtotal.value).toBe(299);
    expect(summary.total.value).toBe(299);
    expect(formatCurrency(summary.total.value)).toBe('$299');
  });
});

describe('createOrderSummary — VIP workshop discount (D11, AC-P-2/3)', () => {
  // AC-P-2 — VIP + ws1 ($149): discount $14.90, ws1 net $134.10, total $733.10.
  it('applies 10% off ws1 for VIP and nets the total', () => {
    const { registration, summary } = makeSummary();
    registration.ticketId.value = 'vip';
    registration.selectedWorkshopIds.value = ['ws1'];

    expect(summary.workshopLines.value).toHaveLength(1);
    expect(summary.workshopLines.value[0]).toMatchObject({ id: 'ws1', amount: 149 });
    expect(summary.workshopDiscount.value).toBe(14.9);
    expect(summary.subtotal.value).toBe(748); // 599 + 149
    expect(summary.total.value).toBe(733.1);
    expect(formatCurrency(summary.workshopDiscount.value)).toBe('$14.90');
    expect(formatCurrency(summary.total.value)).toBe('$733.10');
    // ws1 net (line − its share of the discount) reads $134.10.
    expect(
      formatCurrency(summary.workshopLines.value[0].amount - summary.workshopDiscount.value)
    ).toBe('$134.10');
  });

  // AC-P-3 / AC-P-4 — the discount is 10% of the workshop ALONE; the meals and merch
  // sitting beside it in the same VIP cart never dilute it.
  it('discounts only the workshop, never the meals or merch beside it', () => {
    const { registration, summary } = makeSummary();
    registration.ticketId.value = 'vip';
    registration.selectedWorkshopIds.value = ['ws1']; // $149 (only this is discountable)
    registration.selectedMealIds.value = ['meal1', 'meal2']; // $45 + $89
    registration.merchSelections.merch1 = { size: 'M', quantity: 2 }; // $70

    // 10% of ws1 only ($14.90) — a diluted (149 + 45 + 89 + 70) * 0.10 = $35.30 is the bug.
    expect(summary.workshopDiscount.value).toBe(14.9);
    expect(summary.workshopDiscount.value).not.toBe(35.3);
    // subtotal = 599 + 149 + 134 + 70 = 952; total = 952 − 14.90 = 937.10.
    expect(summary.subtotal.value).toBe(952);
    expect(summary.total.value).toBe(937.1);
  });

  // AC-P-4 — a VIP whose cart has meals/merch but no workshop gets no discount at all.
  it('gives a VIP with no workshop selected no discount', () => {
    const { registration, summary } = makeSummary();
    registration.ticketId.value = 'vip';
    registration.selectedMealIds.value = ['meal1', 'meal2'];
    registration.merchSelections.merch1 = { size: 'M', quantity: 2 };

    expect(summary.workshopLines.value).toHaveLength(0);
    expect(summary.workshopDiscount.value).toBe(0);
    // subtotal = 599 + (45 + 89) + (35 * 2) = 803; no discount applied.
    expect(summary.subtotal.value).toBe(803);
    expect(summary.total.value).toBe(803);
  });

  // AC-P-5 — non-VIP tickets get no discount even with a workshop selected.
  it('gives General/Student no discount', () => {
    const { registration, summary } = makeSummary();
    registration.selectedWorkshopIds.value = ['ws1'];

    registration.ticketId.value = 'general';
    expect(summary.workshopDiscount.value).toBe(0);
    expect(summary.total.value).toBe(448); // 299 + 149

    registration.ticketId.value = 'student';
    expect(summary.workshopDiscount.value).toBe(0);
    expect(summary.total.value).toBe(248); // 99 + 149
  });
});

describe('createOrderSummary — killer ticket-switch (AC-P-6, D3)', () => {
  it('drops the discount instantly when VIP switches to General', () => {
    const { registration, summary } = makeSummary();
    registration.ticketId.value = 'vip';
    registration.selectedWorkshopIds.value = ['ws1'];
    expect(formatCurrency(summary.total.value)).toBe('$733.10');

    // The Edit → change-ticket path is a plain reactive write; no reconciliation code.
    registration.ticketId.value = 'general';
    expect(summary.workshopDiscount.value).toBe(0);
    expect(formatCurrency(summary.total.value)).toBe('$448');
  });
});

describe('createOrderSummary — full cart (AC-P-7)', () => {
  // Cart: ticket + ws1 ($149) + meal1 ($45) + merch1 ×2 ($70).
  function loadFullCart(registration) {
    registration.selectedWorkshopIds.value = ['ws1'];
    registration.selectedMealIds.value = ['meal1'];
    registration.merchSelections.merch1 = { size: 'L', quantity: 2 };
  }

  it('totals $563 for General (no discount)', () => {
    const { registration, summary } = makeSummary();
    registration.ticketId.value = 'general';
    loadFullCart(registration);
    expect(summary.subtotal.value).toBe(563);
    expect(summary.workshopDiscount.value).toBe(0);
    expect(formatCurrency(summary.total.value)).toBe('$563');
  });

  it('totals $848.10 for VIP (863 − 14.90)', () => {
    const { registration, summary } = makeSummary();
    registration.ticketId.value = 'vip';
    loadFullCart(registration);
    expect(summary.subtotal.value).toBe(863);
    expect(summary.workshopDiscount.value).toBe(14.9);
    expect(formatCurrency(summary.total.value)).toBe('$848.10');
  });
});

describe('createOrderSummary — itemized lines (AC-4.2, AC-3.1 order)', () => {
  it('lists ticket then workshops, meals, merch, each priced', () => {
    const { registration, summary } = makeSummary();
    registration.ticketId.value = 'vip';
    registration.selectedWorkshopIds.value = ['ws1'];
    registration.selectedMealIds.value = ['meal1'];
    registration.merchSelections.merch1 = { size: 'M', quantity: 2 };

    const items = summary.lineItems.value;
    expect(items.map((l) => l.type)).toEqual(['ticket', 'workshop', 'meal', 'merchandise']);
    expect(items.map((l) => l.id)).toEqual(['vip', 'ws1', 'meal1', 'merch1']);

    // Every line feeds the totals: 599 + 149 + 45 + 70 = 863 subtotal, 863 − 14.90 = 848.10.
    expect(summary.subtotal.value).toBe(863);
    expect(summary.total.value).toBe(848.1);
    expect(formatCurrency(summary.total.value)).toBe('$848.10');
  });
});

describe('createOrderSummary — merchandise quantity & size', () => {
  it('prices a sized merch line by unitPrice × quantity', () => {
    const { registration, summary } = makeSummary();
    registration.merchSelections.merch1 = { size: 'XL', quantity: 3 }; // $35 × 3

    expect(summary.merchLines.value[0]).toMatchObject({
      id: 'merch1',
      type: 'merchandise',
      size: 'XL',
      unitPrice: 35,
      quantity: 3,
      amount: 105,
    });
  });

  it('prices a size-less merch line with a null size', () => {
    const { registration, summary } = makeSummary();
    registration.merchSelections.merch2 = { quantity: 4 }; // $12 × 4, no sizes

    expect(summary.merchLines.value[0]).toMatchObject({ id: 'merch2', size: null, amount: 48 });
  });

  it('excludes a merch entry whose quantity is zero', () => {
    const { registration, summary } = makeSummary();
    registration.merchSelections.merch2 = { quantity: 0 };
    expect(summary.merchLines.value).toEqual([]);
    expect(summary.total.value).toBe(0);
  });

  it('ignores a selection whose add-on id is unknown', () => {
    const { registration, summary } = makeSummary();
    registration.selectedWorkshopIds.value = ['does-not-exist'];
    expect(summary.workshopLines.value).toEqual([]);
    expect(summary.total.value).toBe(0);
  });
});

describe('createOrderSummary — live recompute (AC-3.11)', () => {
  it('updates the running total as selections change', () => {
    const { registration, summary } = makeSummary();
    registration.ticketId.value = 'general';
    expect(summary.total.value).toBe(299);

    registration.selectedWorkshopIds.value = ['ws1'];
    expect(summary.total.value).toBe(448);

    registration.merchSelections.merch3 = { quantity: 2 }; // $28 × 2
    expect(summary.total.value).toBe(504);

    registration.selectedWorkshopIds.value = [];
    expect(summary.total.value).toBe(355); // 299 + 56
  });
});

describe('useOrderSummary — provide/inject wrapper', () => {
  it('builds the summary from the injected registration store', () => {
    let summary;
    const Child = {
      setup() {
        summary = useOrderSummary(sources);
        return () => h('div');
      },
    };
    const Parent = {
      setup() {
        const registration = provideRegistration();
        registration.ticketId.value = 'vip';
        registration.selectedWorkshopIds.value = ['ws1'];
        return () => h(Child);
      },
    };

    mount(Parent);
    expect(summary.total.value).toBe(733.1);
  });
});
