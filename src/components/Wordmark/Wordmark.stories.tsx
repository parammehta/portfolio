import type { Meta, StoryObj } from '@storybook/nextjs';
import { Wordmark } from 'components/Wordmark';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta: Meta<typeof Wordmark> = {
  title: 'Wordmark',
  component: Wordmark,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Wordmark>;

export const Default: Story = {
  render: () => (
    <StoryContainer>
      <Wordmark highlight />
    </StoryContainer>
  ),
};

export const NoHighlight: Story = {
  render: () => (
    <StoryContainer>
      <Wordmark />
    </StoryContainer>
  ),
};
