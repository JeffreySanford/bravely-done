import { AnimationDirector, AnimationSequence } from './animation-director';

describe('AnimationDirector', () => {
  it('dispatches events to every registered sequence', () => {
    const a: AnimationSequence = { onEvent: jest.fn() };
    const b: AnimationSequence = { onEvent: jest.fn() };
    const director = new AnimationDirector();
    director.register(a);
    director.register(b);

    const event = { type: 'arrival' as const, firstArrival: true };
    director.dispatch(event);

    expect(a.onEvent).toHaveBeenCalledWith(event);
    expect(b.onEvent).toHaveBeenCalledWith(event);
  });

  it('does nothing when no sequences are registered', () => {
    const director = new AnimationDirector();

    expect(() => director.dispatch({ type: 'questCompleted', constructionStage: 1 })).not.toThrow();
  });
});
