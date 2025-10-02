import { describe, it, expect } from 'vitest'
import { estimateCost } from '@/lib/ai/model-pricing'

describe('model pricing', () => {
  it('estimates cost using totalTokens heuristic', () => {
    const cost = estimateCost({ model: 'gpt-4-vision-preview', totalTokens: 1000, hasVision: true })
    expect(cost).toBeGreaterThan(0)
  })

  it('returns 0 for unknown model', () => {
    const cost = estimateCost({ model: 'unknown-model', totalTokens: 500 })
    expect(cost).toBe(0)
  })
})
