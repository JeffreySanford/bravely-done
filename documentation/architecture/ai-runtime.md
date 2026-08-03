# AI Runtime Architecture

## Port

```typescript
interface CompanionAI {
  createQuest(input: QuestInput): Promise<QuestDraft>;
  decomposeQuest(quest: Quest): Promise<QuestStep[]>;
  suggestNextAction(context: PlayerContext): Promise<Suggestion>;
  prepareDailyAdventure(context: PlayerContext): Promise<DailyAdventure>;
  generateCelebration(result: QuestResult): Promise<CompanionMessage>;
}
```

## Adapters

- RulesCompanionAI
- AppleOnDeviceCompanionAI
- AndroidOnDeviceCompanionAI
- PackagedLocalModelCompanionAI
- OptionalCloudCompanionAI

## Selection

A capability service selects the safest available adapter. The rules adapter always remains available.

## Guardrails

- Structured outputs validated against schemas
- No direct database or economy mutation by model output
- Tool calls pass through application authorization
- Personal memory remains explicit and inspectable
- Sensitive or high-stakes advice receives boundaries and escalation guidance
