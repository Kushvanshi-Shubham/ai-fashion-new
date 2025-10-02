import {
  getNextJob,
  completeJob,
  failJob,
} from './job-manager';
import { aiService } from '../ai/ai-services';
import { estimateCost } from '../ai/model-pricing';
import { prisma } from '../database';
import { ExtractionJob } from '@/types/job';

let isProcessing = false;

async function processJob(job: ExtractionJob) {
  console.log(`[Worker] Processing job: ${job.id}`);
  try {
    const extractionResult = await aiService.extractAttributes(
      job.data.imageBuffer,
      job.data.category,
      {
        model: job.data.model,
        maxTokens: 1500,
        temperature: 0.1,
        cacheEnabled: true,
        cacheTTL: 3600 * 24,
      }
    );

    const tokensUsed = extractionResult.status === 'completed' ? extractionResult.tokensUsed ?? 0 : 0;
    const costUsd = estimateCost({
      model: job.data.model,
      totalTokens: tokensUsed,
      hasVision: true,
    });

    if (extractionResult.status === 'completed') {
      const result = {
        status: extractionResult.status,
        extraction: {
          attributes: extractionResult.attributes,
          confidence: extractionResult.confidence,
          tokensUsed: extractionResult.tokensUsed,
          model: 'gpt-4o',
          cost: costUsd,
          fromCache: extractionResult.fromCache || false,
        },
        costUsd,
        tokensUsed,
      };
      completeJob(job.id, result);
      console.log(`[Worker] Completed job: ${job.id}`);
      
      // Persist analytics
      persistAnalytics(job, result, 'COMPLETED');
    } else {
      failJob(job.id, 'Extraction failed with status: ' + extractionResult.status);
      console.log(`[Worker] Failed job: ${job.id} - ${extractionResult.status}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Worker] Failed job: ${job.id}`, error);
    failJob(job.id, errorMessage);
    persistAnalytics(job, { costUsd: 0, tokensUsed: 0 }, 'FAILED', errorMessage);
  }
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
    setTimeout(startWorker, 0);
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
