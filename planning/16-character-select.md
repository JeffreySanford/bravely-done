# Plan 16: Character Select and Onboarding

See [Character select and onboarding](../documentation/product/character-select.md) for the product
decision this plan implements: character select, not Base Camp, is the app's landing page.

## Backend

- [x] Add PostgreSQL + Prisma database layer.
- [x] Build auth/RBAC: signup, login, JWT access token, DB-backed refresh session table (httpOnly
      cookies, RolesGuard, confidence-gated escalation not yet implemented — see
      [Plan 05](05-ai-companion.md) for that).
- [ ] Build Character data model (multiple characters per user account).
- [ ] Build character creation endpoint, tied into the mandatory-first-step onboarding flow.

## Frontend

- [ ] Build signup/login UI wired to the auth API via the generated OpenAPI client.
- [ ] Build character creation UI — functional first, styled plainly.
- [ ] Build character-select landing screen with Three.js, stylized sci-fi/cyber direction matching
      Ember's presentation.
- [ ] Enforce mandatory character creation for brand-new users (no guest/preview browsing first).
- [ ] Support switching between multiple characters from character select.

## Acceptance

- [ ] A new user cannot reach Base Camp or any other screen without first completing signup and
      character creation.
- [ ] A returning user with one or more characters lands on character select, not Base Camp, on login.
- [ ] Character select is visually polished (Three.js, stylized sci-fi/cyber) before this plan is
      considered complete — this is explicitly not left as placeholder UI.
