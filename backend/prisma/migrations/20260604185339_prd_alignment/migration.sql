-- CreateEnum
CREATE TYPE "KnowledgeCandidateStatus" AS ENUM ('PENDING', 'NEEDS_EDIT', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RedactionStatus" AS ENUM ('PENDING', 'REDACTED');

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "feedbackComment" TEXT;

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isTemporary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "compactSidebar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultChatMode" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'system';

-- CreateTable
CREATE TABLE "KnowledgeCandidate" (
    "id" TEXT NOT NULL,
    "sourceSessionId" TEXT,
    "createdByUserId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" TEXT,
    "status" "KnowledgeCandidateStatus" NOT NULL DEFAULT 'PENDING',
    "confidenceScore" DOUBLE PRECISION,
    "redactionStatus" "RedactionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "approvedDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeCandidate_status_idx" ON "KnowledgeCandidate"("status");

-- CreateIndex
CREATE INDEX "KnowledgeCandidate_sourceSessionId_idx" ON "KnowledgeCandidate"("sourceSessionId");

-- CreateIndex
CREATE INDEX "ChatSession_archived_idx" ON "ChatSession"("archived");

-- CreateIndex
CREATE INDEX "ChatSession_deletedAt_idx" ON "ChatSession"("deletedAt");
