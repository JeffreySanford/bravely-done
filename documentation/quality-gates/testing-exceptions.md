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

## Standing exclusions (not incident-tracked, just documented)

- **Generated OpenAPI client** (`apps/frontend/src/app/api/`) — regenerated from the backend's
  `@nestjs/swagger` decorators via `nx run frontend:generate-api`. Never hand-edited, excluded from
  coverage requirements. If it has bugs, the fix is in the backend DTOs/controllers, not the generated
  file.
- **Framework bootstrap files** (`apps/backend/src/main.ts`, `apps/frontend/src/main.ts`) — startup
  wiring with no branching logic worth unit-testing directly; behavior is covered indirectly by e2e
  tests that exercise the running app.
