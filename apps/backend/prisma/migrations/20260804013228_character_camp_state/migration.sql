-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "campConstructionStage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hasArrivedAtCamp" BOOLEAN NOT NULL DEFAULT false;
