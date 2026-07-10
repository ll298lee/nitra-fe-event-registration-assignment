import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import WizardStepper from 'src/components/wizard/WizardStepper.vue';

installQuasarPlugin();

const steps = [
  { key: 'attendee', label: 'Attendee Info' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'addons', label: 'Add-ons' },
  { key: 'review', label: 'Review' },
];

describe('WizardStepper', () => {
  // AC-N-1 — free/non-linear navigation: any step is clickable with no gate.
  it('emits select for a future step when clicked (no validation gate)', async () => {
    const wrapper = mount(WizardStepper, { props: { steps, current: 0 } });
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(4);

    await buttons[3].trigger('click'); // jump straight from step 1 to step 4
    expect(wrapper.emitted('select')[0]).toEqual([3]);
  });

  it('renders a check for completed steps and marks the current step with aria-current', () => {
    const wrapper = mount(WizardStepper, { props: { steps, current: 2 } });
    // Steps 0 and 1 are completed → Figma check-mark SVG; steps 2 and 3 show numbers.
    expect(wrapper.findAll('svg')).toHaveLength(2);
    const buttons = wrapper.findAll('button');
    expect(buttons[2].attributes('aria-current')).toBe('step');
    // The current step shows its number, not a check.
    expect(buttons[2].text()).toContain('3');
  });

  // D37 — a step in errorKeys renders the error state (aria-invalid + red label + "!" glyph),
  // overriding its completed/current style; other steps are unaffected.
  it('marks an errored step regardless of its completed/current state', () => {
    const wrapper = mount(WizardStepper, {
      props: { steps, current: 3, errorKeys: ['attendee'] },
    });
    const buttons = wrapper.findAll('button');

    // Step 1 (attendee) is errored even though it is "completed" (before current=3):
    // aria-invalid, a red label, and the "!" glyph (fill=currentColor) overriding the check.
    expect(buttons[0].attributes('aria-invalid')).toBe('true');
    const errorLabel = buttons[0].findAll('span').find((s) => s.text() === 'Attendee Info');
    expect(errorLabel.classes()).toContain('text-danger');
    expect(buttons[0].find('svg').attributes('fill')).toBe('currentColor');

    // A completed, non-errored step keeps the check glyph (fill=none) and no error flag.
    expect(buttons[1].find('svg').attributes('fill')).toBe('none');
    expect(buttons[1].attributes('aria-invalid')).toBeUndefined();
    expect(buttons[3].attributes('aria-invalid')).toBeUndefined();

    // The connector AFTER the errored step reverts to the incomplete style; connectors after
    // completed, non-errored steps stay in the completed style (D37). Connectors are selected by
    // their responsive base margin (`mx-2`; the `tablet:mx-4` widen is a distinct utility token).
    const connectors = wrapper.findAll('.mx-2');
    expect(connectors[0].classes()).toContain('bg-surface-l2');
    expect(connectors[1].classes()).toContain('bg-brand-emphasis-rest');
  });

  // AC-R-3 (Phase-4 responsive, D44) — below the tablet breakpoint only the current step's label
  // is shown (compact numbered stepper); non-current labels are `hidden tablet:!inline`. The
  // `!` important beats Quasar's `.hidden { display:none !important }`; class presence guards the
  // VIS check (jsdom applies no media queries).
  it('shows only the current step label below tablet, all labels from 768px up', () => {
    const wrapper = mount(WizardStepper, { props: { steps, current: 1 } });
    const labelFor = (i) =>
      wrapper
        .findAll('button')
        [i].findAll('span')
        .find((s) => s.text() === steps[i].label);

    // Current step (1) label is always visible.
    expect(labelFor(1).classes()).toContain('inline');
    expect(labelFor(1).classes()).not.toContain('hidden');

    // Non-current labels are hidden on mobile, restored at tablet+.
    [0, 2, 3].forEach((i) => {
      expect(labelFor(i).classes()).toContain('hidden');
      expect(labelFor(i).classes()).toContain('tablet:!inline');
    });
  });

  // AC-R-3 (a11y) — because the visible label is display:none below tablet (removed from the
  // accessibility tree), every step button carries an aria-label so it keeps a stable accessible
  // name at ALL widths (else non-current steps would announce as a bare digit or, once completed —
  // the check SVG is aria-hidden — as an unnamed button).
  it('gives every step button an aria-label so its accessible name survives the mobile collapse', () => {
    const wrapper = mount(WizardStepper, { props: { steps, current: 1 } });
    const buttons = wrapper.findAll('button');
    steps.forEach((step, i) => {
      expect(buttons[i].attributes('aria-label')).toBe(step.label);
    });
  });
});
