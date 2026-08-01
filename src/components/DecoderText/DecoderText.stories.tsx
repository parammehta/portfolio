import type { Meta, StoryObj } from '@storybook/nextjs';
import { DecoderText } from 'components/DecoderText';
import { Heading } from 'components/Heading';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta = {
  title: 'DecoderText',
  component: DecoderText,
  tags: ['autodocs'],
  args: {
    text: 'Slick cyberpunk text',
  },
} satisfies Meta<typeof DecoderText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: ({ text }) => (
    <StoryContainer>
      <Heading level={3}>
        <DecoderText delay={0} text={text} />
      </Heading>
    </StoryContainer>
  ),
};
