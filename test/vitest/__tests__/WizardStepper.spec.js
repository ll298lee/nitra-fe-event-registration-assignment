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
    // Steps 0 and 1 are completed → check icons; steps 2 and 3 show numbers.
    expect(wrapper.findAll('.q-icon')).toHaveLength(2);
    expect(wrapper.findAll('button')[2].attributes('aria-current')).toBe('step');
  });
});
