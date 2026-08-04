module.exports = {
  displayName: 'frontend',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: 'test-output/jest/coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/app/api/**',
  ],
  coverageThreshold: {
    global: {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
    // Real WebGLRenderer/Three.js scene-graph construction — jsdom has no
    // WebGL implementation, so this can't be meaningfully unit-tested.
    // Compensating evidence is a real Playwright e2e test (character-select
    // .spec.ts) that renders this across three actual browser engines.
    // See testing-exceptions.md OPEN-004.
    '**/renderer-lifecycle.ts': {
      branches: 0,
      functions: 0,
      lines: 4,
      statements: 4,
    },
    '**/character-select-scene.ts': {
      branches: 0,
      functions: 10,
      lines: 14,
      statements: 13,
    },
    '**/base-camp-scene.ts': {
      branches: 0,
      functions: 4,
      lines: 6,
      statements: 6,
    },
  },
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
