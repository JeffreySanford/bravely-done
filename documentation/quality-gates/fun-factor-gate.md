# FUN-factor quality gate

Bravely Done is going to run under Agile/SAFe-style process discipline — sprints, planning, defined
done-criteria — because that discipline is the whole subject matter of the product. But a PM-education
tool that isn't actually *fun* to play has failed regardless of how clean its backlog is. This gate
exists so "does this feel good to play" is a checked, repeatable step in the pipeline, not a vibe.

## Current rigor: lightweight heuristic checklist

For now (solo dev, no external tester pool yet) this gate is a structured self-review, run at the end
of each milestone/feature slice — not a formal external playtest panel. That's intentional: a
lightweight gate that actually runs every milestone beats a rigorous one that never gets scheduled.

### When to run it

- End of every campaign chapter / quest-type feature (e.g. "first team quest is playable")
- Before any milestone demo
- Before merging any change that touches core loop feel: pacing, feedback, animation, Ember dialogue

### The checklist

Score each 1–5. Anything scoring ≤2 needs a written note on why it's shipping anyway (scope
tradeoff, deferred to later milestone, etc.) — the gate isn't a hard blocker yet, but it can't be
silently skipped.

1. **Clarity of goal** — does the player know what they're trying to do in the next 30 seconds, without
   reading documentation?
2. **Feedback is juicy** — does completing an action (task, quest, level-up) produce an immediate,
   satisfying visual/audio/haptic response? Real task completion should feel *better* than checking a
   plain to-do list, not the same.
3. **Pacing** — is there a real task/quest/reward within the first few minutes of any new session, not
   just setup screens?
4. **Ember's presence adds warmth, not friction** — does Ember's coaching feel like a companion helping,
   not a nag or a blocker to getting things done?
5. **Progression is legible** — can the player tell, without opening a stats screen, that they've grown
   since last session?
6. **No hollow grind** — does XP/leveling map to something the player actually did, or does it feel like
   busywork inserted to pad playtime?
7. **Would I show this to someone unprompted?** — the single gut-check question. If the honest answer is
   no, something above scored low even if the individual line items look fine on paper.

### Recording results

Log each run as a dated entry (milestone name, date, scores, any ≤2 notes) in this file's history via
git — no separate tracking system needed while it's a solo/small-group review.

## Where this is going

Once there's a real tester pool (post-MVP, once the core loop is validated), this gate should grow into:

- External playtester panel (5–10 people outside the dev) running the same checklist
- Numeric aggregate scoring with a real pass/fail threshold, not just "notes on low scores"
- Session recordings / analytics on drop-off points to catch pacing problems the checklist misses

Don't build that tooling early — it's wasted effort against an unvalidated core loop. Revisit this
section once there's a playable slice worth testing on strangers.
