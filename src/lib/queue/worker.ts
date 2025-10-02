import {
  getNextJob,
  completeJob,
  failJob,
} from './job-manager';
import { FashionAIService } from '../ai/fashion-ai-service';
import { prisma } from '../database';
import { ExtractionJob } from '@/types/job';

let isProcessing = false;

async function processJob(job: ExtractionJob) {
  console.log(`[Worker] Processing job: ${job.id}`);
  try {
    // Convert buffer to base64 URL for the AI service
    const base64Image = `data:${job.data.imageType};base64,${job.data.imageBuffer.toString('base64')}`;
    
    // Use discovery mode for enhanced extraction
    const extractionResult = await FashionAIService.extractWithDiscovery(
      base64Image,
      job.data.category,
      true // Enable discovery mode
    );

    if (extractionResult.success) {
      const tokensUsed = extractionResult.tokenUsage.total;
      const costUsd = extractionResult.cost;

      // Convert attributes to the expected format
      const formattedAttributes: Record<string, import('@/types/fashion').AttributeDetail> = {}
      for (const [key, value] of Object.entries(extractionResult.attributes)) {
        formattedAttributes[key] = {
          value: value,
          confidence: extractionResult.confidence,
          reasoning: `AI extracted with ${extractionResult.confidence}% confidence`,
          fieldLabel: key,
          isValid: value !== null
        }
      }

      const result = {
        status: 'completed' as const,
        extraction: {
          attributes: formattedAttributes,
          confidence: extractionResult.confidence,
          tokensUsed: tokensUsed,
          model: extractionResult.aiModel,
          cost: costUsd,
          fromCache: false,
        },
        discoveries: extractionResult.discoveries,
        costUsd,
        tokensUsed,
      };
      
      completeJob(job.id, result);
      console.log(`[Worker] Completed job: ${job.id} with ${extractionResult.discoveries?.length || 0} discoveries`);
      
      // Persist analytics
      persistAnalytics(job, result, 'COMPLETED');
    } else {
      const errorMsg = extractionResult.errors?.join(', ') || 'Unknown extraction error';
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
