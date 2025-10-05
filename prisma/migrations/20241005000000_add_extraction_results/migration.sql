-- CreateTable
CREATE TABLE "ExtractionResult" (
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
    "fromCache" BOOLEAN DEFAULT false,
    "error" TEXT,
    "jobId" TEXT,
    "discoveries" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractionResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExtractionResult_status_idx" ON "ExtractionResult"("status");
CREATE INDEX "ExtractionResult_categoryId_idx" ON "ExtractionResult"("categoryId");
CREATE INDEX "ExtractionResult_createdAt_idx" ON "ExtractionResult"("createdAt");
CREATE INDEX "ExtractionResult_jobId_idx" ON "ExtractionResult"("jobId");