import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  moduleNameMapper: {
    '\\.(woff|woff2|eot|ttf|otf|mp4|hdr|glb|glsl)$': '<rootDir>/__mocks__/fileMock.js',
  },
};

// next/jest maps `.svg` to a string stub, but webpack runs SVGR so `.svg`
// imports are React components. moduleNameMapper is first-match-wins and
// next/jest inserts its own rule ahead of ours, so drop it and lead with ours.
export default async () => {
  const config = await createJestConfig(customJestConfig)();
  const inherited = { ...config.moduleNameMapper };
  delete inherited['^.+\\.(svg)$'];

  config.moduleNameMapper = {
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
    ...inherited,
  };

  return config;
};
