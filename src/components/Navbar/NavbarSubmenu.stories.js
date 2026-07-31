import { NavGroup } from './NavbarSubmenu';

const RotatedColumn = Story => (
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

export default {
  title: 'Navbar/Submenu',
  component: NavGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [RotatedColumn],
};

const defaultChildren = [
  { label: 'Intuit', pathname: '/#experience-intuit', isActive: undefined },
  { label: 'Rivian', pathname: '/#experience-rivian', isActive: undefined },
  { label: 'Walmart', pathname: '/#experience-walmart', isActive: undefined },
];

export const Closed = {
  args: {
    label: 'Experience',
    pathname: '/#experience',
    children: defaultChildren,
    isActive: undefined,
    forceOpen: false,
  },
};

export const Open = {
  args: {
    label: 'Experience',
    pathname: '/#experience',
    children: defaultChildren,
    isActive: undefined,
    forceOpen: true,
  },
};

export const ScrollActiveChild = {
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
