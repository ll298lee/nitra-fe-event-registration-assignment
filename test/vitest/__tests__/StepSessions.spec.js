import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import StepSessions from 'src/components/wizard/StepSessions.vue';
import { provideRegistration } from 'src/composables/useRegistration.js';

installQuasarPlugin();

// StepSessions fetches sessions from the async facade on mount. Resolve it synchronously
// with the real, normalized session mock so assertions run against the true data (tracks,
// capacities, times) rather than a hand-rolled fixture.
vi.mock('src/data/facade.js', async () => {
  const { normalizeSessions } = await import('src/data/normalize.js');
  const { sessions } = await import('src/mocks/sessions.js');
  return { fetchSessions: () => Promise.resolve(normalizeSessions(sessions)) };
});

// StepSessions injects the wizard store; wrap it in a root that provides one. Capture the
// store so tests can assert against selectedSessionIds (the injection Symbol isn't exported).
let store;
const Harness = defineComponent({
  setup() {
    store = provideRegistration();
    return () => h(StepSessions);
  },
});

async function mountStep() {
  const wrapper = mount(Harness);
  await flushPromises(); // resolve fetchSessions + render the day tabs + cards
  return wrapper;
}

const cards = (w) => w.findAll('[role="checkbox"]');
const cardByTitle = (w, title) => cards(w).find((c) => c.text().includes(title));
const tabs = (w) => w.findAll('[role="tab"]');

describe('StepSessions (Step 2 — Session Selection)', () => {
  // AC-2.1 — 12 sessions group into two day tabs; s1–s6 on Nov 15, s7–s12 on Nov 16.
  it('groups sessions into Nov 15 / Nov 16 day tabs', async () => {
    const w = await mountStep();

    expect(tabs(w)).toHaveLength(2);
    expect(tabs(w)[0].text()).toBe('Nov 15');
    expect(tabs(w)[1].text()).toBe('Nov 16');

    // Nov 15 active by default → the six day-1 sessions.
    expect(cards(w)).toHaveLength(6);
    expect(cardByTitle(w, 'Opening Keynote')).toBeTruthy();
    expect(cardByTitle(w, 'Day 2 Keynote')).toBeUndefined();

    await tabs(w)[1].trigger('click');
    expect(cards(w)).toHaveLength(6);
    expect(cardByTitle(w, 'Day 2 Keynote')).toBeTruthy();
    expect(cardByTitle(w, 'Opening Keynote')).toBeUndefined();
  });

  // AC-2.2 — each card shows title, speaker, time range, track badge, remaining spots.
  it('renders title, speaker, time range, track badge, and remaining spots', async () => {
    const w = await mountStep();
    const card = cardByTitle(w, 'Building Scalable APIs'); // s3, backend, 78/100 → 22 left

    expect(card.text()).toContain('Building Scalable APIs with Node.js');
    expect(card.text()).toContain('Aisha Patel');
    expect(card.text()).toContain('10:30 AM – 12:00 PM');
    expect(card.text()).toContain('22 spots left');
    expect(card.find('.uppercase').text()).toBe('backend');
  });

  // AC-2.3 / AC-Cap-4 — only the full sessions (s2 on Nov 15, s9 on Nov 16) are
  // disabled + not selectable, and show "Sold Out".
  it('disables only the full sessions and blocks selecting them', async () => {
    const w = await mountStep();

    const vue = cardByTitle(w, 'Advanced Vue.js'); // s2 120/120
    expect(vue.attributes('disabled')).toBeDefined();
    expect(vue.text()).toContain('Sold Out');
    expect(cards(w).filter((c) => c.attributes('disabled') !== undefined)).toHaveLength(1);

    await vue.trigger('click');
    expect(store.selectedSessionIds.value).not.toContain('s2');

    await tabs(w)[1].trigger('click');
    const micro = cardByTitle(w, 'Microservices Communication'); // s9 90/90
    expect(micro.attributes('disabled')).toBeDefined();
    expect(cards(w).filter((c) => c.attributes('disabled') !== undefined)).toHaveLength(1);
  });

  // AC-2.6 — time-conflicting sessions (s4 & s5 overlap) are both freely selectable;
  // no conflict gate at Step 2 (deferred to Step 4).
  it('allows co-selecting time-conflicting sessions', async () => {
    const w = await mountStep();

    await cardByTitle(w, 'Modern CSS').trigger('click'); // s4 13:00–14:30
    await cardByTitle(w, 'Database Performance').trigger('click'); // s5 13:30–15:00 (overlaps)

    expect(store.selectedSessionIds.value).toContain('s4');
    expect(store.selectedSessionIds.value).toContain('s5');
  });

  // AC-2.7 — session access is not gated by ticket type (none selected here).
  it('does not gate selection by ticket type', async () => {
    const w = await mountStep();

    expect(store.ticketId.value).toBeNull();
    await cardByTitle(w, 'Opening Keynote').trigger('click');
    expect(store.selectedSessionIds.value).toContain('s1');
  });

  // AC-2.2 (interaction) — selection toggles on and off; multiple sessions can be selected.
  it('toggles selection and reflects it via aria-checked', async () => {
    const w = await mountStep();
    const keynote = cardByTitle(w, 'Opening Keynote');

    await keynote.trigger('click');
    expect(keynote.attributes('aria-checked')).toBe('true');

    await keynote.trigger('click');
    expect(keynote.attributes('aria-checked')).toBe('false');
    expect(store.selectedSessionIds.value).not.toContain('s1');
  });

  // AC-2.1 (a11y) — the day tablist is a single tab stop (roving tabindex) and arrow keys
  // switch days, per the WAI-ARIA tabs pattern.
  it('supports roving tabindex + arrow-key day switching', async () => {
    const w = await mountStep();
    const tablist = w.find('[role="tablist"]');

    expect(tabs(w)[0].attributes('tabindex')).toBe('0');
    expect(tabs(w)[1].attributes('tabindex')).toBe('-1');

    await tablist.trigger('keydown', { key: 'ArrowRight' });
    expect(tabs(w)[1].attributes('aria-selected')).toBe('true');
    expect(cardByTitle(w, 'Day 2 Keynote')).toBeTruthy();
  });

  // AC-2.2 (counter) — the selection counter updates live and pluralizes.
  it('updates the selection counter with pluralization', async () => {
    const w = await mountStep();
    expect(w.text()).toContain('0 sessions selected');

    await cardByTitle(w, 'Opening Keynote').trigger('click');
    expect(w.text()).toContain('1 session selected');
  });

  // AC-R-2 (Phase-4 responsive, D44) — the session grid stacks to one column below the tablet
  // breakpoint and uses two columns from 768px up. Class presence guards the VIS check.
  it('carries the responsive single→two column classes on the session grid', async () => {
    const w = await mountStep();
    const panel = w.find('[role="tabpanel"]');

    expect(panel.classes()).toContain('grid-cols-1');
    expect(panel.classes()).toContain('tablet:grid-cols-2');
  });

  // D43(b) — skeletons stand in while sessions load, then clear for the day tabs + cards.
  it('shows skeletons while sessions load, then the session cards', async () => {
    const w = mount(Harness); // do NOT flush — assert the loading branch first
    expect(w.findAll('.q-skeleton').length).toBeGreaterThan(0);
    expect(cards(w)).toHaveLength(0);

    await flushPromises();
    expect(w.findAll('.q-skeleton')).toHaveLength(0);
    expect(cards(w).length).toBeGreaterThan(0);
  });
});
