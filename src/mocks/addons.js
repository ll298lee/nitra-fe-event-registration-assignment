/**
 * Add-ons are returned as a mixed flat array.
 * The frontend should group them by `category` for display.
 *
 * Categories: workshop, meal, merchandise
 * Workshops have time slots — candidates must check for conflicts with selected sessions.
 * VIP ticket holders get 10% off workshop prices.
 */
export const addons = [
  // ── Workshops ──
  {
    id: 'ws1',
    category: 'workshop',
    name: 'Hands-on Vue.js Testing',
    description:
      'Write unit and component tests with Vitest and Vue Test Utils. Bring your laptop.',
    price: 149,
    date: '2028-11-16T14:00:00Z',
    endDate: '2028-11-16T17:00:00Z',
    capacity: 30,
    registered: 22,
  },
  {
    id: 'ws2',
    category: 'workshop',
    name: 'Docker & Kubernetes for Frontend Devs',
    description: 'Containerize your apps and deploy to Kubernetes from scratch.',
    price: 179,
    date: '2028-11-15T15:30:00Z',
    endDate: '2028-11-15T18:30:00Z',
    capacity: 25,
    registered: 25,
  },

  // ── Meal Packages ──
  {
    id: 'meal1',
    category: 'meal',
    name: 'Standard Lunch (Both Days)',
    description: 'Buffet lunch with vegetarian and vegan options.',
    price: 45,
  },
  {
    id: 'meal2',
    category: 'meal',
    name: 'Premium Dinner — Day 1 Networking Event',
    description: 'Three-course dinner at rooftop venue with open bar and live music.',
    price: 89,
  },

  // ── Merchandise ──
  {
    id: 'merch1',
    category: 'merchandise',
    name: 'Conference T-Shirt',
    description: '100% organic cotton, WebDev Summit 2028 edition.',
    price: 35,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    maxQuantity: 3,
  },
  {
    id: 'merch2',
    category: 'merchandise',
    name: 'Developer Sticker Pack',
    description: 'Set of 12 holographic developer stickers.',
    price: 12,
    maxQuantity: 5,
  },
  {
    id: 'merch3',
    category: 'merchandise',
    name: 'Insulated Water Bottle',
    description: 'Stainless steel, 500ml, laser-engraved logo.',
    price: 28,
    maxQuantity: 2,
  },
  {
    id: 'merch4',
    category: 'merchandise',
    name: 'Laptop Sleeve (15")',
    description: 'Neoprene sleeve with conference branding.',
    price: 42,
    sizes: ['13"', '15"', '16"'],
    maxQuantity: 1,
  },
];
