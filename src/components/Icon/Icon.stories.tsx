import type { Meta, StoryObj } from '@storybook/nextjs';
import { Icon, icons } from 'components/Icon';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta: Meta<typeof Icon> = {
  title: 'Icon',
  component: Icon,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Icon>;

export const Icons: Story = {
  render: () => (
    <StoryContainer>
      {(Object.keys(icons) as Array<keyof typeof icons>).map(key => (
        <Icon key={key} icon={key} />
      ))}
    </StoryContainer>
  ),
};
