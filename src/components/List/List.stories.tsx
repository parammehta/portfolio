import type { Meta, StoryObj } from '@storybook/nextjs';
import { List } from 'components/List';
import { StoryContainer } from '../../../.storybook/StoryContainer';
import { ListItem } from './List';

const meta = {
  title: 'List',
  component: List,
  tags: ['autodocs'],
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

const Story = (args: React.ComponentProps<typeof List>) => (
  <StoryContainer>
    <List {...args}>
      <ListItem>List item 1</ListItem>
      <ListItem>List item 2</ListItem>
      <ListItem>List item 3</ListItem>
    </List>
  </StoryContainer>
);

export const Unordered: Story = {
  args: { ordered: false },
  render: Story,
};

export const Ordered: Story = {
  args: { ordered: true },
  render: Story,
};
