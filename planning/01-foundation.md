# Plan 01: Foundation

## Developer workflow

- [ ] Add root pnpm scripts for frontend, mobile harness, API, database, generation, and quality.
- [ ] Add environment validation.
- [ ] Add workspace format and documentation-link checks.
- [ ] Add CI workflow for affected lint, test, build, and e2e.
- [ ] Add dependency update policy.

## Backend

- [x] NestJS application exists.
- [x] PostgreSQL Docker Compose exists.
- [x] Prisma service and initial schema exist.
- [ ] Add health controller with database probe.
- [ ] Add global validation and error contract.
- [ ] Add structured logging and correlation IDs.
- [ ] Implement authentication/session endpoints.
- [ ] Add API integration-test database lifecycle.

## Frontend

- [x] Angular application exists.
- [ ] Add NgRx Store/Effects.
- [ ] Add environment-based API configuration.
- [ ] Add route shell and responsive layout.
- [ ] Add mobile development harness.
- [ ] Add shared design tokens and accessible primitives.

## Acceptance

- [ ] A clean checkout can start Postgres, migrate, serve API and frontend, generate contracts, and pass quality checks using documented commands.
