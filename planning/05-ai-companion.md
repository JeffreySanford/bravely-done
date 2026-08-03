# Plan 05: AI Companion (Ember)

See [AI companion](../documentation/product/ai-companion.md) for the product decisions this plan
implements — Ember is a remote, task-driven LLM service built in-scope and connected through the
NestJS backend's API, not a primarily on-device/local-first feature.

- [ ] Build the remote Ember LLM service, connected through a NestJS API (in-scope, not a third-party
      product).
- [ ] Define CompanionAI port and structured outputs against that service.
- [ ] Build curated dialogue and celebration library.
- [ ] Create editable Hero Profile.
- [ ] Implement confidence-based autonomy: Ember advises by default, executes routine/low-stakes tasks
      directly when its own confidence assessment supports it, escalates otherwise.
- [ ] Implement per-role coaching specialization (Ember's guidance adapts to the player's active
      role/skill-tree — see [Agile/SAFe progression](../documentation/product/agile-safe-progression.md)).
- [ ] Build the small selectable avatar roster (2-3 at launch, personality/tone/visual differentiation
      only — same underlying coaching engine).
- [ ] Implement Ember's parallel leveling track (functional + cosmetic), independent of the player
      character's own leveling.
- [ ] Add memory reset/export/delete controls.
- [ ] Verify core quest/sprint flows work with Ember disabled.
