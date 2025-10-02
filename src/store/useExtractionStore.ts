import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { ExtractionResult, CategoryFormData, CompletedExtractionResult, FailedExtractionResult, isCompletedExtraction } from '@/types'

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string | undefined;
  result?: ExtractionResult | undefined;
  jobId?: string;
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

const initialSettings: ExtractionSettings = {
  batchProcessing: true,
  maxConcurrentProcessing: 3,
  autoRetry: false,
  cacheEnabled: true
}

const pollForResult = async (
  imageId: string,
  jobId: string,
  get: () => ExtractionState
) => {
  const maxRetries = 20; // 20 * 3s = 60s timeout
  const interval = 3000; // 3 seconds

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`/api/extract/status/${jobId}`);
      const result = await response.json();

      if (result.status === 'completed') {
        const image = get().uploadedImages.find(img => img.id === imageId);
        if (image) {
            const extractionResult: CompletedExtractionResult = {
                id: imageId,
                fileName: image.file.name,
                status: 'completed',
                attributes: result.result.extraction.attributes,
                confidence: result.result.extraction.confidence,
                tokensUsed: result.result.tokensUsed,
                processingTime: result.processingTime,
                createdAt: result.createdAt,
                fromCache: result.result.extraction.fromCache,
            };
            get().setImageResult(imageId, extractionResult);
        }
        return;
      }

      if (result.status === 'failed') {
        get().updateImageStatus(imageId, 'failed', 0, result.error);
        return;
      }

      // Still processing, update progress
      const progress = 50 + (i / maxRetries) * 40; // Progress from 50% to 90%
      get().updateImageStatus(imageId, 'processing', progress);

      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Polling failed';
      get().updateImageStatus(imageId, 'failed', 0, message);
      return;
    }
  }

  get().updateImageStatus(imageId, 'failed', 0, 'Extraction timed out');
};

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
        
        // Filter helper (not a React hook)
        getFilteredResults: (filter: UploadedImage['status']) => {
          return get().results.filter(r => r.status === filter)
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

        // Type guard helpers
        isCompleted: (result: ExtractionResult): result is CompletedExtractionResult => {
          return isCompletedExtraction(result)
        },
        isFailed: (result: ExtractionResult): result is FailedExtractionResult => {
          return result.status === 'failed'
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
            
            const id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
            const preview = URL.createObjectURL(file)
            return {
              id,
              file,
              preview,
              status: 'pending' as const,
              progress: 0,
              error: undefined
            }
          }).filter(Boolean) as UploadedImage[]
          
          set({ uploadedImages: [...currentImages, ...newImages], error: null })
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
          set((state) => ({
            results: [...state.results.filter((r) => r.id !== id), result],
            uploadedImages: state.uploadedImages.map(img =>
              img.id === id ? { ...img, status: 'completed', progress: 100, result } : img
            )
          }));
          
          get().updateStats(result);
        },

        // Start single extraction
        startExtraction: async (imageId) => {
          const { selectedCategory, uploadedImages, settings } = get();

          if (!selectedCategory) {
            set({ error: 'Please select a category first' });
            return;
          }

          const image = imageId
            ? uploadedImages.find((img) => img.id === imageId)
            : uploadedImages.find((img) => img.status === 'pending');

          if (!image) {
            set({ error: 'No image found for extraction' });
            return;
          }

          set({ isProcessing: true, error: null });
          get().updateImageStatus(image.id, 'processing', 10);

          try {
            const formData = new FormData();
            formData.append('file', image.file);
            formData.append('categoryId', selectedCategory.categoryId);
            formData.append(
              'options',
              JSON.stringify({
                cacheEnabled: settings.cacheEnabled,
                model: 'gpt-4o', // Or get from settings
              })
            );

            get().updateImageStatus(image.id, 'processing', 30);

            const response = await fetch('/api/extract', {
              method: 'POST',
              body: formData,
            });

            if (response.status !== 202) {
              const errorResult = await response.json();
              throw new Error(errorResult.error || 'Failed to start extraction job');
            }

            const { jobId } = await response.json();

            // Store jobId with the image
            set((state) => ({
              uploadedImages: state.uploadedImages.map((img) =>
                img.id === image.id ? { ...img, jobId } : img
              ),
            }));

            get().updateImageStatus(image.id, 'processing', 50);

            // Start polling for the result
            await pollForResult(image.id, jobId, get);

          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            get().updateImageStatus(image.id, 'failed', 0, errorMessage);
            set({ error: errorMessage });
          } finally {
            // isProcessing will be set to false by the batch processor
            const anyProcessing = get().uploadedImages.some(img => img.status === 'processing');
            if (!anyProcessing) {
              set({ isProcessing: false });
            }
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
          const isSuccess = isCompletedExtraction(result)

          const totalExtractions = currentStats.totalExtractions + 1
          const successfulExtractions = currentStats.successfulExtractions + (isSuccess ? 1 : 0)
          const failedExtractions = currentStats.failedExtractions + (isSuccess ? 0 : 1)

          // Safely compute average confidence only when result is completed
          const averageConfidence = isSuccess
            ? (currentStats.averageConfidence * currentStats.successfulExtractions + (typeof result.confidence === 'number' ? result.confidence : 0)) / (currentStats.successfulExtractions + 1)
            : currentStats.averageConfidence

          const totalTokensUsed = currentStats.totalTokensUsed + (isSuccess ? (typeof result.tokensUsed === 'number' ? result.tokensUsed : 0) : 0)
          const totalCost = currentStats.totalCost + (isSuccess ? ((typeof result.tokensUsed === 'number' ? result.tokensUsed : 0) * 0.00015) : 0)
          const processingTime = currentStats.processingTime + (isSuccess ? (typeof result.processingTime === 'number' ? result.processingTime : 0) : 0)

          const newStats: ExtractionStats = {
            totalExtractions,
            successfulExtractions,
            failedExtractions,
            averageConfidence,
            totalTokensUsed,
            totalCost,
            processingTime
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
      })
    ),
    { name: 'extraction-store' }
  )
)
// Custom hook for extraction selectors
export const useExtractionSelectors = () => {
  const store = useExtractionStore()

  return {
    selectedCategory: store.selectedCategory,
    uploadedImages: store.uploadedImages,
    results: store.results,
    isProcessing: store.isProcessing,
    error: store.error,
    pendingImages: store.uploadedImages.filter((i) => i.status === 'pending'),
    processingImages: store.uploadedImages.filter((i) => i.status === 'processing'),
    completedImages: store.uploadedImages.filter((i) => i.status === 'completed'),
    failedImages: store.uploadedImages.filter((i) => i.status === 'failed'),
    stats: {
      successRate: store.stats.totalExtractions > 0 ? (store.stats.successfulExtractions / store.stats.totalExtractions) * 100 : 0,
      averageProcessingTime: store.stats.totalExtractions > 0 ? store.stats.processingTime / store.stats.totalExtractions : 0
    }
  }
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useExtractionStore.getState().cleanup()
  })
}