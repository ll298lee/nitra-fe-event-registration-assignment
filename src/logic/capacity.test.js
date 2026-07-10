import { isFull, remainingSpots, fillFraction } from './capacity.js';
import { normalizeSessions, normalizeAddons } from '../data/normalize.js';
import { sessions as rawSessions } from '../mocks/sessions.js';
import { addons as rawAddons } from '../mocks/addons.js';

const sessions = normalizeSessions(rawSessions);
const addons = normalizeAddons(rawAddons);
const session = Object.fromEntries(sessions.map((s) => [s.id, s]));
const addon = Object.fromEntries(addons.map((a) => [a.id, a]));

describe('isFull — registered >= capacity', () => {
  // AC-Cap-1 / AC-2.3 — only s2 (120/120) and s9 (90/90) are full.
  it('isFull sessions: only s2,s9', () => {
    const full = sessions.filter(isFull).map((s) => s.id);
    expect(full).toEqual(['s2', 's9']);
  });

  // AC-Cap-2 / AC-3.2 — only ws2 (25/25) is full; meals/merch are uncapped.
  it('isFull addons: only ws2; meals/merch uncapped', () => {
    const full = addons.filter(isFull).map((a) => a.id);
    expect(full).toEqual(['ws2']);
    expect(isFull(addon.ws1)).toBe(false);
    expect(isFull(addon.meal1)).toBe(false);
    expect(isFull(addon.merch1)).toBe(false);
  });
});

describe('remainingSpots — capacity − registered', () => {
  // AC-Cap-3 / AC-2.4 / AC-3.5 — spot values verified against the mock.
  it('remainingSpots spot values (s1=13, s3=22, s11=51, ws1=8)', () => {
    expect(remainingSpots(session.s1)).toBe(13);
    expect(remainingSpots(session.s3)).toBe(22);
    expect(remainingSpots(session.s11)).toBe(51);
    expect(remainingSpots(addon.ws1)).toBe(8);
  });

  it('full items report 0 remaining (s2, s9)', () => {
    expect(remainingSpots(session.s2)).toBe(0);
    expect(remainingSpots(session.s9)).toBe(0);
  });

  // AC-Cap-2 — uncapped items (meals/merch) have no remaining-spots number.
  it('uncapped meals/merch → null', () => {
    expect(remainingSpots(addon.meal1)).toBeNull();
    expect(remainingSpots(addon.merch1)).toBeNull();
  });
});

describe('fillFraction — capacity filled, clamped [0,1]', () => {
  // Drives the Step 2 capacity bar (D25). Must agree with the spots label across items.
  it('matches registered/capacity for capped sessions', () => {
    expect(fillFraction(session.s6)).toBeCloseTo(41 / 100); // low band
    expect(fillFraction(session.s3)).toBeCloseTo(78 / 100); // high band
    expect(fillFraction(session.s2)).toBe(1); // full → Sold Out
  });

  it('uncapped meals/merch report 0', () => {
    expect(fillFraction(addon.meal1)).toBe(0);
    expect(fillFraction(addon.merch1)).toBe(0);
  });

  it('clamps over-capacity to 1 and never divides by zero', () => {
    expect(fillFraction({ capacity: 10, registered: 15 })).toBe(1);
    expect(fillFraction({ capacity: 0, registered: 0 })).toBe(0);
    expect(fillFraction({ capacity: 100 })).toBe(0);
  });
});

describe('partial data (defensive)', () => {
  // Not reachable from the mocks, but the facade (D1) is built to be swapped for
  // a real API. A capped item with a missing `registered` count must keep the
  // two predicates consistent: not-full + full remaining, never NaN.
  it('missing registered is read as 0, keeping isFull/remainingSpots consistent', () => {
    const item = { capacity: 100 };
    expect(isFull(item)).toBe(false);
    expect(remainingSpots(item)).toBe(100);
  });
});
