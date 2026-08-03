# Domain Events and Persistence

## Core events

- PlayerReturned
- QuestCreated
- QuestAccepted
- SprintStarted
- SprintPaused
- SprintResumed
- SprintResolved
- QuestCompleted
- QuestSplit
- QuestRetreated
- RewardGranted
- CampUpgradeApplied
- DailyBonusClaimed
- GuildContributionRecorded

## Transaction rule

A quest result, reward bundle, inventory mutation, and camp progression must commit atomically. Repeated requests use an idempotency key so retries cannot duplicate rewards.

## API response rule

Mutation responses return the authoritative changed aggregate and emitted presentation events. The client must not independently calculate final balances.

## Auditability

Important economic and shared-team mutations should be reconstructable through immutable transaction records, while private task details remain appropriately protected.

## Relationship to the unified event log

These domain events are the primary content of the interceptor-driven unified event log described in
[architecture.md](architecture.md#unified-event-logging) — the same events captured here feed both the
admin observability view and user-facing features like the activity feed, rather than being logged
separately for each purpose.

## Offline direction

Later offline support uses a local outbox and conflict rules. It must not bypass validation or permit client-authoritative currency creation.
