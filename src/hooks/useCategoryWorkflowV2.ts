'use client';

import { useState, useCallback, useEffect } from 'react';
import { CategoryFormData, ExtractionResult, UploadedImage } from '@/types/fashion';
import { useOptimisticJobCreation, useQueueStatus } from '@/hooks/useJobPollingNew';
import { toast } from 'sonner';

export interface UseCategoryWorkflowOptions {
  onCategoryChange?: (category: CategoryFormData | null) => void;
  onImageProcessed?: (result: ExtractionResult) => void;
  onError?: (error: string) => void;
  // Enhanced options
  enableOptimisticUpdates?: boolean;
  enableRealTimePolling?: boolean;
}

export interface CategoryWorkflowState {
  selectedCategory: CategoryFormData | null;
  uploadedImages: UploadedImage[];
  results: ExtractionResult[];
  isProcessing: boolean;
  error: string | null;
  jobStatuses: Record<string, string>;
  // Enhanced state
  activeJobs: Record<string, string>; // imageId -> jobId mapping
  processingStats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

export interface CategoryWorkflowActions {
  setCategory: (category: CategoryFormData | null) => void;
  addImages: (files: File[]) => void;
  removeImage: (imageId: string) => void;
  processImage: (imageId: string) => Promise<void>;
  startBatchExtraction: () => Promise<void>;
  clearResults: () => void;
  retry: (imageId: string) => Promise<void>;
  // Enhanced actions
  pauseProcessing: () => void;
  resumeProcessing: () => void;
  cancelJob: (imageId: string) => void;
}

export const useCategoryWorkflowEnhanced = (options: UseCategoryWorkflowOptions = {}) => {
  const {
    onCategoryChange,
    onError,
    enableOptimisticUpdates = true,
    enableRealTimePolling = true
  } = options;

  const [state, setState] = useState<CategoryWorkflowState>({
    selectedCategory: null,
    uploadedImages: [],
    results: [],
    isProcessing: false,
    error: null,
    jobStatuses: {},
    activeJobs: {},
    processingStats: { pending: 0, processing: 0, completed: 0, failed: 0 }
  });

  const [processingQueue, setProcessingQueue] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Enhanced job creation with optimistic updates
  const { createJobOptimistically } = useOptimisticJobCreation();
  
  // Real-time queue status
  const { data: queueStatus } = useQueueStatus();

  // Calculate processing stats from current images
  const updateProcessingStats = useCallback(() => {
    setState(prev => {
      const stats = prev.uploadedImages.reduce(
        (acc, img) => {
          acc[img.status]++;
          return acc;
        },
        { pending: 0, processing: 0, completed: 0, failed: 0 } as { pending: number; processing: number; completed: number; failed: number }
      );
      return { ...prev, processingStats: stats };
    });
  }, []);

  // Update category selection
  const setCategory = useCallback((category: CategoryFormData | null) => {
    setState(prev => ({ 
      ...prev, 
      selectedCategory: category,
      error: null 
    }));
    onCategoryChange?.(category);
  }, [onCategoryChange]);

  // Add images for processing
  const addImages = useCallback((files: File[]) => {
    const newImages: UploadedImage[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending',
      progress: 0,
      preview: URL.createObjectURL(file)
    }));

    setState(prev => ({
      ...prev,
      uploadedImages: [...prev.uploadedImages, ...newImages],
      error: null
    }));

    // Update stats
    setTimeout(updateProcessingStats, 0);
  }, [updateProcessingStats]);

  // Remove image
  const removeImage = useCallback((imageId: string) => {
    setState(prev => {
      // Cancel job if active
      const jobId = prev.activeJobs[imageId];
      if (jobId) {
        // TODO: Implement job cancellation API
        console.log(`Cancelling job ${jobId} for image ${imageId}`);
      }

      // Clean up preview URL
      const image = prev.uploadedImages.find(img => img.id === imageId);
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [imageId]: _, ...remainingJobs } = prev.activeJobs;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [imageId]: __, ...remainingStatuses } = prev.jobStatuses;

      return {
        ...prev,
        uploadedImages: prev.uploadedImages.filter(img => img.id !== imageId),
        activeJobs: remainingJobs,
        jobStatuses: remainingStatuses,
        results: prev.results.filter(result => result.id !== imageId)
      };
    });
    
    setTimeout(updateProcessingStats, 0);
  }, [updateProcessingStats]);

  // Enhanced image processing with optimistic updates
  const processImage = useCallback(async (imageId: string) => {
    const image = state.uploadedImages.find(img => img.id === imageId);
    const category = state.selectedCategory;

    if (!image || !category) {
      const error = !image ? 'Image not found' : 'No category selected';
      onError?.(error);
      toast.error(error);
      return;
    }

    // Optimistic update: mark as processing
    setState(prev => ({
      ...prev,
      uploadedImages: prev.uploadedImages.map(img =>
        img.id === imageId ? { ...img, status: 'processing', progress: 10 } : img
      ),
      isProcessing: true,
      error: null
    }));

    try {
      let jobId: string;

      if (enableOptimisticUpdates) {
        // Create job optimistically
        jobId = await createJobOptimistically(image.file, category, `temp-${imageId}`);
      } else {
        // Standard job creation
        const formData = new FormData();
        formData.append('file', image.file);
        formData.append('categoryId', category.categoryId);

        const response = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create extraction job');
        }

        jobId = data.data?.jobId;
      }

      if (!jobId) {
        throw new Error('No job ID received');
      }

      // Update state with job ID
      setState(prev => ({
        ...prev,
        activeJobs: { ...prev.activeJobs, [imageId]: jobId },
        jobStatuses: { ...prev.jobStatuses, [imageId]: jobId }
      }));

      toast.success(`Extraction started for ${image.file.name}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Revert optimistic update on error
      setState(prev => ({
        ...prev,
        uploadedImages: prev.uploadedImages.map(img =>
          img.id === imageId ? { ...img, status: 'failed', progress: 0, error: errorMessage } : img
        ),
        isProcessing: false,
        error: errorMessage
      }));

      onError?.(errorMessage);
      toast.error(`Failed to start extraction: ${errorMessage}`);
    }
  }, [state.uploadedImages, state.selectedCategory, onError, enableOptimisticUpdates, createJobOptimistically]);

  // Start batch extraction
  const startBatchExtraction = useCallback(async () => {
    const pendingImages = state.uploadedImages.filter(img => img.status === 'pending');
    
    if (pendingImages.length === 0) {
      toast.warning('No pending images to process');
      return;
    }

    setProcessingQueue(pendingImages.map(img => img.id));
    setState(prev => ({ ...prev, isProcessing: true }));

    toast.success(`Starting batch extraction for ${pendingImages.length} images`);

    // Process images sequentially or in parallel based on preference
    for (const image of pendingImages) {
      if (isPaused) break;
      await processImage(image.id);
      // Small delay between jobs to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setProcessingQueue([]);
    setState(prev => ({ ...prev, isProcessing: false }));
  }, [state.uploadedImages, isPaused, processImage]);

  // Pause/Resume processing
  const pauseProcessing = useCallback(() => {
    setIsPaused(true);
    toast.info('Processing paused');
  }, []);

  const resumeProcessing = useCallback(() => {
    setIsPaused(false);
    toast.info('Processing resumed');
  }, []);

  // Cancel specific job
  const cancelJob = useCallback((imageId: string) => {
    const jobId = state.activeJobs[imageId];
    if (!jobId) return;

    // TODO: Implement actual job cancellation API
    console.log(`Cancelling job ${jobId} for image ${imageId}`);

    setState(prev => {
      const { [imageId]: cancelled, ...remainingJobs } = prev.activeJobs;
      void cancelled; // Mark as intentionally unused
      return {
        ...prev,
        activeJobs: remainingJobs,
        uploadedImages: prev.uploadedImages.map(img =>
          img.id === imageId ? { ...img, status: 'pending', progress: 0 } : img
        )
      };
    });

    toast.info('Job cancelled');
  }, [state.activeJobs]);

  // Clear all results
  const clearResults = useCallback(() => {
    // Clean up preview URLs
    state.uploadedImages.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });

    setState({
      selectedCategory: state.selectedCategory,
      uploadedImages: [],
      results: [],
      isProcessing: false,
      error: null,
      jobStatuses: {},
      activeJobs: {},
      processingStats: { pending: 0, processing: 0, completed: 0, failed: 0 }
    });

    toast.success('Results cleared');
  }, [state.uploadedImages, state.selectedCategory]);

  // Retry failed image
  const retry = useCallback(async (imageId: string) => {
    setState(prev => ({
      ...prev,
      uploadedImages: prev.uploadedImages.map(img =>
        img.id === imageId ? { ...img, status: 'pending', progress: 0 } : img
      )
    }));

    await processImage(imageId);
  }, [processImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      state.uploadedImages.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [state.uploadedImages]);

  // Update processing stats when images change
  useEffect(() => {
    updateProcessingStats();
  }, [state.uploadedImages, updateProcessingStats]);

  // Derived state
  const canStartExtraction = state.selectedCategory && 
    state.uploadedImages.some(img => img.status === 'pending') && 
    !state.isProcessing;

  const stats = {
    total: state.uploadedImages.length,
    pending: state.processingStats.pending,
    processing: state.processingStats.processing,
    completed: state.processingStats.completed,
    failed: state.processingStats.failed,
    queueInfo: queueStatus,
  };

  const actions: CategoryWorkflowActions = {
    setCategory,
    addImages,
    removeImage,
    processImage,
    startBatchExtraction,
    clearResults,
    retry,
    pauseProcessing,
    resumeProcessing,
    cancelJob,
  };

  return {
    // State
    ...state,
    isPaused,
    processingQueue,
    
    // Derived state
    canStartExtraction,
    stats,
    
    // Actions
    ...actions,
    
    // Enhanced features
    enableOptimisticUpdates,
    enableRealTimePolling,
  };
};