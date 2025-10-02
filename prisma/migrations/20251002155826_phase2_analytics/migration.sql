-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('TEXT', 'SELECT', 'MULTI_SELECT', 'BOOLEAN', 'NUMBER', 'DATE');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'CACHED');

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "subDepartmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_attributes" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL,
    "description" TEXT,
    "allowedValues" JSONB,
    "aiExtractable" BOOLEAN NOT NULL DEFAULT true,
    "aiWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "aiPromptHint" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_attribute_configs" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "customOptions" JSONB,
    "customLabel" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_attribute_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extractions" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageMetadata" JSONB,
    "categoryId" TEXT NOT NULL,
    "extractedData" JSONB NOT NULL,
    "rawAIResponse" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiModel" TEXT,
    "promptVersion" TEXT,
    "processingTime" INTEGER,
    "tokenUsage" INTEGER,
    "cost" DOUBLE PRECISION,
    "status" "ExtractionStatus" NOT NULL DEFAULT 'PROCESSING',
    "errorMessage" TEXT,
    "sessionId" TEXT,
    "cacheKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extraction_events" (
    "id" TEXT NOT NULL,
    "extractionId" TEXT,
    "categoryCode" TEXT NOT NULL,
    "status" "ExtractionStatus" NOT NULL,
    "fromCache" BOOLEAN NOT NULL DEFAULT false,
    "processingTime" INTEGER,
    "tokensUsed" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "aiModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extraction_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_stats" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "categoryCode" TEXT,
    "total" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "cached" INTEGER NOT NULL DEFAULT 0,
    "avgProcessingMs" DOUBLE PRECISION DEFAULT 0,
    "avgTokens" DOUBLE PRECISION DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCostUsd" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sub_departments_departmentId_code_key" ON "sub_departments"("departmentId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_subDepartmentId_code_key" ON "categories"("subDepartmentId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "master_attributes_key_key" ON "master_attributes"("key");

-- CreateIndex
CREATE UNIQUE INDEX "category_attribute_configs_categoryId_attributeId_key" ON "category_attribute_configs"("categoryId", "attributeId");

-- CreateIndex
CREATE INDEX "extraction_events_categoryCode_createdAt_idx" ON "extraction_events"("categoryCode", "createdAt");

-- CreateIndex
CREATE INDEX "extraction_events_status_createdAt_idx" ON "extraction_events"("status", "createdAt");

-- CreateIndex
CREATE INDEX "extraction_events_createdAt_idx" ON "extraction_events"("createdAt");

-- CreateIndex
CREATE INDEX "daily_stats_date_idx" ON "daily_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_stats_date_categoryCode_key" ON "daily_stats"("date", "categoryCode");

-- AddForeignKey
ALTER TABLE "sub_departments" ADD CONSTRAINT "sub_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_subDepartmentId_fkey" FOREIGN KEY ("subDepartmentId") REFERENCES "sub_departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attribute_configs" ADD CONSTRAINT "category_attribute_configs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attribute_configs" ADD CONSTRAINT "category_attribute_configs_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "master_attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extraction_events" ADD CONSTRAINT "extraction_events_extractionId_fkey" FOREIGN KEY ("extractionId") REFERENCES "extractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
