import { NextResponse, NextRequest } from 'next/server'
import { aiService } from '@/lib/ai/ai-services'
import { rateLimit } from '@/lib/rate-limit'

// Lightweight limiter to avoid abuse of health endpoint
const healthLimiter = rateLimit({ interval: 10_000, maxRequests: 20 })

export async function GET(request: Request) {
  // Best-effort rate limit (ignore failures; health must be cheap)
  try {
    // Adapt native Request to minimal NextRequest-like object for IP extraction
    // We only need headers in current rate limiter implementation
    const fake = request as unknown as NextRequest
    await healthLimiter.check(fake, 'HEALTH')
  } catch {
    // ignore rate limit failures for health
  }

  const env = {
    openaiKey: !!process.env.OPENAI_API_KEY,
    redisUrl: !!process.env.REDIS_URL,
    nodeEnv: process.env.NODE_ENV || 'development'
  }

  const ai = await aiService.healthCheck()

  return NextResponse.json({
    status: ai.status,
    timestamp: new Date().toISOString(),
    environment: env,
    ai: ai.details
  })
}
