/**
 * Enhanced caching strategy with multi-layer approach
 * Layer 1: Result caching (Redis)
 * Layer 2: Prompt caching (Memory) 
 * Layer 3: Image optimization (CDN-ready)
 */

import { Redis } from 'ioredis';
import crypto from 'crypto';
import { ExtractionResult } from '@/types/fashion';

interface CacheConfig {
  redis?: {
    enabled: boolean;
    host: string;
    port: number;
    password?: string;
    ttl: {
      results: number;      // 24 hours
      prompts: number;      // 1 hour
      images: number;       // 7 days
    };
  };
  memory: {
    maxSize: number;        // Maximum items in memory cache
    cleanupThreshold: number; // Trigger cleanup when reaching this size
  };
}

interface CacheEntry<T> {
  data: T;
  expiry: number;
  created: number;
  hits: number;
}

interface CacheStats {
  redis: {
    connected: boolean;
    hits: number;
    misses: number;
    errors: number;
  };
  memory: {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
  };
}

export class SmartCache {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private stats: CacheStats;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      redis: {
        enabled: process.env.REDIS_URL ? true : false,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
        ttl: {
          results: 24 * 60 * 60,    // 24 hours
          prompts: 60 * 60,         // 1 hour
          images: 7 * 24 * 60 * 60  // 7 days
        }
      },
      memory: {
        maxSize: 1000,
        cleanupThreshold: 800
      },
      ...config
    };

    this.stats = {
      redis: { connected: false, hits: 0, misses: 0, errors: 0 },
      memory: { size: 0, maxSize: this.config.memory.maxSize, hits: 0, misses: 0 }
    };

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    if (!this.config.redis?.enabled) return;

    try {
      const redisConfig = this.config.redis;
      this.redis = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        ...(redisConfig.password && { password: redisConfig.password }),
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connected for smart caching');
        this.stats.redis.connected = true;
      });

      this.redis.on('error', (error) => {
        console.warn('⚠️ Redis cache error:', error.message);
        this.stats.redis.errors++;
        this.stats.redis.connected = false;
      });

    } catch (error) {
      console.warn('⚠️ Failed to initialize Redis:', error);
      this.redis = null;
    }
  }

  /**
   * Generate cache key from various inputs
   */
  generateKey(prefix: string, ...inputs: (string | number | boolean)[]): string {
    const combined = inputs.map(input => String(input)).join('|');
    const hash = crypto.createHash('md5').update(combined).digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Generate image hash for caching
   */
  generateImageHash(imageBuffer: Buffer): string {
    return crypto.createHash('sha256').update(imageBuffer).digest('hex');
  }

  /**
   * Cache extraction results (Redis preferred, memory fallback)
   */
  async cacheResult(key: string, result: ExtractionResult): Promise<void> {
    const data = JSON.stringify(result);

    // Try Redis first
    if (this.redis && this.stats.redis.connected) {
      try {
        await this.redis.setex(key, this.config.redis!.ttl.results, data);
        return;
      } catch (error) {
        console.warn('Redis cache write failed:', error);
        this.stats.redis.errors++;
      }
    }

    // Fallback to memory
    this.setMemoryCache(key, result, this.config.redis!.ttl.results * 1000);
  }

  /**
   * Get cached extraction result
   */
  async getResult(key: string): Promise<ExtractionResult | null> {
    // Try Redis first
    if (this.redis && this.stats.redis.connected) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          this.stats.redis.hits++;
          return JSON.parse(cached) as ExtractionResult;
        }
        this.stats.redis.misses++;
      } catch (error) {
        console.warn('Redis cache read failed:', error);
        this.stats.redis.errors++;
      }
    }

    // Fallback to memory
    return this.getMemoryCache(key);
  }

  /**
   * Cache prompts in memory (lighter weight)
   */
  cachePrompt(key: string, prompt: string): void {
    this.setMemoryCache(key, prompt, this.config.redis!.ttl.prompts * 1000);
  }

  /**
   * Get cached prompt
   */
  getPrompt(key: string): string | null {
    return this.getMemoryCache(key);
  }

  /**
   * Memory cache operations
   */
  private setMemoryCache(key: string, data: unknown, ttlMs: number): void {
    const entry: CacheEntry<unknown> = {
      data,
      expiry: Date.now() + ttlMs,
      created: Date.now(),
      hits: 0
    };

    this.memoryCache.set(key, entry);
    this.stats.memory.size = this.memoryCache.size;

    // Trigger cleanup if needed
    if (this.memoryCache.size >= this.config.memory.cleanupThreshold) {
      this.cleanupMemoryCache();
    }
  }

  private getMemoryCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      this.stats.memory.misses++;
      return null;
    }

    if (entry.expiry < Date.now()) {
      this.memoryCache.delete(key);
      this.stats.memory.size = this.memoryCache.size;
      this.stats.memory.misses++;
      return null;
    }

    entry.hits++;
    this.stats.memory.hits++;
    return entry.data as T;
  }

  /**
   * Memory cache cleanup (LRU-style)
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries());

    // Remove expired entries first
    const validEntries = entries.filter(([key, entry]) => {
      if (entry.expiry < now) {
        this.memoryCache.delete(key);
        return false;
      }
      return true;
    });

    // If still too large, remove least recently used
    if (validEntries.length >= this.config.memory.maxSize) {
      const sortedByUsage = validEntries.sort((a, b) => {
        const scoreA = a[1].hits / Math.max(1, now - a[1].created);
        const scoreB = b[1].hits / Math.max(1, now - b[1].created);
        return scoreA - scoreB; // Ascending (least used first)
      });

      const toRemove = sortedByUsage.slice(0, validEntries.length - this.config.memory.cleanupThreshold);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }

    this.stats.memory.size = this.memoryCache.size;
    console.log(`🧹 Memory cache cleaned up. Size: ${this.memoryCache.size}/${this.config.memory.maxSize}`);
  }

  /**
   * Cache statistics
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      memory: {
        ...this.stats.memory,
        size: this.memoryCache.size
      }
    };
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    // Clear Redis
    if (this.redis && this.stats.redis.connected) {
      try {
        await this.redis.flushdb();
      } catch (error) {
        console.warn('Failed to clear Redis cache:', error);
      }
    }

    // Clear memory
    this.memoryCache.clear();
    this.stats.memory.size = 0;
    
    // Reset stats
    this.stats.redis.hits = 0;
    this.stats.redis.misses = 0;
    this.stats.memory.hits = 0;
    this.stats.memory.misses = 0;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
      this.redis = null;
      this.stats.redis.connected = false;
    }
  }
}

// Global smart cache instance
export const smartCache = new SmartCache();

// Cache helpers for specific use cases
export const CacheHelpers = {
  /**
   * Generate cache key for extraction results
   */
  getResultKey(imageHash: string, categoryId: string, modelVersion = '1.0'): string {
    return smartCache.generateKey('result', imageHash, categoryId, modelVersion);
  },

  /**
   * Generate cache key for prompts
   */
  getPromptKey(categoryId: string, fieldsCount: number, version = '1.0'): string {
    return smartCache.generateKey('prompt', categoryId, fieldsCount, version);
  },

  /**
   * Generate cache key for processed images
   */
  getImageKey(originalHash: string, width: number, height: number, quality: number): string {
    return smartCache.generateKey('image', originalHash, width, height, quality);
  }
};