/**
 * Minimal domain-event → animation-sequence dispatcher. Scene builders
 * register sequences that react to named domain events (arrival, quest
 * completion, ...) instead of scenes hard-wiring every reaction inline —
 * see planning/02-base-camp-animations.md's "Animation director" section.
 * Deliberately small for now: one director per scene instance, synchronous
 * dispatch, no queuing/sequencing between concurrent events yet. Grows as
 * more domain events (sprint started, loot revealed, ...) come online.
 */
export type BaseCampAnimationEvent =
  | { type: 'arrival'; firstArrival: boolean }
  | { type: 'questCompleted'; constructionStage: number }
  | { type: 'chopTree'; treeIndex: number }
  | { type: 'firewoodGathered'; totalFirewood: number }
  | { type: 'forage' }
  | { type: 'forageGathered'; totalForage: number };

export interface AnimationSequence {
  onEvent(event: BaseCampAnimationEvent): void;
}

export class AnimationDirector {
  private readonly sequences: AnimationSequence[] = [];

  register(sequence: AnimationSequence): void {
    this.sequences.push(sequence);
  }

  dispatch(event: BaseCampAnimationEvent): void {
    for (const sequence of this.sequences) {
      sequence.onEvent(event);
    }
  }
}
