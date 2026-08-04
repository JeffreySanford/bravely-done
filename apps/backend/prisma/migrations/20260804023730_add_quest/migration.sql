-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('OPEN', 'COMPLETED');

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
