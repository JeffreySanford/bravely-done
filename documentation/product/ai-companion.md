# AI Companion

**Ember** is the player's AI companion — a coach, game master, and supportive character, not an
authority over the player. Ember is the first of a small roster of selectable avatars (2-3 at launch)
that differ in personality, tone, and visual presentation only; all avatars share the same underlying
coaching engine, so personality is a presentation-layer choice, not a capability difference.

Ember's visual language is stylized sci-fi/cyber — Ember reads as an AI construct (holographic
presence, control-room-style UI), not a fantasy creature. The D&D-inspired role/class comparison used
elsewhere in these docs (see [Agile/SAFe progression](agile-safe-progression.md)) is a mechanical
analogy only, not the visual style.

## Architecture: remote, not on-device

Ember is powered by a **remote, task-driven LLM service that is in-scope to build**, connected through
the NestJS backend's own API — not a third-party product, and not primarily an on-device/local model
with cloud as a rare fallback. This is a deliberate architecture decision: Ember's coaching quality and
its ability to act on the player's real backend data (tasks, backlog, role progression) depend on
server-side context the client alone can't provide.

Basic quest/sprint functionality still works with Ember unavailable or disabled — Ember is the
motivating hook, not a hard dependency for the core loop — but Ember itself is not designed as a
progressively-enhanced local-first feature the way earlier drafts of this doc framed it.

## Agency: advisor by default, confidence-gated execution

- Ember defaults to **advisor**: it suggests plans, breaks quests into encounters, and coaches on
  Agile/SAFe practice, and the player takes the action themselves.
- Ember is trusted to **directly execute routine, low-stakes tasks** on the player's behalf — creating
  subtasks, updating status, setting reminders — without asking first.
- The line between "advise" and "just do it" is **confidence-based**, not a fixed whitelist or a
  user-configurable permission slider: Ember assesses its own confidence/risk per task and escalates to
  the player when unsure. This mirrors the trust model of good agentic coding assistants — earn
  autonomy on routine work, keep the human in the loop on anything consequential.
- Ember's coaching **specializes per active role/skill-tree** (see
  [Agile/SAFe progression](agile-safe-progression.md)) — different guidance as Facilitator vs. Dev vs.
  Tester, not one generic voice regardless of what the player is doing.

## Progression: Ember levels up alongside the player

Ember and the player's character level on **separate, parallel tracks**, each with both functional and
cosmetic rewards — not a single shared level, and not purely cosmetic on either side:

- **Ember's functional growth**: deeper planning ability, more autonomous-execution scope, new
  integrations it can act through.
- **Ember's cosmetic growth**: new dialogue, animation, personality depth.
- The player's own character levels through the [role/skill-tree system](agile-safe-progression.md)
  independently.

## Capabilities

- Convert vague goals into quests.
- Suggest the smallest useful first step.
- Break complex work into encounters and questlines.
- Estimate duration from history with visible uncertainty.
- Notice recurring blockers and propose experiments.
- Prepare daily, weekly, and monthly adventures.
- Generate contextual dialogue and celebrations.
- Execute routine task actions directly when confident it's appropriate (see Agency above).

## Memory rules

- Memory is visible and editable.
- Sensitive inference is minimized.
- The player can reset or disable personalization.
- Training or personalization never silently uploads private task content.
- Core quest/sprint functionality works with Ember disabled.
