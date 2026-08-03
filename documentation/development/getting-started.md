# Developer Getting Started

## Install

```powershell
pnpm install
Copy-Item .env.example .env
```

Fill `DATABASE_URL` and any required MCP or authentication values locally. Never commit `.env`.

## Database

```powershell
docker compose -f docker/docker-compose.yml up -d
pnpm exec prisma generate --config apps/backend/prisma.config.ts
pnpm exec prisma migrate dev --config apps/backend/prisma.config.ts
```

## Serve

```powershell
pnpm nx serve @org/backend
pnpm nx serve frontend
```

## Contract generation

```powershell
pnpm nx run @org/backend:generate-openapi
pnpm nx run frontend:generate-api
```

Generated OpenAPI artifacts are not hand-edited.

## Validation

```powershell
pnpm nx run-many -t lint test build
pnpm nx e2e frontend-e2e
```

## Development expectations

- Preserve Nx boundaries.
- Add tests with behavior.
- Record legitimate coverage gaps in the exception log.
- Provide reduced-motion behavior with every animation.
- Keep backend contracts authoritative.
