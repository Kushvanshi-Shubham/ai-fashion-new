export interface CategoryFormData {
  categoryId: string
  categoryCode: string
  categoryName: string
  department: string
  subDepartment: string
  description?: string
  isActive: boolean
  totalAttributes: number
  enabledAttributes: number
  extractableAttributes: number
  fields: AttributeField[]
}

export interface AttributeField {
  key: string
  label: string
  type: 'select' | 'text' | 'number' | 'boolean'
  required: boolean
  options?: AttributeOption[]
  description?: string
  aiExtractable: boolean
  aiWeight?: number
}

export interface AttributeOption {
  shortForm: string
  fullForm: string
}

export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface BaseExtractionResult {
  id: string
  fileName: string
  createdAt: string
  fromCache?: boolean
}

export interface PendingExtractionResult extends BaseExtractionResult {
  status: 'pending'
}

export interface ProcessingExtractionResult extends BaseExtractionResult {
  status: 'processing'
}

export interface CompletedExtractionResult extends BaseExtractionResult {
  status: 'completed'
  attributes: Record<string, AttributeDetail>
  confidence: number
  tokensUsed: number
  processingTime: number
}

export interface FailedExtractionResult extends BaseExtractionResult {
  status: 'failed'
  error: string
}

export type ExtractionResult = 
  | PendingExtractionResult 
  | ProcessingExtractionResult 
  | CompletedExtractionResult 
  | FailedExtractionResult

export interface AttributeDetail {
  value: string | null
  confidence: number
  reasoning: string
  fieldLabel: string
  isValid: boolean
}

export type Extraction = {
  attributes: Record<string, AttributeDetail>;
  confidence: number;
  tokensUsed: number;
  model: string;
  cost: number;
};

export interface DiscoveredAttribute {
  key: string
  label: string
  value: string
  confidence: number
  reasoning: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: string
  requestId?: string
  processingTime?: number
  fromCache?: boolean
  code?: string
}

export interface CategoryListResponse {
  categories: CategorySummary[]
  pagination: {
    offset: number
    limit: number
    total: number
    hasMore: boolean
  }
  summary: {
    total: number
    byDepartment: Record<string, number>
    avgAttributesPerCategory: number
  }
  filters: {
    department: string | null
    search: string | null
  }
}

export interface CategorySummary {
  id: string
  name: string
  description: string
  department: string
  subDepartment: string
  isActive: boolean
  enabledAttributes: number
  totalAttributes: number
  completeness: number
  createdAt: string
}

export interface ExtractionResponse {
  requestId: string
  timestamp: string
  file: {
    name: string
    size: number
    type: string
    optimizedSize: number
  }
  category: {
    id: string
    name: string
    department: string
    subDepartment: string
    totalAttributes: number
    enabledAttributes: number
  }
  extraction: {
    id: string
    status: string
    attributes: Record<string, AttributeDetail>
    confidence: number
    fromCache: boolean
  }
  performance: {
    processingTime: number
    aiProcessingTime: number
    tokensUsed: number
    cost: number
  }
  metrics: {
    totalAttributes: number
    extractedAttributes: number
    successRate: number
    confidenceDistribution: {
      high: number
      medium: number
      low: number
    }
  }
}

// Component prop types
export interface Category {
  id: string
  name: string
  description: string
  department: string
  subDepartment: string
  enabledAttributes: number
  totalAttributes: number
  isActive: boolean
  completeness?: number
}

// Store types
export interface UploadedImage {
  id: string
  file: File
  preview: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  result?: ExtractionResult
}

export interface ExtractionStats {
  totalExtractions: number
  successfulExtractions: number
  failedExtractions: number
  averageConfidence: number
  totalTokensUsed: number
  totalCost: number
  processingTime: number
}

// Hook return types
export interface UseExtractionReturn {
  selectedCategory: CategoryFormData | null
  uploadedImages: UploadedImage[]
  results: ExtractionResult[]
  isProcessing: boolean
  error: string | null
  pendingImages: UploadedImage[]
  processingImages: UploadedImage[]
  completedImages: UploadedImage[]
  failedImages: UploadedImage[]
  successRate: number
  canStartExtraction: boolean
  selectCategory: (category: CategoryFormData) => void
  addImages: (files: File[]) => void
  startExtraction: (imageId?: string) => Promise<void>
  retryExtraction: (imageId: string) => Promise<void>
  clearError: () => void
  getImageById: (id: string) => UploadedImage | undefined
  getResultById: (id: string) => ExtractionResult | undefined
  stats: {
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
    successRate: number
  }
}

// Error types
export interface ExtractorError extends Error {
  code?: string
  status?: number
  details?: Record<string, unknown> | undefined
}

// Configuration types
export interface ExtractorConfig {
  maxFileSize: number
  maxFiles: number
  allowedTypes: string[]
  maxConcurrentExtractions: number
  retryAttempts: number
  cacheEnabled: boolean
  cacheTTL: number
}

// Type guards for narrowing ExtractionResult unions
export function isCompletedExtraction(result: ExtractionResult): result is CompletedExtractionResult {
  return result.status === 'completed'
}

export function isProcessingExtraction(result: ExtractionResult): result is ProcessingExtractionResult {
  return result.status === 'processing'
}

export function isFailedExtraction(result: ExtractionResult): result is FailedExtractionResult {
  return result.status === 'failed'
}
