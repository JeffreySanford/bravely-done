# Bravely Done

A gamified Agile/SAFe project-management coach — completing your real tasks *is* the gameplay.
See [documentation/](./documentation) for the product/planning docs and
[documentation/quality-gates/](./documentation/quality-gates) for the FUN-factor and testing quality
gates this project holds itself to.

Nx monorepo: Angular frontend (`apps/frontend`), NestJS backend (`apps/backend`, Prisma + PostgreSQL,
OpenAPI-driven contracts).

## Local development setup

1. **Start Postgres** (Docker):

   ```sh
   docker compose -f docker/docker-compose.yml up -d
   ```

2. **Configure secrets**: copy `.env.example` to `.env` at the repo root and fill in real values
   (GitHub PAT for the MCP server, etc.). The backend also has its own `apps/backend/.env` with
   `DATABASE_URL` — already pointed at the docker-compose Postgres by default.

3. **Install dependencies and generate the Prisma client**:

   ```sh
   pnpm install
   npx prisma generate --schema apps/backend/prisma/schema.prisma
   ```

4. **Run the apps**:

   ```sh
   npx nx serve @org/backend    # http://localhost:3000/api, docs at /api-docs
   npx nx serve frontend        # http://localhost:4200
   ```

## Contract pipeline (OpenAPI)

The backend's `@nestjs/swagger` decorators are the single source of truth for the API contract. Never
hand-edit the generated spec or client — regenerate both with:

```sh
npx nx run frontend:generate-api
```

See [packages/openapi/README.md](./packages/openapi/README.md) for details.

## Quality gates

Every change is expected to clear the [testing gate](./documentation/quality-gates/testing-gate.md)
(98% coverage — unit/Jest, component/Storybook, e2e/Playwright) and, at milestones, the
[FUN-factor gate](./documentation/quality-gates/fun-factor-gate.md). Legitimate gaps against either are
recorded in [testing-exceptions.md](./documentation/quality-gates/testing-exceptions.md), not silently
skipped.

```sh
npx nx run-many -t build lint test
npx nx run-many -t test --coverage
```

## MCP servers

`.mcp.json` wires up `nx-mcp`, Angular CLI's built-in `mcp` server, Playwright, GitHub (hosted remote,
needs `GITHUB_PERSONAL_ACCESS_TOKEN` in `.env`), and Prisma's `mcp` server.
