import {
  formatCurrency,
  round2,
  workshopDiscountAmount,
  WORKSHOP_DISCOUNT_RATE,
} from './pricing.js';

describe('formatCurrency (D5/D42)', () => {
  // AC-1.4 — whole-dollar ticket prices render with no cents.
  it('formatCurrency 299/599/99 → $299/$599/$99 (whole dollars, no cents)', () => {
    expect(formatCurrency(299)).toBe('$299');
    expect(formatCurrency(599)).toBe('$599');
    expect(formatCurrency(99)).toBe('$99');
  });

  // AC-P-1 (D42) — whole dollars drop cents; fractional amounts keep 2-decimal cents; both
  // thousands-separated.
  it('omits cents for whole dollars but keeps them for fractional amounts', () => {
    expect(formatCurrency(1234)).toBe('$1,234'); // whole → no cents, separator kept
    expect(formatCurrency(1234.5)).toBe('$1,234.50'); // fractional → 2-decimal cents
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(848.1)).toBe('$848.10');
  });
});

describe('workshopDiscountAmount (D11, rate = 0.10)', () => {
  it('exposes the derived rate as 0.10', () => {
    expect(WORKSHOP_DISCOUNT_RATE).toBe(0.1);
  });

  // AC-P-2 — VIP + ws1 ($149): discount $14.90, net $134.10.
  it('workshopDiscount(VIP, ws1)=14.90; net 134.10', () => {
    const discount = workshopDiscountAmount('vip', [149]);
    expect(discount).toBe(14.9);
    expect(formatCurrency(discount)).toBe('$14.90');
    expect(formatCurrency(round2(149 - discount))).toBe('$134.10');
  });

  // AC-P-5 — non-VIP tickets get no discount; ws1 stays $149.
  it('General/Student → discount 0', () => {
    expect(workshopDiscountAmount('general', [149])).toBe(0);
    expect(workshopDiscountAmount('student', [149])).toBe(0);
    expect(formatCurrency(149)).toBe('$149');
  });

  // AC-P-3/P-4 (pure part) — discount is computed only from the workshop prices it
  // is given, so meal/merch/ticket prices (never passed) can never be discounted.
  it('no discount on meals/merch/ticket', () => {
    expect(workshopDiscountAmount('vip', [])).toBe(0);
    // Two workshops summed then discounted (VIP): (149 + 179) * 0.10 = 32.80.
    expect(workshopDiscountAmount('vip', [149, 179])).toBe(32.8);
  });
});

describe('round2', () => {
  it('rounds binary-float drift to whole cents', () => {
    expect(round2(149 * 0.1)).toBe(14.9);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});
