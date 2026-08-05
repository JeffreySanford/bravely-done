/** Mirrors apps/backend/src/character/character.service.ts's
 * WORKBENCH_MAX_LEVEL / WORKBENCH_UPGRADE_COSTS. The backend is the
 * source of truth (and rejects an unaffordable upgrade regardless of what
 * the client thinks); these are for display and the client-side
 * "can I afford the next level" check that disables the button early. */
export const WORKBENCH_MAX_LEVEL = 3;
export const WORKBENCH_UPGRADE_COSTS = [10, 20, 30];
