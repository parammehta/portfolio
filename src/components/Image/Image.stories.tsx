import type { Meta, StoryObj } from '@storybook/nextjs';
import { Image } from 'components/Image';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta: Meta<typeof Image> = {
  title: 'Image',
  component: Image,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Image>;

const imageData = {
  alt: 'An abstract purple and pink neon thing',
  src: {
    src: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=960&h=540&q=80',
    width: 960,
    height: 540,
  },
  placeholder: {
    src: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=64&h=36&q=0',
    width: 64,
    height: 36,
  },
};

const Story = (args: React.ComponentProps<typeof Image>) => (
  <StoryContainer>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0px, 960px)' }}>
      <Image {...args} alt={args.alt} />
    </div>
  </StoryContainer>
);

export const Default: Story = {
  args: { ...imageData },
  render: Story,
};

export const Reveal: Story = {
  args: { ...imageData, reveal: true },
  render: Story,
};
