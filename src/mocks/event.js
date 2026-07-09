const PERKS = {
  ALL_SESSIONS: 'All sessions',
  KEYNOTE_ACCESS: 'Keynote access',
  LUNCH_INCLUDED: 'Lunch included',
  VIP_LOUNGE: 'VIP lounge',
  SPEAKER_MEET_GREET: 'Speaker meet & greet',
  WORKSHOP_DISCOUNT: '10% off workshops',
};
export const event = {
  id: 'evt-2028-webdev',
  name: 'WebDev Summit 2028',
  description:
    'A two-day conference for web developers featuring talks on frontend, backend, and DevOps. Join industry leaders for in-depth sessions, hands-on workshops, and networking opportunities.',
  dates: ['2028-11-15', '2028-11-16'],
  venue: {
    name: 'Grand Tech Convention Center',
    address: '1234 Innovation Blvd, San Francisco, CA 94105',
  },
  ticketTypes: [
    {
      id: 'general',
      name: 'General',
      price: 299,
      description: 'Access to all sessions and keynotes',
      perks: [PERKS.ALL_SESSIONS, PERKS.KEYNOTE_ACCESS, PERKS.LUNCH_INCLUDED],
    },
    {
      id: 'vip',
      name: 'VIP',
      price: 599,
      description: 'Premium experience with exclusive perks',
      perks: [
        PERKS.ALL_SESSIONS,
        PERKS.KEYNOTE_ACCESS,
        PERKS.LUNCH_INCLUDED,
        PERKS.VIP_LOUNGE,
        PERKS.SPEAKER_MEET_GREET,
        PERKS.WORKSHOP_DISCOUNT,
      ],
    },
    {
      id: 'student',
      name: 'Student',
      price: 99,
      description: 'Discounted rate for students with valid ID',
      perks: [PERKS.ALL_SESSIONS, PERKS.KEYNOTE_ACCESS],
    },
  ],
};
