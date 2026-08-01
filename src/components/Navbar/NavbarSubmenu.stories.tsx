import type { Meta, StoryObj } from '@storybook/nextjs';
import type { ReactNode } from 'react';
import { NavGroup } from './NavbarSubmenu';

const RotatedColumn = (Story: () => ReactNode) => (
  <div style={{ width: 48, height: 400, position: 'relative' }}>
    <div
      style={{
        transform: 'rotate(-90deg) translate3d(-50%, 0, 0)',
        display: 'flex',
        flexDirection: 'row-reverse',
      }}
    >
      <Story />
    </div>
  </div>
);

const meta: Meta<typeof NavGroup> = {
  title: 'Navbar/Submenu',
  component: NavGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [RotatedColumn],
};

export default meta;
type Story = StoryObj<typeof NavGroup>;

const defaultChildren = [
  { label: 'Intuit', pathname: '/#experience-intuit', isActive: undefined },
  { label: 'Rivian', pathname: '/#experience-rivian', isActive: undefined },
  { label: 'Walmart', pathname: '/#experience-walmart', isActive: undefined },
];

export const Closed: Story = {
  args: {
    label: 'Experience',
    pathname: '/#experience',
    children: defaultChildren,
    isActive: undefined,
    forceOpen: false,
  },
};

export const Open: Story = {
  args: {
    label: 'Experience',
    pathname: '/#experience',
    children: defaultChildren,
    isActive: undefined,
    forceOpen: true,
  },
};

export const ScrollActiveChild: Story = {
  args: {
    label: 'Experience',
    pathname: '/#experience',
    children: [
      { label: 'Intuit', pathname: '/#experience-intuit', isActive: undefined },
      { label: 'Rivian', pathname: '/#experience-rivian', isActive: 'page' },
      { label: 'Walmart', pathname: '/#experience-walmart', isActive: undefined },
    ],
    isActive: undefined,
    forceOpen: true,
  },
};
