-- CreateEnum
CREATE TYPE "RewardCategory" AS ENUM ('QUEST', 'SPLIT', 'FOCUS', 'COURAGE', 'FIRST_BRAVE_STEP', 'TODAYS_THREE', 'WORKBENCH_UPGRADE');

-- CreateTable
CREATE TABLE "reward_entries" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "category" "RewardCategory" NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reward_entries_characterId_createdAt_idx" ON "reward_entries"("characterId", "createdAt");

-- AddForeignKey
ALTER TABLE "reward_entries" ADD CONSTRAINT "reward_entries_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
