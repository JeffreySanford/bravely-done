# Character Select and Onboarding

Character select — not [Base Camp](base-camp.md) — is the app's landing page, for every user,
including a returning user with only one character. Base Camp is what the player lands in *after*
picking a character, not a competing entry point.

## Why character-select-first

- Establishes early that characters are a real, persistent, multi-character concept, not an afterthought
  bolted on later.
- Gives new users a natural, single place to create their first character, without a separate
  onboarding branch that diverges from the returning-user flow.
- Is itself a strong FUN-factor moment — a stylized, animated selection screen (sci-fi/cyber, matching
  Ember's visual language — see [AI companion](ai-companion.md)) that makes the app feel like a game
  before the player reaches their first real task.

## Onboarding flow

1. Signup (RBAC-driven auth against Postgres — see
   [Security and privacy](../architecture/security-privacy.md)).
2. **Character creation is mandatory** for a brand-new user — no guest/preview browsing of the
   character-select or Base Camp UI before a character exists. Signup flows directly into character
   creation.
3. After creation (or for a returning user), land on character select.
4. Choosing a character enters that character's Base Camp.

## Characters per account

A single user account can hold **multiple characters**. Character select is where the player switches
between them, not a one-time-only setup screen.

## Visual direction

Stylized sci-fi/cyber, consistent with Ember's presentation — holographic dashboards, control-room-style
hubs — rather than a fantasy/D&D aesthetic. (The D&D-style role/class *mechanics* described in
[Agile/SAFe progression](agile-safe-progression.md) are a mechanical analogy only and do not dictate the
visual style.)
