'use client';

import { ExtractionResult } from '@/types/fashion';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number; // Exponential backoff multiplier
  jitterFactor: number; // Random jitter factor (0-1)
  confidenceThreshold: number; // Minimum confidence to accept result
  retryableStatuses: string[]; // HTTP status codes that should trigger retry
  retryableErrorTypes: string[]; // Error types that should trigger retry
}

export interface RetryAttempt {
  attemptNumber: number;
  timestamp: Date;
  error: string;
  delayMs: number;
  isRetryable: boolean;
}

export interface RetryContext {
  attempts: RetryAttempt[];
  totalAttempts: number;
  totalDelay: number;
  lastAttemptAt: Date | null;
  isExhausted: boolean;
  nextRetryAt: Date | null;
}

interface ErrorLike {
  message?: string;
  response?: { status?: number };
  type?: string;
}

export class AdvancedErrorHandler {
  private config: RetryConfig;
  private retryContexts = new Map<string, RetryContext>();

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      jitterFactor: 0.1,
      confidenceThreshold: 70, // 70% minimum confidence
      retryableStatuses: ['408', '429', '500', '502', '503', '504'],
      retryableErrorTypes: [
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'RATE_LIMIT_ERROR',
        'SERVER_ERROR',
        'LOW_CONFIDENCE_ERROR'
      ],
      ...config
    };
  }

  /**
   * Determine if an error should trigger a retry
   */
  isRetryableError(error: ErrorLike): boolean {
    // Check HTTP status codes
    if (error?.response?.status) {
      const status = error.response.status.toString();
      if (this.config.retryableStatuses.includes(status)) {
        return true;
      }
    }

    // Check error types
    if (error?.type && this.config.retryableErrorTypes.includes(error.type)) {
      return true;
    }

    // Check error messages for common patterns
    const errorMessage = error?.message?.toLowerCase() || '';
    const retryablePatterns = [
      'network error',
      'timeout',
      'rate limit',
      'server error',
      'connection refused',
      'service unavailable'
    ];

    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Check if extraction result has sufficient confidence
   */
  hasAcceptableConfidence(result: ExtractionResult): boolean {
    if (result.status !== 'completed') {
      return false;
    }

    // Type guard to check if result has confidence property
    if ('confidence' in result && typeof result.confidence === 'number') {
      return result.confidence >= this.config.confidenceThreshold;
    }

    return true; // If no confidence data, assume acceptable
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  calculateRetryDelay(attemptNumber: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attemptNumber - 1);
    
    // Add jitter to prevent thundering herd
    const jitter = exponentialDelay * this.config.jitterFactor * Math.random();
    const delayWithJitter = exponentialDelay + jitter;
    
    return Math.min(delayWithJitter, this.config.maxDelay);
  }

  /**
   * Initialize retry context for a job
   */
  initializeRetryContext(jobId: string): RetryContext {
    const context: RetryContext = {
      attempts: [],
      totalAttempts: 0,
      totalDelay: 0,
      lastAttemptAt: null,
      isExhausted: false,
      nextRetryAt: null
    };

    this.retryContexts.set(jobId, context);
    return context;
  }

  /**
   * Get retry context for a job
   */
  getRetryContext(jobId: string): RetryContext | undefined {
    return this.retryContexts.get(jobId);
  }

  /**
   * Record a failed attempt and determine if retry should be attempted
   */
  recordFailedAttempt(jobId: string, error: ErrorLike): {
    shouldRetry: boolean;
    retryDelay: number;
    context: RetryContext;
  } {
    let context = this.getRetryContext(jobId);
    if (!context) {
      context = this.initializeRetryContext(jobId);
    }

    const attemptNumber = context.totalAttempts + 1;
    const isRetryable = this.isRetryableError(error);
    const retryDelay = isRetryable ? this.calculateRetryDelay(attemptNumber) : 0;

    // Record the attempt
    const attempt: RetryAttempt = {
      attemptNumber,
      timestamp: new Date(),
      error: error?.message || 'Unknown error',
      delayMs: retryDelay,
      isRetryable
    };

    context.attempts.push(attempt);
    context.totalAttempts = attemptNumber;
    context.lastAttemptAt = attempt.timestamp;

    // Determine if we should retry
    const shouldRetry = isRetryable && 
                       attemptNumber < this.config.maxAttempts &&
                       !context.isExhausted;

    if (shouldRetry) {
      context.totalDelay += retryDelay;
      context.nextRetryAt = new Date(Date.now() + retryDelay);
    } else {
      context.isExhausted = true;
      context.nextRetryAt = null;
    }

    this.retryContexts.set(jobId, context);

    return {
      shouldRetry,
      retryDelay,
      context: { ...context }
    };
  }

  /**
   * Record a low-confidence result and determine if re-extraction should be attempted
   */
  recordLowConfidenceResult(jobId: string, result: ExtractionResult): {
    shouldReextract: boolean;
    retryDelay: number;
    context: RetryContext;
  } {
    const lowConfidenceError = {
      type: 'LOW_CONFIDENCE_ERROR',
      message: `Low confidence result: ${('confidence' in result) ? result.confidence : 'unknown'}%`,
      result
    };

    const retryResult = this.recordFailedAttempt(jobId, lowConfidenceError);
    return {
      shouldReextract: retryResult.shouldRetry,
      retryDelay: retryResult.retryDelay,
      context: retryResult.context
    };
  }

  /**
   * Execute a function with automatic retry logic
   */
  async executeWithRetry<T>(
    jobId: string,
    operation: () => Promise<T>,
    validator?: (result: T) => boolean
  ): Promise<T> {
    while (true) {
      try {
        const result = await operation();

        // If validator is provided, check if result is acceptable
        if (validator && !validator(result)) {
          const validationError = new Error('Result validation failed');
          validationError.name = 'VALIDATION_ERROR';
          throw validationError;
        }

        // Success - clean up retry context
        this.retryContexts.delete(jobId);
        return result;

      } catch (error) {
        const errorLike = error as ErrorLike;
        const { shouldRetry, retryDelay, context } = this.recordFailedAttempt(jobId, errorLike);

        if (!shouldRetry) {
          // No more retries - throw the last error with context
          const enhancedError = new Error(
            `Operation failed after ${context.totalAttempts} attempts: ${errorLike?.message || 'Unknown error'}`
          ) as Error & { originalError?: ErrorLike; retryContext?: RetryContext };
          enhancedError.originalError = errorLike;
          enhancedError.retryContext = context;
          throw enhancedError;
        }

        // Wait before retrying
        if (retryDelay > 0) {
          console.warn(
            `[RetryHandler] Attempt ${context.totalAttempts} failed for job ${jobId}. ` +
            `Retrying in ${retryDelay}ms. Error: ${errorLike?.message || 'Unknown error'}`
          );
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }

  /**
   * Get retry statistics for monitoring
   */
  getRetryStatistics(): {
    activeRetries: number;
    totalContexts: number;
    exhaustedContexts: number;
    averageAttempts: number;
    totalDelay: number;
  } {
    const contexts = Array.from(this.retryContexts.values());
    
    return {
      activeRetries: contexts.filter(c => !c.isExhausted && c.nextRetryAt).length,
      totalContexts: contexts.length,
      exhaustedContexts: contexts.filter(c => c.isExhausted).length,
      averageAttempts: contexts.length > 0 
        ? contexts.reduce((sum, c) => sum + c.totalAttempts, 0) / contexts.length 
        : 0,
      totalDelay: contexts.reduce((sum, c) => sum + c.totalDelay, 0)
    };
  }

  /**
   * Clean up old retry contexts
   */
  cleanup(maxAge: number = 3600000): void { // Default 1 hour
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [jobId, context] of this.retryContexts.entries()) {
      if (context.lastAttemptAt && context.lastAttemptAt < cutoff) {
        this.retryContexts.delete(jobId);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Reset all retry contexts (useful for testing)
   */
  reset(): void {
    this.retryContexts.clear();
  }
}