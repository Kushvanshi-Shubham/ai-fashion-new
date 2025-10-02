import { NextRequest } from 'next/server'
import { Redis } from 'ioredis'

export class RateLimitExceededError extends Error {
  constructor(
    public readonly retryAfter: number,
    message: string = 'Rate limit exceeded'
  ) {
    super(message)
    this.name = 'RateLimitExceededError'
  }
}

export interface RateLimitConfig {
  /** Time window in milliseconds */
  interval: number
  /** Maximum requests per interval */
  maxRequests: number
  /** How long to block if limit exceeded (ms) */
  blockDuration?: number
  /** Maximum size of in-memory store before cleanup */
  maxStoreSize?: number
}

export interface RateLimitInfo {
  remaining: number
  reset: number
  total: number
}

class RateLimiter {
  private redis: Redis | null = null
  private inMemoryStore: Map<string, number[]> = new Map()
  private readonly maxStoreSize: number

  constructor(private config: RateLimitConfig) {
    this.maxStoreSize = config.maxStoreSize || 10000

    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL, {
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
        enableOfflineQueue: true
      })

      this.redis.on('error', (error) => {
        console.error('Redis error:', error)
      })
    }
  }

  async check(req: NextRequest, identifier: string): Promise<RateLimitInfo> {
    const key = this.getKey(req, identifier)
    const now = Date.now()

    try {
      if (this.redis?.status === 'ready') {
        return await this.checkRedis(key, now)
      }
    } catch (error) {
      console.error('Redis check failed, falling back to memory:', error)
    }

    return this.checkInMemory(key, now)
  }

  private async checkRedis(key: string, now: number): Promise<RateLimitInfo> {
    if (!this.redis) throw new Error('Redis not initialized')

    const windowStart = now - this.config.interval
    const multi = this.redis.multi()

    // Clean old entries and add new one
    multi.zremrangebyscore(key, 0, windowStart)
    multi.zadd(key, now, `${now}-${Math.random()}`)
    multi.zcard(key)
    multi.ttl(key)

    const responses = await multi.exec()
    if (!responses) throw new Error('Rate limit check failed')

  const count = responses[2] ? (responses[2][1] as number) : 0
  const ttl = responses[3] ? (responses[3][1] as number) : 0

    // Set or refresh expiration
    const expiry = ttl < 0 ? this.config.interval / 1000 : ttl
    await this.redis.expire(key, expiry)

    if (count > this.config.maxRequests) {
      if (this.config.blockDuration) {
        await this.redis.expire(key, this.config.blockDuration / 1000)
      }
      throw new RateLimitExceededError(expiry * 1000)
    }

    return {
      remaining: this.config.maxRequests - count,
      reset: now + (expiry * 1000),
      total: this.config.maxRequests
    }
  }

  private checkInMemory(key: string, now: number): RateLimitInfo {
    const windowStart = now - this.config.interval
    let timestamps = this.inMemoryStore.get(key) || []

    // Clean old entries
    timestamps = timestamps.filter(ts => ts > windowStart)
    
    if (timestamps.length >= this.config.maxRequests) {
      const oldestValidTimestamp = timestamps[0]
    const resetTime = (oldestValidTimestamp ?? 0) + this.config.interval
      throw new RateLimitExceededError(resetTime - now)
    }

    timestamps.push(now)
    this.inMemoryStore.set(key, timestamps)

    // Cleanup if store gets too large
    if (this.inMemoryStore.size > this.maxStoreSize) {
      this.cleanup(now)
    }

    return {
      remaining: this.config.maxRequests - timestamps.length,
      reset: now + this.config.interval,
      total: this.config.maxRequests
    }
  }

  private getKey(req: NextRequest, identifier: string): string {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown'
    return `rate-limit:${identifier}:${ip}`
  }

  private cleanup(now: number): void {
    const windowStart = now - this.config.interval
    for (const [key, timestamps] of this.inMemoryStore.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > windowStart)
      if (validTimestamps.length === 0) {
        this.inMemoryStore.delete(key)
      } else {
        this.inMemoryStore.set(key, validTimestamps)
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis?.status === 'ready') {
      await this.redis.quit()
    }
    this.inMemoryStore.clear()
  }
}

export const rateLimit = (config: RateLimitConfig) => new RateLimiter(config)