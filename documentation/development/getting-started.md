# Developer Getting Started

## Install

```powershell
pnpm install
Copy-Item .env.example .env
```

`.env.example` documents every variable and why it's needed. `DATABASE_URL` and `FRONTEND_ORIGIN`
ship with working local defaults; **`JWT_SECRET` is intentionally blank** and must be filled in — the
backend reads it while constructing providers, so a missing value fails at startup rather than with a
clear message. Generate one with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Never commit `.env` — it's gitignored.

## Everything at once

```powershell
pnpm start:all
```

Starts Postgres, generates the Prisma client, applies migrations, and serves both apps. The
individual steps are below if you need them separately.

## Database

```powershell
pnpm db:up          # start Postgres (docker compose)
pnpm db:generate    # regenerate the Prisma client
pnpm db:migrate     # apply existing migrations
pnpm db:down        # stop Postgres
```

To create a _new_ migration after editing `apps/backend/prisma/schema.prisma`:

```powershell
pnpm --filter @org/backend exec prisma migrate dev --name your_change --config prisma.config.ts
```

## Serve

```powershell
pnpm serve:apps     # both, in parallel
pnpm serve:api      # backend only
pnpm serve:web      # frontend only
```

The backend dev server does **not** hot-reload schema/DTO changes — restart it (ideally with
`--skip-nx-cache`) after backend model changes, or it will keep serving a stale compiled bundle. This
has bitten this project before; see Plan 02's "Visual verification" notes.

Health check: `curl http://localhost:3000/api/health` — returns 200 with `{"database":"ok"}` when
Postgres is reachable, 503 when it isn't.

## Contract generation

```powershell
pnpm api:generate
```

Regenerates the OpenAPI contract from the backend's decorators and then the typed Angular client from
that contract. Run it after any DTO or controller change. Generated OpenAPI artifacts are never
hand-edited.

## Validation

```powershell
pnpm quality        # exactly what CI gates on: format check, typecheck, lint, test, build
pnpm e2e            # both e2e tiers (needs a running backend + Postgres)
```

`pnpm quality` is the one command that answers "will CI pass?". The e2e tiers are separate because
they need live servers: `apps/backend-e2e` hits the real API against real Postgres, and
`apps/frontend-e2e` drives Chromium, Firefox, and WebKit.

## Development expectations

- Preserve Nx boundaries.
- Add tests with behavior.
- Record legitimate coverage gaps in the exception log.
- Provide reduced-motion behavior with every animation.
- Keep backend contracts authoritative.
