export interface Category {
  id: string
  name: string
  description?: string | null
  parentId?: string | null
  attributes: Attribute[]
  isActive: boolean
  sortOrder: number
  aiPromptTemplate: string
  createdAt: Date
  updatedAt: Date
}

export interface Attribute {
  id: string
  key: string
  label: string
  type: AttributeType
  required: boolean
  options?: AttributeOption[] | null
  categoryId: string
  aiExtractable: boolean
  aiWeight: number
  aiPromptHint?: string | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AttributeOption {
  value: string
  label: string
  description?: string
}

export interface ExtractionResult {
  [x: string]: any
  id: string
  imageUrl: string
  categoryId: string
  category: Category
  extractedData: Record<string, any>
  confidence: number
  processingTime: number
  cost: number
  aiModel: string
  status: ExtractionStatus
  errorMessage?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UploadedImage {
  id: string
  file: File
  previewUrl: string
  uploadProgress: number
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error'
}

export interface ExtractionProgress {
  id: string
  status: ExtractionStatus
  progress: number
  estimatedTime?: number
  currentStep?: string
}

export enum AttributeType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  BOOLEAN = 'BOOLEAN',
  RANGE = 'RANGE',
  COLOR = 'COLOR',
  URL = 'URL',
  DATE = 'DATE'
}

export enum ExtractionStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CACHED = 'CACHED'
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    timestamp: string
    requestId: string
    processingTime?: number
  }
}
