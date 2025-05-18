module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@assets/(.*)$': '<rootDir>/attached_assets/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['esbuild-jest', { sourcemap: true }],
  },
  testMatch: ['<rootDir>/client/src/**/*.test.(js|jsx|ts|tsx)'],
  collectCoverageFrom: [
    'client/src/**/*.{js,jsx,ts,tsx}',
    '!client/src/**/*.d.ts',
    '!client/src/main.tsx',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
};