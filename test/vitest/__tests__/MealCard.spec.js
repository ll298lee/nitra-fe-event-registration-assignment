import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import MealCard from 'src/components/wizard/MealCard.vue';
import { addons } from 'src/mocks/addons.js';

installQuasarPlugin();

const meal = (id) => addons.find((a) => a.id === id);
const MEAL1 = meal('meal1'); // Standard Lunch (Both Days): $45
const MEAL2 = meal('meal2'); // Premium Dinner — Day 1 Networking Event: $89

function mountCard(props = {}) {
  return mount(MealCard, { props: { meal: MEAL1, ...props } });
}

describe('MealCard (Step 3 — Meal Packages)', () => {
  // AC-3.12 — name, price (formatted), and description render.
  it('renders name, price, and description', () => {
    const w = mountCard({ meal: MEAL2 });
    expect(w.text()).toContain('Premium Dinner — Day 1 Networking Event');
    expect(w.text()).toContain('$89.00');
    expect(w.text()).toContain(MEAL2.description);
  });

  // A meal card is a selectable toggle (role=checkbox), unselected by default.
  it('is an unchecked checkbox by default', () => {
    const w = mountCard();
    const btn = w.get('[role="checkbox"]');
    expect(btn.attributes('aria-checked')).toBe('false');
  });

  // AC-3.13 — clicking emits toggle with the meal id.
  it('emits toggle with the meal id on click', async () => {
    const w = mountCard();
    await w.get('[role="checkbox"]').trigger('click');
    expect(w.emitted('toggle')).toEqual([['meal1']]);
  });

  // Selected applies aria-checked and the brand selection classes (background + 2px ring).
  // That the ring actually paints (box-shadow not `none`) is browser-verified per D41 —
  // classes() only proves the class token is present, not that UnoCSS emitted the rule.
  it('reflects the selected state', () => {
    const w = mountCard({ selected: true });
    const btn = w.get('[role="checkbox"]');
    expect(btn.attributes('aria-checked')).toBe('true');
    expect(btn.classes()).toContain('bg-brand-subtle-rest');
    expect(
      btn.classes(
        'shadow-[inset_0_0_0_2px_var(--border-brand-emphasis),0px_4px_16px_0px_rgba(0,0,0,0.08),0px_1px_3px_0px_rgba(0,0,0,0.04)]'
      )
    ).toBe(true);
  });
});
