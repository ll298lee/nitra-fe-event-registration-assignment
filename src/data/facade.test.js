import {
  fetchEvent,
  fetchSessions,
  fetchAddons,
  submitRegistration,
  generateConfirmationNumber,
} from './facade.js';

describe('async data facade (D1)', () => {
  // AC-S-1 — the facade resolves asynchronously so loading states are exercisable.
  it('fetchSessions resolves to 12 normalized sessions with parsed Dates', async () => {
    const sessions = await fetchSessions();
    expect(sessions).toHaveLength(12);
    expect(sessions[0].start).toBeInstanceOf(Date);
    expect(sessions[0].end).toBeInstanceOf(Date);
  });

  it('fetchAddons resolves to 8 add-ons; workshops carry parsed time slots', async () => {
    const addons = await fetchAddons();
    expect(addons).toHaveLength(8);
    const ws1 = addons.find((a) => a.id === 'ws1');
    expect(ws1.start).toBeInstanceOf(Date);
    // Meals/merch have no time slot.
    const meal1 = addons.find((a) => a.id === 'meal1');
    expect(meal1.start).toBeUndefined();
  });

  it('fetchEvent resolves to the event with three ticket types', async () => {
    const event = await fetchEvent();
    expect(event.id).toBe('evt-2028-webdev');
    expect(event.ticketTypes).toHaveLength(3);
  });
});

describe('submitRegistration', () => {
  it('resolves with a confirmation number and echoes the registration', async () => {
    const registration = { attendee: { fullName: 'Ada Lovelace' }, ticketId: 'vip' };
    const result = await submitRegistration(registration);
    expect(result.confirmationNumber).toMatch(/^WDS-[A-Z0-9]{8}$/);
    expect(result.registration).toBe(registration);
  });

  it('generateConfirmationNumber matches the WDS-XXXXXXXX format', () => {
    expect(generateConfirmationNumber()).toMatch(/^WDS-[A-Z0-9]{8}$/);
  });
});
