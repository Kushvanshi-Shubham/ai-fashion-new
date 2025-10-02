"use client"

import { useCallback, useEffect, useState } from 'react'
import { useExtractionStore, useExtractionSelectors } from '@/store/useExtractionStore'
import { CategoryFormData, ExtractionResult } from '@/types/fashion'

// Local uploaded image shape is provided by the store; avoid duplicating here

export interface UseExtractionOptions {
  autoProcess?: boolean
  retryOnError?: boolean
  onSuccess?: (result: ExtractionResult) => void
  onError?: (error: string) => void
  onProgress?: (progress: number) => void
}

export const useExtraction = (options: UseExtractionOptions = {}) => {
  const { autoProcess, retryOnError, onProgress, onSuccess, onError } = options
  const {
    setCategory,
    addImages,
    startExtraction,
    startBatchExtraction,
    retryExtraction,
    setError,
    updateSettings,
    cleanup
  } = useExtractionStore()

  const selectors = useExtractionSelectors()
  const selectedCategory = selectors.selectedCategory
  const uploadedImages = selectors.uploadedImages
  const results = selectors.results
  const isProcessing = selectors.isProcessing
  const error = selectors.error
  const pendingImages = selectors.pendingImages
  const processingImages = selectors.processingImages
  const completedImages = selectors.completedImages
  const failedImages = selectors.failedImages
  const successRate = selectors.stats?.successRate ?? 0

  // Auto-process when images are added
  useEffect(() => {
    if (autoProcess && pendingImages.length > 0 && !isProcessing && selectedCategory) {
      startBatchExtraction()
    }
  }, [pendingImages.length, isProcessing, selectedCategory, autoProcess, startBatchExtraction])

  // Handle progress updates
  useEffect(() => {
    if (onProgress) {
      const totalImages = uploadedImages.length
      const completedCount = completedImages.length + failedImages.length
      const progress = totalImages > 0 ? (completedCount / totalImages) * 100 : 0
      onProgress(progress)
    }
  }, [completedImages.length, failedImages.length, uploadedImages.length, onProgress])

  // Handle success
  useEffect(() => {
    if (onSuccess && completedImages.length > 0) {
      const latestResult = results[results.length - 1]
      if (latestResult) {
        onSuccess(latestResult)
      }
    }
  }, [completedImages.length, results, onSuccess])

  // Handle errors
  useEffect(() => {
    if (onError && error) {
      onError(error)
    }
  }, [error, onError])

  // Auto-retry failed extractions
  useEffect(() => {
    if (retryOnError && failedImages.length > 0 && !isProcessing) {
      // Retry after a delay
      const retryTimeout = setTimeout(() => {
        failedImages.forEach((image) => {
          retryExtraction(image.id)
        })
      }, 5000) // 5 second delay

      return () => clearTimeout(retryTimeout)
    }
  }, [failedImages, isProcessing, retryOnError, retryExtraction])

  // Memoized handlers
  const handleCategorySelect = useCallback((category: CategoryFormData) => {
    setCategory(category)
    setError(null)
  }, [setCategory, setError])

  const handleImagesAdd = useCallback((files: File[]) => {
    addImages(files)
    setError(null)
  }, [addImages, setError])

  const handleStartExtraction = useCallback(async (imageId?: string) => {
    if (!selectedCategory) {
      setError('Please select a category first')
      return
    }

    if (uploadedImages.length === 0) {
      setError('Please upload at least one image')
      return
    }

    try {
      if (imageId) {
        await startExtraction(imageId)
      } else {
        await startBatchExtraction()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Extraction failed'
      setError(errorMessage)
    }
  }, [selectedCategory, uploadedImages, startExtraction, startBatchExtraction, setError])

  const handleRetry = useCallback(async (imageId: string) => {
    try {
      await retryExtraction(imageId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed'
      setError(errorMessage)
    }
  }, [retryExtraction, setError])

  // Performance optimization settings
  const optimizeForPerformance = useCallback(() => {
    updateSettings({
      batchProcessing: true,
      maxConcurrentProcessing: 2, // Reduce for better stability
      cacheEnabled: true
    })
  }, [updateSettings])

  const optimizeForSpeed = useCallback(() => {
    updateSettings({
      batchProcessing: true,
      maxConcurrentProcessing: 5, // Increase for faster processing
      cacheEnabled: true
    })
  }, [updateSettings])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    // State
    selectedCategory,
    uploadedImages,
    results,
    isProcessing,
    error,
    
    // Computed state
    pendingImages,
    processingImages,
    completedImages,
    failedImages,
    successRate,
    canStartExtraction: selectedCategory && pendingImages.length > 0 && !isProcessing,
    
    // Actions
    selectCategory: handleCategorySelect,
    addImages: handleImagesAdd,
    startExtraction: handleStartExtraction,
    retryExtraction: handleRetry,
    clearError: () => setError(null),
    
    // Settings
    optimizeForPerformance,
    optimizeForSpeed,
    
    // Utility
  getImageById: (id: string) => uploadedImages.find(img => img.id === id),
  getResultById: (id: string) => results.find((result: ExtractionResult) => result.id === id),
    
    // Statistics
    stats: {
      total: uploadedImages.length,
      pending: pendingImages.length,
      processing: processingImages.length,
      completed: completedImages.length,
      failed: failedImages.length,
      successRate: Math.round(successRate)
    }
  }
}

// Custom hook for category management
export const useCategoryManagement = () => {
  const [categories, setCategories] = useState<CategoryFormData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = useCallback(async (filters?: {
    department?: string
    search?: string
    limit?: number
    offset?: number
  }) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.department) params.set('department', filters.department)
      if (filters?.search) params.set('search', filters.search)
      if (filters?.limit) params.set('limit', filters.limit.toString())
      if (filters?.offset) params.set('offset', filters.offset.toString())

      const response = await fetch(`/api/categories?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setCategories(result.data.categories)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getCategoryById = useCallback(async (id: string): Promise<CategoryFormData | null> => {
    try {
      const response = await fetch(`/api/categories/${id}/form`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    } catch (err) {
      console.error('Failed to load category:', err)
      return null
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  return {
    categories,
    loading,
    error,
    loadCategories,
    getCategoryById,
    refresh: () => loadCategories()
  }
}
