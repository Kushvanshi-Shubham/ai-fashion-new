import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { ExtractionResult, CategoryFormData, CompletedExtractionResult, FailedExtractionResult } from '@/types/fashion'
import { useMemo } from 'react'

interface UploadedImage {
  id: string
  file: File
  preview: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  result?: ExtractionResult
}

interface ExtractionStats {
  totalExtractions: number
  successfulExtractions: number
  failedExtractions: number
  averageConfidence: number
  totalTokensUsed: number
  totalCost: number
  processingTime: number
}

interface ExtractionSettings {
  batchProcessing: boolean
  maxConcurrentProcessing: number
  autoRetry: boolean
  cacheEnabled: boolean
}

interface ExtractionState {
  // Core state
  selectedCategory: CategoryFormData | null
  uploadedImages: UploadedImage[]
  results: ExtractionResult[]
  
  // UI state
  isProcessing: boolean
  currentProgress: number
  error: string | null
  
  // Statistics
  stats: ExtractionStats
  
  // Settings
  settings: ExtractionSettings

  // Type guards for result states
  isCompleted: (result: ExtractionResult) => result is CompletedExtractionResult
  isFailed: (result: ExtractionResult) => result is FailedExtractionResult
  
  // Actions
  setCategory: (category: CategoryFormData | null) => void
  addImages: (files: File[]) => void
  removeImage: (id: string) => void
  clearImages: () => void
  updateImageStatus: (id: string, status: UploadedImage['status'], progress?: number, error?: string) => void
  setImageResult: (id: string, result: ExtractionResult) => void
  startExtraction: (imageId?: string) => Promise<void>
  startBatchExtraction: () => Promise<void>
  retryExtraction: (imageId: string) => Promise<void>
  setError: (error: string | null) => void
  updateStats: (result: ExtractionResult) => void
  resetStats: () => void
  updateSettings: (settings: Partial<ExtractionState['settings']>) => void
  
  // Cleanup
  cleanup: () => void
}

const initialStats: ExtractionStats = {
  totalExtractions: 0,
  successfulExtractions: 0,
  failedExtractions: 0,
  averageConfidence: 0,
  totalTokensUsed: 0,
  totalCost: 0,
  processingTime: 0
}

const initialSettings = {
  batchProcessing: true,
  maxConcurrentProcessing: 3,
  autoRetry: false,
  cacheEnabled: true
}

export const useExtractionStore = create<ExtractionState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // Initial state
        selectedCategory: null,
        uploadedImages: [],
        results: [],
        isProcessing: false,
        currentProgress: 0,
        
        // Add memoization
        getFilteredResults: (filter: string) => {
          const results = get().results
          return useMemo(() => {
            return results.filter(r => r.status === filter)
          }, [results, filter])
        },
        error: null,
        stats: initialStats,
        settings: initialSettings,

        // Set selected category
        setCategory: (category) => {
          set({ selectedCategory: category, error: null })
          
          // Clear images if category changes to avoid confusion
          const current = get().selectedCategory
          if (current && category && current.categoryId !== category.categoryId) {
            get().clearImages()
          }
        },

        // Add images with validation and preview generation
        addImages: (files) => {
          const currentImages = get().uploadedImages
          const maxImages = 10 // Reasonable limit
          
          if (currentImages.length + files.length > maxImages) {
            set({ error: `Maximum ${maxImages} images allowed` })
            return
          }
          
          const newImages: UploadedImage[] = files.map(file => {
            // Validate file
            if (!file.type.startsWith('image/')) {
              return null
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
              return null
            }
            
            return {
              id: crypto.randomUUID(),
              file,
              preview: URL.createObjectURL(file),
              status: 'pending' as const,
              progress: 0
            }
          }).filter(Boolean) as UploadedImage[]
          
          set({
            uploadedImages: [...currentImages, ...newImages],
            error: null
          })
        },

        // Remove single image
        removeImage: (id) => {
          const images = get().uploadedImages
          const imageToRemove = images.find(img => img.id === id)
          
          if (imageToRemove) {
            // Cleanup object URL
            URL.revokeObjectURL(imageToRemove.preview)
            
            set({
              uploadedImages: images.filter(img => img.id !== id),
              results: get().results.filter(result => result.id !== id)
            })
          }
        },

        // Clear all images
        clearImages: () => {
          // Cleanup all object URLs
          get().uploadedImages.forEach(img => {
            URL.revokeObjectURL(img.preview)
          })
          
          set({
            uploadedImages: [],
            results: [],
            currentProgress: 0,
            error: null,
            isProcessing: false
          })
        },

        // Update image status
        updateImageStatus: (id, status, progress = 0, error) => {
          set({
            uploadedImages: get().uploadedImages.map(img =>
              img.id === id ? { ...img, status, progress, error } : img
            )
          })
          
          // Update overall progress
          const images = get().uploadedImages
          const totalProgress = images.reduce((sum, img) => sum + img.progress, 0)
          const averageProgress = images.length > 0 ? totalProgress / images.length : 0
          
          set({ currentProgress: averageProgress })
        },

        // Set extraction result
        setImageResult: (id, result) => {
          set({
            results: [...get().results.filter(r => r.id !== id), result]
          })
          
          get().updateImageStatus(id, 'completed', 100)
          get().updateStats(result)
        },

        // Start single extraction
        startExtraction: async (imageId) => {
          const { selectedCategory, uploadedImages } = get()
          
          if (!selectedCategory) {
            set({ error: 'Please select a category first' })
            return
          }
          
          const image = imageId 
            ? uploadedImages.find(img => img.id === imageId)
            : uploadedImages.find(img => img.status === 'pending')
          
          if (!image) {
            set({ error: 'No image found for extraction' })
            return
          }
          
          set({ isProcessing: true, error: null })
          get().updateImageStatus(image.id, 'processing', 10)
          
          try {
            // Prepare form data
            const formData = new FormData()
            formData.append('file', image.file)
            formData.append('categoryId', selectedCategory.categoryId)
            formData.append('options', JSON.stringify({
              cacheEnabled: get().settings.cacheEnabled
            }))
            
            // Update progress
            get().updateImageStatus(image.id, 'processing', 30)
            
            // Make API call
            const response = await fetch('/api/extract', {
              method: 'POST',
              body: formData
            })
            
            get().updateImageStatus(image.id, 'processing', 70)
            
            const result = await response.json()
            
            if (!result.success) {
              throw new Error(result.error || 'Extraction failed')
            }
            
            // Create extraction result
            const extractionResult: ExtractionResult = {
              id: result.data.extraction.id,
              fileName: image.file.name,
              status: 'completed',
              attributes: result.data.extraction.attributes,
              confidence: result.data.extraction.confidence,
              tokensUsed: result.data.performance.tokensUsed,
              processingTime: result.data.performance.aiProcessingTime,
              createdAt: result.data.timestamp,
              fromCache: result.data.extraction.fromCache
            }
            
            get().setImageResult(image.id, extractionResult)
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            get().updateImageStatus(image.id, 'failed', 0, errorMessage)
            set({ error: errorMessage })
          } finally {
            set({ isProcessing: false })
          }
        },

        // Start batch extraction
        startBatchExtraction: async () => {
          const { uploadedImages, settings } = get()
          const pendingImages = uploadedImages.filter(img => img.status === 'pending')
          
          if (pendingImages.length === 0) {
            set({ error: 'No images to process' })
            return
          }
          
          set({ isProcessing: true, error: null })
          
          if (settings.batchProcessing) {
            // Process in batches with concurrency limit
            const batches: UploadedImage[][] = []
            for (let i = 0; i < pendingImages.length; i += settings.maxConcurrentProcessing) {
              batches.push(pendingImages.slice(i, i + settings.maxConcurrentProcessing))
            }
            
            for (const batch of batches) {
              await Promise.allSettled(
                batch.map(image => get().startExtraction(image.id))
              )
            }
          } else {
            // Process sequentially
            for (const image of pendingImages) {
              await get().startExtraction(image.id)
            }
          }
          
          set({ isProcessing: false })
        },

        // Retry failed extraction
        retryExtraction: async (imageId) => {
          get().updateImageStatus(imageId, 'pending', 0)
          await get().startExtraction(imageId)
        },

        // Set error message
        setError: (error) => set({ error }),

        // Update statistics
        updateStats: (result) => {
          const currentStats = get().stats
          const isSuccess = result.status === 'completed'
          
          const newStats: ExtractionStats = {
            totalExtractions: currentStats.totalExtractions + 1,
            successfulExtractions: currentStats.successfulExtractions + (isSuccess ? 1 : 0),
            failedExtractions: currentStats.failedExtractions + (isSuccess ? 0 : 1),
            averageConfidence: isSuccess 
              ? (currentStats.averageConfidence * currentStats.successfulExtractions + result.confidence) / (currentStats.successfulExtractions + 1)
              : currentStats.averageConfidence,
            totalTokensUsed: currentStats.totalTokensUsed + result.tokensUsed,
            totalCost: currentStats.totalCost + (result.tokensUsed * 0.00015), // Approximate cost
            processingTime: currentStats.processingTime + result.processingTime
          }
          
          set({ stats: newStats })
        },

        // Reset statistics
        resetStats: () => set({ stats: initialStats }),

        // Update settings
        updateSettings: (newSettings) => set({
          settings: { ...get().settings, ...newSettings }
        }),

        // Cleanup resources
        cleanup: () => {
          // Cleanup object URLs
          get().uploadedImages.forEach(img => {
            URL.revokeObjectURL(img.preview)
          })
          
          // Reset to initial state
          set({
            selectedCategory: null,
            uploadedImages: [],
            results: [],
            isProcessing: false,
            currentProgress: 0,
            error: null,
            stats: initialStats
          })
        }
      }),
      {
        name: 'extraction-store',
        version: 1
      }
    )
  )
)

// Custom hook for extraction selectors
export const useExtractionSelectors = () => {
  const store = useExtractionStore()
  
  return {
    // Basic selectors
    selectedCategory: store.selectedCategory,
    uploadedImages: store.uploadedImages,
    results: store.results,
    isProcessing: store.isProcessing,
    error: store.error,
    
    // Computed selectors
    pendingImages: store.uploadedImages.filter(
      (img): img is UploadedImage & { status: 'pending' } => 
      img.status === 'pending'
    ),
    
    processingImages: store.uploadedImages.filter(
      (img): img is UploadedImage & { status: 'processing' } => 
      img.status === 'processing'
    ),
    
    completedImages: store.uploadedImages.filter(
      (img): img is UploadedImage & { status: 'completed' } => 
      img.status === 'completed'
    ),
    
    failedImages: store.uploadedImages.filter(
      (img): img is UploadedImage & { status: 'failed' } => 
      img.status === 'failed'
    ),
    
    // Stats selectors
    stats: {
      successRate: (() => {
        const total = store.stats.totalExtractions
        return total > 0 ? (store.stats.successfulExtractions / total) * 100 : 0
      })(),
      
      averageProcessingTime: (() => {
        const total = store.stats.totalExtractions
        return total > 0 ? store.stats.processingTime / total : 0
      })()
    }
  }
}
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useExtractionStore.getState().cleanup()
  })
}