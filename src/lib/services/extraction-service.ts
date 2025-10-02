import { CategoryFormData, ExtractionResult, ExtractionResponse } from '@/types/fashion'
import { normalizeExtraction } from '@/lib/extraction/transform'

export class ExtractionService {
  static async extract(file: File, categoryId: string): Promise<ExtractionResult> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('categoryId', categoryId)

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (!response.ok || !result?.success) {
        // Attach guidance for common server failure scenarios
        const code = result?.code || (response.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'EXTRACTION_FAILED')
        const guidance = this.failureGuidance(code, result?.error)
        throw new Error(guidance)
      }
  return this.mapExtractionResponse(result)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error')
    }
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