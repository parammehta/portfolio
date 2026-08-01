import type { Meta, StoryObj } from '@storybook/nextjs';
import { Text } from 'components/Text';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta: Meta<typeof Text> = {
  title: 'Text',
  component: Text,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Text>;

export const Size: Story = {
  render: () => (
    <StoryContainer vertical>
      <Text size="xl">XLarge</Text>
      <Text size="l">Large</Text>
      <Text size="m">Medium</Text>
      <Text size="s">Small</Text>
    </StoryContainer>
  ),
};

export const Weight: Story = {
  render: () => (
    <StoryContainer vertical>
      <Text weight="regular">Regular</Text>
      <Text weight="medium">Medium</Text>
      <Text weight="bold">Bold</Text>
    </StoryContainer>
  ),
};

export const Align: Story = {
  render: () => (
    <StoryContainer vertical stretch>
      <Text align="start">Start</Text>
      <Text align="center">Center</Text>
    </StoryContainer>
  ),
};
