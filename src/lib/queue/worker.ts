import {
  getNextJob,
  completeJob,
  failJob,
} from './job-manager';
import { FashionAIService } from '../ai/fashion-ai-service';
import { prisma } from '../database';
import { ExtractionJob } from '@/types/job';
import { isCompletedExtraction } from '@/types/fashion';

let isProcessing = false;

async function processJob(job: ExtractionJob) {
  console.log(`[Worker] Processing job: ${job.id}`);
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured. Please set up your environment variables.');
    }

    // Convert buffer to base64 URL for the AI service
    const base64Image = `data:${job.data.imageType};base64,${job.data.imageBuffer.toString('base64')}`;
    
    // Use discovery mode for enhanced extraction
    const extractionResult = await FashionAIService.extractWithDiscovery(
      base64Image,
      job.data.category,
      true // Enable discovery mode
    );

    if (isCompletedExtraction(extractionResult)) {
      const tokensUsed = extractionResult.tokensUsed;

      const result = {
        status: 'completed' as const,
        extraction: {
          attributes: extractionResult.attributes,
          confidence: extractionResult.confidence,
          tokensUsed: tokensUsed,
          model: 'gpt-4-vision-preview', // Default model name
          cost: 0, // Cost calculation would need to be added
          fromCache: extractionResult.fromCache || false,
        },
        discoveries: [], // Discoveries would need to be extracted from the result
        costUsd: 0, // Cost calculation would need to be added
        tokensUsed: tokensUsed,
      };
      
      completeJob(job.id, result);
      console.log(`[Worker] Completed job: ${job.id} with ${result.discoveries?.length || 0} discoveries`);
      
      // Persist analytics
      persistAnalytics(job, result, 'COMPLETED');
    } else {
      // Handle extraction failure (FailedExtractionResult)
      const errorMsg = extractionResult.status === 'failed' ? extractionResult.error : 'Unknown extraction error';
      failJob(job.id, errorMsg);
      console.log(`[Worker] Failed job: ${job.id} - ${errorMsg}`);
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
    console.log('[Worker] Trigger called, starting worker...');
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
