'use client';

import React, { useEffect, useState } from 'react';
import { useJobPolling } from '@/hooks/useJobPollingNew';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { ExtractionResult } from '@/types/fashion';
import { toast } from 'sonner';

interface JobPollingCardProps {
  jobId: string;
  imageFileName: string;
  onCompleted?: (result: ExtractionResult) => void;
  onError?: (error: string) => void;
}

export function JobPollingCard({ 
  jobId, 
  imageFileName, 
  onCompleted, 
  onError 
}: JobPollingCardProps) {
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  const {
    jobStatus,
    isLoading,
    isError,
    error,
    refetch,
    optimisticUpdate,
    pollingInterval,
    attempts,
    isPolling
  } = useJobPolling(jobId, {
    enabled: true,
    onStatusChange: (status) => {
      console.log(`Job ${jobId} status changed:`, status);
      toast.info(`Job status: ${status.status}`);
    },
    onCompleted: (result) => {
      console.log(`Job ${jobId} completed:`, result);
      toast.success(`Extraction completed for ${imageFileName}`);
      onCompleted?.(result);
    },
    onError: (errorMessage) => {
      console.error(`Job ${jobId} failed:`, errorMessage);
      toast.error(`Extraction failed: ${errorMessage}`);
      onError?.(errorMessage);
    }
  });

  // Update elapsed time every second
  useEffect(() => {
    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, jobStatus?.status]);

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    
    switch (jobStatus?.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    const statusVariants = {
      pending: 'secondary' as const,
      processing: 'default' as const,
      completed: 'default' as const, // Badge doesn't have 'success' variant
      failed: 'destructive' as const,
    };
    
    const variant = statusVariants[jobStatus?.status || 'pending'];

    return (
      <Badge variant={variant}>
        {jobStatus?.status || 'unknown'}
      </Badge>
    );
  };

  const getProgress = () => {
    switch (jobStatus?.status) {
      case 'pending':
        return 10;
      case 'processing':
        return 50;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const handleOptimisticUpdate = () => {
    optimisticUpdate({ status: 'processing' });
    toast.info('Status updated optimistically');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getStatusIcon()}
          {imageFileName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status and Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          {getStatusBadge()}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{getProgress()}%</span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>

        {/* Timing Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Elapsed:</span>
            <div className="font-mono">{formatTime(elapsedTime)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Polling:</span>
            <div className="font-mono">
              {isPolling ? `${pollingInterval}ms` : 'Stopped'}
            </div>
          </div>
        </div>

        {/* Polling Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Attempts:</span>
            <div className="font-mono">{attempts}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Job ID:</span>
            <div className="font-mono text-xs truncate">{jobId}</div>
          </div>
        </div>

        {/* Error Display */}
        {(isError || jobStatus?.status === 'failed') && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
              <div className="ml-2">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="text-sm text-red-700">
                  {jobStatus?.error || error?.message || 'Unknown error occurred'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completed Result Summary */}
        {jobStatus?.status === 'completed' && jobStatus.result && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
              <div className="ml-2">
                <h3 className="text-sm font-medium text-green-800">Completed</h3>
                <div className="text-sm text-green-700">
                  {jobStatus.result.status === 'completed' && 'tokensUsed' in jobStatus.result
                    ? `Tokens: ${jobStatus.result.tokensUsed}, Confidence: ${jobStatus.result.confidence}%`
                    : 'Extraction completed successfully'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {jobStatus?.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOptimisticUpdate}
            >
              Test Optimistic
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

