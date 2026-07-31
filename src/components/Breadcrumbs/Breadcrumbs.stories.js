import { Breadcrumbs } from './Breadcrumbs';

export default {
  title: 'Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
};

export const TwoLevel = {
  render: () => (
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/' },
        { label: 'Resume', href: '/resume' },
      ]}
    />
  ),
};

export const ThreeLevel = {
  render: () => (
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/' },
        { label: 'Experience', href: '/#experience' },
        { label: 'Intuit', href: '/experience/intuit' },
      ]}
    />
  ),
};
