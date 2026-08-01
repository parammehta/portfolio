import type { Meta, StoryObj } from '@storybook/nextjs';
import { Code } from 'components/Code';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta = {
  title: 'Code',
  component: Code,
  tags: ['autodocs'],
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj<typeof meta>;

export const JavaScript: Story = {
  render: () => (
    <StoryContainer>
      <div style={{ maxWidth: 600, width: '100%' }}>
        <Code className="language-js">
          {`const greet = name => \`Hello, \${name}!\`;
console.log(greet('world'));`}
        </Code>
      </div>
    </StoryContainer>
  ),
};

export const PlainText: Story = {
  render: () => (
    <StoryContainer>
      <div style={{ maxWidth: 600, width: '100%' }}>
        <Code>npm install three</Code>
      </div>
    </StoryContainer>
  ),
};
