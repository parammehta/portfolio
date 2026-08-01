import type { Meta, StoryObj } from '@storybook/nextjs';
import { Text } from 'components/Text';
import { VisuallyHidden } from 'components/VisuallyHidden';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta: Meta<typeof VisuallyHidden> = {
  title: 'VisuallyHidden',
  component: VisuallyHidden,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof VisuallyHidden>;

export const Default: Story = {
  render: () => (
    <StoryContainer vertical>
      <Text>The text below is visually hidden but present in the accessibility tree.</Text>
      <VisuallyHidden>This text is hidden from sighted users</VisuallyHidden>
    </StoryContainer>
  ),
};

export const Visible: Story = {
  render: () => (
    <StoryContainer vertical>
      <VisuallyHidden visible>Visible override — shown to everyone</VisuallyHidden>
    </StoryContainer>
  ),
};

export const ShowOnFocus: Story = {
  render: () => (
    <StoryContainer vertical>
      <Text>Tab into the page to reveal the hidden element below.</Text>
      <VisuallyHidden showOnFocus>
        <a href="#main">Skip to main content</a>
      </VisuallyHidden>
    </StoryContainer>
  ),
};
