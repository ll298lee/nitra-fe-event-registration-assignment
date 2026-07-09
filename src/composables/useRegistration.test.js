import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { createRegistration, provideRegistration, useRegistration } from './useRegistration.js';

describe('createRegistration — navigation (D2, D13)', () => {
  it('starts at step 0', () => {
    const r = createRegistration();
    expect(r.currentStep.value).toBe(0);
    expect(r.isFirstStep.value).toBe(true);
    expect(r.isLastStep.value).toBe(false);
  });

  // AC-N-1 (logic level) — free/non-linear: any step reachable, no validation gate.
  it('goToStep jumps to any valid step and clamps out-of-range', () => {
    const r = createRegistration();
    r.goToStep(3);
    expect(r.currentStep.value).toBe(3);
    expect(r.isLastStep.value).toBe(true);
    r.goToStep(99); // ignored (out of range)
    expect(r.currentStep.value).toBe(3);
    r.goToStep(-1); // ignored (out of range)
    expect(r.currentStep.value).toBe(3);
  });

  it('next/prev move one step and clamp at the ends', () => {
    const r = createRegistration();
    r.prev();
    expect(r.currentStep.value).toBe(0); // clamped at start
    r.next();
    r.next();
    expect(r.currentStep.value).toBe(2);
    r.prev();
    expect(r.currentStep.value).toBe(1);
  });
});

describe('createRegistration — state persistence (AC-N-2)', () => {
  it('selections from Steps 1 & 3 survive forward/back navigation', () => {
    const r = createRegistration();
    r.attendee.fullName = 'Ada Lovelace';
    r.ticketId.value = 'vip';
    r.merchSelections.merch1 = { size: 'M', quantity: 2 };

    r.goToStep(3); // forward to Review
    r.goToStep(0); // back to Attendee

    expect(r.attendee.fullName).toBe('Ada Lovelace');
    expect(r.ticketId.value).toBe('vip');
    expect(r.merchSelections.merch1).toEqual({ size: 'M', quantity: 2 });
  });
});

describe('provide/inject wiring (AC-N-3)', () => {
  it('injects one shared store; a mutation in one consumer is seen by another', () => {
    const captured = [];
    const Child = {
      setup() {
        captured.push(useRegistration());
        return () => h('div');
      },
    };
    const Parent = {
      setup() {
        provideRegistration();
        return () => h('div', [h(Child), h(Child)]);
      },
    };

    mount(Parent);

    expect(captured).toHaveLength(2);
    expect(captured[0]).toBe(captured[1]); // same instance
    captured[0].ticketId.value = 'student';
    expect(captured[1].ticketId.value).toBe('student'); // shared reactivity
  });

  it('useRegistration throws when no provider is above it', () => {
    const Lone = {
      setup() {
        useRegistration();
        return () => h('div');
      },
    };
    expect(() => mount(Lone)).toThrow(/provideRegistration/);
  });
});
