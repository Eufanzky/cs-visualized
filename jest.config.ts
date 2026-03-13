import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // Override module settings for Jest compatibility
          module: 'commonjs',
          moduleResolution: 'node',
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  collectCoverageFrom: ['src/**/*.ts', 'src/**/*.tsx', '!src/**/*.d.ts'],
};

export default config;
