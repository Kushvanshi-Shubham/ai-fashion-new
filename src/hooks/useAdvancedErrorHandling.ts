'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

import { AdvancedErrorHandler, RetryContext } from '@/lib/error-handling/AdvancedErrorHandler';

import { ExtractionResult } from '@/types/fashion';
import { toast } from 'sonner';

export interface UseAdvancedErrorHandlingOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  confidenceThreshold?: number;
  enableLowConfidenceRetry?: boolean;
  onRetryAttempt?: (jobId: string, attempt: number, context: RetryContext) => void;
  onRetryExhausted?: (jobId: string, context: RetryContext) => void;
  onLowConfidenceDetected?: (jobId: string, result: ExtractionResult) => void;
}

export interface ErrorHandlingState {
  retryContexts: Record<string, RetryContext>;
  isRetrying: Record<string, boolean>;
  retryStatistics: {
    activeRetries: number;
    totalContexts: number;
    exhaustedContexts: number;
    averageAttempts: number;
    totalDelay: number;
  };
}

export function useAdvancedErrorHandling(options: UseAdvancedErrorHandlingOptions = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 2000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    confidenceThreshold = 75,
    enableLowConfidenceRetry = true,
    onRetryAttempt,
    onRetryExhausted,
    onLowConfidenceDetected
  } = options;


  const errorHandlerRef = useRef<AdvancedErrorHandler | null>(null);
  
  const [state, setState] = useState<ErrorHandlingState>({
    retryContexts: {},
    isRetrying: {},
    retryStatistics: {
      activeRetries: 0,
      totalContexts: 0,
      exhaustedContexts: 0,
      averageAttempts: 0,
      totalDelay: 0
    }
  });

  // Initialize error handler
  if (!errorHandlerRef.current) {
    errorHandlerRef.current = new AdvancedErrorHandler({
      maxAttempts,
      baseDelay,
      maxDelay,
      backoffMultiplier,
      confidenceThreshold,
      retryableStatuses: ['408', '429', '500', '502', '503', '504'],
      retryableErrorTypes: [
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'RATE_LIMIT_ERROR',
        'SERVER_ERROR',
        'LOW_CONFIDENCE_ERROR'
      ]
    });
  }

  // Update statistics periodically
  useEffect(() => {
    const updateStats = () => {
      if (errorHandlerRef.current) {
        const stats = errorHandlerRef.current.getRetryStatistics();
        setState(prev => ({ ...prev, retryStatistics: stats }));
      }
    };

    const interval = setInterval(updateStats, 5000);
    updateStats(); // Initial update
    
    return () => clearInterval(interval);
  }, []);

  // Enhanced job creation with automatic retry
  const createJobWithRetry = useCallback(async (
    file: File,
    category: { categoryId: string },
    tempJobId?: string
  ): Promise<string> => {
    const jobId = tempJobId || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const result = await errorHandlerRef.current!.executeWithRetry(
        jobId,
        async () => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('categoryId', category.categoryId);

          const response = await fetch('/api/extract', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          
          if (!response.ok) {
            const error = new Error(data.error || `HTTP ${response.status}`) as Error & { type?: string; response?: { status: number } };
            error.response = { status: response.status };
            error.type = response.status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
            throw error;
          }

          if (!data.success || !data.data?.jobId) {
            throw new Error('Invalid response: missing job ID');
          }

          return data.data.jobId;
        }
      );

      return result;

    } catch (error) {
      console.error(`[ErrorHandling] Job creation failed for ${jobId}:`, error);
      toast.error(`Failed to create job: ${(error as Error).message}`);
      throw error;
    }
  }, []);

  // Trigger re-extraction for low confidence results
  const triggerReextraction = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/extract/retry/${jobId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = new Error(`Re-extraction failed: HTTP ${response.status}`) as Error & { type?: string; response?: { status: number } };
        error.response = { status: response.status };
        throw error;
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Re-extraction request failed');
      }

      toast.success(`Re-extraction initiated for job ${jobId}`);
      return data.newJobId || jobId;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Re-extraction failed: ${message}`);
      
      setState(prev => {
        const { [jobId]: removed, ...remainingRetries } = prev.isRetrying;
        void removed; // Intentionally unused
        return { ...prev, isRetrying: remainingRetries };
      });
      
      throw error;
    }
  }, []);

  // Helper to create enhanced polling options (no hook calls inside)
  const getEnhancedPollingOptions = useCallback((
    jobId: string,
    originalOptions: { onCompleted?: (result: unknown) => void; onError?: (error: unknown) => void } = {}
  ) => {
    return {
      ...originalOptions,
      onCompleted: (result: ExtractionResult) => {
        // Check confidence level
        if (enableLowConfidenceRetry && !errorHandlerRef.current!.hasAcceptableConfidence(result)) {
          onLowConfidenceDetected?.(jobId, result);
          
          const { shouldReextract, retryDelay, context } = 
            errorHandlerRef.current!.recordLowConfidenceResult(jobId, result);

          if (shouldReextract) {
            setState(prev => ({
              ...prev,
              isRetrying: { ...prev.isRetrying, [jobId]: true },
              retryContexts: { ...prev.retryContexts, [jobId]: context }
            }));

            onRetryAttempt?.(jobId, context.totalAttempts, context);
            
            toast.warning(
              `Low confidence result (${('confidence' in result) ? result.confidence : 'unknown'}%). ` +
              `Retrying in ${Math.round(retryDelay / 1000)}s...`
            );

            // Trigger re-extraction after delay
            setTimeout(async () => {
              try {
                await triggerReextraction(jobId);
              } catch (error) {
                console.error(`[ErrorHandling] Re-extraction failed for ${jobId}:`, error);
              }
            }, retryDelay);

            return; // Don't call original onCompleted yet
          } else {
            onRetryExhausted?.(jobId, context);
            toast.error(`Low confidence result after ${context.totalAttempts} attempts. Giving up.`);
          }
        }

        // Acceptable result or retry exhausted
        setState(prev => {
          const { [jobId]: removed, ...remainingRetries } = prev.isRetrying;
          void removed; // Intentionally unused
          return { ...prev, isRetrying: remainingRetries };
        });

        originalOptions.onCompleted?.(result);
      },
      onError: (error: string) => {
        const errorObj = { message: error, type: 'POLLING_ERROR' };
        const { shouldRetry, retryDelay, context } = 
          errorHandlerRef.current!.recordFailedAttempt(jobId, errorObj);

        setState(prev => ({
          ...prev,
          retryContexts: { ...prev.retryContexts, [jobId]: context }
        }));

        if (shouldRetry) {
          setState(prev => ({
            ...prev,
            isRetrying: { ...prev.isRetrying, [jobId]: true }
          }));

          onRetryAttempt?.(jobId, context.totalAttempts, context);
          
          toast.warning(
            `Polling failed. Retrying in ${Math.round(retryDelay / 1000)}s... ` +
            `(${context.totalAttempts}/${maxAttempts})`
          );

          // Don't call original onError yet - wait for retry
        } else {
          onRetryExhausted?.(jobId, context);
          setState(prev => {
            const { [jobId]: removed, ...remainingRetries } = prev.isRetrying;
            void removed; // Intentionally unused
            return { ...prev, isRetrying: remainingRetries };
          });
          
          originalOptions.onError?.(error);
        }
      }
    };
  }, [enableLowConfidenceRetry, maxAttempts, onRetryAttempt, onRetryExhausted, onLowConfidenceDetected, triggerReextraction]);



  // Manual retry for failed jobs
  const retryJob = useCallback(async (jobId: string) => {
    const context = errorHandlerRef.current!.getRetryContext(jobId);
    
    if (!context || context.isExhausted) {
      toast.error('Cannot retry: job has exhausted retry attempts');
      return;
    }

    setState(prev => ({
      ...prev,
      isRetrying: { ...prev.isRetrying, [jobId]: true }
    }));

    try {
      await triggerReextraction(jobId);
    } catch (error) {
      void error; // Mark as intentionally unused
      setState(prev => {
        const { [jobId]: removed, ...remainingRetries } = prev.isRetrying;
        void removed; // Mark as intentionally unused
        return { ...prev, isRetrying: remainingRetries };
      });
    }
  }, [triggerReextraction]);

  // Clear retry context
  const clearRetryContext = useCallback((jobId: string) => {
    errorHandlerRef.current!.reset();
    setState(prev => {
      const { [jobId]: removedContext, ...remainingContexts } = prev.retryContexts;
      const { [jobId]: removedRetrying, ...remainingRetrying } = prev.isRetrying;
      void removedContext; // Mark as intentionally unused
      void removedRetrying; // Mark as intentionally unused
      return {
        ...prev,
        retryContexts: remainingContexts,
        isRetrying: remainingRetrying
      };
    });
  }, []);

  // Update error handler configuration
  const updateConfig = useCallback((newConfig: Partial<UseAdvancedErrorHandlingOptions>) => {
    if (errorHandlerRef.current) {
      const config: Record<string, number> = {};
      if (newConfig.maxAttempts !== undefined) config.maxAttempts = newConfig.maxAttempts;
      if (newConfig.baseDelay !== undefined) config.baseDelay = newConfig.baseDelay;
      if (newConfig.maxDelay !== undefined) config.maxDelay = newConfig.maxDelay;
      if (newConfig.backoffMultiplier !== undefined) config.backoffMultiplier = newConfig.backoffMultiplier;
      if (newConfig.confidenceThreshold !== undefined) config.confidenceThreshold = newConfig.confidenceThreshold;
      
      errorHandlerRef.current.updateConfig(config);
    }
  }, []);

  return {
    // State
    retryContexts: state.retryContexts,
    isRetrying: state.isRetrying,
    retryStatistics: state.retryStatistics,
    
    // Enhanced operations
    createJobWithRetry,
    getEnhancedPollingOptions,
    retryJob,
    triggerReextraction,
    clearRetryContext,
    updateConfig,
    
    // Utilities
    getRetryContext: (jobId: string) => errorHandlerRef.current!.getRetryContext(jobId),
    isJobRetrying: (jobId: string) => state.isRetrying[jobId] || false,
    canRetry: (jobId: string) => {
      const context = errorHandlerRef.current!.getRetryContext(jobId);
      return context && !context.isExhausted;
    },
  };
}