import { CategoryFormData, ExtractionResult, ExtractionResponse } from '@/types/fashion'
import { normalizeExtraction } from '@/lib/extraction/transform'

export interface ExtractionJobResponse {
  success: boolean
  data?: {
    jobId: string
    status: string
    message: string
    timestamp: string
  }
  error?: string
  code?: string
  retryAfter?: number
}

export class ExtractionService {
  /**
   * Extract attributes from image using category-specific configuration
   * Returns a job ID for async processing
   */
  static async extract(file: File, category: CategoryFormData): Promise<{ jobId: string }> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('categoryId', category.categoryId)

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      })

      const result: ExtractionJobResponse = await response.json()
      if (!response.ok || !result?.success) {
        // Attach guidance for common server failure scenarios
        const code = result?.code || (response.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'EXTRACTION_FAILED')
        const guidance = this.failureGuidance(code, result?.error)
        throw new Error(guidance)
      }

      if (!result.data?.jobId) {
        throw new Error('Invalid response: missing job ID')
      }

      return { jobId: result.data.jobId }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Check the status of an extraction job
   */
  static async getJobStatus(jobId: string): Promise<{
    status: string
    result?: ExtractionResult
    error?: string
  }> {
    try {
      const response = await fetch(`/api/extract/status/${jobId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get job status')
      }

      return data
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to check job status')
    }
  }

  /**
   * Poll job status until completion
   */
  static async pollJobStatus(
    jobId: string, 
    onProgress?: (status: string) => void,
    maxAttempts = 30,
    interval = 2000
  ): Promise<ExtractionResult> {
    let attempts = 0
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.getJobStatus(jobId)
        
        onProgress?.(status.status)
        
        if (status.status === 'completed' && status.result) {
          return status.result
        }
        
        if (status.status === 'failed') {
          throw new Error(status.error || 'Job failed')
        }
        
        if (status.status === 'processing' || status.status === 'pending') {
          await new Promise(resolve => setTimeout(resolve, interval))
          attempts++
          continue
        }
        
        throw new Error(`Unknown job status: ${status.status}`)
      } catch (error) {
        if (attempts === maxAttempts - 1) {
          throw error
        }
        await new Promise(resolve => setTimeout(resolve, interval))
        attempts++
      }
    }
    
    throw new Error('Job polling timed out')
  }

  static async getCategory(categoryId: string): Promise<CategoryFormData> {
    const response = await fetch(`/api/categories/${categoryId}/form`)
    if (!response.ok) {
      throw new Error('Failed to fetch category')
    }
    return response.json()
  }

  private static mapExtractionResponse(response: ExtractionResponse): ExtractionResult {
    type SafeExtraction = {
      extraction?: {
        id?: string
        status?: string
        attributes?: Record<string, unknown>
        confidence?: number
        fromCache?: boolean
        error?: string
      }
      performance?: {
        tokensUsed?: number
        processingTime?: number
      }
      file?: { name?: string }
      timestamp?: string
    }
    const r = response as unknown as SafeExtraction
    const raw = {
      id: r.extraction?.id,
      status: r.extraction?.status,
      attributes: r.extraction?.attributes,
      confidence: r.extraction?.confidence,
      tokensUsed: r.performance?.tokensUsed,
      processingTime: r.performance?.processingTime,
      createdAt: r.timestamp,
      fromCache: r.extraction?.fromCache,
      error: r.extraction?.error
    }
    return normalizeExtraction(raw, response?.file?.name ?? 'unknown')
  }

  private static failureGuidance(code: string, message?: string): string {
    const base = message || 'Extraction failed'
    switch (code) {
      case 'RATE_LIMIT_EXCEEDED':
        return `${base}. You have hit the rate limit. Wait a minute and retry. Consider batching fewer images.`
      case 'INVALID_IMAGE':
        return `${base}. The image may be too large, unsupported type, or below minimum dimensions.`
      case 'INVALID_CATEGORY_DATA':
        return `${base}. Category definition is incomplete; refresh categories or pick a different one.`
      case 'INVALID_CATEGORY':
        return `${base}. Selected category no longer exists.`
      default:
        return `${base}. If this persists, check: OpenAI key, server logs (/api/health), and Redis availability.`
    }
  }
}
