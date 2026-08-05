-- AlterEnum
ALTER TYPE "QuestStatus" ADD VALUE 'SPLIT';

-- AlterTable
ALTER TABLE "quests" ADD COLUMN     "lastIdempotencyKey" TEXT;
