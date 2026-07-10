import { mount } from '@vue/test-utils';
import SuccessScreen from 'src/components/wizard/SuccessScreen.vue';

// Terminal success screen (D15/D40, frame 1075:903). Presentational — given the confirmation
// number and the echoed state, it renders the confirmation copy and emits "home" on Back to Home.
const props = {
  confirmationNumber: 'WDS-AB12CD34',
  name: 'Ada',
  email: 'ada@example.com',
  ticketName: 'VIP',
  eventName: 'WebDev Summit 2028',
};

describe('SuccessScreen (D15/D40 — AC-4.7, AC-S-2)', () => {
  it('renders the confirmation heading, number, and personalized thank-you (name + email)', () => {
    const w = mount(SuccessScreen, { props });

    expect(w.get('h1').text()).toBe('Registration Complete!');
    expect(w.text()).toContain('Confirmation #WDS-AB12CD34');
    expect(w.text()).toContain(
      'Thank you, Ada! Your VIP registration for WebDev Summit 2028 is confirmed.'
    );
    expect(w.text()).toContain('You will receive a confirmation email at ada@example.com.');
  });

  it('emits "home" when Back to Home is clicked', async () => {
    const w = mount(SuccessScreen, { props });

    const home = w.findAll('button').find((b) => b.text() === 'Back to Home');
    await home.trigger('click');

    expect(w.emitted('home')).toHaveLength(1);
  });
});
