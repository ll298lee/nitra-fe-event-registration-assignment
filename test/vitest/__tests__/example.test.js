/**
 * Example / smoke test — safe to delete once real tests exist.
 *
 * Vitest is set up for targeted business-logic unit tests. Write real tests
 * co-located next to the code they cover, e.g. `src/utils/pricing.test.js` beside
 * `src/utils/pricing.js` (any `src/**` + `*.test.js` is picked up), or under
 * `test/vitest/__tests__/`. Vitest globals (`describe`, `it`, `expect`, …) are
 * enabled, so no imports are required, and the `src` alias resolves to `/src`.
 *
 * Component/SFC testing is also wired up — mount with `@vue/test-utils` and
 * `installQuasarPlugin()` from `@quasar/quasar-app-extension-testing-unit-vitest`.
 * See PLAN.md for a snippet.
 */
import { addons } from 'src/mocks/addons.js';

describe('vitest harness (example — replace with real business-logic tests)', () => {
  it('runs a trivial assertion (smoke test)', () => {
    expect(1 + 1).toBe(2);
  });

  it('can load mock fixtures for future business-logic tests', () => {
    // Real tests will exercise rules the mocks are designed for — VIP workshop
    // discounts, capacity (registered >= capacity), time-conflict detection, etc.
    const merchandise = addons.filter((addon) => addon.category === 'merchandise');
    expect(merchandise.length).toBeGreaterThan(0);
  });
});
