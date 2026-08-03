# OpenAPI contract

`openapi.json` in this directory is a generated artifact — never hand-edited, never committed.

Regenerate it (and the typed Angular client that consumes it) with:

```bash
nx run frontend:generate-api
```

This runs `@org/backend:generate-openapi` first (boots the NestJS app without listening, writes the
spec from `@nestjs/swagger` decorators) and then `ng-openapi-gen`, which writes the typed client to
`apps/frontend/src/app/api/`.

The backend's DTOs and controllers are the single source of truth. If the frontend and backend types
disagree, regenerate — don't patch the generated files by hand.
