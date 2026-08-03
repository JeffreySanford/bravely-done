# AI Companion

The companion is a coach, game master, and supportive character—not an authority over the player.

## Capabilities

- Convert vague goals into quests.
- Suggest the smallest useful first step.
- Break complex work into encounters and questlines.
- Estimate duration from history with visible uncertainty.
- Notice recurring blockers and propose experiments.
- Prepare daily, weekly, and monthly adventures.
- Generate contextual dialogue and celebrations.

## Layered implementation

1. Deterministic rules and curated dialogue.
2. Private Hero Profile containing explicit preferences and learned statistics.
3. Small local ranking models for timing and suggestion effectiveness.
4. Optional on-device language-model adapters.
5. Optional cloud model for complex requests with clear consent.

## Memory rules

- Memory is visible and editable.
- Sensitive inference is minimized.
- The player can reset or disable personalization.
- Training or personalization never silently uploads private task content.
- Basic quest and sprint functionality works with AI disabled.
