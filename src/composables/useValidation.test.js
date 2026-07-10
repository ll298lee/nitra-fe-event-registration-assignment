import { nextTick } from 'vue';
import { createValidation } from './useValidation.js';
import { createRegistration } from './useRegistration.js';
import { normalizeSessions, normalizeAddons } from '../data/normalize.js';
import { sessions as rawSessions } from '../mocks/sessions.js';
import { addons as rawAddons } from '../mocks/addons.js';
import { i18n } from '../i18n/index.js';

const sessions = normalizeSessions(rawSessions);
const addons = normalizeAddons(rawAddons);

// The composable takes an injected translator (D45); supply the real `en` one so the
// assertions below read against the actual shipped copy.
const t = i18n.global.t;

function setup() {
  const reg = createRegistration();
  const validation = createValidation(reg, { sessions, addons }, t);
  return { reg, validation };
}

// A complete, valid Step-1 attendee block.
function fillAttendee(reg) {
  Object.assign(reg.attendee, {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1 415 555 0100',
    company: 'Acme Inc.',
    jobTitle: 'Senior Developer',
  });
  reg.ticketId.value = 'vip';
}

describe('useValidation — reward early, punish late (D7/D36, AC-V-5)', () => {
  // AC-V-5 — nothing validates before the first submit.
  it('shows no errors before the first submit', () => {
    const { validation } = setup();
    expect(validation.submitted.value).toBe(false);
    expect(validation.attendeeError('fullName')).toBe('');
    expect(validation.attendeeError('email')).toBe('');
  });

  // AC-V-1/V-6 — a failed submit reveals every missing/invalid field.
  it('reveals field errors after a failed submit', () => {
    const { validation } = setup();
    const ok = validation.attemptSubmit();

    expect(ok).toBe(false);
    expect(validation.submitted.value).toBe(true);
    expect(validation.attendeeError('fullName')).toBe('Full Name is required');
    expect(validation.attendeeError('email')).toBe('Email is required');
    // Ticket selection is a submit-time requirement filed under Step 1 (D34b).
    expect(validation.attendeeError('ticketId')).toBe('Please select a ticket type');
    expect(validation.errorSteps.value).toContain('attendee');
  });

  // AC-V-5 — after a failed submit a fixed field clears its error live (no re-submit).
  it('clears a field error live once it becomes valid', async () => {
    const { reg, validation } = setup();
    validation.attemptSubmit();
    expect(validation.attendeeError('email')).toBe('Email is required');

    reg.attendee.email = 'not-an-email';
    await nextTick();
    expect(validation.attendeeError('email')).toBe('Enter a valid email address');

    reg.attendee.email = 'jane@example.com';
    await nextTick();
    expect(validation.attendeeError('email')).toBe('');
  });

  // AC-4.4 — a fully valid registration passes the unified submit.
  it('passes when every step is valid', () => {
    const { reg, validation } = setup();
    fillAttendee(reg);
    expect(validation.attemptSubmit()).toBe(true);
    expect(validation.isValid.value).toBe(true);
    expect(validation.errorSteps.value).toEqual([]);
  });

  it('resets to the pristine state', () => {
    const { validation } = setup();
    validation.attemptSubmit();
    expect(validation.submitted.value).toBe(true);
    validation.reset();
    expect(validation.submitted.value).toBe(false);
    expect(validation.attendeeError('fullName')).toBe('');
  });

  // D37 — the submitted-gated banner list + stepper keys are empty pre-submit and populated after.
  it('exposes a submitted-gated error summary + stepper keys for the banner', () => {
    const { reg, validation } = setup();
    expect(validation.errorSummary.value).toEqual([]);
    expect(validation.errorStepsShown.value).toEqual([]);

    fillAttendee(reg);
    reg.attendee.phone = ''; // one missing field
    validation.attemptSubmit();

    expect(validation.errorSummary.value).toEqual(['Step 1: Phone is required']);
    expect(validation.errorStepsShown.value).toEqual(['attendee']);
  });
});

describe('useValidation — conflicts & cross-step (AC-4.5/4.6/4.9, D9/D36)', () => {
  // AC-4.9 — two overlapping sessions flag Step 2, wizard-ordered.
  it('flags a session↔session conflict on the sessions step', () => {
    const { reg, validation } = setup();
    fillAttendee(reg);
    reg.selectedSessionIds.value = ['s4', 's5']; // 13:00–14:30 vs 13:30–15:00 overlap
    validation.attemptSubmit();

    expect(validation.errors.value.sessions.length).toBe(1);
    expect(validation.errors.value.sessions[0]).toContain('overlaps with');
    expect(validation.errorSteps.value).toContain('sessions');
  });

  // AC-4.6 / D10 — a stale workshop↔session conflict is reported on Step 3 and NOT auto-removed.
  it('reports a stale workshop conflict without mutating the selection', () => {
    const { reg, validation } = setup();
    fillAttendee(reg);
    reg.selectedWorkshopIds.value = ['ws1']; // Nov 16 14:00–17:00
    reg.selectedSessionIds.value = ['s11']; // Accessibility Deep Dive 14:00–15:30 overlaps ws1
    validation.attemptSubmit();

    expect(validation.errors.value.addons.length).toBe(1);
    expect(validation.errors.value.addons[0]).toContain('Accessibility Deep Dive');
    expect(reg.selectedWorkshopIds.value).toEqual(['ws1']); // kept, not auto-removed
    expect(validation.isValid.value).toBe(false);
  });

  // AC-4.5 — errorSteps is wizard-ordered (sessions before addons).
  it('orders error steps in wizard order', () => {
    const { reg, validation } = setup();
    fillAttendee(reg);
    reg.selectedSessionIds.value = ['s11', 's12']; // overlap → sessions error
    reg.selectedWorkshopIds.value = ['ws1']; // overlaps s11/s12 → addons error
    validation.attemptSubmit();

    expect(validation.errorSteps.value).toEqual(['sessions', 'addons']);
  });

  // AC-1.6/1.7 — Shipping Address is required only when merch is selected.
  it('requires shipping only when merch is selected', () => {
    const { reg, validation } = setup();
    fillAttendee(reg);
    validation.attemptSubmit();
    expect(validation.attendeeError('shippingAddress')).toBe(''); // no merch → optional

    reg.merchSelections.merch1 = { size: 'M', quantity: 1 };
    expect(validation.attendeeError('shippingAddress')).toBe(
      'Shipping Address is required when merchandise is selected'
    );

    reg.attendee.shippingAddress = '742 Evergreen Terrace';
    expect(validation.attendeeError('shippingAddress')).toBe('');
  });
});
