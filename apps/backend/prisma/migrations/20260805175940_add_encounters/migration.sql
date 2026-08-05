-- CreateEnum
CREATE TYPE "EncounterStatus" AS ENUM ('OPEN', 'COMPLETED');

-- CreateTable
CREATE TABLE "encounters" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "EncounterStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "encounters_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
