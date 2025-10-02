import { CategoryFormData, ExtractionResult, ExtractionResponse } from '@/types/fashion'

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
    const extraction = response?.extraction ?? {}
    // Narrowed local type to read optional fields safely
    type MaybeExtraction = {
      id?: string
      status?: string
      attributes?: Record<string, unknown>
      confidence?: number
      fromCache?: boolean
      error?: string
    }
    const ext = extraction as MaybeExtraction
    const performance = response?.performance ?? {}
    const status = (ext.status as string) ?? 'failed'

    // Helper to coerce raw attribute records into the expected AttributeDetail map
    const coerceAttributes = (raw: Record<string, unknown> | undefined): Record<string, import('@/types/fashion').AttributeDetail> => {
      const out: Record<string, import('@/types/fashion').AttributeDetail> = {}
      if (!raw || typeof raw !== 'object') return out
      for (const [k, v] of Object.entries(raw)) {
        if (v && typeof v === 'object') {
          const maybe = v as Record<string, unknown>
          const value = maybe.value ?? null
          const strValue = value === null ? null : (typeof value === 'string' ? value : String(value))
          const confidence = typeof maybe.confidence === 'number' ? Math.max(0, Math.min(100, maybe.confidence)) : 0
          const reasoning = typeof maybe.reasoning === 'string' ? maybe.reasoning : ''
          out[k] = {
            fieldLabel: typeof maybe.fieldLabel === 'string' ? maybe.fieldLabel : k,
            value: strValue,
            confidence,
            reasoning,
            isValid: strValue !== null
          }
        } else {
          const strValue = v === null ? null : (typeof v === 'string' ? v : String(v))
          out[k] = {
            fieldLabel: k,
            value: strValue,
            confidence: 0,
            reasoning: '',
            isValid: strValue !== null
          }
        }
      }
      return out
    }

    if (status === 'completed') {
      return {
        id: ext.id!,
        fileName: response?.file?.name ?? 'unknown',
        status: 'completed',
        attributes: coerceAttributes(ext.attributes as Record<string, unknown> | undefined),
        confidence: typeof ext.confidence === 'number' ? Math.round(Math.max(0, Math.min(100, ext.confidence))) : 0,
        tokensUsed: typeof performance.tokensUsed === 'number' ? Math.max(0, Math.floor(performance.tokensUsed)) : 0,
        processingTime: typeof performance.processingTime === 'number' ? Math.max(0, Math.floor(performance.processingTime)) : (typeof performance.aiProcessingTime === 'number' ? Math.max(0, Math.floor(performance.aiProcessingTime)) : 0),
        createdAt: response?.timestamp ?? new Date().toISOString(),
        fromCache: !!ext.fromCache
      }
    }

    if (status === 'failed') {
      return {
        id: ext.id ?? `${Date.now().toString(36)}`,
        fileName: response?.file?.name ?? 'unknown',
        status: 'failed',
        error: ext.error || 'Extraction failed',
        createdAt: response?.timestamp ?? new Date().toISOString()
      }
    }

    // fallback for pending/processing
    return {
      id: ext.id ?? `${Date.now().toString(36)}`,
      fileName: response?.file?.name ?? 'unknown',
      status: (status as 'pending' | 'processing') ?? 'processing',
      createdAt: response?.timestamp ?? new Date().toISOString()
    }
  }
}