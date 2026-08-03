module.exports = {
  displayName: '@org/backend',
  preset: '../../jest.preset.js',
  coverageDirectory: 'test-output/jest/coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/generate-openapi.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
    // NestJS classes combining a class decorator (@Controller/@Injectable)
    // with constructor-parameter-property DI compile to a synthetic branch
    // this project's coverage collector can't fully hit. Recurring pattern,
    // not unique to this file — see testing-exceptions.md OPEN-002.
    '**/app.controller.ts': {
      branches: 70,
    },
  },
};
