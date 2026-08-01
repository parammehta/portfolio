import { themes } from 'storybook/theming';
import { addons } from 'storybook/manager-api';

addons.setConfig({
  theme: {
    ...themes.dark,
    brandImage: 'https://parammehta.com/icon.svg',
    brandTitle: 'Param Mehta Components',
    brandUrl: 'https://parammehta.com',
  },
});
