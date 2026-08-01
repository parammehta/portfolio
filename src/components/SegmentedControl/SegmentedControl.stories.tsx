import type { Meta, StoryObj } from '@storybook/nextjs';
import { SegmentedControl, SegmentedControlOption } from 'components/SegmentedControl';
import { useState } from 'react';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta: Meta<typeof SegmentedControl> = {
  title: 'SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
  args: {
    label: 'Select an option',
    options: ['Option 1', 'Option 2', 'Option 3'],
  } as Record<string, unknown>,
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

const Story = ({ options, ...args }: { options?: string[] } & Record<string, unknown>) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  return (
    <StoryContainer>
      <SegmentedControl
        currentIndex={currentIndex}
        onChange={setCurrentIndex}
        label={args.label as string}
      >
        {options?.map((option, index) => (
          <SegmentedControlOption key={`${option}-${index}`}>
            {option}
          </SegmentedControlOption>
        ))}
      </SegmentedControl>
    </StoryContainer>
  );
};

export const Default: Story = {
  render: Story,
};
