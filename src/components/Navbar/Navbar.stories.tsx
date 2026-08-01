import type { Meta, StoryObj } from '@storybook/nextjs';
import { Navbar } from 'components/Navbar';
import { AppContext } from 'pages/_app.page';
import { expect, userEvent, within } from 'storybook/test';

const appContext = { menuOpen: false, theme: 'dark' as const, dispatch: () => {} };

const meta: Meta<typeof Navbar> = {
  title: 'Navbar',
  component: Navbar,
  tags: ['autodocs'],
  parameters: {
    nextjs: {
      appDirectory: false,
      router: { pathname: '/', asPath: '/' },
    },
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <AppContext.Provider value={appContext}>
        <Story />
      </AppContext.Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Navbar>;

export const Default: Story = {};

export const MenuOpen: Story = {
  parameters: {
    nextjs: {
      appDirectory: false,
      router: { pathname: '/', asPath: '/' },
    },
  },
  decorators: [
    Story => (
      <AppContext.Provider value={{ menuOpen: true, theme: 'dark', dispatch: () => {} }}>
        <Story />
      </AppContext.Provider>
    ),
  ],
};

export const ArticlesPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: false,
      router: { pathname: '/articles', asPath: '/articles' },
    },
  },
};

export const ExperienceSubmenuOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const parent = canvas.getByRole('link', { name: 'Experience' });
    await userEvent.hover(parent);
    await expect(parent).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('link', { name: 'Intuit' })).toBeVisible();
  },
};

export const ExperienceSubmenuKeyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const parent = canvas.getByRole('link', { name: 'Experience' });
    await userEvent.tab();
    while (document.activeElement !== parent) await userEvent.tab();
    await expect(parent).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('link', { name: 'Intuit' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('link', { name: 'Rivian' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(parent).toHaveFocus();
    await expect(parent).toHaveAttribute('aria-expanded', 'false');
  },
};

export const ExperienceDetailPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: false,
      router: { pathname: '/experience/[slug]', asPath: '/experience/intuit' },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: 'Experience' })).toHaveAttribute('aria-current');
  },
};

export const MenuOpenNested: Story = {
  globals: { viewport: { value: 'mobile1' } },
  decorators: [
    Story => (
      <AppContext.Provider value={{ menuOpen: true, theme: 'dark', dispatch: () => {} }}>
        <Story />
      </AppContext.Provider>
    ),
  ],
};
