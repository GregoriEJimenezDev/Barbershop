/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: [
    '<rootDir>/src/**/*.test.?(ts|tsx|js|jsx)',
    '<rootDir>/tests/**/*.test.?(ts|tsx|js|jsx)'
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest'
  },
  coverageDirectory: '<rootDir>/coverage'
};

export default config;