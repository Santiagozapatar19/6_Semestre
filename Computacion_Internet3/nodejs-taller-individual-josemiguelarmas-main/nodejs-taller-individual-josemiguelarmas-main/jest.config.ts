import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  testMatch: ['**/tests/**/*.test.ts'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 15000,
};

export default config;
