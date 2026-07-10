import {
  formatTime,
  formatTimeRange,
  dayGroupKey,
  formatDayLabel,
  formatDateTimeRange,
} from './datetime.js';
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

describe('formatDayLabel — wall-clock day tab label (D4)', () => {
  // AC-2.1 — the two day groups label as "Nov 15" / "Nov 16" (frame's tab copy).
  it('labels s1 → "Nov 15" and s7 → "Nov 16"', () => {
    expect(formatDayLabel(session.s1.start)).toBe('Nov 15');
    expect(formatDayLabel(session.s7.start)).toBe('Nov 16');
  });

  // AC-T-1 — ws2 (18:30Z) labels Nov 15; a +8 local offset would read Nov 16.
  it('reads UTC fields so no local shift (ws2 18:30Z → Nov 15)', () => {
    expect(formatDayLabel(addon.ws2.start)).toBe('Nov 15');
  });
});

describe('formatDateTimeRange — Step 3 workshop date + time (D28)', () => {
  // ws1 (Nov 16, 14:00–17:00Z) and ws2 (Nov 15, 15:30–18:30Z) render date + wall-clock time.
  it('prefixes the wall-clock day to the time range', () => {
    expect(formatDateTimeRange(addon.ws1.start, addon.ws1.end)).toBe('Nov 16, 2:00 PM – 5:00 PM');
    expect(formatDateTimeRange(addon.ws2.start, addon.ws2.end)).toBe('Nov 15, 3:30 PM – 6:30 PM');
  });
});
