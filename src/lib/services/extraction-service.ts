import { CategoryFormData, ExtractionResult, ExtractionResponse } from '@/types/fashion'
import { aiService } from '../ai/ai-services'

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

      if (!response.ok) {
        throw new Error('Extraction failed')
      }

      const result = await response.json()
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
    return {
      id: response.extraction.id,
      fileName: response.file.name,
      status: 'completed',
      attributes: response.extraction.attributes,
      confidence: response.extraction.confidence,
      tokensUsed: response.performance.tokensUsed,
      processingTime: response.performance.processingTime,
      createdAt: response.timestamp,
      fromCache: response.extraction.fromCache
    }
  }
}