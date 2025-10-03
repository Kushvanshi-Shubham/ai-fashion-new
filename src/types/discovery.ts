// Discovery types for the new project
export interface DiscoveredAttribute {
  key: string
  label: string
  rawValue: string
  normalizedValue: string
  confidence: number
  reasoning: string
  frequency: number
  suggestedType: 'text' | 'select' | 'number'
  possibleValues?: string[]
  isPromotable?: boolean
  categoryId?: string | undefined
  createdAt?: string | undefined
  updatedAt?: string | undefined
}

export interface DiscoveryStats {
  totalFound: number
  highConfidence: number
  schemaPromotable: number
  uniqueKeys: number
}

export interface DiscoverySettings {
  enabled: boolean
  minConfidence: number
  showInTable: boolean
  autoPromote: boolean
  maxDiscoveries: number
}

export interface PromoteDiscoveryRequest {
  discoveryKey: string
  categoryId: string
  label?: string
  type?: 'text' | 'select' | 'number'
}

export interface PromoteDiscoveryResponse {
  success: boolean
  schemaItem?: {
    key: string
    label: string
    type: string
    required: boolean
    options?: string[] | undefined
    description: string
  }
  error?: string
}

export interface DiscoveryApiResponse {
  success: boolean
  data?: {
    discoveries: DiscoveredAttribute[]
    stats: DiscoveryStats
    settings: DiscoverySettings
  }
  error?: string
  processingTime?: number
}
