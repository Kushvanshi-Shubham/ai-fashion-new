import { NextRequest } from 'next/server'
import { Redis } from 'ioredis'

interface RateLimitConfig {
  interval: number
  uniqueTokenPerInterval: number
}

class RateLimiter {
  private redis: Redis | null = null
  private interval: number
  private uniqueTokenPerInterval: number

  constructor(config: RateLimitConfig) {
    this.interval = config.interval
    this.uniqueTokenPerInterval = config.uniqueTokenPerInterval

    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL)
    }
  }

  async check(req: NextRequest, maxRequests: number, identifier: string): Promise<void> {
    if (!this.redis) {
      // Fallback to in-memory rate limiting if Redis is not available
      return this.checkInMemory(req, maxRequests, identifier)
    }

    const key = this.getKey(req, identifier)
    const now = Date.now()
    const windowStart = now - this.interval

    const multi = this.redis.multi()
    multi.zremrangebyscore(key, 0, windowStart)
    multi.zadd(key, now, `${now}-${Math.random()}`)
    multi.zcard(key)
    multi.expire(key, this.interval / 1000)

    const responses = await multi.exec()
    if (!responses) throw new Error('Rate limit check failed')

    const requestCount = responses[2][1] as number

    if (requestCount > maxRequests) {
      throw new Error('Too many requests')
    }
  }

  private getKey(req: NextRequest, identifier: string): string {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'
    return `rate-limit:${identifier}:${ip}`
  }

  private inMemoryStore: Map<string, number[]> = new Map()

  private async checkInMemory(req: NextRequest, maxRequests: number, identifier: string): Promise<void> {
    const key = this.getKey(req, identifier)
    const now = Date.now()
    const windowStart = now - this.interval

    let timestamps = this.inMemoryStore.get(key) || []
    timestamps = timestamps.filter(timestamp => timestamp > windowStart)
    timestamps.push(now)

    this.inMemoryStore.set(key, timestamps)

    if (timestamps.length > maxRequests) {
      throw new Error('Too many requests')
    }
  }
}

export const rateLimit = (config: RateLimitConfig) => new RateLimiter(config)