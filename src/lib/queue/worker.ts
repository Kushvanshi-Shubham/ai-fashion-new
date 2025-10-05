import {
  getNextJob,
  failJob,
} from './job-manager';
import { ExtractionJob } from '@/types/job';

let isProcessing = false;

async function processJob(job: ExtractionJob) {
  console.log(`[Worker] Processing job: ${job.id} - TEMPORARILY DISABLED FOR NEW SERVICE MIGRATION`);
  
  // TODO: Update worker to use new ExtractionService after testing direct API
  failJob(job.id, 'Worker temporarily disabled during service migration');
}

export async function startWorker() {
  if (isProcessing) {
    console.log('[Worker] Already processing.');
    return;
  }

  isProcessing = true;
  console.log('[Worker] Starting...');

  let job = getNextJob();
  while (job) {
    await processJob(job);
    job = getNextJob();
  }

  isProcessing = false;
  console.log('[Worker] Finished processing queue.');
}

// Trigger the worker to run. In a real app, this would be a cron job or a separate process.
// For this simulation, we can trigger it after a job is added.
export function triggerWorker() {
    // Non-blocking trigger
    console.log('[Worker] Trigger called, starting worker...');
    setTimeout(startWorker, 0);
}

// TODO: Re-implement with new service
/*
// 🆕 Save extraction result to database for permanent UI display
async function saveExtractionResult(job: ExtractionJob, extractionResult: CompletedExtractionResult, tokensUsed: number) {
    if (!process.env.DATABASE_URL) return;

    try {
        // Generate unique filename if not provided
        const originalFileName = `extraction-${Date.now()}.jpg`;
        const fileName = originalFileName;

        // Transform attributes to the format expected by ExtractionResults component
        const transformedAttributes = extractionResult.attributes || {};

        const extractionRecord = await prisma.extractionResult.create({
            data: {
                id: `result_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                fileName: fileName,
                originalFileName: originalFileName,
                status: 'completed',
                categoryId: job.data.category.categoryId,
                categoryName: job.data.category.categoryName || job.data.category.categoryId,
                attributes: JSON.parse(JSON.stringify(transformedAttributes)), // Store as JSON
                confidence: Math.round(extractionResult.confidence || 0),
                tokensUsed: tokensUsed,
                processingTime: Date.now() - job.createdAt.getTime(),
                modelUsed: job.data.model || 'gpt-4o',
                costUsd: 0, // Cost calculation can be added later
                fromCache: extractionResult.fromCache || false,
                jobId: job.id,
                discoveries: {}, // Can be enhanced later for discovery mode
            }
        });

        console.log(`[Worker] Saved extraction result to database: ${extractionRecord.id}`);
    } catch (error) {
        console.error('[Worker] Failed to save extraction result:', error);
    }
}

async function persistAnalytics(job: ExtractionJob, result: { costUsd: number, tokensUsed: number }, status: 'COMPLETED' | 'FAILED', errorMessage?: string) {
    if (!process.env.DATABASE_URL) return;

    try {
        const categoryId = job.data.category.categoryId;
        const today = new Date();
        const dayKey = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

        await prisma.$transaction(async (tx) => {
            await tx.extractionEvent.create({
                data: {
                    categoryCode: categoryId,
                    status: status,
                    fromCache: false, // TODO: get from extraction result
                    processingTime: Date.now() - job.createdAt.getTime(),
                    tokensUsed: result.tokensUsed,
                    aiModel: job.data.model,
                    costUsd: result.costUsd,
                    errorMessage: errorMessage || null,
                }
            });

            const incrementData: Record<string, { increment: number }> = {
                total: { increment: 1 },
                totalTokens: { increment: result.tokensUsed },
                totalCostUsd: { increment: result.costUsd }
            };
            if (status === 'COMPLETED') incrementData.completed = { increment: 1 };
            if (status === 'FAILED') incrementData.failed = { increment: 1 };

            await tx.dailyStat.upsert({
                where: { date_categoryCode: { date: dayKey, categoryCode: categoryId } },
                update: incrementData,
                create: { date: dayKey, categoryCode: categoryId, total: 1, completed: status === 'COMPLETED' ? 1 : 0, failed: status === 'FAILED' ? 1 : 0, cached: 0, totalTokens: result.tokensUsed, totalCostUsd: result.costUsd }
            });
            await tx.dailyStat.upsert({
                where: { date_categoryCode: { date: dayKey, categoryCode: 'ALL' } },
                update: incrementData,
                create: { date: dayKey, categoryCode: 'ALL', total: 1, completed: status === 'COMPLETED' ? 1 : 0, failed: status === 'FAILED' ? 1 : 0, cached: 0, totalTokens: result.tokensUsed, totalCostUsd: result.costUsd }
            });
        });
    } catch (err) {
        console.warn('[AnalyticsWorker] Failed to persist extraction event', err);
    }
}
*/