import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import MerchCard from 'src/components/wizard/MerchCard.vue';
import { addons } from 'src/mocks/addons.js';

installQuasarPlugin();

const merch = (id) => addons.find((a) => a.id === id);
const MERCH1 = merch('merch1'); // Conference T-Shirt: sizes S–XXL, max 3, $35
const MERCH2 = merch('merch2'); // Developer Sticker Pack: no sizes, max 5, $12
const MERCH4 = merch('merch4'); // Laptop Sleeve: sizes 13/15/16", max 1, $42

function mountCard(props = {}) {
  return mount(MerchCard, { props: { merch: MERCH1, ...props } });
}

const decBtn = (w) => w.get('button[aria-label^="Decrease"]');
const incBtn = (w) => w.get('button[aria-label^="Increase"]');

describe('MerchCard (Step 3 — Merchandise)', () => {
  // AC-3.6 — name, unit price (no cents, per the frame), and description render.
  it('renders name, price (no cents), and description', () => {
    const w = mountCard();
    expect(w.text()).toContain('Conference T-Shirt');
    expect(w.text()).toContain('$35');
    expect(w.text()).not.toContain('$35.00');
    expect(w.text()).toContain(MERCH1.description);
  });

  // AC-3.6 / AC-3.7 — a sized item shows a size selector: a "Select" placeholder + every size.
  it('shows a size selector with placeholder and all sizes when the item has sizes', () => {
    const w = mountCard({ merch: MERCH1 });
    const options = w.get('select').findAll('option');
    expect(options.map((o) => o.text())).toEqual(['Select', 'S', 'M', 'L', 'XL', 'XXL']);
  });

  // AC-3.8 — an unsized item shows no size selector.
  it('shows no size selector when the item has no sizes', () => {
    expect(mountCard({ merch: MERCH2 }).find('select').exists()).toBe(false);
  });

  // AC-3.6/3.7/3.8 — the "max N" hint reflects each item's maxQuantity.
  it('shows the max-quantity hint from the item', () => {
    expect(mountCard({ merch: MERCH1 }).text()).toContain('max 3');
    expect(mountCard({ merch: MERCH2 }).text()).toContain('max 5');
    expect(mountCard({ merch: MERCH4 }).text()).toContain('max 1');
  });

  // Quantity 0 (not added): decrement disabled, increment enabled, no added footer.
  it('disables decrement and hides the added footer at quantity 0', () => {
    const w = mountCard({ quantity: 0 });
    expect(decBtn(w).attributes('disabled')).toBeDefined();
    expect(incBtn(w).attributes('disabled')).toBeUndefined();
    expect(w.text()).not.toContain('Added to order');
  });

  // D16 / AC-Cap-4 — increment disabled once quantity reaches maxQuantity (merch4 → 1).
  it('disables increment at maxQuantity', () => {
    const w = mountCard({ merch: MERCH4, quantity: 1 });
    expect(incBtn(w).attributes('disabled')).toBeDefined();
    expect(decBtn(w).attributes('disabled')).toBeUndefined();
  });

  // Added state — the "✓ Added to order" footer appears at quantity ≥ 1.
  it('shows the added footer at quantity ≥ 1', () => {
    expect(mountCard({ quantity: 1 }).text()).toContain('✓ Added to order');
  });

  // Emits — +/− and a size change bubble up with the merch id (parent owns the mutation).
  it('emits increment, decrement, and select-size with the merch id', async () => {
    const w = mountCard({ merch: MERCH1, quantity: 1 });
    await incBtn(w).trigger('click');
    await decBtn(w).trigger('click');
    expect(w.emitted('increment')[0]).toEqual(['merch1']);
    expect(w.emitted('decrement')[0]).toEqual(['merch1']);

    await w.get('select').setValue('M');
    expect(w.emitted('select-size')[0]).toEqual(['merch1', 'M']);
  });
});
