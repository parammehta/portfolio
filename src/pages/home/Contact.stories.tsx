import type { Meta, StoryObj } from '@storybook/nextjs';
import { Contact } from './Contact';

const meta = {
  title: 'Pages/Home/Contact',
  component: Contact,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    id: 'contact',
  },
} satisfies Meta<typeof Contact>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
