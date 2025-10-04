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
  baseInterval?: number;
  maxAttempts?: number;
}

// Smart polling intervals based on job status
const getPollingInterval = (status: string, attempt: number = 0): number => {
  switch (status) {
    case 'pending':
      return 2000; // Quick check for pending jobs
    case 'processing':
      return 3000; // Moderate polling for processing
    case 'completed':
    case 'failed':
      return 0; // Stop polling for terminal states
    default:
      return Math.min(5000 * Math.pow(1.5, attempt), 15000); // Exponential backoff
  }
};

export function useJobPolling(jobId: string | null, options: UseJobPollingOptions = {}) {
  const {
    enabled = true,
    onStatusChange,
    onCompleted,
    onError,
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
      const interval = getPollingInterval(currentStatus, attemptCount.current);
      
      // Stop polling for terminal states
      if (currentStatus === 'completed' || currentStatus === 'failed') {
        return false;
      }

      // Stop if max attempts reached
      if (attemptCount.current >= maxAttempts) {
        return false;
      }

      return interval;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0, // Always refetch for real-time status
    retry: (failureCount, error) => {
      // Don't retry 404 errors (job not found)
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(1.5, attemptIndex), 5000),
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
    pollingInterval: jobStatus ? getPollingInterval(jobStatus.status, attemptCount.current) : 0,
    attempts: attemptCount.current,
    isPolling: enabled && !!jobId && jobStatus?.status !== 'completed' && jobStatus?.status !== 'failed',
  };
}

export interface QueueStatus {
  pendingJobs: number;
  processingJobs: number;
  totalJobs: number;
}

// Simple queue status hook for dashboard/overview
export function useQueueStatus() {
  return useQuery({
    queryKey: ['queue-status'],
    queryFn: async () => {
      const response = await fetch('/api/queue/status');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch queue status');
      }
      
      return data.data;
    },
    refetchInterval: 5000, // Check queue every 5 seconds
    refetchOnWindowFocus: false,
    staleTime: 2000,
  });
}

// Optimistic job creation hook
export function useOptimisticJobCreation() {
  const queryClient = useQueryClient();
  
  const createJobOptimistically = useCallback(async (
    file: File,
    category: { categoryId: string },
    tempJobId?: string
  ) => {
    const optimisticJob: JobStatus = {
      id: tempJobId || `temp-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to queue status optimistically
    queryClient.setQueryData(['queue-status'], (old: QueueStatus | undefined) => {
      if (!old) return old;
      return {
        ...old,
        pendingJobs: (old.pendingJobs || 0) + 1,
        totalJobs: (old.totalJobs || 0) + 1,
      };
    });

    try {
      // Create actual job
      const formData = new FormData();
      formData.append('file', file);
      formData.append('categoryId', category.categoryId);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      const actualJobId = data.data?.jobId;

      // Update with real job ID if different
      if (actualJobId && actualJobId !== optimisticJob.id) {
        queryClient.removeQueries({ queryKey: ['job-status', optimisticJob.id] });
        queryClient.setQueryData(['job-status', actualJobId], optimisticJob);
      }

      return actualJobId || optimisticJob.id;
    } catch (error) {
      // Rollback optimistic update on error
      queryClient.setQueryData(['queue-status'], (old: QueueStatus | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pendingJobs: Math.max((old.pendingJobs || 0) - 1, 0),
          totalJobs: Math.max((old.totalJobs || 0) - 1, 0),
        };
      });
      
      throw error;
    }
  }, [queryClient]);

  return { createJobOptimistically };
}