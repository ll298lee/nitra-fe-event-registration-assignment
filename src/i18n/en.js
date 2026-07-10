/**
 * English (`en`) — the default locale and the source of copy truth.
 *
 * Holds every user-facing UI string the app itself renders (headings, labels, buttons,
 * banners, validation and time-conflict messages). Content that comes from the data layer
 * (`src/mocks/*` — event/ticket/session/add-on names, descriptions, perks, prices) is NOT
 * here: it is data, rendered as-is in every locale. Date and currency formatting also stay
 * out — they are handled by `utils/datetime.js` / `utils/pricing.js` (see IMPLEMENTATION_PLAN.md
 * D45). `zh-TW.js` mirrors this key structure exactly.
 */
export default {
  app: {
    title: 'Event Registration',
  },

  language: {
    en: 'EN',
    zhTW: '中文',
    label: 'Language',
  },

  stepper: {
    aria: 'Registration progress',
  },

  steps: {
    attendee: 'Attendee Info',
    sessions: 'Sessions',
    addons: 'Add-ons',
    review: 'Review',
  },

  footer: {
    back: 'Back',
    nextSessions: 'Next: Session Selection',
    nextAddons: 'Next: Add-ons',
    nextReview: 'Next: Review',
    submit: 'Submit Registration',
  },

  field: {
    optional: '(Optional)',
  },

  step1: {
    ticketHeading: 'Select Ticket Type',
    ticketAria: 'Ticket type',
    ticketSelected: '✓ Selected',
    heading: 'Attendee Information',
    fields: {
      fullName: { label: 'Full Name', placeholder: 'Enter your full name' },
      email: { label: 'Email', placeholder: 'Enter your email address' },
      phone: { label: 'Phone', placeholder: 'Enter your phone number' },
      company: { label: 'Company', placeholder: 'Enter your company name' },
      jobTitle: { label: 'Job Title', placeholder: 'Enter your job title' },
      shippingAddress: { label: 'Shipping Address', placeholder: 'Enter your shipping address' },
    },
  },

  step2: {
    heading: 'Select Sessions',
    dayAria: 'Session day',
    counter: '{count} session selected | {count} sessions selected',
  },

  session: {
    soldOut: 'Sold Out',
    spotsLeft: '{n} spots left',
  },

  step3: {
    heading: 'Select Add-ons',
    categoryAria: 'Add-on category',
    tabs: {
      workshop: 'Workshops',
      meal: 'Meal Packages',
      merchandise: 'Merchandise',
    },
  },

  workshop: {
    soldOut: 'Sold Out',
    spotsRemaining: '{n} spots remaining',
  },

  merch: {
    size: 'Size:',
    sizeAria: 'Size for {name}',
    selectPlaceholder: 'Select',
    qty: 'Qty:',
    decreaseAria: 'Decrease {name} quantity',
    increaseAria: 'Increase {name} quantity',
    max: 'max {n}',
    added: '✓ Added to order',
  },

  shipping: {
    title: 'Shipping Information',
    body: 'Merchandise items will be shipped to your address one week before the conference. Please ensure your shipping address in Step 1 is correct.',
  },

  summary: {
    orderTitle: 'Order Summary',
    pricingTitle: 'Pricing Summary',
    aria: {
      order: 'Order summary',
      pricing: 'Pricing summary',
    },
    empty: 'Nothing selected yet.',
    ticketLine: '{name} Ticket',
    line: '{name} × {qty}',
    discount: 'Workshop discount (VIP 10%)',
    total: 'Total',
    grandTotal: 'Grand Total',
  },

  step4: {
    heading: 'Review Your Registration',
    editStep: 'Edit → Step {n}',
    editAria: 'Edit {title}',
    sections: {
      attendee: 'Attendee Information',
      sessions: 'Selected Sessions',
      addons: 'Add-ons',
    },
    rows: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      jobTitle: 'Job Title',
      ticketType: 'Ticket Type',
      shippingAddress: 'Shipping Address',
    },
    addonLabels: {
      workshop: 'Workshop',
      meal: 'Meal',
      merchandise: 'Merchandise',
    },
    empty: {
      sessions: 'No sessions selected.',
      addons: 'No add-ons selected.',
    },
    required: '— (required)',
    requiredMerch: '— (required for merchandise)',
    priceParens: '{name} ({price})',
    errorBannerTitle: 'Please fix the following errors before submitting',
    errorLine: 'Step {step}: {message}',
  },

  success: {
    title: 'Registration Complete!',
    confirmation: 'Confirmation #{number}',
    thanks: 'Thank you, {name}! Your {ticket} registration for {event} is confirmed.',
    email: 'You will receive a confirmation email at {email}.',
    backToHome: 'Back to Home',
  },

  validation: {
    required: '{label} is required',
    labels: {
      fullName: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      jobTitle: 'Job Title',
    },
    emailInvalid: 'Enter a valid email address',
    phoneInvalid: 'Enter a valid phone number',
    shippingRequired: 'Shipping Address is required when merchandise is selected',
    ticketRequired: 'Please select a ticket type',
  },

  // Time-conflict copy is consolidated here so the WorkshopCard in-card status and the
  // Step-4 submit error cannot drift apart (IMPLEMENTATION_PLAN.md D14 / D34d).
  conflict: {
    session: '{a} overlaps with {b}',
    workshop: '{workshop} overlaps with {session}',
    cardOverlaps: 'Overlaps {sessions}',
    cardUnavailable: 'Unavailable — overlaps {sessions}',
  },
};
