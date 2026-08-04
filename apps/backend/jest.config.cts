module.exports = {
  displayName: '@org/backend',
  preset: '../../jest.preset.js',
  setupFiles: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: 'test-output/jest/coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/generate-openapi.ts',
    '!src/generated/**',
    '!src/test-setup.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
    // NestJS classes combining a class decorator (@Controller/@Injectable)
    // with constructor-parameter-property DI, or a property decorator like
    // @ApiProperty, compile to a synthetic branch this project's coverage
    // collector can't fully hit. Recurring pattern — see
    // testing-exceptions.md OPEN-002.
    '**/app.controller.ts': {
      branches: 70,
    },
    '**/auth.controller.ts': {
      branches: 70,
    },
    '**/auth.service.ts': {
      branches: 85,
    },
    '**/roles.guard.ts': {
      branches: 85,
    },
    '**/auth-user.dto.ts': {
      branches: 70,
    },
    '**/character.controller.ts': {
      branches: 70,
    },
    '**/character.service.ts': {
      branches: 70,
    },
    '**/character.dto.ts': {
      branches: 70,
    },
    '**/session.dto.ts': {
      branches: 70,
    },
    '**/arrive-response.dto.ts': {
      branches: 70,
    },
    // onModuleInit/onModuleDestroy require a live Postgres connection —
    // deliberately exercised at the e2e tier (apps/backend-e2e), not here.
    // See testing-exceptions.md OPEN-003.
    '**/prisma.service.ts': {
      functions: 33,
      lines: 70,
      statements: 70,
    },
  },
};
