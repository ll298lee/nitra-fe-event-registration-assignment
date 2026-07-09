import { formatTime, formatTimeRange, dayGroupKey } from './datetime.js';
import { normalizeSessions, normalizeAddons } from '../data/normalize.js';
import { sessions as rawSessions } from '../mocks/sessions.js';
import { addons as rawAddons } from '../mocks/addons.js';

const session = Object.fromEntries(normalizeSessions(rawSessions).map((s) => [s.id, s]));
const addon = Object.fromEntries(normalizeAddons(rawAddons).map((a) => [a.id, a]));

describe('formatTimeRange — wall-clock (D4)', () => {
  // AC-2.5 — s6 15:30–17:00Z renders wall-clock, not shifted by viewer offset.
  it("formatTimeRange(s6)='3:30 PM – 5:00 PM' (no local shift)", () => {
    expect(formatTimeRange(session.s6.start, session.s6.end)).toBe('3:30 PM – 5:00 PM');
  });

  // AC-T-3 — s10 and ws1 wall-clock ranges.
  it('formatTimeRange s10 & ws1 wall-clock', () => {
    expect(formatTimeRange(session.s10.start, session.s10.end)).toBe('1:00 PM – 2:00 PM');
    expect(formatTimeRange(addon.ws1.start, addon.ws1.end)).toBe('2:00 PM – 5:00 PM');
  });

  it('formatTime handles noon/midnight edges', () => {
    expect(formatTime(new Date('2028-11-15T12:00:00Z'))).toBe('12:00 PM');
    expect(formatTime(new Date('2028-11-15T00:00:00Z'))).toBe('12:00 AM');
    expect(formatTime(session.s1.start)).toBe('9:00 AM');
  });
});

describe('dayGroupKey — wall-clock (D4)', () => {
  // AC-2.1 / AC-T-2 — s1–s6 group to Nov 15, s7–s12 to Nov 16.
  it('dayGroupKey groups s1–s6=2028-11-15, s7–s12=2028-11-16', () => {
    const day1 = ['s1', 's2', 's3', 's4', 's5', 's6'];
    const day2 = ['s7', 's8', 's9', 's10', 's11', 's12'];
    day1.forEach((id) => expect(dayGroupKey(session[id].start)).toBe('2028-11-15'));
    day2.forEach((id) => expect(dayGroupKey(session[id].start)).toBe('2028-11-16'));
  });

  // AC-T-1 — ws2 (18:30Z) stays on Nov 15; a +8 local offset would push it to Nov 16.
  it('ws2 stays Nov 15 15:30–18:30, no local shift', () => {
    expect(dayGroupKey(addon.ws2.start)).toBe('2028-11-15');
    expect(dayGroupKey(addon.ws2.end)).toBe('2028-11-15');
    expect(formatTimeRange(addon.ws2.start, addon.ws2.end)).toBe('3:30 PM – 6:30 PM');
  });
});
