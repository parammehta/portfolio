import type { Meta, StoryObj } from '@storybook/nextjs';
import { Monogram } from 'components/Monogram';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta: Meta<typeof Monogram> = {
  title: 'Monogram',
  component: Monogram,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Monogram>;

export const Default: Story = {
  render: () => (
    <StoryContainer>
      <Monogram highlight />
    </StoryContainer>
  ),
};

export const NoHighlight: Story = {
  render: () => (
    <StoryContainer>
      <Monogram />
    </StoryContainer>
  ),
};
