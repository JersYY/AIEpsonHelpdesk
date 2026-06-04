-- CreateEnum
CREATE TYPE "FeedbackRating" AS ENUM ('UP', 'DOWN');

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "feedback" "FeedbackRating",
ADD COLUMN     "predictedCategoryId" TEXT,
ADD COLUMN     "predictedConfidence" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "MlModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "metrics" JSONB,
    "trainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MlModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingExample" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'conversation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingExample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MlModel_name_key" ON "MlModel"("name");

-- CreateIndex
CREATE INDEX "MlModel_name_idx" ON "MlModel"("name");

-- CreateIndex
CREATE INDEX "TrainingExample_task_idx" ON "TrainingExample"("task");

-- CreateIndex
CREATE INDEX "TrainingExample_label_idx" ON "TrainingExample"("label");

-- CreateIndex
CREATE INDEX "ChatMessage_feedback_idx" ON "ChatMessage"("feedback");
