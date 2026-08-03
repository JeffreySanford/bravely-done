# AI Runtime Architecture

See [AI companion](../product/ai-companion.md) for the product decisions this implements: Ember is a
remote, task-driven LLM service, built in-scope and connected through the NestJS backend's own API —
not primarily an on-device/local-first feature with cloud as a rare fallback.

## Port

```typescript
interface CompanionAI {
  createQuest(input: QuestInput): Promise<QuestDraft>;
  decomposeQuest(quest: Quest): Promise<QuestStep[]>;
  suggestNextAction(context: PlayerContext): Promise<Suggestion>;
  prepareDailyAdventure(context: PlayerContext): Promise<DailyAdventure>;
  generateCelebration(result: QuestResult): Promise<CompanionMessage>;
  executeRoutineAction(action: RoutineAction, context: PlayerContext): Promise<ActionOutcome>;
}
```

## Adapters

- **RemoteEmberCompanionAI** — the primary adapter, calling the in-scope NestJS-backed Ember service.
  This is the intended runtime for the shipped product, not an optional enhancement.
- **RulesCompanionAI** — deterministic, no-network fallback so the core quest/sprint loop keeps working
  with Ember unavailable or disabled. Always available.

On-device/local model adapters are **not** part of the current architecture — they were an earlier
draft direction superseded by the remote-service decision. Revisit only if a specific product need
(offline mobile play, cost, latency) makes it worth the added complexity; don't build it speculatively.

## Selection

A capability service selects `RemoteEmberCompanionAI` when Ember is reachable and enabled, falling back
to `RulesCompanionAI` otherwise. The rules adapter always remains available so the core loop never hard-
depends on Ember.

## Autonomy and guardrails

Ember is not purely advisory — see
[AI companion: agency](../product/ai-companion.md#agency-advisor-by-default-confidence-gated-execution).
Guardrails constrain *how* Ember acts, not whether it can act at all:

- Structured outputs validated against schemas.
- Routine-action execution (`executeRoutineAction`) is **confidence-gated**: Ember assesses its own
  confidence/risk per action and only proceeds autonomously when justified, escalating to the player
  otherwise. This is a real capability, not disabled-by-default.
- All tool calls — autonomous or player-confirmed — pass through the same application authorization and
  RBAC boundary as any other mutation; nothing bypasses it because it originated from Ember.
- Every autonomous action is captured in the [unified event log](architecture.md#unified-event-logging)
  (audit trail + activity feed), so autonomous behavior is always inspectable after the fact.
- Personal memory remains explicit and inspectable.
- Sensitive or high-stakes advice receives boundaries and escalation guidance.
