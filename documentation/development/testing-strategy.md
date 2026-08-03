# Testing Strategy

## Test pyramid

- Domain unit tests for quest, timer, reward, economy, and progression rules
- Angular component and NgRx tests
- NestJS service/controller tests
- PostgreSQL integration tests for transactions and constraints
- API contract tests
- Storybook interaction and accessibility tests when builder support is stable
- Playwright end-to-end tests for critical player journeys
- Native Android/iOS smoke and lifecycle tests
- Visual and performance evidence for Base Camp states

## Coverage

The codebase targets 98% statements, branches, functions, and lines for testable application code. Coverage is evidence, not a substitute for good assertions.

## Required early journeys

1. Create quest.
2. Start/pause/resume/resolve sprint.
3. Complete quest exactly once.
4. Grant and persist rewards transactionally.
5. Restore Base Camp after reload.
6. Exercise full, reduced, and minimal motion.

## Exceptions

Any untested behavior must be entered in `documentation/quality-gates/testing-exceptions.md` with owner, reason, risk, compensating evidence, and removal criteria.
