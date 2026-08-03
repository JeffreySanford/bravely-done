# Security and Privacy

## Current foundation

The Prisma schema includes users, roles, and database-backed sessions so individual refresh sessions can be revoked. Raw refresh tokens must never be stored.

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
