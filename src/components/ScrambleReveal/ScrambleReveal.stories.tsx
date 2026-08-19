import type { Meta, StoryObj } from '@storybook/nextjs';
import { ScrambleReveal } from 'components/ScrambleReveal';
import { Heading } from 'components/Heading';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta = {
  title: 'ScrambleReveal',
  component: ScrambleReveal,
  tags: ['autodocs'],
  args: {
    text: 'Say hello',
  },
} satisfies Meta<typeof ScrambleReveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: ({ text }) => (
    <StoryContainer>
      <Heading level={3}>
        <ScrambleReveal delay={0} text={text} />
      </Heading>
    </StoryContainer>
  ),
};
