import type { Meta, StoryObj } from '@storybook/nextjs';
import { Input } from 'components/Input';
import { useFormInput } from 'hooks';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta: Meta<typeof Input> = {
  title: 'Input',
  component: Input,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

const Story = (args: React.ComponentProps<typeof Input>) => {
  const exampleValue = useFormInput('');
  return (
    <StoryContainer>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <Input {...exampleValue} {...args} />
      </div>
    </StoryContainer>
  );
};

export const Text: Story = {
  args: { label: 'Your name', type: 'text' },
  render: Story,
};

export const Multiline: Story = {
  args: { label: 'Type a message', type: 'text', multiline: true },
  render: Story,
};
