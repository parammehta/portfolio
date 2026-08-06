import type { Meta, StoryObj } from '@storybook/nextjs';
import { Breadcrumbs } from 'components/Breadcrumbs';
import { PageHeader } from 'components/Page';
import { StoryContainer } from '../../../.storybook/StoryContainer';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const TwoLevel: Story = {
  render: () => (
    <StoryContainer vertical stretch>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Resume', href: '/resume' },
        ]}
      />
    </StoryContainer>
  ),
};

export const ThreeLevel: Story = {
  render: () => (
    <StoryContainer vertical stretch>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Experience', href: '/#experience' },
          { label: 'Intuit', href: '/experience/intuit' },
        ]}
      />
    </StoryContainer>
  ),
};

export const InPageHeader: Story = {
  render: () => (
    <PageHeader
      title="Resume"
      description="Software engineer with 8+ years building identity, frontend, and AI-native experiences."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Resume', href: '/resume' },
      ]}
    />
  ),
};
