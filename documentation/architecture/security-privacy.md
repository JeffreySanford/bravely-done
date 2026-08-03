# Security and Privacy

## Current foundation

The Prisma schema includes users, roles, and database-backed sessions so individual refresh sessions can be revoked. Raw refresh tokens must never be stored.

## Auth token model

- Short-lived **JWT access tokens**, issued by NestJS (`@nestjs/jwt` + `passport-jwt`).
- A separate, longer-lived **refresh token backed by the Postgres `Session` table** — not a stateless
  rotating JWT — so an individual session can be forcibly revoked (e.g. "log out this device") without
  needing a blocklist.
- Both access and refresh tokens delivered via **httpOnly + Secure + SameSite cookies**, not
  `localStorage` — defends against XSS-based token theft.
- **RBAC** implemented as a NestJS guard reading the validated role claim off the JWT.

## Requirements

- Hash passwords with a modern memory-hard algorithm.
- Rotate and revoke refresh sessions.
- Validate all API input and enforce authorization server-side.
- Keep secrets in environment variables and secret stores.
- Apply rate limits to authentication and community endpoints.
- Record security-relevant audit events without logging private task text.
- Encrypt transport and use secure mobile storage for tokens.

## Privacy principles

- Private by default
- Minimal collection
- Clear sharing boundaries
- Export and deletion support
- Editable AI memory
- No sale of personal productivity data
- No employer access to private tasks without explicit organizational policy and user visibility
