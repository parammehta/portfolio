/**
 * The single source of truth for work history.
 *
 * Deliberately free of asset imports: `components/Navbar/navData` builds its
 * Experience submenu from this module, and navData is loaded on every route.
 * Anything imported here lands in the shared bundle.
 */

export type CompanySlug = 'intuit' | 'rivian' | 'walmart';

export interface Role {
  /** Stable React key and anchor id. */
  id: string;
  title: string;
  dateRange: string;
  /** The /experience tab pane renders the first `TAB_HIGHLIGHT_LIMIT` of these. */
  highlights: string[];
}

export interface Company {
  slug: CompanySlug;
  /** Full name, for headings and aria labels. */
  name: string;
  /** Tab rail and navbar submenu label. */
  shortName: string;
  /** Newest role first. */
  roles: Role[];
}

/** How many highlights a role shows on /experience before it costs vertical space we don't have. */
export const TAB_HIGHLIGHT_LIMIT = 2;

export const companies: Company[] = [
  {
    slug: 'intuit',
    name: 'Intuit',
    shortName: 'Intuit',
    roles: [
      {
        id: 'intuit-identity',
        title: 'Staff Software Engineer, Identity Authentication Experiences',
        dateRange: 'Jan 2024 – Present',
        highlights: [
          'Led Passkeys across Intuit, shipping 8 cross-product launches and driving adoption from 10% to 26% of active customers',
          'Architected the first cross-identity SSO pattern at Intuit for Amazon partnership integrations',
          "Currently leading the agentic AI track, building MCP-based agent authentication prototypes and running the org's AI-assisted engineering practice",
        ],
      },
      {
        id: 'intuit-design-system',
        title: 'Software Engineer, Intuit Design System',
        dateRange: 'Jul 2022 – Jan 2024',
        highlights: [
          'Built and maintained 100+ reusable components shared across QuickBooks, TurboTax, Credit Karma, and Mailchimp',
          'Built a theming layer so each product could apply its own brand on top of the same components',
          "Owned the team's Storybook as the source of truth for usage and accessibility guidance, and held weekly office hours to help other teams adopt the library",
        ],
      },
    ],
  },
  {
    slug: 'rivian',
    name: 'Rivian',
    shortName: 'Rivian',
    roles: [
      {
        id: 'rivian-fleet-core',
        title: 'Senior Software Engineer, Full Stack',
        dateRange: 'Jan 2022 – Jul 2022',
        highlights: [
          "Joined as a founding engineer on the Fleet Core team during Rivian's rapid scaling phase",
          'Led a team of 4 engineers to ship a cross-platform notifications system (push, email, in-app inbox, Slack) for fleet management software',
          'Architected the event-driven pipeline using WebSockets, AWS SQS, and EventBridge, with a React frontend consuming a GraphQL API',
        ],
      },
    ],
  },
  {
    slug: 'walmart',
    name: 'Walmart Global Tech',
    shortName: 'Walmart',
    roles: [
      {
        id: 'walmart-marketplace',
        title: 'Senior Software Engineer, Marketplace & UGC',
        dateRange: 'Jan 2021 – Jan 2022',
        highlights: [
          'Re-platformed the 3P seller experience using GraphQL, React, TypeScript, and Next.js, serving 3.1M+ customers',
          'Built the seller ratings and reviews page, ranked the #1 feature in Q2 2021',
          'Architected end-to-end seller workflows across homepage, search, item page, cart, and checkout',
        ],
      },
      {
        id: 'walmart-core-components',
        title: 'Software Engineer, Walmart Core Components',
        dateRange: 'Jan 2020 – Jan 2021',
        highlights: [
          "Built and maintained 100+ reusable components used across Walmart.com, Sam's Club, and Marketplace",
          "Added a theming layer for different Walmart banners and owned the team's Storybook",
        ],
      },
      {
        id: 'walmart-baby-registry',
        title: 'Software Engineer, Wireless Verticals & Baby Registry',
        dateRange: 'Jun 2018 – Jan 2020',
        highlights: [
          'Launched Walmart Baby Registry, reaching 100K new registrants within 30 days',
          'First team at Walmart to adopt TypeScript, earning the internal Tech Evangelist Award',
          'Optimized the PDP buy-box to improve page speed by 15%, generating a 30bps conversion rate lift',
        ],
      },
    ],
  },
];

export const companyHref = (slug: CompanySlug) => `/experience/${slug}`;

export const getCompany = (slug: CompanySlug) =>
  companies.find(company => company.slug === slug)!;
