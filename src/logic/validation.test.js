import {
  isValidEmail,
  isValidPhone,
  isPresent,
  hasMerchSelected,
  validateAttendee,
  sessionConflictErrors,
  workshopConflictErrors,
  validateAll,
  errorStepKeys,
  isValid,
  summarizeErrors,
} from './validation.js';
import { normalizeSessions, normalizeAddons } from '../data/normalize.js';
import { sessions as rawSessions } from '../mocks/sessions.js';
import { addons as rawAddons } from '../mocks/addons.js';

const sessions = normalizeSessions(rawSessions);
const addons = normalizeAddons(rawAddons);
const sources = { sessions, addons };
const session = Object.fromEntries(sessions.map((s) => [s.id, s]));
const addon = Object.fromEntries(addons.map((a) => [a.id, a]));

const validAttendee = () => ({
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+1 415 555 0100',
  company: 'Analytical Engines',
  jobTitle: 'Engineer',
  shippingAddress: '',
});

const validState = () => ({
  attendee: validAttendee(),
  ticketId: 'general',
  selectedSessionIds: [],
  selectedWorkshopIds: [],
  merchSelections: {},
});

describe('isValidEmail (AC-V-2)', () => {
  it('accepts a@b.com; rejects abc, a@, a@b', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('ada@example.com')).toBe(true);
    expect(isValidEmail('abc')).toBe(false);
    expect(isValidEmail('a@')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });

  it('rejects empty / whitespace-only and trims before testing', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('   ')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail('  a@b.com  ')).toBe(true);
  });
});

describe('isValidPhone — lenient (AC-V-3, D8)', () => {
  it('accepts common international shapes', () => {
    expect(isValidPhone('+1 415 555 0100')).toBe(true);
    expect(isValidPhone('(415) 555-0100')).toBe(true);
    expect(isValidPhone('4155550100')).toBe(true);
  });

  it('rejects letters and too-few digits', () => {
    expect(isValidPhone('abc')).toBe(false);
    expect(isValidPhone('12')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });

  it('bounds digit count to E.164 (7–15)', () => {
    expect(isValidPhone('1234567')).toBe(true); // 7 digits
    expect(isValidPhone('123456789012345')).toBe(true); // 15 digits
    expect(isValidPhone('1234567890123456')).toBe(false); // 16 digits
  });
});

describe('isPresent', () => {
  it('is false for empty/whitespace/nullish, true for content', () => {
    expect(isPresent('')).toBe(false);
    expect(isPresent('   ')).toBe(false);
    expect(isPresent(undefined)).toBe(false);
    expect(isPresent('x')).toBe(true);
  });
});

describe('hasMerchSelected (AC-V-4, AC-1.6/1.7)', () => {
  it('is true only when some entry has quantity ≥ 1', () => {
    expect(hasMerchSelected({})).toBe(false);
    expect(hasMerchSelected({ merch2: { quantity: 0 } })).toBe(false);
    expect(hasMerchSelected({ merch1: { size: 'M', quantity: 1 } })).toBe(true);
    expect(hasMerchSelected(undefined)).toBe(false);
    // Size chosen before the first `+` leaves { size } with no quantity key (real store shape).
    expect(hasMerchSelected({ merch1: { size: 'M' } })).toBe(false);
  });
});

describe('validateAttendee (AC-V-1)', () => {
  it('errors every required field when the attendee is empty', () => {
    const errors = validateAttendee({});
    for (const field of ['fullName', 'email', 'phone', 'company', 'jobTitle']) {
      expect(errors).toHaveProperty(field);
    }
    // Shipping is not required by default (no merch).
    expect(errors).not.toHaveProperty('shippingAddress');
  });

  it('passes a fully valid attendee with no errors', () => {
    expect(validateAttendee(validAttendee())).toEqual({});
  });

  it('flags a present-but-malformed email/phone with the format message, not "required"', () => {
    const errors = validateAttendee({ ...validAttendee(), email: 'a@b', phone: '12' });
    expect(errors.email).toBe('Enter a valid email address');
    expect(errors.phone).toBe('Enter a valid phone number');
  });

  it('makes shipping required only when merch is present (AC-V-4, non-sticky)', () => {
    const base = { ...validAttendee(), shippingAddress: '' };
    expect(validateAttendee(base, { shippingRequired: false })).not.toHaveProperty(
      'shippingAddress'
    );
    expect(validateAttendee(base, { shippingRequired: true })).toHaveProperty('shippingAddress');
    // With an address supplied, the requirement is satisfied.
    expect(
      validateAttendee({ ...base, shippingAddress: '1 Infinite Loop' }, { shippingRequired: true })
    ).not.toHaveProperty('shippingAddress');
  });
});

describe('sessionConflictErrors (README Step 2 §2, D34)', () => {
  it('flags a selected overlapping pair and names both sessions', () => {
    const errors = sessionConflictErrors([session.s4, session.s5]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(session.s4.title);
    expect(errors[0]).toContain(session.s5.title);
  });

  it('is silent for back-to-back sessions (touch ≠ conflict, D6)', () => {
    expect(sessionConflictErrors([session.s10, session.s11])).toEqual([]);
  });
});

describe('workshopConflictErrors (AC-3.3/3.4, D9)', () => {
  it('flags ws1 against s11 and s12, naming each session', () => {
    const errors = workshopConflictErrors([addon.ws1], [session.s11, session.s12]);
    expect(errors).toHaveLength(2);
    expect(errors.join(' ')).toContain(session.s11.title);
    expect(errors.join(' ')).toContain(session.s12.title);
    expect(errors.every((m) => m.includes(addon.ws1.name))).toBe(true);
  });

  it('does not flag ws1 against s10 (touch at 14:00Z)', () => {
    expect(workshopConflictErrors([addon.ws1], [session.s10])).toEqual([]);
  });

  it('never flags a non-timed add-on (meal/merch) against a session', () => {
    expect(workshopConflictErrors([addon.meal1, addon.merch1], [session.s11])).toEqual([]);
  });
});

describe('validateAll — unified per-step map (AC-4.4, AC-V-6)', () => {
  it('returns an all-clear per-step map for a valid registration', () => {
    const errors = validateAll(validState(), sources);
    expect(errors).toEqual({ attendee: {}, sessions: [], addons: [] });
    expect(isValid(errors)).toBe(true);
    expect(errorStepKeys(errors)).toEqual([]);
  });

  it('aggregates field, conflict, and cross-step errors across steps at once', () => {
    const errors = validateAll(
      {
        attendee: { ...validAttendee(), email: '', shippingAddress: '' },
        ticketId: 'general',
        selectedSessionIds: ['s4', 's5'], // session↔session conflict → Step 2
        selectedWorkshopIds: ['ws1'],
        selectedMealIds: [],
        merchSelections: { merch1: { size: 'M', quantity: 1 } }, // → shipping required (Step 1)
      },
      sources
    );

    expect(errors.attendee).toHaveProperty('email');
    expect(errors.attendee).toHaveProperty('shippingAddress');
    expect(errors.sessions).toHaveLength(1);
    // ws1 selected but no conflicting session selected here (only s4/s5) → no addon conflict.
    expect(errors.addons).toEqual([]);
    expect(errorStepKeys(errors)).toEqual(['attendee', 'sessions']);
    expect(isValid(errors)).toBe(false);
  });

  it('attributes shipping-when-merch to Step 1 and a workshop conflict to Step 3 (AC-4.5)', () => {
    const errors = validateAll(
      {
        attendee: { ...validAttendee(), shippingAddress: '' },
        ticketId: 'vip',
        selectedSessionIds: ['s11'],
        selectedWorkshopIds: ['ws1'], // ws1 (14:00–17:00) overlaps s11 (14:00–15:30)
        merchSelections: { merch2: { quantity: 2 } },
      },
      sources
    );
    expect(errors.attendee).toHaveProperty('shippingAddress'); // Step 1
    expect(errors.addons).toHaveLength(1); // Step 3
    expect(errors.addons[0]).toContain(session.s11.title);
    expect(errorStepKeys(errors)).toEqual(['attendee', 'addons']);
  });

  it('keeps a stale ws1 conflict and reports it at submit — never auto-removed (AC-4.6, D10)', () => {
    const state = {
      attendee: validAttendee(),
      ticketId: 'vip',
      selectedSessionIds: ['s11'], // added after ws1 via back-nav
      selectedWorkshopIds: ['ws1'],
      merchSelections: {},
    };
    const errors = validateAll(state, sources);

    expect(errors.addons).toHaveLength(1);
    expect(errors.addons[0]).toContain(session.s11.title);
    // The selection is untouched — validation is pure and reports, not mutates.
    expect(state.selectedWorkshopIds).toEqual(['ws1']);
  });

  it('requires a ticket to be selected — Step-1 spec-gap fill (D34)', () => {
    const errors = validateAll({ ...validState(), ticketId: null }, sources);
    expect(errors.attendee).toHaveProperty('ticketId');
    expect(errorStepKeys(errors)).toContain('attendee');

    const ok = validateAll({ ...validState(), ticketId: 'vip' }, sources);
    expect(ok.attendee).not.toHaveProperty('ticketId');
  });

  it('tolerates missing sources and selections without throwing', () => {
    expect(() => validateAll({}, {})).not.toThrow();
    const errors = validateAll({}, {});
    // No attendee data → all required fields + ticket flagged; no conflict arrays throw.
    expect(errorStepKeys(errors)).toEqual(['attendee']);
    expect(errors.sessions).toEqual([]);
    expect(errors.addons).toEqual([]);
  });

  it('orders error steps sessions-before-addons in wizard order (AC-4.5)', () => {
    // Valid attendee + a session↔session conflict (s11/s12) AND a workshop↔session
    // conflict (ws1 overlaps both) — the only shape that proves the relative order.
    const errors = validateAll(
      {
        attendee: validAttendee(),
        ticketId: 'vip',
        selectedSessionIds: ['s11', 's12'],
        selectedWorkshopIds: ['ws1'],
        merchSelections: {},
      },
      sources
    );
    expect(errors.attendee).toEqual({});
    expect(errors.sessions).toHaveLength(1);
    expect(errors.addons).toHaveLength(2);
    expect(errorStepKeys(errors)).toEqual(['sessions', 'addons']);
  });
});

describe('errorStepKeys / isValid — empty-object tolerance', () => {
  it('treats a partial/empty error object as clean', () => {
    expect(errorStepKeys({})).toEqual([]);
    expect(errorStepKeys(undefined)).toEqual([]);
    expect(isValid({})).toBe(true);
  });
});

describe('summarizeErrors — Step-4 error banner list (D37, AC-4.5)', () => {
  // Flattens the per-step map to wizard-ordered "Step N: {message}" lines, one per error.
  it('prefixes each error with its 1-based wizard step, in order', () => {
    const errors = {
      attendee: { phone: 'Phone is required', company: 'Company is required' },
      sessions: ['A overlaps with B'],
      addons: ['Workshop overlaps with C'],
    };
    expect(summarizeErrors(errors)).toEqual([
      'Step 1: Phone is required',
      'Step 1: Company is required',
      'Step 2: A overlaps with B',
      'Step 3: Workshop overlaps with C',
    ]);
  });

  it('returns [] for a clean / partial result', () => {
    expect(summarizeErrors({ attendee: {}, sessions: [], addons: [] })).toEqual([]);
    expect(summarizeErrors({})).toEqual([]);
    expect(summarizeErrors(undefined)).toEqual([]);
  });
});
