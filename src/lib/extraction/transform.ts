import { ExtractionResult } from '@/types/fashion'

/** Raw API extraction payload shape (server or AI service) */
export interface RawExtractionPayload {
  id?: string | undefined
  status?: string | undefined
  attributes?: Record<string, unknown> | undefined
  confidence?: number | undefined
  tokensUsed?: number | undefined
  processingTime?: number | undefined
  createdAt?: string | undefined
  fromCache?: boolean | undefined
  error?: string | undefined
  tokenUsage?: { total?: number } | undefined
}

export type NormalizedExtractionResult = ExtractionResult

/** Normalize confidence & tokens, ensure attribute map safety */
export function normalizeExtraction(raw: RawExtractionPayload, fileName: string): NormalizedExtractionResult {
  const status = (raw.status as string) || 'failed'
  const baseId = raw.id || `ext_${Date.now().toString(36)}`
  const tokensUsed = typeof raw.tokensUsed === 'number'
    ? raw.tokensUsed
    : (typeof raw.tokenUsage?.total === 'number' ? raw.tokenUsage.total : 0)

  const safeAttributes = coerceAttributes(raw.attributes)

  if (status === 'completed') {
    return {
      id: baseId,
      fileName,
      status: 'completed',
      attributes: safeAttributes,
      confidence: normalizeConfidence(raw.confidence),
      tokensUsed,
      processingTime: numeric(raw.processingTime),
      createdAt: raw.createdAt || new Date().toISOString(),
      fromCache: !!raw.fromCache
    }
  }

  if (status === 'failed') {
    return {
      id: baseId,
      fileName,
      status: 'failed',
      error: raw.error || 'Extraction failed',
      createdAt: raw.createdAt || new Date().toISOString()
    }
  }

  return {
    id: baseId,
    fileName,
    status: (status as 'pending' | 'processing') || 'processing',
    createdAt: raw.createdAt || new Date().toISOString()
  }
}

function normalizeConfidence(v: unknown): number {
  if (typeof v !== 'number' || Number.isNaN(v)) return 0
  if (v <= 1) return Math.round(v * 100)
  return Math.round(Math.max(0, Math.min(100, v)))
}

function numeric(v: unknown): number {
  return typeof v === 'number' && v >= 0 ? Math.floor(v) : 0
}

function coerceAttributes(raw: unknown): Record<string, import('@/types/fashion').AttributeDetail> {
  const out: Record<string, import('@/types/fashion').AttributeDetail> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v && typeof v === 'object') {
      const maybe = v as Record<string, unknown>
      const value = maybe.value ?? null
      const strValue = value == null ? null : (typeof value === 'string' ? value : String(value))
      out[k] = {
        fieldLabel: typeof maybe.fieldLabel === 'string' ? maybe.fieldLabel : k,
        value: strValue,
        confidence: typeof maybe.confidence === 'number' ? normalizeConfidence(maybe.confidence) : 0,
        reasoning: typeof maybe.reasoning === 'string' ? maybe.reasoning : '',
        isValid: strValue !== null
      }
    } else {
      const strValue = v == null ? null : (typeof v === 'string' ? v : String(v))
      out[k] = { fieldLabel: k, value: strValue, confidence: 0, reasoning: '', isValid: strValue !== null }
    }
  }
  return out
}
