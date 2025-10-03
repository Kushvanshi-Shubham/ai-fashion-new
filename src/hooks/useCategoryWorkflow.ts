'use client';

import { useState, useCallback, useEffect } from 'react';
import { CategoryFormData, ExtractionResult, UploadedImage } from '@/types/fashion';
import { ExtractionService } from '@/lib/services/extraction-service';

export interface UseCategoryWorkflowOptions {
  onCategoryChange?: (category: CategoryFormData | null) => void;
  onImageProcessed?: (result: ExtractionResult) => void;
  onError?: (error: string) => void;
}

export interface CategoryWorkflowState {
  selectedCategory: CategoryFormData | null;
  uploadedImages: UploadedImage[];
  results: ExtractionResult[];
  isProcessing: boolean;
  error: string | null;
  jobStatuses: Record<string, string>;
}

export const useCategoryWorkflow = (options: UseCategoryWorkflowOptions = {}) => {
  const [state, setState] = useState<CategoryWorkflowState>({
    selectedCategory: null,
    uploadedImages: [],
    results: [],
    isProcessing: false,
    error: null,
    jobStatuses: {}
  });

  const { onCategoryChange, onImageProcessed, onError } = options;

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
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }));

    setState(prev => ({
      ...prev,
      uploadedImages: [...prev.uploadedImages, ...newImages]
    }));

    return newImages;
  }, []);

  // Start extraction for specific image
  const startExtraction = useCallback(async (imageId: string) => {
    const image = state.uploadedImages.find(img => img.id === imageId);
    const category = state.selectedCategory;

    if (!image || !category) {
      const error = !image ? 'Image not found' : 'No category selected';
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    // Update image status to processing
    setState(prev => ({
      ...prev,
      uploadedImages: prev.uploadedImages.map(img =>
        img.id === imageId ? { ...img, status: 'processing', progress: 10 } : img
      ),
      isProcessing: true,
      error: null
    }));

    try {
      // Start extraction job
      const { jobId } = await ExtractionService.extract(image.file, category);

      // Update job status
      setState(prev => ({
        ...prev,
        jobStatuses: { ...prev.jobStatuses, [imageId]: jobId }
      }));

      // Poll for job completion
      const result = await ExtractionService.pollJobStatus(
        jobId,
        (status) => {
          // Update progress based on job status
          let progress = 10;
          switch (status) {
            case 'pending': progress = 20; break;
            case 'processing': progress = 50; break;
            case 'completed': progress = 100; break;
          }

          setState(prev => ({
            ...prev,
            uploadedImages: prev.uploadedImages.map(img =>
              img.id === imageId ? { ...img, progress } : img
            )
          }));
        }
      );

      // Update with completed result
      setState(prev => ({
        ...prev,
        uploadedImages: prev.uploadedImages.map(img =>
          img.id === imageId 
            ? { ...img, status: 'completed', progress: 100, result }
            : img
        ),
        results: [...prev.results, result],
        isProcessing: prev.uploadedImages.filter(img => 
          img.status === 'processing' && img.id !== imageId
        ).length > 0
      }));

      onImageProcessed?.(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Extraction failed';
      
      setState(prev => ({
        ...prev,
        uploadedImages: prev.uploadedImages.map(img =>
          img.id === imageId 
            ? { ...img, status: 'failed', progress: 0, error: errorMessage }
            : img
        ),
        error: errorMessage,
        isProcessing: prev.uploadedImages.filter(img => 
          img.status === 'processing' && img.id !== imageId
        ).length > 0
      }));

      onError?.(errorMessage);
    }
  }, [state.uploadedImages, state.selectedCategory, onImageProcessed, onError]);

  // Start batch extraction
  const startBatchExtraction = useCallback(async () => {
    const pendingImages = state.uploadedImages.filter(img => img.status === 'pending');
    
    if (pendingImages.length === 0) {
      setState(prev => ({ ...prev, error: 'No pending images to process' }));
      return;
    }

    if (!state.selectedCategory) {
      setState(prev => ({ ...prev, error: 'No category selected' }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    // Process images in parallel (limit concurrency)
    const concurrentLimit = 3;
    const chunks: UploadedImage[][] = [];
    
    for (let i = 0; i < pendingImages.length; i += concurrentLimit) {
      chunks.push(pendingImages.slice(i, i + concurrentLimit));
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(image => startExtraction(image.id))
      );
    }
  }, [state.uploadedImages, state.selectedCategory, startExtraction]);

  // Retry failed extraction
  const retryExtraction = useCallback(async (imageId: string) => {
    setState(prev => ({
      ...prev,
      uploadedImages: prev.uploadedImages.map(img => {
        if (img.id === imageId) {
          return { 
            id: img.id,
            file: img.file,
            preview: img.preview,
            progress: 0,
            status: 'pending' as const
            // Omitting error and result to make them undefined
          };
        }
        return img;
      })
    }));
    
    await startExtraction(imageId);
  }, [startExtraction]);

  // Remove image
  const removeImage = useCallback((imageId: string) => {
    setState(prev => {
      const image = prev.uploadedImages.find(img => img.id === imageId);
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }

      return {
        ...prev,
        uploadedImages: prev.uploadedImages.filter(img => img.id !== imageId),
        results: prev.results.filter(result => 
          !prev.uploadedImages.some(img => img.id === imageId && img.result?.id === result.id)
        )
      };
    });
  }, []);

  // Clear all data
  const clearAll = useCallback(() => {
    // Cleanup preview URLs
    state.uploadedImages.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });

    setState({
      selectedCategory: null,
      uploadedImages: [],
      results: [],
      isProcessing: false,
      error: null,
      jobStatuses: {}
    });
  }, [state.uploadedImages]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

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

  // Computed values
  const pendingImages = state.uploadedImages.filter(img => img.status === 'pending');
  const processingImages = state.uploadedImages.filter(img => img.status === 'processing');
  const completedImages = state.uploadedImages.filter(img => img.status === 'completed');
  const failedImages = state.uploadedImages.filter(img => img.status === 'failed');

  const stats = {
    total: state.uploadedImages.length,
    pending: pendingImages.length,
    processing: processingImages.length,
    completed: completedImages.length,
    failed: failedImages.length,
    successRate: state.uploadedImages.length > 0 
      ? Math.round((completedImages.length / state.uploadedImages.length) * 100)
      : 0
  };

  const canStartExtraction = Boolean(
    state.selectedCategory && 
    pendingImages.length > 0 && 
    !state.isProcessing
  );

  return {
    // State
    ...state,
    
    // Computed
    pendingImages,
    processingImages,
    completedImages,
    failedImages,
    stats,
    canStartExtraction,
    
    // Actions
    setCategory,
    addImages,
    startExtraction,
    startBatchExtraction,
    retryExtraction,
    removeImage,
    clearAll,
    clearError,
    
    // Utilities
    getImageById: (id: string) => state.uploadedImages.find(img => img.id === id),
    getResultById: (id: string) => state.results.find(result => result.id === id)
  };
};
