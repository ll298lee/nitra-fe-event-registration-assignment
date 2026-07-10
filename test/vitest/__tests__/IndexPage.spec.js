import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import IndexPage from 'src/pages/IndexPage.vue';

installQuasarPlugin();

// A controllable spy for the async submit so the success + pending flows are deterministic.
const { submitRegistrationMock } = vi.hoisted(() => ({ submitRegistrationMock: vi.fn() }));

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
    submitRegistration: submitRegistrationMock,
  };
});

async function mountPage() {
  const wrapper = mount(IndexPage);
  await flushPromises();
  return wrapper;
}

const stepButtons = (w) => w.find('[aria-label="Registration progress"]').findAll('button');
const submitBtn = (w) => w.findAll('button').find((b) => b.text() === 'Submit Registration');
// The primary footer control by its accent fill — robust across its label/pending-spinner swap.
// NB: the success screen's "Back to Home" CTA shares this fill, so only use this on wizard steps
// (before success), not to assert the footer is gone (use submitBtn for that).
const primaryBtn = (w) =>
  w.findAll('button').find((b) => b.classes().includes('bg-accent-emphasis-rest'));

async function fillValidStep1(w) {
  await stepButtons(w)[0].trigger('click');
  await flushPromises();
  const inputs = w.findAll('input'); // fullName, email, phone, company, jobTitle, shipping
  await inputs[0].setValue('Ada Lovelace');
  await inputs[1].setValue('ada@example.com');
  await inputs[2].setValue('4155550100');
  await inputs[3].setValue('Analytical Engines');
  await inputs[4].setValue('Engineer');
  await w.findAll('[role="radio"]')[0].trigger('click'); // General ticket
  await nextTick();
}

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

describe('IndexPage — Step 4 async submit + terminal success (D15/D40)', () => {
  beforeEach(() => {
    submitRegistrationMock.mockReset();
    submitRegistrationMock.mockResolvedValue({
      confirmationNumber: 'WDS-TEST1234',
      registration: {},
    });
  });

  // AC-4.7 / AC-S-2 — a valid submit resolves to the terminal success screen showing the assigned
  // confirmation number and a personalized thank-you echoing the attendee name + email from state;
  // the stepper and submit footer give way to it.
  it('shows the success screen after a valid submit', async () => {
    const w = await mountPage();
    await fillValidStep1(w);
    await stepButtons(w)[3].trigger('click');
    await flushPromises();

    await submitBtn(w).trigger('click');
    await flushPromises();

    expect(submitRegistrationMock).toHaveBeenCalledTimes(1);
    expect(w.text()).toContain('Registration Complete!');
    expect(w.text()).toContain('Confirmation #WDS-TEST1234');
    expect(w.text()).toContain('Thank you, Ada!');
    expect(w.text()).toContain('ada@example.com');
    expect(w.find('[aria-label="Registration progress"]').exists()).toBe(false);
    expect(submitBtn(w)).toBeUndefined();
  });

  // AC-4.8 / AC-S-4 — while a submit is in flight the primary button is disabled and its label is
  // replaced by a pending affordance, and a second click cannot start a second submit.
  it('prevents a double-submit while a submit is in flight', async () => {
    submitRegistrationMock.mockReset();
    submitRegistrationMock.mockReturnValue(new Promise(() => {})); // never resolves → stays pending

    const w = await mountPage();
    await fillValidStep1(w);
    await stepButtons(w)[3].trigger('click');
    await flushPromises();

    await primaryBtn(w).trigger('click');
    await nextTick();

    expect(submitRegistrationMock).toHaveBeenCalledTimes(1);
    // Pending affordance: the button is disabled and its label is replaced by the spinner.
    expect(primaryBtn(w).attributes('disabled')).toBeDefined();
    expect(primaryBtn(w).find('.q-spinner').exists()).toBe(true);
    expect(primaryBtn(w).text()).not.toContain('Submit Registration');

    // The disabled button blocks a second click, so no second submit is dispatched (the
    // `if (isSubmitting) return` in onPrimary is the belt-and-suspenders behind this affordance).
    await primaryBtn(w).trigger('click');
    await nextTick();
    expect(submitRegistrationMock).toHaveBeenCalledTimes(1);
  });

  // D15 — the flow is terminal; "Back to Home" is the only path back, to a pristine Step 1.
  it('resets to a pristine Step 1 on Back to Home', async () => {
    const w = await mountPage();
    await fillValidStep1(w);
    await stepButtons(w)[3].trigger('click');
    await flushPromises();
    await submitBtn(w).trigger('click');
    await flushPromises();
    expect(w.text()).toContain('Registration Complete!');

    const home = w.findAll('button').find((b) => b.text() === 'Back to Home');
    await home.trigger('click');
    await flushPromises();

    expect(w.text()).not.toContain('Registration Complete!');
    expect(w.find('[aria-label="Registration progress"]').exists()).toBe(true);
    expect(w.findAll('input')[0].element.value).toBe('');
  });
});
