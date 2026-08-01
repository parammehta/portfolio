import type { Meta, StoryObj } from '@storybook/nextjs';
import { Link } from 'components/Link';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta = {
  title: 'Link',
  component: Link,
  tags: ['autodocs'],
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryContainer style={{ fontSize: 18 }}>
      <Link href="https://parammehta.com">Primary link</Link>
      <Link secondary href="https://parammehta.com">
        Secondary link
      </Link>
    </StoryContainer>
  ),
};

export const InternalLink: Story = {
  render: () => (
    <StoryContainer style={{ fontSize: 18 }}>
      <Link href="/#skills">Internal link (RouterLink)</Link>
      <Link secondary href="/#skills">
        Secondary internal link
      </Link>
    </StoryContainer>
  ),
};
