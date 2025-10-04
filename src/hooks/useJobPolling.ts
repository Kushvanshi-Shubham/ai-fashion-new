'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback, useMemo } from 'react';
import { ExtractionResult } from '@/types/fashion';

export interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ExtractionResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseJobPollingOptions {
  enabled?: boolean;
  onStatusChange?: (status: JobStatus) => void;
  onCompleted?: (result: ExtractionResult) => void;
  onError?: (error: string) => void;
  // Intelligent polling configuration
  baseInterval?: number; // Base polling interval in ms
  maxInterval?: number; // Maximum polling interval in ms
  backoffMultiplier?: number; // Backoff multiplier for failed requests
  maxAttempts?: number; // Maximum polling attempts
}

// Intelligent polling intervals based on job status
const getPollingInterval = (status: string, attempt: number, baseInterval = 2000): number => {
  switch (status) {
    case 'pending':
      return Math.min(baseInterval, 3000); // Quick check for pending jobs
    case 'processing':
      return Math.min(baseInterval * 1.5, 5000); // Moderate polling for processing
    case 'completed':
    case 'failed':
      return 0; // Stop polling for terminal states
    default:
      return Math.min(baseInterval * Math.pow(2, attempt), 10000); // Exponential backoff for errors
  }
};

export function useJobPolling(jobId: string | null, options: UseJobPollingOptions = {}) {
  const {
    enabled = true,
    onStatusChange,
    onCompleted,
    onError,
    baseInterval = 2000,
    maxInterval = 15000,
    backoffMultiplier = 1.5,
    maxAttempts = 50
  } = options;

  const queryClient = useQueryClient();
  const attemptCount = useRef(0);
  const lastStatus = useRef<string>('');

  const queryKey = useMemo(() => ['job-status', jobId], [jobId]);

  const {
    data: jobStatus,
    error,
    isError,
    isLoading,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<JobStatus> => {
      if (!jobId) throw new Error('Job ID is required');

      const response = await fetch(`/api/extract/status/${jobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Job status request failed');
      }

      return data.data as JobStatus;
    },
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || !enabled) return false;
      
      const currentStatus = data.status;
      const interval = getPollingInterval(currentStatus, attemptCount.current, baseInterval);
      
      // Stop polling for terminal states
      if (currentStatus === 'completed' || currentStatus === 'failed') {
        return false;
      }

      // Stop if max attempts reached
      if (attemptCount.current >= maxAttempts) {
        return false;
      }

      return Math.min(interval, maxInterval);
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0, // Always refetch to get real-time status
    retry: (failureCount, error) => {
      // Don't retry 404 errors (job not found)
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(backoffMultiplier, attemptIndex), 5000),
  });

  // Handle status changes and callbacks
  useEffect(() => {
    if (!jobStatus) return;

    const currentStatus = jobStatus.status;
    
    // Track attempt count for intelligent polling
    if (lastStatus.current !== currentStatus) {
      attemptCount.current = 0; // Reset on status change
      lastStatus.current = currentStatus;
      onStatusChange?.(jobStatus);
    } else {
      attemptCount.current += 1;
    }

    // Handle completion
    if (currentStatus === 'completed' && jobStatus.result) {
      onCompleted?.(jobStatus.result);
    }

    // Handle errors
    if (currentStatus === 'failed') {
      onError?.(jobStatus.error || 'Job failed');
    }
  }, [jobStatus, onStatusChange, onCompleted, onError]);

  // Handle query errors
  useEffect(() => {
    if (isError && error) {
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [isError, error, onError]);

  // Optimistic updates for better UX
  const optimisticUpdate = useCallback((status: Partial<JobStatus>) => {
    if (!jobId) return;
    
    queryClient.setQueryData(queryKey, (old: JobStatus | undefined) => {
      if (!old) return old;
      return { ...old, ...status };
    });
  }, [queryClient, queryKey, jobId]);

  // Manual refetch with exponential backoff
  const refetchWithBackoff = useCallback(async () => {
    if (!enabled || !jobId) return;
    
    try {
      await refetch();
      attemptCount.current = 0; // Reset on successful refetch
    } catch (error) {
      attemptCount.current += 1;
      console.warn(`Job polling failed (attempt ${attemptCount.current}):`, error);
    }
  }, [refetch, enabled, jobId]);

  return {
    jobStatus,
    isLoading,
    isError,
    error,
    refetch: refetchWithBackoff,
    optimisticUpdate,
    // Polling state
    pollingInterval: jobStatus ? getPollingInterval(jobStatus.status, attemptCount.current, baseInterval) : 0,
    attempts: attemptCount.current,
    isPolling: enabled && !!jobId && jobStatus?.status !== 'completed' && jobStatus?.status !== 'failed',
  };
}

// Batch job polling for multiple jobs
export function useBatchJobPolling(
  jobIds: string[], 
  options: Omit<UseJobPollingOptions, 'onStatusChange' | 'onCompleted' | 'onError'> & {
    onJobStatusChange?: (jobId: string, status: JobStatus) => void;
    onJobCompleted?: (jobId: string, result: ExtractionResult) => void;
    onJobError?: (jobId: string, error: string) => void;
  } = {}
) {
  const {
    onJobStatusChange,
    onJobCompleted,
    onJobError,
    ...pollingOptions
  } = options;

  // Create individual polling hooks for each job using map at top level
  const jobPollingResults = useMemo(() => [
    ...jobIds.map(jobId => 
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useJobPolling(jobId, {
        ...pollingOptions,
        onStatusChange: (status) => onJobStatusChange?.(jobId, status),
        onCompleted: (result) => onJobCompleted?.(jobId, result),
        onError: (error) => onJobError?.(jobId, error),
      })
    )
  ], [jobIds, pollingOptions, onJobStatusChange, onJobCompleted, onJobError]);

  // Aggregate results
  const allJobStatuses = jobPollingResults.map(result => result.jobStatus).filter(Boolean) as JobStatus[];
  const isAnyLoading = jobPollingResults.some(result => result.isLoading);
  const hasAnyError = jobPollingResults.some(result => result.isError);
  const allErrors = jobPollingResults.map(result => result.error).filter(Boolean);
  const activePollingCount = jobPollingResults.filter(result => result.isPolling).length;

  // Batch operations
  const refetchAll = useCallback(async () => {
    await Promise.all(jobPollingResults.map(result => result.refetch()));
  }, [jobPollingResults]);

  const optimisticUpdateAll = useCallback((updates: Record<string, Partial<JobStatus>>) => {
    Object.entries(updates).forEach(([jobId, update]) => {
      const jobIndex = jobIds.indexOf(jobId);
      if (jobIndex !== -1 && jobPollingResults[jobIndex]) {
        jobPollingResults[jobIndex].optimisticUpdate(update);
      }
    });
  }, [jobPollingResults, jobIds]);

  return {
    jobStatuses: allJobStatuses,
    isLoading: isAnyLoading,
    hasError: hasAnyError,
    errors: allErrors,
    refetchAll,
    optimisticUpdateAll,
    activePollingCount,
    totalJobs: jobIds.length,
    completedJobs: allJobStatuses.filter(status => status.status === 'completed').length,
    failedJobs: allJobStatuses.filter(status => status.status === 'failed').length,
    processingJobs: allJobStatuses.filter(status => status.status === 'processing').length,
    pendingJobs: allJobStatuses.filter(status => status.status === 'pending').length,
  };
}