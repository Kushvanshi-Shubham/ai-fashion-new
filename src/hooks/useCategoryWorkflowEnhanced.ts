import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { CategoryFormData, UploadedImage } from '@/types/fashion'

export interface CategoryWorkflowState {
  selectedCategory: CategoryFormData | null
  uploadedImages: UploadedImage[]
  currentStep: 'category' | 'attributes' | 'upload' | 'results'
}

// React Query hook for extraction jobs
export const useExtractionJob = (jobId: string | null) => {
  return useQuery({
    queryKey: ['extraction-job', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) throw new Error('Failed to fetch job status')
      return response.json()
    },
    enabled: !!jobId,
    refetchInterval: 2000, // Poll every 2 seconds
    retry: 3
  })
}

// Enhanced category workflow with React Query
export const useCategoryWorkflowEnhanced = () => {
  const queryClient = useQueryClient()
  
  // Local state for workflow
  const [selectedCategory, setSelectedCategory] = useState<CategoryFormData | null>(null)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [currentStep, setCurrentStep] = useState<'category' | 'attributes' | 'upload' | 'results'>('category')

  // Query for extraction results
  const { data: extractionResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['extraction-results'],
    queryFn: async () => {
      const response = await fetch('/api/extractions')
      if (!response.ok) throw new Error('Failed to fetch results')
      return response.json()
    },
    enabled: currentStep === 'results'
  })

  // Mutation for starting extractions
  const extractionMutation = useMutation({
    mutationFn: async ({ imageFile, category }: { imageFile: File, category: CategoryFormData }) => {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('category', JSON.stringify(category))
      
      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) throw new Error('Extraction failed')
      return response.json()
    },
    onSuccess: (result, variables) => {
      // Update image status to processing
      setUploadedImages(prev => prev.map(img => 
        img.file === variables.imageFile 
          ? { ...img, status: 'processing', jobId: result.jobId }
          : img
      ))
      
      // Invalidate and refetch results
      queryClient.invalidateQueries({ queryKey: ['extraction-results'] })
    },
    onError: (error, variables) => {
      // Update image status to failed
      setUploadedImages(prev => prev.map(img => 
        img.file === variables.imageFile 
          ? { ...img, status: 'failed', error: error.message }
          : img
      ))
    }
  })

  // Batch extraction mutation
  const batchExtractionMutation = useMutation({
    mutationFn: async ({ images, category }: { images: UploadedImage[], category: CategoryFormData }) => {
      const results = await Promise.allSettled(
        images.map(img => 
          extractionMutation.mutateAsync({ imageFile: img.file, category })
        )
      )
      return results
    }
  })

  // Add images
  const addImages = useCallback((files: File[]) => {
    const newImages: UploadedImage[] = files.map(file => ({
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }))

    setUploadedImages(prev => [...prev, ...newImages])
    return newImages
  }, [])

  // Remove image
  const removeImage = useCallback((imageId: string) => {
    setUploadedImages(prev => {
      const image = prev.find(img => img.id === imageId)
      if (image?.preview) {
        URL.revokeObjectURL(image.preview)
      }
      return prev.filter(img => img.id !== imageId)
    })
  }, [])

  // Start extraction for single image
  const startExtraction = useCallback(async (imageId: string) => {
    const image = uploadedImages.find(img => img.id === imageId)
    if (!image || !selectedCategory) return

    await extractionMutation.mutateAsync({
      imageFile: image.file,
      category: selectedCategory
    })
  }, [uploadedImages, selectedCategory, extractionMutation])

  // Start batch extraction
  const startBatchExtraction = useCallback(async () => {
    const pendingImages = uploadedImages.filter(img => img.status === 'pending')
    if (pendingImages.length === 0 || !selectedCategory) return

    await batchExtractionMutation.mutateAsync({
      images: pendingImages,
      category: selectedCategory
    })
  }, [uploadedImages, selectedCategory, batchExtractionMutation])

  // Navigate between steps
  const goToStep = useCallback((step: typeof currentStep) => {
    setCurrentStep(step)
  }, [])

  // Computed values
  const stats = {
    total: uploadedImages.length,
    pending: uploadedImages.filter(img => img.status === 'pending').length,
    processing: uploadedImages.filter(img => img.status === 'processing').length,
    completed: uploadedImages.filter(img => img.status === 'completed').length,
    failed: uploadedImages.filter(img => img.status === 'failed').length
  }

  const canStartExtraction = Boolean(
    selectedCategory && 
    stats.pending > 0 && 
    !extractionMutation.isPending && 
    !batchExtractionMutation.isPending
  )

  const isProcessing = extractionMutation.isPending || batchExtractionMutation.isPending

  return {
    // State
    selectedCategory,
    uploadedImages,
    currentStep,
    extractionResults,
    
    // Loading states
    isProcessing,
    resultsLoading,
    
    // Actions
    setSelectedCategory,
    addImages,
    removeImage,
    startExtraction,
    startBatchExtraction,
    goToStep,
    
    // Computed
    stats,
    canStartExtraction,
    
    // Step helpers
    pendingImages: uploadedImages.filter(img => img.status === 'pending'),
    processingImages: uploadedImages.filter(img => img.status === 'processing'),
    completedImages: uploadedImages.filter(img => img.status === 'completed'),
    failedImages: uploadedImages.filter(img => img.status === 'failed'),
  }
}

// Hook for individual job status tracking
export const useJobStatus = (jobId: string | null) => {
  const { data: job, isLoading } = useExtractionJob(jobId)
  
  return {
    job,
    isLoading,
    status: job?.status || 'unknown',
    progress: job?.progress || 0,
    result: job?.result,
    error: job?.error
  }
}

// Hook for cached categories (performance optimization)
export const useCachedCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      return response.json()
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour in cache
  })
}

export default useCategoryWorkflowEnhanced