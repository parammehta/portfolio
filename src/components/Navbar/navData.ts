export interface NavLink {
  label: string;
  pathname: string;
  match?: string;
  children?: NavLink[];
}

import type { IconName } from 'components/Icon/Icon';

export interface SocialLink {
  label: string;
  url: string;
  icon: IconName;
}

export const navLinks: NavLink[] = [
  {
    label: 'Profile',
    pathname: '/#profile',
  },
  {
    label: 'Experience',
    pathname: '/#experience',
    match: '/experience',
    children: [
      { label: 'Intuit', pathname: '/#experience-intuit', match: '/experience/intuit' },
      { label: 'Rivian', pathname: '/#experience-rivian', match: '/experience/rivian' },
      { label: 'Walmart', pathname: '/#experience-walmart', match: '/experience/walmart' },
    ],
  },
  {
    label: 'Skills',
    pathname: '/#skills',
  },
  {
    label: 'Resume',
    pathname: '/resume',
  },
  {
    label: 'Articles',
    pathname: '/articles',
    match: '/articles',
  },
  {
    label: 'Contact',
    pathname: '/contact',
  },
];

export const hashIds = navLinks
  .flatMap(link => [...(link.children ?? []), link])
  .filter(l => l.pathname.startsWith('/#'))
  .map(l => l.pathname.slice(2));

export const socialLinks: SocialLink[] = [
  {
    label: 'Twitter',
    url: 'https://twitter.com/abovepar_am',
    icon: 'twitter',
  },
  {
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/parammehta/',
    icon: 'linkedin',
  },
  {
    label: 'Github',
    url: 'https://github.com/parammehta',
    icon: 'github',
  },
];
