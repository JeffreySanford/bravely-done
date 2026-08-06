import { RewardCategory } from '../generated/prisma/client';

/** The shape of a single ledger row, before it's written. Kept as a plain
 * value (not a service call) so callers can drop it straight into the
 * `prisma.$transaction([...])` array they already build for the balance
 * change — that co-location is the whole point: a grant and its entry
 * commit together or not at all. */
export interface RewardEntryInput {
  characterId: string;
  category: RewardCategory;
  xp?: number;
  coins?: number;
  sourceId?: string;
}

/** Normalizes an entry for `prisma.rewardEntry.create`. Exists mostly so
 * every call site defaults xp/coins the same way rather than each
 * remembering to pass zeros. */
export function rewardEntryData(input: RewardEntryInput) {
  return {
    characterId: input.characterId,
    category: input.category,
    xp: input.xp ?? 0,
    coins: input.coins ?? 0,
    sourceId: input.sourceId ?? null,
  };
}
