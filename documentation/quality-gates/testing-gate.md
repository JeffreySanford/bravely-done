# Testing quality gate

Target: **98% coverage**, tested early and often, across unit, component/story, and end-to-end layers.
98% rather than 100% is deliberate — some code genuinely can't or shouldn't be covered (see
[testing-exceptions.md](./testing-exceptions.md)), and chasing the last 2% with meaningless tests is
worse than documenting why it's excluded.

"Early and often" means tests are written alongside the feature that needs them, not backfilled before
a release. A quest system, a role/skill-tree, an Ember coaching flow — each should land with its tests
in the same change, not as a follow-up ticket.

## Layers

### Unit tests — Jest

- **What**: services, DTOs/validation logic, pure functions, NestJS controllers/providers, Angular
  component logic that doesn't require rendering.
- **Where**: `apps/backend` (`nx test @org/backend`), `apps/frontend` (`nx test frontend`).
- **Bar**: 98% line/branch coverage per project, enforced via Jest's `coverageThreshold`.

### Component/story tests — Storybook

- **What**: every reusable Angular component gets a story covering its meaningful states (empty,
  loading, error, populated, interactive). Storybook's interaction test addon drives basic
  click/type/assert flows against the story, catching regressions in component behavior, not just
  markup.
- **Where**: `apps/frontend/.storybook`, stories live next to their components.
- **Status**: ⚠️ currently blocked — see [testing-exceptions.md](./testing-exceptions.md) for the open
  Storybook/Angular-esbuild-builder incompatibility. Component logic is still unit-tested via Jest in
  the meantime; visual/interaction coverage is the gap until this is resolved.

### End-to-end tests — Playwright

- **What**: critical user flows exercised against a real running app — onboarding, completing a real
  task, a full team quest, a live ceremony event, Ember executing a routine task, role switching. E2E
  is for flows that cross multiple components/services and can't be meaningfully faked with mocks.
- **Where**: `apps/frontend-e2e` (`nx e2e frontend-e2e`), `apps/backend-e2e` for API-level flows.
- **Bar**: every core-loop user journey has at least one e2e test before that journey ships, regardless
  of the 98% unit/story number — e2e coverage is about flow completeness, not line percentage.

## Enforcement

- Coverage thresholds are checked in CI on every PR; a PR that drops project coverage below 98% fails
  the gate unless the gap is logged in `testing-exceptions.md` with a reviewed justification.
- New files with 0% coverage are treated the same as a regression — no silent exclusions via
  `coveragePathIgnorePatterns` without an entry in the exceptions log.
- Flaky e2e tests get quarantined with a tracked issue, not deleted — quarantine is visible in CI output,
  deletion isn't.

## What "can't be tested" actually means

Legitimate exceptions are narrow: generated code (OpenAPI client, see
[OpenAPI contract](../../packages/openapi/README.md)), third-party framework bootstrap code
(`main.ts`), and — as of this writing — Storybook interaction coverage blocked by an upstream tooling
gap. "Hard to test" or "would take a while" are not legitimate exceptions; they go in the backlog as
tech debt, not the exceptions log.
