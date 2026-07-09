/**
 * Sessions are returned as a flat array with ISO timestamps.
 * The frontend should group them by date and handle time-conflict detection.
 *
 * Intentional time overlaps:
 *   Day 1: S2 & S3 overlap (10:00–11:30 vs 10:30–12:00)
 *          S4 & S5 overlap (13:00–14:30 vs 13:30–15:00)
 *   Day 2: S8 & S9 overlap (10:00–11:30 vs 10:30–12:00)
 *          S11 & S12 overlap (14:00–15:30 vs 14:30–16:00)
 */
export const sessions = [
  // ── Day 1: November 15, 2028 ──
  {
    id: 's1',
    title: 'Opening Keynote: The Future of the Web Platform',
    speaker: 'Sarah Chen',
    speakerTitle: 'VP of Engineering, WebCorp',
    track: 'main',
    date: '2028-11-15T09:00:00Z',
    endDate: '2028-11-15T10:00:00Z',
    capacity: 500,
    registered: 487,
    description:
      'Explore the latest web platform APIs and what they mean for developers in 2028 and beyond.',
  },
  {
    id: 's2',
    title: 'Advanced Vue.js Patterns',
    speaker: 'Marco Rossi',
    speakerTitle: 'Core Team, Vue.js',
    track: 'frontend',
    date: '2028-11-15T10:00:00Z',
    endDate: '2028-11-15T11:30:00Z',
    capacity: 120,
    registered: 120,
    description:
      'Deep dive into composables, render functions, and performance optimization techniques.',
  },
  {
    id: 's3',
    title: 'Building Scalable APIs with Node.js',
    speaker: 'Aisha Patel',
    speakerTitle: 'Senior Engineer, CloudScale',
    track: 'backend',
    date: '2028-11-15T10:30:00Z',
    endDate: '2028-11-15T12:00:00Z',
    capacity: 100,
    registered: 78,
    description: 'Patterns and best practices for building production-ready REST and GraphQL APIs.',
  },
  {
    id: 's4',
    title: 'Modern CSS: Beyond Tailwind',
    speaker: 'Yuki Tanaka',
    speakerTitle: 'Design Systems Lead, DesignLab',
    track: 'frontend',
    date: '2028-11-15T13:00:00Z',
    endDate: '2028-11-15T14:30:00Z',
    capacity: 80,
    registered: 65,
    description: 'CSS container queries, cascade layers, and the future of styling on the web.',
  },
  {
    id: 's5',
    title: 'Database Performance Tuning',
    speaker: 'David Kim',
    speakerTitle: 'DBA, DataForge',
    track: 'backend',
    date: '2028-11-15T13:30:00Z',
    endDate: '2028-11-15T15:00:00Z',
    capacity: 90,
    registered: 52,
    description:
      'Query optimization, indexing strategies, and monitoring for PostgreSQL and MySQL.',
  },
  {
    id: 's6',
    title: 'CI/CD Pipelines That Actually Work',
    speaker: 'Elena Volkov',
    speakerTitle: 'DevOps Architect, ShipFast',
    track: 'devops',
    date: '2028-11-15T15:30:00Z',
    endDate: '2028-11-15T17:00:00Z',
    capacity: 100,
    registered: 41,
    description:
      'Build reliable, fast CI/CD pipelines using GitHub Actions, Docker, and Kubernetes.',
  },

  // ── Day 2: November 16, 2028 ──
  {
    id: 's7',
    title: 'Day 2 Keynote: AI-Assisted Development',
    speaker: 'James Liu',
    speakerTitle: 'CTO, CodeAssist AI',
    track: 'main',
    date: '2028-11-16T09:00:00Z',
    endDate: '2028-11-16T10:00:00Z',
    capacity: 500,
    registered: 312,
    description: 'How AI tools are reshaping developer workflows and what comes next.',
  },
  {
    id: 's8',
    title: 'State Management in 2028',
    speaker: 'Ana Morales',
    speakerTitle: 'Staff Engineer, FrontEnd Co',
    track: 'frontend',
    date: '2028-11-16T10:00:00Z',
    endDate: '2028-11-16T11:30:00Z',
    capacity: 110,
    registered: 98,
    description: 'Comparing Pinia, Zustand, Jotai, and signals-based approaches for modern apps.',
  },
  {
    id: 's9',
    title: 'Microservices Communication Patterns',
    speaker: 'Robert Chang',
    speakerTitle: 'Architect, ScaleUp Inc',
    track: 'backend',
    date: '2028-11-16T10:30:00Z',
    endDate: '2028-11-16T12:00:00Z',
    capacity: 90,
    registered: 90,
    description:
      'Event-driven architectures, message queues, and gRPC for service-to-service communication.',
  },
  {
    id: 's10',
    title: 'Observability for Frontend Apps',
    speaker: 'Fatima Al-Rashid',
    speakerTitle: 'Monitoring Lead, ObserveAll',
    track: 'devops',
    date: '2028-11-16T13:00:00Z',
    endDate: '2028-11-16T14:00:00Z',
    capacity: 70,
    registered: 33,
    description: 'Implementing real user monitoring, error tracking, and performance budgets.',
  },
  {
    id: 's11',
    title: 'Accessibility Deep Dive',
    speaker: 'Chris Anderson',
    speakerTitle: 'A11y Specialist, InclusiveWeb',
    track: 'frontend',
    date: '2028-11-16T14:00:00Z',
    endDate: '2028-11-16T15:30:00Z',
    capacity: 80,
    registered: 29,
    description: 'ARIA patterns, screen reader testing, and building truly inclusive interfaces.',
  },
  {
    id: 's12',
    title: 'Edge Computing with Cloudflare Workers',
    speaker: 'Nina Petrov',
    speakerTitle: 'Developer Advocate, Cloudflare',
    track: 'devops',
    date: '2028-11-16T14:30:00Z',
    endDate: '2028-11-16T16:00:00Z',
    capacity: 100,
    registered: 67,
    description: 'Deploy serverless functions at the edge for ultra-low latency applications.',
  },
];
