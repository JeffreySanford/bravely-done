# Testing exceptions log

Every gap against the [98% testing gate](./testing-gate.md) that isn't a straightforward missing test
gets recorded here: what's excluded, why, what the mitigation is in the meantime, and what would need
to happen to close the gap. This file is reviewed whenever coverage drops or a new exception is added —
it's not a place to quietly bury untested code.

Format per entry: **Area** · **Reason** · **Mitigation** · **Reviewed by / date** · **Reopen condition**

---

## OPEN-001 — Storybook interaction tests blocked by Angular esbuild-builder incompatibility

- **Area**: `apps/frontend` component story/interaction coverage (Storybook layer of the testing gate).
- **Reason**: This project's Angular app uses the newer `@angular/build:application` (esbuild) builder
  via `project.json`, with no `angular.json`. Storybook's Angular framework support currently requires
  one of:
  - Storybook 8.x — needs the legacy `@angular-devkit/build-angular` package, which this project
    doesn't have (superseded by `@angular/build`).
  - Storybook 9.x/10.x — dropped direct-CLI Angular builds entirely (`AngularLegacyBuildOptionsError`);
    requires a full `angular.json` with an explicit `@storybook/angular:build-storybook` builder
    target, which an esbuild-application/project.json-based Nx workspace doesn't have.
    All three combinations were tried directly (2026-08-03) and failed for the reasons above. This is a
    genuine, current gap in the Nx + Angular(esbuild) + Storybook ecosystem, not a local misconfiguration.
- **Mitigation**: Component _logic_ is still covered via Jest unit tests (`nx test frontend`) at the
  98% bar. What's missing is Storybook's story-driven interaction/visual coverage specifically — a real
  but bounded gap, not an untested-component gap.
- **Reviewed by / date**: Claude (scaffolding session), 2026-08-03.
- **Reopen condition**: Re-attempt when either (a) `@nx/storybook` ships Angular esbuild-builder
  support, or (b) the team decides to author a minimal `angular.json` + custom builder target to unblock
  Storybook now rather than wait. Check `@nx/storybook`'s peer range and changelog before re-attempting
  a version bump — pin to whatever `storybook` version `@nx/storybook`'s own `devDependencies` uses,
  don't take the latest that satisfies the peer range (that's what caused the 10.x attempt to fail
  first).

---

## OPEN-002 — NestJS decorator-emission synthetic branch (recurring pattern)

- **Area**: any NestJS class combining a class decorator (`@Controller`, `@Injectable`, etc.) with
  either constructor parameter-property DI (`constructor(private readonly x: Foo) {}`) or a property
  decorator like `@ApiProperty()`. Hit in `app.controller.ts`, `auth.controller.ts`, `auth.service.ts`,
  `roles.guard.ts`, `auth-user.dto.ts`, `character.controller.ts`, `character.service.ts`,
  `character.dto.ts`, `arrive-response.dto.ts`, `quest.controller.ts`, `quest.service.ts`,
  `quest.dto.ts`, `complete-quest-response.dto.ts`.
- **Reason**: TypeScript's legacy decorator emission (`__esDecorate`) for these patterns compiles to a
  branch in the output JS that only ever resolves one way at runtime. This project's coverage collector
  (ts-jest via the Nx Jest preset) reports it as an uncovered branch regardless of test coverage of the
  actual class logic. Confirmed not fixable via `/* istanbul ignore next */` — comments don't suppress
  branches at this collector's instrumentation stage for this decorator-emission pattern.
- **Mitigation**: Per-file `branches` threshold override in `jest.config.cts` for each affected file,
  set close to its actual achievable percentage (so a real regression still fails the gate), rather than
  weakening the global threshold.
- **Reviewed by / date**: Claude (scaffolding session), 2026-08-03; extended to the auth module the same
  day, and again to the character module — both times recurring exactly as predicted.
- **Pipeline-swap investigated and rejected (2026-08-03)**: Tried `coverageProvider: 'v8'` as the
  reopen condition suggested. It did _not_ fix the synthetic branches, and made overall coverage
  reporting measurably worse — several previously-100% files (bare interfaces, simple DTOs) dropped to
  0-40% because v8's bytecode-level instrumentation counts decorator/interface scaffolding differently
  than istanbul does. Reverted. Per-file overrides remain the right tool for this project; not
  revisiting this again without a concrete new instrumenter to try, not just "swap providers and see."
- **Status**: thirteen per-file overrides as of this writing. Accepted as this project's steady-state
  pattern for NestJS decorator-heavy files — add one per new file as needed, no further investigation
  planned.

## OPEN-003 — PrismaService lifecycle hooks require a live database connection

- **Area**: `apps/backend/src/prisma/prisma.service.ts` — `onModuleInit`/`onModuleDestroy`.
- **Reason**: These call `$connect()`/`$disconnect()` against a real Postgres instance. Exercising them
  in the unit suite would make `nx test @org/backend` depend on live infrastructure being up, which
  contradicts this project's own testing-gate philosophy (external-service dependencies belong at the
  e2e tier, not unit). Deliberately not mocked into false coverage either — a mocked `$connect` proves
  nothing real.
- **Mitigation**: Per-file threshold override (`functions: 33`) in `jest.config.cts` for
  `prisma.service.ts`, reflecting exactly the 1-of-3 methods (the constructor) unit tests can cover.
  `onModuleInit`/`onModuleDestroy` should be exercised at `apps/backend-e2e` against the real local
  Postgres (see `docker/docker-compose.yml`) once e2e coverage is built out.
- **Reviewed by / date**: Claude (scaffolding session), 2026-08-03.
- **Reopen condition**: Close this out once an e2e test exists that boots the real Nest app (`app.init()`
  / `app.close()`, not just `.compile()`) against the docker-compose Postgres and asserts a successful
  connect/disconnect cycle.

## OPEN-004 — Three.js/WebGL scene code can't be unit-tested in jsdom

- **Area**: `apps/frontend/src/app/game-rendering/renderer-lifecycle.ts` (real `THREE.WebGLRenderer`,
  `ResizeObserver`, render-loop construction), `apps/frontend/src/app/pages/character-list/
character-select-scene.ts`, and `apps/frontend/src/app/pages/base-camp/base-camp-scene.ts` (real
  Three.js scene-graph object construction: geometries, materials, lights).
- **Reason**: jsdom has no WebGL implementation. Constructing a real `THREE.WebGLRenderer` against a
  jsdom canvas either throws or silently no-ops depending on the mock shape, and there's no way to
  meaningfully assert "the scene looks right" without an actual GPU-backed rendering context. Everything
  _around_ this — motion-mode detection, WebGL-availability detection, and the component-level wiring
  that constructs `RendererLifecycle` and calls `.start()`/`.dispose()` — **is** unit-tested (via
  `jest.mock` on these modules; see `character-list.webgl-available.spec.ts` and `base-camp
.webgl-available.spec.ts`). Only the actual WebGL/Three.js internals are excluded.
- **Mitigation**: Real, automated compensating evidence, not just a documented gap — `apps/frontend-e2e/
src/onboarding.spec.ts` runs a full signup → character-creation → Base Camp → character-select
  → Base Camp journey through three actual browser engines (Chromium, Firefox, WebKit), asserting that
  whichever rendering path the app takes (WebGL canvas or the CSS grid-veil fallback) mounts correctly
  on both scenes and that no unexpected console errors occur. The shared `expectSceneMounted` helper
  lives in `src/support/journey.ts` and is reused by the other specs, so every e2e test exercises a
  real scene mount rather than only this one. This is the same "e2e for what can't be meaningfully faked with
  mocks" principle the testing gate already states, applied to rendering specifically. Per-file
  `jest.config.cts` overrides set to the files' actual achievable percentage (the wiring code coverage
  that leaks through from other tests), not zero.
- **Firefox/CI WebGL gap (2026-08-03)**: Chromium (bundled SwiftShader) and WebKit both provide a
  working software WebGL path in this project's GPU-less CI runner. Headless Firefox does not, even
  with the `webgl.force-enabled` preference set (see `playwright.config.mts`) — `isWebglAvailable()`
  correctly reports `false` there and the app correctly falls back to the grid-veil. The e2e test
  therefore asserts on whichever path actually mounts rather than forcing a canvas assertion Firefox's
  CI environment can't satisfy; the canvas path is still exercised for real on every run via Chromium
  and WebKit. Locally (with a real GPU), Firefox does render the canvas as expected.
- **Reviewed by / date**: Claude (scaffolding session), 2026-08-03.
- **Reopen condition**: Revisit if a headless-WebGL jsdom shim becomes standard practice for this project
  (not planned — e2e is the more honest signal for actual rendering correctness than a mocked WebGL
  context would be), if Nx/Angular gains an officially-supported approach for this, or if a future
  Playwright/Firefox release ships a working headless software-WebGL path.
- **Known gap, confirmed real (2026-08-04)**: the "compensating evidence" above only proves the canvas
  element mounts with a nonzero bounding box — it does not prove anything meaningful is actually drawn,
  or that the canvas isn't visually obscured by other UI. Both failure modes shipped for real: a fuel-
  system change left the campfire fully unlit on arrival, and a layout change (unrelated commit) put
  the quest-board dialog directly over the campfire's screen position. Neither was caught by any
  automated test — both were only found by manually taking a screenshot and reading back live WebGL
  pixel values (see planning/02-base-camp-animations.md's "Visual verification" section for the fix).
  No automated regression test exists for either failure mode yet. Closing this gap (e.g., pixel-
  sampling or visual-regression assertions in the e2e suite) is open, tracked in planning/02.

---

## Standing exclusions (not incident-tracked, just documented)

- **Generated OpenAPI client** (`apps/frontend/src/app/api/`) — regenerated from the backend's
  `@nestjs/swagger` decorators via `nx run frontend:generate-api`. Never hand-edited, excluded from
  coverage requirements. If it has bugs, the fix is in the backend DTOs/controllers, not the generated
  file.
- **Framework bootstrap files** (`apps/backend/src/main.ts`, `apps/frontend/src/main.ts`) — startup
  wiring with no branching logic worth unit-testing directly; behavior is covered indirectly by e2e
  tests that exercise the running app.
