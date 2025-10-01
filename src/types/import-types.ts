// Type definitions for your import data
export interface AttributeOption {
  shortForm: string
  fullForm: string
}

export interface AttributeDefinition {
  [x: string]: unknown
  key: string
  label: string
  type: 'select' | 'text' | 'number' | 'boolean'
  allowedValues?: AttributeOption[]
  description?: string
}

export interface CategoryConfig {
  id: string
  department: string
  subDepartment: string
  category: string
  displayName: string
  description?: string
  isActive: boolean
  createdAt?: Date
  attributes: Record<string, boolean>
}

export interface ImportResult {
  imported: number
  errors: ImportError[]
}

export interface CategoryImportResult {
  importedCategories: number
  importedMappings: number
  errors: ImportError[]
}

export interface ImportError {
  key?: string
  category?: string
  attribute?: string
  error: string
}
