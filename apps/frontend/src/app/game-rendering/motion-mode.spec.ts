import { detectMotionMode } from './motion-mode';

describe('detectMotionMode', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns "reduced" when the OS prefers reduced motion', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    expect(detectMotionMode()).toBe('reduced');
  });

  it('returns "full" when the OS does not prefer reduced motion', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
    expect(detectMotionMode()).toBe('full');
  });

  it('falls back to "reduced" when matchMedia is unavailable', () => {
    // @ts-expect-error simulating an environment without matchMedia
    delete window.matchMedia;
    expect(detectMotionMode()).toBe('reduced');
  });
});
