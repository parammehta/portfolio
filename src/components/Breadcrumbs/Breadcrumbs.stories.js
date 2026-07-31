import { Breadcrumbs } from 'components/Breadcrumbs';
import { ProjectHeader } from 'layouts/Project';
import { StoryContainer } from '../../../.storybook/StoryContainer';

export default {
  title: 'Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
};

// Breadcrumbs carry no padding of their own — they expect to sit inside an
// already-padded container, so the stories supply that container.
export const TwoLevel = {
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

export const ThreeLevel = {
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

// How breadcrumbs actually ship: passed to a page header, which supplies the
// section padding and the spacing above the heading.
export const InPageHeader = {
  render: () => (
    <ProjectHeader
      title="Resume"
      description="Software engineer with 8+ years building identity, frontend, and AI-native experiences."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Resume', href: '/resume' },
      ]}
    />
  ),
};
