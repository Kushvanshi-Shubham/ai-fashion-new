/*
  Warnings:

  - You are about to drop the `ExtractionResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."ExtractionResult";

-- CreateTable
CREATE TABLE "extraction_results" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "categoryId" TEXT NOT NULL,
    "categoryName" TEXT,
    "attributes" JSONB NOT NULL,
    "confidence" INTEGER,
    "tokensUsed" INTEGER,
    "processingTime" INTEGER,
    "modelUsed" TEXT,
    "costUsd" DECIMAL(10,6),
    "fromCache" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "jobId" TEXT,
    "discoveries" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extraction_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "extraction_results_status_idx" ON "extraction_results"("status");

-- CreateIndex
CREATE INDEX "extraction_results_categoryId_idx" ON "extraction_results"("categoryId");

-- CreateIndex
CREATE INDEX "extraction_results_createdAt_idx" ON "extraction_results"("createdAt");

-- CreateIndex
CREATE INDEX "extraction_results_jobId_idx" ON "extraction_results"("jobId");
