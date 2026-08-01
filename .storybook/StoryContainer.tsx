import type { CSSProperties, PropsWithChildren } from 'react';
import './StoryContainer.css';

interface StoryContainerProps {
  padding?: number;
  stretch?: boolean;
  gutter?: number;
  vertical?: boolean;
  style?: CSSProperties;
}

export const StoryContainer = ({
  padding = 32,
  stretch,
  gutter = 32,
  vertical,
  children,
  style,
}: PropsWithChildren<StoryContainerProps>) => (
  <div
    className="storyContainer"
    style={{
      padding,
      gap: gutter,
      flexDirection: vertical ? 'column' : 'row',
      alignItems: stretch ? 'stretch' : 'flex-start',
      justifyContent: stretch ? 'stretch' : 'flex-start',
      ...style,
    }}
  >
    {children}
  </div>
);
