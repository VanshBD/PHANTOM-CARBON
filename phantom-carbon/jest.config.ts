import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/__tests__/services/**/*.test.ts',
        '<rootDir>/src/__tests__/api/**/*.test.ts',
        '<rootDir>/src/__tests__/lib/**/*.test.ts',
      ],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
      },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['<rootDir>/src/__tests__/components/**/*.test.tsx'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', jsx: 'react-jsx' } }],
      },
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
  ],
  // Collect coverage from the most testable parts of the codebase
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/lib/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['text', 'text-summary', 'lcov'],
  // Thresholds set to what's achievable given external dependencies (Groq, Redis, Prisma)
  // that require mocking for full coverage
  coverageThreshold: {
    global: {
      lines:     65,
      functions: 60,
      branches:  45,
    },
  },
};

export default config;
