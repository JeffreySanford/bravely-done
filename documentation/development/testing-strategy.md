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

## Structuring e2e specs

One spec per behavior, each starting from its own fresh signup via `newPlayer` in
`apps/frontend-e2e/src/support/journey.ts`. The point is diagnosability: when a focused test fails,
its name tells you what broke. This project previously had a single 375-line journey covering
everything from signup to the Chronicle, and its failures surfaced as an opaque mid-journey
`locator.click` timeout that said nothing about the cause.

The exception is deliberate: `quest-loop.spec.ts` stays one long sequential test, because the
property it proves — that real state survives every step _in order_ and then a reload — only exists
in sequence. Split that and you lose the thing it's testing. Reach for a long journey only when
sequence itself is the assertion.

Two practical consequences of per-test signup: every test's first quest completion also earns the
Daily loop's First Brave Step bonus (it's the day's first completion for that brand-new character),
so expected totals must include it; and reward constants are mirrored in `journey.ts` so an expected
total reads as arithmetic rather than a magic number.

## Exceptions

Any untested behavior must be entered in `documentation/quality-gates/testing-exceptions.md` with owner, reason, risk, compensating evidence, and removal criteria.
