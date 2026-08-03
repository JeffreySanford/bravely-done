# Animation Architecture

## Boundary

Three.js is a projection of domain state. It does not calculate rewards, decide completion, or own durable player progress.

## Event flow

```text
QuestCompleted
  -> backend transaction grants RewardBundle and CampMutation
  -> NgRx receives authoritative result
  -> AnimationDirector creates an AnimationPlan
  -> Three.js and DOM animation adapters execute it
  -> completion acknowledgement marks the presentation complete
```

## Animation plan

An animation plan contains named steps, duration bounds, skip behavior, accessibility narration, haptic/audio cues, and a final-state snapshot.

## Motion modes

- Full: complete choreography and particles
- Reduced: shorter camera motion, limited particles, no forced zoom
- Minimal: direct state transition with semantic confirmation

All modes grant identical rewards and produce the same durable state.

## Performance rules

- Clamp device pixel ratio.
- Stop render loop when hidden.
- Dispose geometry, materials, textures, and listeners.
- Use instancing and compressed assets where evidence supports them.
- Establish budgets on a representative mid-tier Android device.
