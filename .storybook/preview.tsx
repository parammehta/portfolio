import '../src/shell/reset.css';
import '../src/shell/global.css';
import './preview.css';

import { useEffect } from 'react';
import { ThemeProvider, tokenStyles } from 'refract-ui';
import { fontStyles } from '../src/shell/fonts';
import type { Preview } from '@storybook/nextjs';

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as 'light' | 'dark';

      useEffect(() => {
        document.body.dataset.theme = theme;
      }, [theme]);

      return (
        <ThemeProvider themeId={theme}>
          <style>{fontStyles}</style>
          <style>{tokenStyles}</style>
          <div id="story-root" className="storyRoot">
            <Story />
            <div id="portal-root" />
          </div>
        </ThemeProvider>
      );
    },
  ],
  initialGlobals: { theme: 'dark' },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      toolbar: {
        icon: 'paintbrush',
        items: ['light', 'dark'],
      },
    },
  },
  parameters: {
    layout: 'fullscreen',
    controls: { hideNoControlsWarning: true },
  },
};

export default preview;
