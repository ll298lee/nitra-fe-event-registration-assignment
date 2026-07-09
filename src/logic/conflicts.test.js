import { intervalsOverlap, detectConflicts, conflictingSessions } from './conflicts.js';
import { isFull } from './capacity.js';
import { normalizeSessions, normalizeAddons } from '../data/normalize.js';
import { sessions as rawSessions } from '../mocks/sessions.js';
import { addons as rawAddons } from '../mocks/addons.js';

const sessions = normalizeSessions(rawSessions);
const addons = normalizeAddons(rawAddons);
const session = Object.fromEntries(sessions.map((s) => [s.id, s]));
const addon = Object.fromEntries(addons.map((a) => [a.id, a]));

const pairIds = (pairs) => pairs.map(([a, b]) => [a.id, b.id]);

describe('intervalsOverlap — strict inequality (D6)', () => {
  // AC-C-1 — strict overlap true; touching endpoints false.
  it('intervalsOverlap strict vs touching', () => {
    // s4 (13:00–14:30) vs s5 (13:30–15:00): strict overlap.
    expect(intervalsOverlap(session.s4, session.s5)).toBe(true);
    // s10 (13:00–14:00) vs s11 (14:00–15:30): touch at 14:00 → no conflict.
    expect(intervalsOverlap(session.s10, session.s11)).toBe(false);
    // ws1 (14:00–17:00) vs s10 (13:00–14:00): touch at 14:00 → no conflict.
    expect(intervalsOverlap(addon.ws1, session.s10)).toBe(false);
    // Full containment counts as overlap.
    const outer = {
      start: new Date('2028-11-15T09:00:00Z'),
      end: new Date('2028-11-15T12:00:00Z'),
    };
    const inner = {
      start: new Date('2028-11-15T10:00:00Z'),
      end: new Date('2028-11-15T11:00:00Z'),
    };
    expect(intervalsOverlap(outer, inner)).toBe(true);
    expect(intervalsOverlap(inner, outer)).toBe(true);
  });
});

describe('detectConflicts — session pairs', () => {
  // AC-C-2 — raw overlaps are s2/s3, s4/s5, s8/s9, s11/s12; but s2 and s9 are full,
  // so among *co-selectable* sessions only s4/s5 and s11/s12 are live conflicts.
  it('flags s4/s5, s11/s12; decoys s2/s3, s8/s9', () => {
    expect(pairIds(detectConflicts(sessions))).toEqual([
      ['s2', 's3'],
      ['s4', 's5'],
      ['s8', 's9'],
      ['s11', 's12'],
    ]);

    const selectable = sessions.filter((s) => !isFull(s));
    expect(pairIds(detectConflicts(selectable))).toEqual([
      ['s4', 's5'],
      ['s11', 's12'],
    ]);
  });
});

describe('conflictingSessions — workshop vs selected sessions', () => {
  // AC-C-3 — ws1 conflicts with s11 & s12, not s10 (touch at 14:00Z).
  it('ws1 vs s10/s11/s12', () => {
    const conflicts = conflictingSessions(addon.ws1, [session.s10, session.s11, session.s12]);
    expect(conflicts.map((s) => s.id)).toEqual(['s11', 's12']);
  });

  // AC-C-4 — ws2 overlaps s6, but ws2 is full → never selectable → no live conflict.
  it('ws2 full: no live conflict', () => {
    expect(intervalsOverlap(addon.ws2, session.s6)).toBe(true);
    expect(isFull(addon.ws2)).toBe(true);
  });

  it('non-timed add-ons (meals/merch) never conflict', () => {
    expect(conflictingSessions(addon.meal1, [session.s11])).toEqual([]);
    expect(conflictingSessions(addon.merch1, [session.s11])).toEqual([]);
  });
});
