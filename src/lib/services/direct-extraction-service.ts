import { CategoryFormData, ExtractionResult } from '@/types/fashion'

/**
 * Direct Extraction Service - Works like your old project
 * No job queues, immediate results
 */
export class DirectExtractionService {
  
  /**
   * Extract attributes directly and return immediate results
   * This mimics your old project's workflow exactly
   */
  static async extractDirect(file: File, category: CategoryFormData): Promise<ExtractionResult> {
    console.log('[DirectExtractionService] Starting direct extraction for:', file.name, 'Category:', category.categoryId)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('categoryId', category.categoryId)

      const response = await fetch('/api/extract-direct', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (!response.ok || !result?.success) {
        const errorMsg = result?.error || `Server error: ${response.status}`
        console.error('[DirectExtractionService] API Error:', errorMsg)
        throw new Error(errorMsg)
      }

      if (!result.data) {
        throw new Error('Invalid response: missing extraction data')
      }

      console.log('[DirectExtractionService] Extraction completed:', result.data.id)
      return result.data as ExtractionResult
      
    } catch (error) {
      console.error('[DirectExtractionService] Error:', error)
      throw new Error(error instanceof Error ? error.message : 'Extraction failed')
    }
  }

  /**
   * Get category form data (same as original service)
   */
  static async getCategory(categoryId: string): Promise<CategoryFormData> {
    try {
      const response = await fetch(`/api/categories/${categoryId}/form`)
      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.status}`)
      }
      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('[DirectExtractionService] Category fetch error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch category')
    }
  }
}