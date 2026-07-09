import { normalizeSession, normalizeAddon } from './normalize.js';

describe('normalizeSession', () => {
  it('parses ISO date/endDate into Date start/end and preserves other fields', () => {
    const raw = {
      id: 's1',
      title: 'Keynote',
      track: 'main',
      date: '2028-11-15T09:00:00Z',
      endDate: '2028-11-15T10:00:00Z',
      capacity: 500,
      registered: 487,
    };
    const s = normalizeSession(raw);
    expect(s.start).toBeInstanceOf(Date);
    expect(s.end).toBeInstanceOf(Date);
    expect(s.start.toISOString()).toBe('2028-11-15T09:00:00.000Z');
    expect(s.title).toBe('Keynote');
    expect(s.capacity).toBe(500);
  });
});

describe('normalizeAddon', () => {
  it('attaches start/end for a timed workshop (both date + endDate)', () => {
    const ws = normalizeAddon({
      id: 'ws1',
      category: 'workshop',
      date: '2028-11-16T14:00:00Z',
      endDate: '2028-11-16T17:00:00Z',
    });
    expect(ws.start).toBeInstanceOf(Date);
    expect(ws.end).toBeInstanceOf(Date);
  });

  it('leaves non-timed add-ons (meals/merch) without start/end', () => {
    const meal = normalizeAddon({ id: 'meal1', category: 'meal', price: 45 });
    expect(meal.start).toBeUndefined();
    expect(meal.end).toBeUndefined();
  });

  // Defensive: a malformed timed add-on with `date` but no `endDate` must NOT
  // produce an Invalid Date `end` (which would be truthy and silently break
  // conflict comparisons); the incomplete slot is simply not attached.
  it('does not attach a partial time slot (date without endDate)', () => {
    const broken = normalizeAddon({
      id: 'wsX',
      category: 'workshop',
      date: '2028-11-16T14:00:00Z',
    });
    expect(broken.start).toBeUndefined();
    expect(broken.end).toBeUndefined();
  });
});
