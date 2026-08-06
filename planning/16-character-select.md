# Plan 16: Character Select and Onboarding

See [Character select and onboarding](../documentation/product/character-select.md) for the product
decision this plan implements: character select, not Base Camp, is the app's landing page.

## Backend

- [x] Add PostgreSQL + Prisma database layer.
- [x] Build auth/RBAC: signup, login, JWT access token, DB-backed refresh session table (httpOnly
      cookies, RolesGuard, confidence-gated escalation not yet implemented — see
      [Plan 05](05-ai-companion.md) for that).
- [x] Build Character data model (multiple characters per user account).
- [x] Build character creation/list endpoints (`POST/GET /characters`, JWT-guarded). Mandatory-first-
      step _enforcement_ is a frontend routing concern, handled by the guards in the Frontend section
      below.

## Frontend

- [x] Build signup/login UI wired to the auth API via the generated OpenAPI client. Styled to the
      sci-fi/cyber direction from the start (glowing glassmorphic panels, animated grid veil, entrance
      motion) rather than deferring polish — signals-based state (`AuthStateService`), reactive forms,
      httpOnly-cookie auth via a `withCredentials` interceptor.
- [x] Build character creation UI, same visual language, with a success-state animation before
      advancing.
- [x] Build character-select landing screen with Three.js, stylized sci-fi/cyber direction matching
      Ember's presentation. Real character cards stay the interactive surface; the Three.js scene
      (particle field + orbit rings, cyan/violet palette) is an ambient WebGL backdrop behind them, per
      `documentation/product/base-camp.md`'s interaction rule. Full/reduced/minimal motion mode
      detection and a CSS grid-veil fallback for browsers without WebGL are both wired through
      `apps/frontend/src/app/game-rendering/` (`RendererLifecycle`, `isWebglAvailable`,
      `detectMotionMode`), a reusable module carried forward into Base Camp.
- [x] Enforce mandatory character creation for brand-new users: `authGuard`/`guestGuard` route guards,
      an app initializer (`restoreSessionInitializer`) that resolves the existing cookie session before
      the router activates (so guards never run against unknown state), and post-login/signup routing
      logic that sends a character-less user straight to `/characters/new`.
- [x] Support switching between multiple characters from character select (list view + "New character"
      entry point; full character-switching-into-a-session flow lands with Base Camp/Ember, not this
      plan).

## Acceptance

- [x] A new user cannot reach the character list or any protected screen without first completing
      signup and character creation — verified live (signup → forced through `/characters/new` →
      character list), not just by guard code inspection.
- [x] A returning user with one or more characters lands on character select, not character creation,
      on login — verified live (login with an existing character routes straight to `/characters`).
- [x] Character select is visually polished **with Three.js** — verified live in a real browser
      (signup → character creation → character select), confirming the WebGL canvas actually mounts
      (not the CSS fallback) and real character cards remain interactive above it. Compensating
      automated evidence is `apps/frontend-e2e/src/onboarding.spec.ts`, which runs the same
      journey across Chromium, Firefox, and WebKit. This plan is complete; Base Camp is next
      (see [Plan 02](02-base-camp-animations.md) and [Plan 10](10-now-base-camp.md)).
