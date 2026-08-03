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
      step *enforcement* is a frontend routing concern — see the Frontend section below, still open.

## Frontend

- [x] Build signup/login UI wired to the auth API via the generated OpenAPI client. Styled to the
      sci-fi/cyber direction from the start (glowing glassmorphic panels, animated grid veil, entrance
      motion) rather than deferring polish — signals-based state (`AuthStateService`), reactive forms,
      httpOnly-cookie auth via a `withCredentials` interceptor.
- [x] Build character creation UI, same visual language, with a success-state animation before
      advancing.
- [ ] Build character-select landing screen with Three.js, stylized sci-fi/cyber direction matching
      Ember's presentation. Current `/characters` page is a functional, styled placeholder (card grid,
      not yet 3D) — this is the one remaining piece of this plan.
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
- [ ] Character select is visually polished **with Three.js** before this plan is considered fully
      complete. The current CSS-only placeholder is deliberately styled to the same standard as the
      auth pages, but the 3D treatment is still open — this is the one item carried into the next
      milestone.
