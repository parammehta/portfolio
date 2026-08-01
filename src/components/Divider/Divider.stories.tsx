import type { Meta, StoryObj } from '@storybook/nextjs';
import { Divider } from 'components/Divider';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta: Meta<typeof Divider> = {
  title: 'Divider',
  component: Divider,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Divider>;

export const Default: Story = {
  render: () => (
    <StoryContainer vertical stretch>
      <Divider />
    </StoryContainer>
  ),
};

export const Light: Story = {
  render: () => (
    <StoryContainer vertical stretch>
      <Divider light notch={false} />
    </StoryContainer>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <StoryContainer vertical stretch>
      <Divider collapsed />
    </StoryContainer>
  ),
};

export const CustomSize: Story = {
  render: () => (
    <StoryContainer vertical stretch>
      <Divider lineWidth="60%" notchWidth="60px" notchHeight="6px" />
    </StoryContainer>
  ),
};
