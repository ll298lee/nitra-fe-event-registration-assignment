import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import FormField from 'src/components/wizard/FormField.vue';

installQuasarPlugin();

const mountField = (props = {}) => mount(FormField, { props: { label: 'Email', ...props } });

describe('FormField — focus & error border states (D38)', () => {
  // Focus darkens the border to neutral-emphasis without thickening (no ring).
  it('uses the muted rest border, darkens on focus, and never thickens', () => {
    const input = mountField().get('input');
    const cls = input.classes();
    expect(cls).toContain('border-neutral-muted');
    expect(cls).toContain('focus:border-neutral-emphasis');
    expect(cls).not.toContain('border-danger-emphasis');
    // No focus ring / box-shadow → the border color changes but the width does not.
    expect(input.attributes('class')).not.toMatch(/shadow-\[/);
  });

  // An errored field keeps its red border even when focused (no focus override), and its
  // whole label turns red.
  it('keeps the error border red even when focused, and reddens the label', () => {
    const w = mountField({ error: 'Email is required' });
    const input = w.get('input');
    const cls = input.classes();
    expect(cls).toContain('border-danger-emphasis');
    expect(cls).not.toContain('focus:border-neutral-emphasis');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(w.get('label').classes()).toContain('text-danger');
    expect(w.text()).toContain('Email is required');
  });

  it('marks an optional field in the label', () => {
    const w = mountField({ optional: true, label: 'Shipping Address' });
    expect(w.get('label').text()).toContain('(Optional)');
    expect(w.get('label').classes()).toContain('text-neutral');
  });
});
