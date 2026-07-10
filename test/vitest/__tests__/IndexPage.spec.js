import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import IndexPage from 'src/pages/IndexPage.vue';

installQuasarPlugin();

// Resolve the async facade synchronously with the real, normalized mocks.
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

async function mountPage() {
  const wrapper = mount(IndexPage);
  await flushPromises();
  return wrapper;
}

const stepButtons = (w) => w.find('[aria-label="Registration progress"]').findAll('button');
const submitBtn = (w) => w.findAll('button').find((b) => b.text() === 'Submit Registration');

describe('IndexPage — Step 4 submit-time error affordances (D37)', () => {
  // AC-4.5 / D37 — a failed submit marks the errored step in the stepper, disables the Submit
  // button, and shows the error-summary banner, all together.
  it('marks the stepper, disables Submit, and shows the banner on a failed submit', async () => {
    const w = await mountPage();

    // Free-nav to Review via the stepper (nothing filled in).
    await stepButtons(w)[3].trigger('click');
    await flushPromises();
    expect(w.text()).toContain('Review Your Registration');

    // Pre-submit: no error affordances, Submit enabled.
    expect(stepButtons(w)[0].attributes('aria-invalid')).toBeUndefined();
    expect(w.find('[role="alert"]').exists()).toBe(false);
    expect(submitBtn(w).attributes('disabled')).toBeUndefined();

    await submitBtn(w).trigger('click');
    await nextTick();

    // Step 1 (Attendee) is flagged; Submit is disabled; the banner lists the errors.
    expect(stepButtons(w)[0].attributes('aria-invalid')).toBe('true');
    expect(stepButtons(w)[1].attributes('aria-invalid')).toBeUndefined();
    expect(submitBtn(w).attributes('disabled')).toBeDefined();
    expect(w.find('[role="alert"]').text()).toContain('Please fix the following errors');
  });

  // AC-V-5 / D37(c) — the disabled Submit re-enables live once the form is made valid, with no
  // second submit (the reward-early half; guards the `!isValid` term of submitDisabled).
  it('re-enables Submit once the form is made valid', async () => {
    const w = await mountPage();
    await stepButtons(w)[3].trigger('click');
    await flushPromises();
    await submitBtn(w).trigger('click');
    await nextTick();
    expect(submitBtn(w).attributes('disabled')).toBeDefined();

    // Fix everything on Step 1: fill the attendee fields and pick a ticket.
    await stepButtons(w)[0].trigger('click');
    await flushPromises();
    const inputs = w.findAll('input'); // fullName, email, phone, company, jobTitle, shipping
    await inputs[0].setValue('Ada Lovelace');
    await inputs[1].setValue('ada@example.com');
    await inputs[2].setValue('4155550100');
    await inputs[3].setValue('Analytical Engines');
    await inputs[4].setValue('Engineer');
    await w.findAll('[role="radio"]')[0].trigger('click'); // select a ticket
    await nextTick();

    // Back on Review the errors have cleared, so Submit is enabled again.
    await stepButtons(w)[3].trigger('click');
    await flushPromises();
    expect(submitBtn(w).attributes('disabled')).toBeUndefined();
    expect(stepButtons(w)[0].attributes('aria-invalid')).toBeUndefined();
  });
});
