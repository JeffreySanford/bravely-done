/** Mirrors apps/backend/src/sprint/sprint.service.ts's
 * SPRINT_DURATION_PRESETS_SECONDS. The backend is the source of truth (and
 * rejects anything else); this is for rendering the preset picker. */
export const SPRINT_DURATION_PRESETS_SECONDS = [900, 1500, 2700, 3600] as const;

export function formatSprintDuration(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}
