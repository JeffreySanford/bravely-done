/**
 * Full: complete choreography and particles.
 * Reduced: shorter camera motion, limited particles, no forced zoom.
 * Minimal: direct state transition with semantic confirmation (no 3D at all).
 *
 * All modes must grant identical rewards / reach the same durable state — see
 * documentation/architecture/animation-architecture.md.
 */
export type MotionMode = 'full' | 'reduced' | 'minimal';

/**
 * Derives the default motion mode from the OS-level reduced-motion
 * preference. There's no in-app settings UI yet to override this, so this is
 * the whole policy for now — full or reduced. "minimal" (no 3D rendered at
 * all) is reserved for a future explicit low-power/accessibility setting or
 * a WebGL-unavailable fallback, not chosen automatically here.
 */
export function detectMotionMode(): MotionMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'reduced';
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full';
}
