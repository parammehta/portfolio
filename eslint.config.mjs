import js from '@eslint/js';
import nextConfig from 'eslint-config-next';
import storybook from 'eslint-plugin-storybook';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'build/**',
      'build-storybook/**',
      'public/draco/**',
      'public/og/**',
      'functions/**',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextConfig,
  ...storybook.configs['flat/recommended'],
  {
    rules: {
      semi: 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'import/no-anonymous-default-export': 'off',
      'react/display-name': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', 'jest.setup.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
  },
  {
    files: [
      'scripts/**/*.js',
      'postcss.config.js',
      '__mocks__/*.js',
      'next.config.js',
    ],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        __dirname: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
