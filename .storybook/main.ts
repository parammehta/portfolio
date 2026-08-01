import path from 'path';
import type { StorybookConfig } from '@storybook/nextjs';
import type { RuleSetRule } from 'webpack';

const config: StorybookConfig = {
  addons: ['@storybook/addon-a11y', '@storybook/addon-mcp'],
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  staticDirs: ['../public'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  webpackFinal: async config => {
    config.resolve!.modules = [path.resolve(process.cwd(), 'src'), 'node_modules'];

    const imageRule = config.module!.rules!.find(
      (rule): rule is RuleSetRule =>
        typeof rule === 'object' &&
        rule !== null &&
        rule.test instanceof RegExp &&
        rule.test.test('.svg')
    );
    if (imageRule) imageRule.exclude = /\.svg$/;

    config.module!.rules!.push({
      test: /\.svg$/,
      resourceQuery: { not: [/url/] },
      use: [{ loader: '@svgr/webpack', options: { svgo: false } }],
    });

    config.module!.rules!.push({
      test: /\.(mp4|hdr|glb)$/i,
      type: 'asset/resource',
    });

    config.module!.rules!.push({
      resourceQuery: /url/,
      type: 'asset/resource',
    });

    config.module!.rules!.push({
      test: /\.glsl$/,
      type: 'asset/source',
    });

    return config;
  },
};

export default config;
