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
- **Mitigation**: Component *logic* is still covered via Jest unit tests (`nx test frontend`) at the
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

## OPEN-002 — NestJS DI constructor synthetic branch (recurring pattern)

- **Area**: any NestJS class combining a class decorator (`@Controller`, `@Injectable`, etc.) with a
  constructor using parameter-property DI (`constructor(private readonly x: Foo) {}`). First hit in
  `apps/backend/src/app/app.controller.ts`.
- **Reason**: TypeScript's legacy decorator emission (`__esDecorate`) for this combination compiles to
  a branch in the output JS that only ever resolves one way at runtime. This project's coverage
  collector (ts-jest via the Nx Jest preset) reports it as an uncovered branch regardless of test
  coverage of the actual class logic. Confirmed not fixable via `/* istanbul ignore next */` — comments
  don't suppress branches at this collector's instrumentation stage for this decorator-emission pattern.
- **Mitigation**: Per-file `branches` threshold override in `jest.config.cts` for affected files (e.g.
  `app.controller.ts` at 70% instead of the 98% global bar), rather than weakening the global threshold.
  This is a recurring pattern — expect to add a similar override for every new Nest controller/provider
  with constructor DI as the backend grows, not just this one file.
- **Reviewed by / date**: Claude (scaffolding session), 2026-08-03.
- **Reopen condition**: Re-investigate if this project's Jest transform pipeline changes (e.g. swapping
  the coverage instrumenter/provider) — v8-based coverage collection handles decorator emission
  differently and may not hit this issue. Not worth a pipeline change on its own; revisit if the number
  of per-file overrides becomes unwieldy.

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

---

## Standing exclusions (not incident-tracked, just documented)

- **Generated OpenAPI client** (`apps/frontend/src/app/api/`) — regenerated from the backend's
  `@nestjs/swagger` decorators via `nx run frontend:generate-api`. Never hand-edited, excluded from
  coverage requirements. If it has bugs, the fix is in the backend DTOs/controllers, not the generated
  file.
- **Framework bootstrap files** (`apps/backend/src/main.ts`, `apps/frontend/src/main.ts`) — startup
  wiring with no branching logic worth unit-testing directly; behavior is covered indirectly by e2e
  tests that exercise the running app.
